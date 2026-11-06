"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { loginAction } from "@/app/actions/auth";
import { DemoPanel } from "./demo-panel";
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
      <form onSubmit={handleSubmit((v) => run(() => loginAction(v)))} className="stagger space-y-5 [&_label]:transition-colors [&_div:focus-within>label]:text-accent" noValidate>
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

      {demo && <DemoPanel />}
    </div>
  );
}
