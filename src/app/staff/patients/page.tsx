import { ChevronLeft, ChevronRight, Search, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/card";
import { Button, buttonClass } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { first, fmtDay } from "@/components/staff/format";
import { cn } from "@/lib/cn";
import { listPatients } from "@/server/services/care";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Patients" };

type SP = Promise<{ q?: string | string[]; page?: string | string[]; sort?: string | string[] }>;

export default async function PatientsPage({ searchParams }: { searchParams: SP }) {
  const session = await requireSession("PROFESSIONAL");
  const sp = await searchParams;
  const q = first(sp.q)?.trim().slice(0, 100) || undefined;
  const sort = first(sp.sort) === "recent" ? "recent" : "name";
  const page = Math.max(1, Math.floor(Number(first(sp.page))) || 1);
  const { rows, total, pageSize } = await listPatients(session, { q, page, sort });
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (p: number, s = sort) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (s !== "name") u.set("sort", s);
    if (p > 1) u.set("page", String(p));
    const qs = u.toString();
    return `/staff/patients${qs ? `?${qs}` : ""}`;
  };
  return (
    <>
      <PageHeader title="Patients" description="Patients with an active care relationship with you. You only see what each patient has chosen to share." />
      <Card className="anim-fade mb-4 p-4">
        <form role="search" className="flex flex-wrap items-center gap-2">
          <label htmlFor="q" className="sr-only">Search by name or email</label>
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted" aria-hidden />
            <Input id="q" name="q" defaultValue={q} placeholder="Search by name or email" className="pl-9" />
          </div>
          {sort !== "name" && <input type="hidden" name="sort" value={sort} />}
          <Button type="submit">Search</Button>
          {q && <Link href="/staff/patients" className={buttonClass({ variant: "ghost" })}>Clear</Link>}
        </form>
        <p className="mt-3 flex items-center gap-2 text-sm text-muted">
          Sort:
          {(["name", "recent"] as const).map((s) => (
            <Link key={s} href={href(1, s)} aria-current={sort === s ? "true" : undefined} className={cn("rounded-md px-2 py-1 transition-colors hover:bg-surface2", sort === s && "bg-accent-soft font-medium text-accent-hover")}>
              {s === "name" ? "Name" : "Most recently connected"}
            </Link>
          ))}
        </p>
      </Card>

      <Card>
        {rows.length === 0 ? (
          <EmptyState icon={Users} title={q ? "No patients match your search" : "No patients yet"} action={!q ? <Link href="/staff/invitations" className={buttonClass({})}>Invite a patient</Link> : undefined}>
            {q ? "Check the spelling or clear the search." : "Invite a patient, or accept a connection request, to see them here."}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Patients with an active care relationship</caption>
              <thead className="border-b border-line bg-surface2 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-5 py-2.5 font-semibold">Patient</th>
                  <th scope="col" className="hidden px-3 py-2.5 font-semibold sm:table-cell">Email</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Status</th>
                  <th scope="col" className="hidden px-3 py-2.5 font-semibold md:table-cell">Connected</th>
                  <th scope="col" className="w-10 py-2.5 pr-5"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody className="stagger divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.id} className="group transition-colors hover:bg-surface2">
                    <td className="px-5 py-3">
                      <Link href={`/staff/patients/${r.patientId}`} className="font-medium text-ink group-hover:text-accent-hover">{r.patient.user.name}</Link>
                      <span className="block truncate text-muted sm:hidden">{r.patient.user.email}</span>
                    </td>
                    <td className="hidden max-w-64 truncate px-3 py-3 text-muted sm:table-cell">{r.patient.user.email}</td>
                    <td className="px-3 py-3"><Badge tone="ok">Active</Badge></td>
                    <td className="hidden px-3 py-3 tabular-nums text-ink2 md:table-cell">{r.startedAt ? fmtDay(r.startedAt, session.timezone) : ""}</td>
                    <td className="py-3 pr-5"><ChevronRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted">Page {Math.min(page, pages)} of {pages} · {total} patients</span>
          <span className="flex gap-2">
            {page > 1 ? <Link href={href(page - 1)} className={buttonClass({ variant: "secondary", size: "sm" })}><ChevronLeft className="size-4" aria-hidden /> Previous</Link> : null}
            {page < pages ? <Link href={href(page + 1)} className={buttonClass({ variant: "secondary", size: "sm" })}>Next <ChevronRight className="size-4" aria-hidden /></Link> : null}
          </span>
        </nav>
      )}
    </>
  );
}
