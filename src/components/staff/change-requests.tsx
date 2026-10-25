"use client";

import { useState } from "react";
import { resolveChangeRequestAction } from "@/app/actions/staff";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/form";
import { useAction } from "@/components/ui/use-action";

export function ResolveChangeRequestForm({ id }: { id: string }) {
  const { run, pending, error } = useAction();
  const [text, setText] = useState("");
  return (
    <form
      className="mt-3 space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => resolveChangeRequestAction(id, text), "Response sent to the patient", () => setText(""));
      }}
    >
      <Field label="Your response (visible to the patient)" error={error ?? undefined} hint="Replying does not change any medication. Edit the plan separately if a change is needed.">
        {(a) => <Textarea {...a} className="min-h-20" value={text} onChange={(e) => setText(e.target.value)} />}
      </Field>
      <Button type="submit" size="sm" loading={pending} disabled={text.trim().length < 2}>Send response and resolve</Button>
    </form>
  );
}
