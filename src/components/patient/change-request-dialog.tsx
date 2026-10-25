"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquareText } from "lucide-react";
import { useForm } from "react-hook-form";
import { createChangeRequestAction } from "@/app/actions/patient";
import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/form";
import { useAction } from "@/components/ui/use-action";
import { changeRequestSchema } from "@/lib/schemas";
import { DialogButton } from "./dialog-button";

type Values = { planId: string; message: string };

function Form({ planId, close }: { planId: string; close: () => void }) {
  const { run, pending, error } = useAction();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(changeRequestSchema), defaultValues: { planId, message: "" } });

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(async (v) => {
        if (await run(() => createChangeRequestAction(v), "Question sent to your care team")) close();
      })}
    >
      <Alert tone="info">
        Only your care team can change a prescription. This sends them your question; it does not change your medication. Keep following your current instructions until they reply.
      </Alert>
      <input type="hidden" {...register("planId")} />
      <Field label="What would you like to ask about?" hint="For example: side effects you noticed, trouble with the schedule, or a question about the instructions." error={errors.message?.message}>
        {(p) => <Textarea maxLength={1000} {...register("message")} {...p} />}
      </Field>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={close}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          Send question
        </Button>
      </div>
    </form>
  );
}

export function ChangeRequestDialog({ planId, medication }: { planId: string; medication: string }) {
  return (
    <DialogButton label="Ask about a change" ariaLabel={`Ask about a change to ${medication}`} title={`Ask about ${medication}`} icon={<MessageSquareText className="size-4" aria-hidden />}>
      {(close) => <Form planId={planId} close={close} />}
    </DialogButton>
  );
}
