"use client";

import { useState } from "react";
import { setupAdminAction } from "@/app/actions/auth";
import { Alert } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { useAction } from "@/components/ui/use-action";

export function SetupForm() {
  const { run, pending, error } = useAction();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [local, setLocal] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return setLocal("The two passwords do not match.");
    setLocal(null);
    void run(() => setupAdminAction({ name, email, password }));
  }

  return (
    <form onSubmit={submit} className="stagger space-y-5 [&_label]:transition-colors [&_div:focus-within>label]:text-accent" noValidate>
      {(local || error) && <Alert tone="danger" className="anim-up">{local ?? error}</Alert>}
      <Field label="Your name">{(a) => <Input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} {...a} />}</Field>
      <Field label="Email">{(a) => <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} {...a} />}</Field>
      <Field label="Password" hint="At least 14 characters. A short phrase of several words works well.">
        {(a) => <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} {...a} />}
      </Field>
      <Field label="Repeat password">
        {(a) => <Input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} {...a} />}
      </Field>
      <Button type="submit" loading={pending} className="w-full">
        Create administrator
      </Button>
    </form>
  );
}
