"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { addNoteAction, completeTaskAction, createTaskAction } from "@/app/actions/staff";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/form";
import { useAction } from "@/components/ui/use-action";
import { noteSchema, taskSchema } from "@/lib/schemas";
import { localInputToIso } from "./format";

const taskForm = z.object({ title: taskSchema.shape.title, due: z.string().min(1, "Choose a due date and time.") });
type TaskIn = z.input<typeof taskForm>;

export function CreateTaskForm({ patientId, tz }: { patientId: string; tz: string }) {
  const { run, pending, error } = useAction();
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<TaskIn>({ resolver: zodResolver(taskForm), defaultValues: { title: "", due: "" } });
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit((v) => {
        const dueAt = localInputToIso(v.due, tz);
        if (!dueAt) return setError("due", { message: "Enter a valid date and time." });
        return run(() => createTaskAction({ patientId, title: v.title, dueAt }), "Follow-up task created", () => reset());
      })}
    >
      <p className="text-sm text-muted">Tasks are assigned to you and are not shown to the patient.</p>
      <Field label="Task" error={errors.title?.message}>{(a) => <Input {...a} {...register("title")} />}</Field>
      <Field label={`Due (${tz})`} error={errors.due?.message}>{(a) => <Input type="datetime-local" {...a} {...register("due")} />}</Field>
      {error && <Alert tone="danger">{error}</Alert>}
      <Button type="submit" loading={pending}>Create task</Button>
    </form>
  );
}

export function CompleteTaskButton({ id, title }: { id: string; title: string }) {
  const { run, pending } = useAction();
  return (
    <Button type="button" size="sm" variant="secondary" loading={pending} aria-label={`Mark done: ${title}`} onClick={() => void run(() => completeTaskAction(id), "Task completed")}>
      <Check className="size-4" aria-hidden /> Done
    </Button>
  );
}

type NoteIn = z.input<typeof noteSchema>;

export function AddNoteForm({ patientId }: { patientId: string }) {
  const { run, pending, error } = useAction();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<NoteIn>({ resolver: zodResolver(noteSchema), defaultValues: { patientId, body: "" } });
  return (
    <form noValidate className="space-y-3" onSubmit={handleSubmit((v) => run(() => addNoteAction(v), "Internal note saved", () => reset({ patientId, body: "" })))}>
      <Field label="New internal note" error={errors.body?.message}>{(a) => <Textarea {...a} {...register("body")} />}</Field>
      {error && <Alert tone="danger">{error}</Alert>}
      <Button type="submit" loading={pending}>Save note</Button>
    </form>
  );
}
