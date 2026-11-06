"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerPatientAction } from "@/app/actions/auth";
import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/form";
import { useAction } from "@/components/ui/use-action";
import { registerPatientSchema, type RegisterPatientInput } from "@/lib/schemas";
import { inlineLink } from "@/components/auth/link-styles";
import { PASSWORD_HINT } from "./password-hint";
import { TimezoneField } from "./timezone-field";

export function RegisterPatientForm() {
  const { run, pending, error } = useAction();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterPatientInput>({ resolver: zodResolver(registerPatientSchema), defaultValues: { timezone: "UTC", dateOfBirth: "" } });

  return (
    <form onSubmit={handleSubmit((v) => run(() => registerPatientAction(v)))} className="stagger space-y-4" noValidate>
      {error && <Alert tone="danger" className="anim-up">{error}</Alert>}
      <Field label="Full name" error={errors.name?.message}>
        {(a) => <Input autoComplete="name" {...a} {...register("name")} />}
      </Field>
      <Field label="Email" error={errors.email?.message}>
        {(a) => <Input type="email" autoComplete="email" inputMode="email" {...a} {...register("email")} />}
      </Field>
      <Field label="Password" hint={PASSWORD_HINT} error={errors.password?.message}>
        {(a) => <Input type="password" autoComplete="new-password" {...a} {...register("password")} />}
      </Field>
      <TimezoneField registration={register("timezone")} onDetect={(tz) => setValue("timezone", tz)} error={errors.timezone?.message} />
      <Field
        label="Date of birth (optional)"
        hint="Optional. Asked only so your care team can tell you apart from patients with similar names and show age-appropriate context. You can leave it blank."
        error={errors.dateOfBirth?.message}
      >
        {(a) => <Input type="date" autoComplete="bday" {...a} {...register("dateOfBirth")} />}
      </Field>
      <div>
        <Checkbox
          label="I accept the terms and privacy notice"
          hint="Read the terms and privacy notice first; both open in a new tab."
          aria-invalid={errors.acceptTerms ? true : undefined}
          {...register("acceptTerms")}
        />
        <p className="ml-6.5 mt-1 text-sm">
          <Link href="/terms" target="_blank" className={inlineLink}>
            Terms
          </Link>
          {" · "}
          <Link href="/privacy" target="_blank" className={inlineLink}>
            Privacy notice
          </Link>
        </p>
        {errors.acceptTerms && (
          <p role="alert" className="anim-up mt-1 ml-6.5 text-sm text-danger">
            {errors.acceptTerms.message}
          </p>
        )}
      </div>
      <Button type="submit" className="w-full" loading={pending}>
        Create patient account
      </Button>
    </form>
  );
}
