import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { LinkButton } from "@/components/ui/button";
import { PageHeader, Stat } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
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
  const total = Math.max(roles.reduce((s, [, n]) => s + n, 0), 1);
  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Platform health"
        description="Account and security counts only. This portal never shows clinical records."
        photo="colleagues"
        focal="center 40%"
      />
      <div className="grid gap-x-14 gap-y-12 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section aria-label="Key figures">
          <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
            <Stat label="Active accounts" value={m.users} />
            <Stat label="Pending approvals" value={m.pending} tone={m.pending > 0 ? "warn" : undefined} hint={m.pending > 0 ? "Professionals waiting for review" : "Nothing waiting"} />
            <Stat label="Suspended accounts" value={m.suspended} />
            <Stat label="Active sessions" value={m.activeSessions} />
            <Stat label="Failed sign-ins, last 24 hours" value={m.failedLogins24h} tone={m.failedLogins24h > 20 ? "danger" : undefined} />
          </div>
        </section>

        <div className="space-y-12">
          <section aria-labelledby="roles-h" className="anim-up" style={{ animationDelay: "200ms" }}>
            <h2 id="roles-h" className="eyebrow">
              Users by role
            </h2>
            <ul className="mt-3 border-t border-line2">
              {roles.map(([label, n], i) => (
                <li key={label} className="border-b border-line py-4">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-ink2">{label}</span>
                    <span className="text-2xl font-semibold tracking-tight tabular-nums">
                      <CountUp value={n} />
                    </span>
                  </div>
                  <div className="mt-2.5 h-0.5 bg-surface2" aria-hidden>
                    <div className="anim-grow-x h-full bg-accent" style={{ width: `${(n / total) * 100}%`, animationDelay: `${300 + i * 90}ms` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="next-h" className="anim-up" style={{ animationDelay: "280ms" }}>
            <h2 id="next-h" className="eyebrow">
              Next steps
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line2 pt-5">
              <LinkButton href="/admin/approvals" variant={m.pending > 0 ? "primary" : "secondary"}>
                Review approvals{m.pending > 0 ? ` (${m.pending})` : ""}
              </LinkButton>
              <Link href="/admin/audit" className="group inline-flex items-center gap-1.5 font-medium text-accent underline underline-offset-4">
                Open audit log
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
