"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { addMedicationAction, stopMedicationAction } from "@/app/actions/staff";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/card";
import { ConfirmButton } from "@/components/ui/confirm";
import { Field, Input } from "@/components/ui/form";
import { useAction } from "@/components/ui/use-action";
import { medicationPlanSchema } from "@/lib/schemas";
import { DAY_NAMES } from "./format";

type In = z.input<typeof medicationPlanSchema>;
type Out = z.output<typeof medicationPlanSchema>;

export function AddMedicationForm({ planId, today }: { planId: string; today: string }) {
  const { run, pending, error } = useAction();
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<In, unknown, Out>({
    resolver: zodResolver(medicationPlanSchema),
    defaultValues: { medicationName: "", dose: "", route: "", instructions: "", timesOfDay: ["08:00"], daysOfWeek: [], startDate: today, endDate: "" },
  });
  const [draft, setDraft] = useState("");
  const times = watch("timesOfDay");
  const days = watch("daysOfWeek");
  const timesError = (errors.timesOfDay as { message?: string } | undefined)?.message ?? errors.timesOfDay?.root?.message;

  const addTime = () => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(draft) || times.includes(draft)) return;
    setValue("timesOfDay", [...times, draft].sort(), { shouldValidate: true });
    setDraft("");
  };

  return (
    <form
      onSubmit={handleSubmit((v) =>
        run(() => addMedicationAction(planId, v), "Medication schedule added", () => {
          reset();
          setDraft("");
        }),
      )}
      className="space-y-4"
      noValidate
    >
      <p className="text-sm text-muted">
        This records the schedule you decide. Tessera does not suggest or change doses automatically. The patient is notified.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Medication name" error={errors.medicationName?.message}>{(a) => <Input {...a} {...register("medicationName")} />}</Field>
        <Field label="Dose" hint="For example 500 mg" error={errors.dose?.message}>{(a) => <Input {...a} {...register("dose")} />}</Field>
        <Field label="Route (optional)" hint="For example oral" error={errors.route?.message}>{(a) => <Input {...a} {...register("route")} />}</Field>
        <Field label="Instructions (optional)" error={errors.instructions?.message}>{(a) => <Input {...a} {...register("instructions")} />}</Field>
      </div>

      <fieldset>
        <legend className="text-sm font-medium">Times of day (patient&apos;s local time)</legend>
        <ul className="mt-2 flex flex-wrap gap-2">
          {times.map((t) => (
            <li key={t} className="inline-flex items-center gap-1 rounded-md border border-line2 bg-surface2 py-1 pl-2.5 pr-1 text-sm tabular-nums">
              {t}
              <button
                type="button"
                aria-label={`Remove ${t}`}
                className="rounded-sm p-1 hover:bg-line"
                onClick={() => setValue("timesOfDay", times.filter((x) => x !== t), { shouldValidate: true })}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-end gap-2">
          <div className="w-36">
            <Input type="time" aria-label="Add a time" value={draft} onChange={(e) => setDraft(e.target.value)} />
          </div>
          <Button type="button" variant="secondary" onClick={addTime}>
            <Plus className="size-4" aria-hidden /> Add time
          </Button>
        </div>
        {timesError && <p role="alert" className="mt-1 text-sm text-danger">{timesError}</p>}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium">Days of the week</legend>
        <p className="text-sm text-muted">Leave all unchecked for every day.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DAY_NAMES.map((n, i) => (
            <label key={n} className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-line2 px-2.5 py-1.5 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:focus-visible]:outline-2">
              <input
                type="checkbox"
                className="size-4 accent-[var(--c-accent)]"
                checked={days.includes(i)}
                onChange={(e) => setValue("daysOfWeek", e.target.checked ? [...days, i] : days.filter((d) => d !== i))}
              />
              {n}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date" error={errors.startDate?.message}>{(a) => <Input type="date" {...a} {...register("startDate")} />}</Field>
        <Field label="End date (optional)" error={errors.endDate?.message}>{(a) => <Input type="date" {...a} {...register("endDate")} />}</Field>
      </div>
      {error && <Alert tone="danger">{error}</Alert>}
      <Button type="submit" loading={pending}>Add medication</Button>
    </form>
  );
}

export function StopMedicationControl({ medicationPlanId, name }: { medicationPlanId: string; name: string }) {
  const { run, pending, error } = useAction();
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Stop medication
      </Button>
    );
  const ok = reason.trim().length >= 3;
  return (
    <div className="flex w-full flex-wrap items-end gap-2">
      <div className="min-w-48 flex-1">
        <Field label={`Reason for stopping ${name}`} error={error ?? undefined}>
          {(a) => <Input {...a} value={reason} onChange={(e) => setReason(e.target.value)} />}
        </Field>
      </div>
      <ConfirmButton
        label={pending ? "Stopping..." : "Stop"}
        title={`Stop ${name}?`}
        message="Future scheduled doses are removed and the patient is notified. Past records are kept. This is recorded in the plan history with your reason."
        confirmLabel="Stop medication"
        disabled={!ok || pending}
        onConfirm={() => void run(() => stopMedicationAction(medicationPlanId, reason.trim()), "Medication stopped", () => setOpen(false))}
      />
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
    </div>
  );
}
