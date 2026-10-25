"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { createCarePlanAction, updateCarePlanAction } from "@/app/actions/staff";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/form";
import { useAction } from "@/components/ui/use-action";
import { carePlanSchema, carePlanUpdateSchema } from "@/lib/schemas";

type PlanIn = z.input<typeof carePlanSchema>;
type PlanOut = z.output<typeof carePlanSchema>;

export function CreatePlanForm({ patientId, today }: { patientId: string; today: string }) {
  const { run, pending, error } = useAction();
  const f = useForm<PlanIn, unknown, PlanOut>({
    resolver: zodResolver(carePlanSchema),
    defaultValues: { title: "", instructions: "", startDate: today, endDate: "" },
  });
  const { register, handleSubmit, reset, formState: { errors } } = f;
  return (
    <form
      onSubmit={handleSubmit((v) => run(() => createCarePlanAction(patientId, v), "Care plan shared with the patient", () => reset()))}
      className="space-y-4"
      noValidate
    >
      <p className="text-sm text-muted">The patient sees this plan, its instructions, and every later change with the reason you give.</p>
      <Field label="Plan title" error={errors.title?.message}>{(a) => <Input {...a} {...register("title")} />}</Field>
      <Field label="Instructions (visible to the patient)" error={errors.instructions?.message}>
        {(a) => <Textarea {...a} {...register("instructions")} />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date" error={errors.startDate?.message}>{(a) => <Input type="date" {...a} {...register("startDate")} />}</Field>
        <Field label="End date (optional)" error={errors.endDate?.message}>{(a) => <Input type="date" {...a} {...register("endDate")} />}</Field>
      </div>
      {error && <Alert tone="danger">{error}</Alert>}
      <Button type="submit" loading={pending}>Create care plan</Button>
    </form>
  );
}

type UpdIn = z.input<typeof carePlanUpdateSchema>;
type UpdOut = z.output<typeof carePlanUpdateSchema>;

export function EditPlanForm({
  planId,
  initial,
}: {
  planId: string;
  initial: { title: string; instructions: string; startDate: string; endDate: string };
}) {
  const { run, pending, error } = useAction();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UpdIn, unknown, UpdOut>({
    resolver: zodResolver(carePlanUpdateSchema),
    defaultValues: { ...initial, reason: "" },
  });
  return (
    <form
      onSubmit={handleSubmit((v) => run(() => updateCarePlanAction(planId, v), "Care plan updated", () => reset({ ...v, reason: "" })))}
      className="space-y-4"
      noValidate
    >
      <Field label="Plan title" error={errors.title?.message}>{(a) => <Input {...a} {...register("title")} />}</Field>
      <Field label="Instructions (visible to the patient)" error={errors.instructions?.message}>
        {(a) => <Textarea {...a} {...register("instructions")} />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date" error={errors.startDate?.message}>{(a) => <Input type="date" {...a} {...register("startDate")} />}</Field>
        <Field label="End date (optional)" error={errors.endDate?.message}>{(a) => <Input type="date" {...a} {...register("endDate")} />}</Field>
      </div>
      <Field label="Reason for change (required)" hint="Recorded in the version history and shown to the patient." error={errors.reason?.message}>
        {(a) => <Input {...a} {...register("reason")} />}
      </Field>
      {error && <Alert tone="danger">{error}</Alert>}
      <Button type="submit" loading={pending}>Save new version</Button>
    </form>
  );
}
