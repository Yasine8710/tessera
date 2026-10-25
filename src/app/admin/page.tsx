import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/button";
import { PageHeader, Stat, Card, CardHeader } from "@/components/ui/card";
import { platformMetrics } from "@/server/services/admin";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Platform health" };

export default async function AdminHome() {
  const session = await requireSession("ADMIN");
  const m = await platformMetrics(session);
  const roles = [
    ["Patients", m.byRole.PATIENT ?? 0],
    ["Professionals", m.byRole.PROFESSIONAL ?? 0],
    ["Administrators", m.byRole.ADMIN ?? 0],
  ] as const;
  return (
    <div>
      <PageHeader title="Platform health" description="Account and security counts only. This portal never shows clinical records." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Active accounts" value={m.users} />
        <Stat label="Pending approvals" value={m.pending} tone={m.pending > 0 ? "warn" : undefined} hint={m.pending > 0 ? "Professionals waiting for review" : "Nothing waiting"} />
        <Stat label="Suspended accounts" value={m.suspended} />
        <Stat label="Active sessions" value={m.activeSessions} />
        <Stat label="Failed sign-ins, last 24 hours" value={m.failedLogins24h} tone={m.failedLogins24h > 20 ? "danger" : undefined} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Users by role" />
          <dl className="divide-y divide-line">
            {roles.map(([label, n]) => (
              <div key={label} className="flex items-center justify-between px-5 py-3 text-sm">
                <dt>{label}</dt>
                <dd className="font-semibold tabular-nums">{n}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card>
          <CardHeader title="Next steps" />
          <div className="flex flex-wrap gap-2 px-5 py-4">
            <LinkButton href="/admin/approvals" variant={m.pending > 0 ? "primary" : "secondary"}>
              Review approvals{m.pending > 0 ? ` (${m.pending})` : ""}
            </LinkButton>
            <LinkButton href="/admin/audit" variant="secondary">
              Open audit log
            </LinkButton>
          </div>
        </Card>
      </div>
    </div>
  );
}
