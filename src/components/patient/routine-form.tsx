"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { createRoutineAction } from "@/app/actions/patient";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { useAction } from "@/components/ui/use-action";
import { routineSchema } from "@/lib/schemas";
import { DAY_SHORT } from "./format";

type Values = z.infer<typeof routineSchema>;

const KINDS: [Values["kind"], string][] = [
  ["HYDRATION", "Hydration"],
  ["ACTIVITY", "Activity"],
  ["EXERCISE", "Exercise"],
  ["SLEEP", "Sleep"],
  ["WELLNESS", "Wellness"],
];

export function RoutineForm() {
  const { run, pending, error } = useAction();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(routineSchema), defaultValues: { title: "", kind: "WELLNESS", daysOfWeek: [], timeOfDay: "" } });
  const days = watch("daysOfWeek");

  const toggleDay = (d: number) => setValue("daysOfWeek", days.includes(d) ? days.filter((x) => x !== d) : [...days, d]);

  return (
    <form
      className="space-y-4 px-5 py-4"
      onSubmit={handleSubmit(async (v) => {
        if (await run(() => createRoutineAction(v), "Routine added")) reset();
      })}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Routine name" error={errors.title?.message ? "Enter a name of 2 to 100 characters." : undefined}>
          {(p) => <Input maxLength={100} placeholder="For example: Evening walk" {...register("title")} {...p} />}
        </Field>
        <Field label="Type">{(p) => <Select {...register("kind")} {...p}>{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>}</Field>
      </div>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Days</legend>
        <div className="flex flex-wrap gap-2">
          {DAY_SHORT.map((label, d) => (
            <label key={d} className="cursor-pointer">
              <input type="checkbox" className="peer sr-only" checked={days.includes(d)} onChange={() => toggleDay(d)} />
              <span className="inline-flex h-9 min-w-12 items-center justify-center rounded-md border border-line2 bg-surface px-2 text-sm peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:font-semibold peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
                {label}
              </span>
            </label>
          ))}
        </div>
        <p className="mt-1.5 text-sm text-muted">Leave all unselected for every day.</p>
      </fieldset>
      <Field label="Time of day (optional)" error={errors.timeOfDay?.message ? "Use a valid time." : undefined} className="max-w-48">
        {(p) => <Input type="time" {...register("timeOfDay")} {...p} />}
      </Field>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button type="submit" loading={pending}>
        <Plus className="size-4" aria-hidden /> Add routine
      </Button>
    </form>
  );
}
