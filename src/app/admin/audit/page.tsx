import type { Metadata } from "next";
import { ScrollText } from "lucide-react";
import { Pager } from "@/components/admin/pagination";
import { formatDateTime } from "@/components/account/format";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { listAudit } from "@/server/services/admin";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Audit log" };

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ action?: string; page?: string }> }) {
  const session = await requireSession("ADMIN");
  const sp = await searchParams;
  const action = sp.action?.trim().slice(0, 60) || undefined;
  const page = Math.max(Number.parseInt(sp.page ?? "1", 10) || 1, 1);
  const { rows, total, pageSize } = await listAudit(session, { action, page });

  return (
    <div>
      <PageHeader title="Audit log" description="Security and administrative events. Metadata keys are listed, values are not shown." />
      <Card>
        <form method="get" action="/admin/audit" role="search" className="flex flex-wrap items-end gap-3 border-b border-line px-5 py-4">
          <div className="min-w-48 flex-1">
            <label htmlFor="action" className="mb-1.5 block text-sm font-medium">Action starts with</label>
            <Input id="action" name="action" defaultValue={action} placeholder="e.g. admin. or auth." maxLength={60} />
          </div>
          <Button type="submit">Filter</Button>
          {action && <LinkButton href="/admin/audit" variant="ghost">Clear</LinkButton>}
        </form>
        {rows.length === 0 ? (
          <EmptyState icon={ScrollText} title="No events found">{action ? "No events match this prefix." : "Events will appear as people use the platform."}</EmptyState>
        ) : (
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable table">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <caption className="sr-only">Audit events, newest first</caption>
              <thead className="border-b border-line bg-surface2 text-muted">
                <tr>
                  <th scope="col" className="px-5 py-2.5 font-medium">Time</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Who</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Action</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Entity</th>
                  <th scope="col" className="px-5 py-2.5 font-medium">Metadata keys</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => {
                  const keys = r.metadata && typeof r.metadata === "object" && !Array.isArray(r.metadata) ? Object.keys(r.metadata) : [];
                  return (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap px-5 py-2.5 text-muted">{formatDateTime(r.createdAt, session.timezone)}</td>
                      <td className="px-3 py-2.5">{r.actor ? `${r.actor.name}` : "System"}{r.actor && <span className="block text-xs text-muted">{r.actor.role.toLowerCase()}</span>}</td>
                      <td className="px-3 py-2.5 font-mono text-xs">{r.action}</td>
                      <td className="px-3 py-2.5">{r.entityType ?? "-"}{r.entityId && <span className="block break-all font-mono text-xs text-muted">{r.entityId}</span>}</td>
                      <td className="px-5 py-2.5 text-muted">{keys.length ? keys.join(", ") : "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pager basePath="/admin/audit" params={{ action }} page={page} pageSize={pageSize} total={total} />
      </Card>
    </div>
  );
}
