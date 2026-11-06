import type { Metadata } from "next";
import { UserCheck } from "lucide-react";
import { ApprovalActions } from "@/components/admin/approval-actions";
import { formatDateTime } from "@/components/account/format";
import { Alert, Badge, Card, EmptyState, PageHeader } from "@/components/ui/card";
import { pendingProfessionals } from "@/server/services/admin";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Professional approvals" };

export default async function ApprovalsPage() {
  const session = await requireSession("ADMIN");
  const rows = await pendingProfessionals(session);
  return (
    <div className="max-w-4xl">
      <PageHeader title="Professional approvals" description="Professionals who registered and are waiting for access to the staff portal." />
      <Alert tone="warn" title="Verify the licence yourself" className="mb-5">
        Tessera does not check licences automatically. Before approving, confirm the licence number and region with the issuing regulator or register. Approval grants access to patient data once a patient consents.
      </Alert>
      {rows.length === 0 ? (
        <Card>
          <EmptyState icon={UserCheck} title="No pending approvals">
            New professional registrations will appear here.
          </EmptyState>
        </Card>
      ) : (
        <ul className="space-y-4">
          {rows.map((u) => {
            const p = u.professionalProfile;
            return (
              <li key={u.id}>
                <Card className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-semibold">{u.name}</h2>
                      <p className="break-words text-sm text-muted">{u.email}</p>
                    </div>
                    <Badge tone={u.emailVerifiedAt ? "ok" : "warn"}>{u.emailVerifiedAt ? "Email verified" : "Email not verified"}</Badge>
                  </div>
                  <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                    <Item label="Profession" value={p?.profession} />
                    <Item label="Specialty" value={p?.specialty} />
                    <Item label="Licence number" value={p?.licenseNumber} />
                    <Item label="Issuing region" value={p?.licenseRegion} />
                    <Item label="Registered" value={formatDateTime(u.createdAt, session.timezone)} />
                  </dl>
                  <div className="mt-4 border-t border-line pt-4">
                    <ApprovalActions userId={u.id} name={u.name} />
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Item({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted">{label}</dt>
      <dd className="mt-0.5 break-words font-medium">{value || "Not provided"}</dd>
    </div>
  );
}
