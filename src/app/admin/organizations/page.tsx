import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { AddMemberForm, CreateOrgForm } from "@/components/admin/org-forms";
import { Card, CardHeader, EmptyState, PageHeader } from "@/components/ui/card";
import { listOrganizations } from "@/server/services/admin";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Organizations" };

export default async function OrganizationsPage() {
  const session = await requireSession("ADMIN");
  const orgs = await listOrganizations(session);
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Organizations" description="Group professionals by clinic or practice. Add members by the email they registered with." />
      <Card>
        <CardHeader title="New organization" />
        <CreateOrgForm />
      </Card>
      {orgs.length === 0 ? (
        <Card>
          <EmptyState icon={Building2} title="No organizations yet">Create the first one above.</EmptyState>
        </Card>
      ) : (
        orgs.map((o) => (
          <Card key={o.id}>
            <CardHeader title={o.name} description={`${o.members.length} member${o.members.length === 1 ? "" : "s"}`} />
            {o.members.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted">No members yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {o.members.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-baseline justify-between gap-x-4 px-5 py-2.5 text-sm">
                    <span className="font-medium">{m.user.name}{m.title && <span className="font-normal text-muted">, {m.title}</span>}</span>
                    <span className="break-all text-muted">{m.user.email}</span>
                  </li>
                ))}
              </ul>
            )}
            <AddMemberForm orgId={o.id} orgName={o.name} />
          </Card>
        ))
      )}
    </div>
  );
}
