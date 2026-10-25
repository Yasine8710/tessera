"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordAction } from "@/app/actions/auth";
import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { useAction } from "@/components/ui/use-action";
import { resetRequestSchema } from "@/lib/schemas";

export function ForgotPasswordForm() {
  const { run, pending, error } = useAction();
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string }>({ resolver: zodResolver(resetRequestSchema) });

  if (sent) {
    return (
      <Alert tone="ok" title="Check your email">
        If an account exists for that address, a reset link has been sent. The link works once and expires after 60 minutes. If this server has no email delivery configured, the operator can find the link in the server console.
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit((v) => run(() => forgotPasswordAction(v), undefined, () => setSent(true)))} className="space-y-4" noValidate>
      {error && <Alert tone="danger">{error}</Alert>}
      <Field label="Email" error={errors.email?.message}>
        {(a) => <Input type="email" autoComplete="email" inputMode="email" {...a} {...register("email")} />}
      </Field>
      <Button type="submit" className="w-full" loading={pending}>
        Send reset link
      </Button>
    </form>
  );
}
