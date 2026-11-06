"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { demoLoginAction, loginAction } from "@/app/actions/auth";
import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { useAction } from "@/components/ui/use-action";
import { inlineLink } from "@/components/auth/link-styles";
import { loginSchema } from "@/lib/schemas";

type Values = z.input<typeof loginSchema>;

export function LoginForm({ demo }: { demo: boolean }) {
  const { run, pending, error } = useAction();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(loginSchema) });

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit((v) => run(() => loginAction(v)))} className="stagger space-y-4" noValidate>
        {error && <Alert tone="danger" className="anim-up">{error}</Alert>}
        <Field label="Email" error={errors.email?.message}>
          {(a) => <Input type="email" autoComplete="email" inputMode="email" {...a} {...register("email")} />}
        </Field>
        <Field label="Password" error={errors.password?.message}>
          {(a) => <Input type="password" autoComplete="current-password" {...a} {...register("password")} />}
        </Field>
        <Button type="submit" className="w-full" loading={pending}>
          Sign in
        </Button>
        <p className="text-sm">
          <Link href="/forgot-password" className={inlineLink}>
            Forgot your password?
          </Link>
        </p>
      </form>

      {demo && (
        <section aria-labelledby="demo-h" className="anim-up rounded-lg border border-line bg-surface2 p-4">
          <h2 id="demo-h" className="text-sm font-semibold">
            Try the demo
          </h2>
          <p className="mt-1 text-sm text-muted">
            Sign in to a shared demo account for each role. All data in it is synthetic and for illustration only, and the demo administrator can only look, not change anything. Do not enter real personal or health information.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" disabled={pending} onClick={() => run(() => demoLoginAction("patient"))}>
              Demo as patient
            </Button>
            <Button type="button" variant="secondary" disabled={pending} onClick={() => run(() => demoLoginAction("staff"))}>
              Demo as medical staff
            </Button>
            <Button type="button" variant="secondary" disabled={pending} onClick={() => run(() => demoLoginAction("admin"))}>
              Demo as administrator
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
