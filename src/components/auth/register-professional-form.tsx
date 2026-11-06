"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerProfessionalAction } from "@/app/actions/auth";
import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/form";
import { useAction } from "@/components/ui/use-action";
import { registerProfessionalSchema, type RegisterProfessionalInput } from "@/lib/schemas";
import { inlineLink } from "@/components/auth/link-styles";
import { PASSWORD_HINT } from "./password-hint";
import { TimezoneField } from "./timezone-field";

export function RegisterProfessionalForm() {
  const { run, pending, error } = useAction();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterProfessionalInput>({ resolver: zodResolver(registerProfessionalSchema), defaultValues: { timezone: "UTC", specialty: "" } });

  return (
    <form onSubmit={handleSubmit((v) => run(() => registerProfessionalAction(v)))} className="stagger space-y-5 [&_label]:transition-colors [&_div:focus-within>label]:text-accent" noValidate>
      {error && <Alert tone="danger" className="anim-up">{error}</Alert>}
      <Field label="Full name" error={errors.name?.message}>
        {(a) => <Input autoComplete="name" {...a} {...register("name")} />}
      </Field>
      <Field label="Work email" error={errors.email?.message}>
        {(a) => <Input type="email" autoComplete="email" inputMode="email" {...a} {...register("email")} />}
      </Field>
      <Field label="Password" hint={PASSWORD_HINT} error={errors.password?.message}>
        {(a) => <Input type="password" autoComplete="new-password" {...a} {...register("password")} />}
      </Field>
      <TimezoneField registration={register("timezone")} onDetect={(tz) => setValue("timezone", tz)} error={errors.timezone?.message} />

      <fieldset className="space-y-4 rounded-lg border border-line p-4">
        <legend className="px-1 text-sm font-semibold">Professional details</legend>
        <Field label="Profession" hint="For example: general practitioner, nurse, pharmacist." error={errors.profession?.message}>
          {(a) => <Input {...a} {...register("profession")} />}
        </Field>
        <Field label="Licence number" error={errors.licenseNumber?.message}>
          {(a) => <Input autoComplete="off" {...a} {...register("licenseNumber")} />}
        </Field>
        <Field label="Issuing region" hint="The country, state or body that issued the licence." error={errors.licenseRegion?.message}>
          {(a) => <Input autoComplete="off" {...a} {...register("licenseRegion")} />}
        </Field>
        <Field label="Specialty (optional)" error={errors.specialty?.message}>
          {(a) => <Input {...a} {...register("specialty")} />}
        </Field>
      </fieldset>

      <Alert tone="info" title="Staff access needs verification">
        You can sign in right away, but patient features stay locked until an administrator reviews your details and approves your account.
      </Alert>

      <div>
        <Checkbox label="I accept the terms and privacy notice" aria-invalid={errors.acceptTerms ? true : undefined} {...register("acceptTerms")} />
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
        Submit for verification
      </Button>
    </form>
  );
}
