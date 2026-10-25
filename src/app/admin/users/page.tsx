import type { Metadata } from "next";
import { Search, Users } from "lucide-react";
import { Pager } from "@/components/admin/pagination";
import { UserStatusButton } from "@/components/admin/user-status-button";
import { formatDateTime } from "@/components/account/format";
import { Button, LinkButton } from "@/components/ui/button";
import { Badge, Card, EmptyState, PageHeader, type Tone } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/form";
import { listUsers } from "@/server/services/admin";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Users" };

const STATUSES = ["ACTIVE", "PENDING_APPROVAL", "SUSPENDED"] as const;
type Status = (typeof STATUSES)[number];
const STATUS_LABEL: Record<string, string> = { ACTIVE: "Active", PENDING_APPROVAL: "Pending approval", SUSPENDED: "Suspended" };
const STATUS_TONE: Record<string, Tone> = { ACTIVE: "ok", PENDING_APPROVAL: "warn", SUSPENDED: "danger" };
const ROLE_LABEL: Record<string, string> = { PATIENT: "Patient", PROFESSIONAL: "Professional", ADMIN: "Administrator" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const session = await requireSession("ADMIN");
  const sp = await searchParams;
  const q = sp.q?.trim().slice(0, 100) || undefined;
  const status = STATUSES.find((s) => s === sp.status) as Status | undefined;
  const page = Math.max(Number.parseInt(sp.page ?? "1", 10) || 1, 1);
  const { rows, total, pageSize } = await listUsers(session, { q, status, page });

  return (
    <div>
      <PageHeader title="Users" description="Accounts on the platform. Suspending an account signs the person out immediately." />
      <Card>
        <form method="get" action="/admin/users" role="search" className="flex flex-wrap items-end gap-3 border-b border-line px-5 py-4">
          <div className="min-w-48 flex-1">
            <label htmlFor="q" className="mb-1.5 block text-sm font-medium">Search name or email</label>
            <Input id="q" name="q" defaultValue={q} maxLength={100} />
          </div>
          <div>
            <label htmlFor="status" className="mb-1.5 block text-sm font-medium">Status</label>
            <Select id="status" name="status" defaultValue={status ?? ""}>
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </Select>
          </div>
          <Button type="submit"><Search className="size-4" aria-hidden /> Search</Button>
          {(q || status) && <LinkButton href="/admin/users" variant="ghost">Clear</LinkButton>}
        </form>
        {rows.length === 0 ? (
          <EmptyState icon={Users} title="No users found">Try a different search or status.</EmptyState>
        ) : (
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable table">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <caption className="sr-only">Users</caption>
              <thead className="border-b border-line bg-surface2 text-muted">
                <tr>
                  <th scope="col" className="px-5 py-2.5 font-medium">User</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Role</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Status</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Joined</th>
                  <th scope="col" className="px-5 py-2.5 font-medium"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((u) => {
                  const canToggle = u.role !== "ADMIN" && u.id !== session.userId && u.status !== "PENDING_APPROVAL";
                  return (
                    <tr key={u.id}>
                      <td className="px-5 py-3">
                        <p className="font-medium">{u.name}{u.isDemo && <Badge className="ml-2">Demo</Badge>}</p>
                        <p className="break-all text-muted">{u.email}</p>
                      </td>
                      <td className="px-3 py-3">
                        {ROLE_LABEL[u.role]}
                        {u.role === "PROFESSIONAL" && <span className="block text-xs text-muted">{u.professionalProfile?.verifiedAt ? "Licence verified" : "Not verified"}</span>}
                      </td>
                      <td className="px-3 py-3"><Badge tone={STATUS_TONE[u.status] ?? "neutral"}>{STATUS_LABEL[u.status] ?? u.status}</Badge></td>
                      <td className="whitespace-nowrap px-3 py-3 text-muted">{formatDateTime(u.createdAt, session.timezone)}</td>
                      <td className="px-5 py-3 text-right">
                        {canToggle ? (
                          <UserStatusButton userId={u.id} name={u.name} status={u.status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE"} />
                        ) : u.status === "PENDING_APPROVAL" ? (
                          <LinkButton href="/admin/approvals" variant="ghost" size="sm">Review</LinkButton>
                        ) : (
                          <span className="text-xs text-muted">{u.id === session.userId ? "You" : "Managed by CLI"}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pager basePath="/admin/users" params={{ q, status }} page={page} pageSize={pageSize} total={total} />
      </Card>
    </div>
  );
}
