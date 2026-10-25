"use client";

import { useState } from "react";
import { addOrgMemberAction, createOrganizationAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { useAction } from "@/components/ui/use-action";

export function CreateOrgForm() {
  const [name, setName] = useState("");
  const { run, pending, error } = useAction();
  return (
    <form
      className="flex flex-wrap items-end gap-3 px-5 py-4"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => createOrganizationAction(name), "Organization created", () => setName(""));
      }}
    >
      <Field label="Organization name" error={error ?? undefined} className="min-w-56 flex-1">
        {(a) => <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required {...a} />}
      </Field>
      <Button type="submit" loading={pending} disabled={name.trim().length < 2}>
        Create organization
      </Button>
    </form>
  );
}

export function AddMemberForm({ orgId, orgName }: { orgId: string; orgName: string }) {
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const { run, pending, error } = useAction();
  return (
    <form
      className="grid gap-3 border-t border-line px-5 py-4 sm:grid-cols-[1fr_12rem_auto] sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => addOrgMemberAction(orgId, email, title), "Member added", () => {
          setEmail("");
          setTitle("");
        });
      }}
    >
      <Field label={`Professional email (${orgName})`} error={error ?? undefined}>
        {(a) => <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="off" {...a} />}
      </Field>
      <Field label="Title (optional)">{(a) => <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} {...a} />}</Field>
      <Button type="submit" variant="secondary" loading={pending} disabled={!email.trim()}>
        Add member
      </Button>
    </form>
  );
}
