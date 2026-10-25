"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { resetPasswordAction } from "@/app/actions/auth";
import { Alert } from "@/components/ui/card";
import { Button, LinkButton } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { useAction } from "@/components/ui/use-action";
import { resetPasswordSchema } from "@/lib/schemas";
import { PASSWORD_HINT } from "./password-hint";

type Values = z.input<typeof resetPasswordSchema>;

export function ResetPasswordForm({ token }: { token: string }) {
  const { run, pending, error } = useAction();
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { token } });

  if (done) {
    return (
      <div className="space-y-4">
        <Alert tone="ok" title="Password updated">
          You have been signed out of all devices. Sign in with your new password.
        </Alert>
        <LinkButton href="/login" className="w-full">
          Go to sign in
        </LinkButton>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit((v) => run(() => resetPasswordAction(v), "Password updated", () => setDone(true)))} className="space-y-4" noValidate>
      {error && (
        <Alert tone="danger">
          {error}{" "}
          <Link href="/forgot-password" className="underline">
            Request a new link
          </Link>
        </Alert>
      )}
      <input type="hidden" {...register("token")} />
      <Field label="New password" hint={PASSWORD_HINT} error={errors.password?.message ?? errors.token?.message}>
        {(a) => <Input type="password" autoComplete="new-password" {...a} {...register("password")} />}
      </Field>
      <Button type="submit" className="w-full" loading={pending}>
        Set new password
      </Button>
    </form>
  );
}
