"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { scheduleAppointmentAction, staffAppointmentAction } from "@/app/actions/staff";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/card";
import { ConfirmButton } from "@/components/ui/confirm";
import { Field, Input, Textarea } from "@/components/ui/form";
import { useAction } from "@/components/ui/use-action";
import { appointmentScheduleSchema } from "@/lib/schemas";
import { FormDialog } from "./form-dialog";
import { localInputToIso } from "./format";

const form = z.object({
  title: appointmentScheduleSchema.shape.title,
  start: z.string().min(1, "Choose a date and time."),
  durationMin: z.coerce.number().int().min(10, "At least 10 minutes.").max(240, "At most 240 minutes."),
  location: z.string().trim().max(200).optional(),
});
type In = z.input<typeof form>;
type Out = z.output<typeof form>;

export function ScheduleAppointmentForm({ patientId, professionalId, tz }: { patientId: string; professionalId: string; tz: string }) {
  const { run, pending, error } = useAction();
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<In, unknown, Out>({
    resolver: zodResolver(form),
    defaultValues: { title: "", start: "", durationMin: 30, location: "" },
  });
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit((v) => {
        const startsAt = localInputToIso(v.start, tz);
        if (!startsAt) return setError("start", { message: "Enter a valid date and time." });
        const input = { patientId, professionalId, title: v.title, startsAt, durationMin: v.durationMin, location: v.location ?? "" };
        return run(() => scheduleAppointmentAction(input), "Appointment scheduled and patient notified", () => reset());
      })}
    >
      <p className="text-sm text-muted">The appointment is created as confirmed and the patient is notified.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" error={errors.title?.message}>{(a) => <Input {...a} {...register("title")} />}</Field>
        <Field label="Location (optional)" error={errors.location?.message}>{(a) => <Input {...a} {...register("location")} />}</Field>
        <Field label={`Starts (${tz})`} error={errors.start?.message}>{(a) => <Input type="datetime-local" {...a} {...register("start")} />}</Field>
        <Field label="Duration (minutes)" error={errors.durationMin?.message}>{(a) => <Input type="number" min={10} max={240} step={5} {...a} {...register("durationMin")} />}</Field>
      </div>
      {error && <Alert tone="danger">{error}</Alert>}
      <Button type="submit" loading={pending}>Schedule appointment</Button>
    </form>
  );
}

export type ApptAction = "confirm" | "keep" | "reschedule" | "cancel" | "complete" | "noshow";

function CompleteForm({ id, close }: { id: string; close: () => void }) {
  const { run, pending, error } = useAction();
  const [notes, setNotes] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => staffAppointmentAction(id, "COMPLETED", { sharedNotes: notes }), "Marked as completed", close);
      }}
    >
      <Field label="Notes shared with the patient (optional)" hint="Visible to the patient. Do not put internal remarks here; use Internal notes on the patient profile.">
        {(a) => <Textarea {...a} value={notes} maxLength={2000} onChange={(e) => setNotes(e.target.value)} />}
      </Field>
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={close}>Cancel</Button>
        <Button type="submit" loading={pending}>Mark completed</Button>
      </div>
    </form>
  );
}

function RescheduleForm({ id, tz, close }: { id: string; tz: string; close: () => void }) {
  const { run, pending, error } = useAction();
  const [value, setValue] = useState("");
  const [bad, setBad] = useState<string>();
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const startsAt = localInputToIso(value, tz);
        if (!startsAt) return setBad("Choose a new date and time.");
        setBad(undefined);
        void run(() => staffAppointmentAction(id, "CONFIRMED", { startsAt }), "Appointment rescheduled and confirmed", close);
      }}
    >
      <Field label={`New start (${tz})`} error={bad ?? error ?? undefined}>
        {(a) => <Input type="datetime-local" {...a} value={value} onChange={(e) => setValue(e.target.value)} />}
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={close}>Cancel</Button>
        <Button type="submit" loading={pending}>Confirm new time</Button>
      </div>
    </form>
  );
}

/** `actions` is computed on the server from the domain transition rules. */
export function AppointmentActions({ id, title, tz, actions }: { id: string; title: string; tz: string; actions: ApptAction[] }) {
  const { run, pending } = useAction();
  const go = (to: "CONFIRMED" | "CANCELLED" | "NO_SHOW", ok: string) => void run(() => staffAppointmentAction(id, to), ok);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.includes("confirm") && <Button size="sm" loading={pending} onClick={() => go("CONFIRMED", "Appointment confirmed")}>Confirm</Button>}
      {actions.includes("keep") && <Button size="sm" variant="secondary" loading={pending} onClick={() => go("CONFIRMED", "Appointment kept")}>Keep appointment</Button>}
      {actions.includes("reschedule") && (
        <FormDialog label="Reschedule" title={`Reschedule: ${title}`}>{(close) => <RescheduleForm id={id} tz={tz} close={close} />}</FormDialog>
      )}
      {actions.includes("complete") && (
        <FormDialog label="Mark completed" title={`Complete: ${title}`}>{(close) => <CompleteForm id={id} close={close} />}</FormDialog>
      )}
      {actions.includes("noshow") && (
        <ConfirmButton variant="secondary" label="No-show" title="Mark as no-show?" message="The patient is told this appointment was recorded as a no-show. This cannot be undone." confirmLabel="Mark no-show" onConfirm={() => go("NO_SHOW", "Marked as no-show")} />
      )}
      {actions.includes("cancel") && (
        <ConfirmButton label="Cancel appointment" title="Cancel this appointment?" message="The patient is notified. This cannot be undone." confirmLabel="Cancel appointment" onConfirm={() => go("CANCELLED", "Appointment cancelled")} />
      )}
    </div>
  );
}
