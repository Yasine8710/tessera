"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { requestAppointmentAction } from "@/app/actions/patient";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { useAction } from "@/components/ui/use-action";
import { appointmentRequestSchema } from "@/lib/schemas";
import { localInputToIso, toLocalInput } from "./format";

const formSchema = z.object({
  professionalId: z.string().min(1, "Choose a professional."),
  title: appointmentRequestSchema.shape.title,
  startsLocal: z.string().min(1, "Choose a date and time."),
  durationMin: z.number({ error: "Enter the length in minutes." }).int("Use whole minutes.").min(10, "At least 10 minutes.").max(240, "At most 240 minutes."),
});
type Values = z.infer<typeof formSchema>;

export type TeamOption = { professionalId: string; label: string };

export function AppointmentForm({ team, tz, nowIso }: { team: TeamOption[]; tz: string; nowIso: string }) {
  const { run, pending, error } = useAction();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(formSchema),
    defaultValues: { professionalId: team.length === 1 ? team[0].professionalId : "", title: "", startsLocal: "", durationMin: 30 },
  });

  return (
    <form
      className="space-y-4 px-5 py-4"
      onSubmit={handleSubmit(async (v) => {
        const startsAt = localInputToIso(v.startsLocal, tz);
        if (!startsAt) return setError("startsLocal", { message: "Enter a valid date and time." });
        if (new Date(startsAt).getTime() < Date.now()) return setError("startsLocal", { message: "Choose a future time." });
        const ok = await run(
          () => requestAppointmentAction({ professionalId: v.professionalId, title: v.title, startsAt, durationMin: v.durationMin }),
          "Request sent. It is not confirmed until your care team replies",
        );
        if (ok) reset();
      })}
    >
      <p className="text-sm text-muted">This sends a request. The appointment is only confirmed once someone from your care team confirms it. Times are in {tz}.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Care team professional" error={errors.professionalId?.message}>
          {(p) => (
            <Select {...register("professionalId")} {...p}>
              <option value="">Select...</option>
              {team.map((t) => (
                <option key={t.professionalId} value={t.professionalId}>
                  {t.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Reason or title" error={errors.title?.message ? "Enter 3 to 120 characters." : undefined}>
          {(p) => <Input maxLength={120} placeholder="For example: Follow-up visit" {...register("title")} {...p} />}
        </Field>
        <Field label="Preferred date and time" error={errors.startsLocal?.message}>
          {(p) => <Input type="datetime-local" min={toLocalInput(new Date(nowIso), tz)} {...register("startsLocal")} {...p} />}
        </Field>
        <Field label="Length (minutes)" error={errors.durationMin?.message}>
          {(p) => <Input type="number" inputMode="numeric" min={10} max={240} step={5} {...register("durationMin", { valueAsNumber: true })} {...p} />}
        </Field>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button type="submit" loading={pending}>
        <CalendarPlus className="size-4" aria-hidden /> Request appointment
      </Button>
    </form>
  );
}
