"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { createClinicianRoutineAction } from "@/app/actions/staff";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/form";
import { useAction } from "@/components/ui/use-action";
import { routineSchema } from "@/lib/schemas";
import { DAY_NAMES, ROUTINE_KIND_LABEL } from "./format";

type In = z.input<typeof routineSchema>;
type Out = z.output<typeof routineSchema>;

export function RoutineForm({ patientId }: { patientId: string }) {
  const { run, pending, error } = useAction();
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<In, unknown, Out>({
    resolver: zodResolver(routineSchema),
    defaultValues: { title: "", kind: "CLINICIAN_TASK", daysOfWeek: [], timeOfDay: "" },
  });
  const days = watch("daysOfWeek");
  return (
    <form onSubmit={handleSubmit((v) => run(() => createClinicianRoutineAction(patientId, v), "Routine added for the patient", () => reset()))} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Routine" error={errors.title?.message}>{(a) => <Input {...a} {...register("title")} />}</Field>
        <Field label="Type" error={errors.kind?.message}>
          {(a) => (
            <Select {...a} {...register("kind")}>
              {Object.entries(ROUTINE_KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Time of day (optional)" error={errors.timeOfDay?.message}>{(a) => <Input type="time" {...a} {...register("timeOfDay")} />}</Field>
      </div>
      <fieldset>
        <legend className="text-sm font-medium">Days (none checked = every day)</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {DAY_NAMES.map((n, i) => (
            <label key={n} className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-line2 px-2.5 py-1.5 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
              <input type="checkbox" className="size-4 accent-[var(--c-accent)]" checked={days.includes(i)} onChange={(e) => setValue("daysOfWeek", e.target.checked ? [...days, i] : days.filter((d) => d !== i))} />
              {n}
            </label>
          ))}
        </div>
      </fieldset>
      {error && <Alert tone="danger">{error}</Alert>}
      <Button type="submit" loading={pending}>Add routine</Button>
    </form>
  );
}
