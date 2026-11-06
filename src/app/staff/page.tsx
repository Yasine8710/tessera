import { Flag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardHeader, EmptyState, PageHeader, Stat } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { FlagRow } from "@/components/staff/flags";
import { fmtDateTime } from "@/components/staff/format";
import { requireSession } from "@/server/session";
import { staffOverview } from "@/server/services/staff";

export const metadata: Metadata = { title: "Staff overview" };

export default async function StaffOverviewPage() {
  const session = await requireSession("PROFESSIONAL");
  const o = await staffOverview(session);
  const tz = session.timezone;
  return (
    <>
      <PageHeader
        title="Overview"
        description="A summary of the patients who have connected with you. Figures reflect only what patients have chosen to share."
        action={<LinkButton href="/staff/patients" variant="secondary">Open patient directory</LinkButton>}
      />
      <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Patients in your care" value={o.patientCount} hint="Active care relationships" />
        <Stat label="Patients with indicators" value={o.patientsFlagged} hint="See the list below" tone={o.patientsFlagged ? "warn" : undefined} />
        <Stat label="Upcoming appointments" value={o.upcoming.length >= 5 ? "5+" : o.upcoming.length} hint="Next five are listed below" />
        <Stat label="Dose exceptions, last 7 days" value={o.exceptions7d} hint="Reported by patients; only patients sharing adherence" tone={o.exceptions7d ? "warn" : undefined} />
        <Stat label="Open follow-up tasks" value={o.openTasks} hint="Assigned to you" />
        <Stat label="Pending connection requests" value={o.pendingRequests} hint={o.pendingRequests ? "Review in Invitations" : "None waiting"} tone={o.pendingRequests ? "info" : undefined} />
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Monitoring indicators"
            description="Configurable workflow indicators, not diagnoses or predictions. Data is patient-reported and checked when you open this page, not continuously."
            action={<LinkButton href="/staff/monitoring" variant="ghost" size="sm">All</LinkButton>}
          />
          {o.flags.length === 0 ? (
            <EmptyState icon={Flag} title="Nothing to review">No indicators right now, based on the data patients share with you.</EmptyState>
          ) : (
            <ul className="stagger divide-y divide-line">{o.flags.slice(0, 8).map((f, i) => <FlagRow key={`${f.patientId}${f.kind}${i}`} flag={f} />)}</ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Upcoming appointments" action={<LinkButton href="/staff/appointments" variant="ghost" size="sm">All</LinkButton>} />
          {o.upcoming.length === 0 ? (
            <EmptyState title="No upcoming appointments" />
          ) : (
            <ul className="stagger divide-y divide-line">
              {o.upcoming.map((a) => (
                <li key={a.id} className="px-5 py-3 transition-colors hover:bg-surface2">
                  <p className="font-medium">{a.title}</p>
                  <p className="text-sm text-ink2">
                    {fmtDateTime(a.startsAt, tz)} ·{" "}
                    <Link href={`/staff/patients/${a.patientId}`} className="text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent">{a.patient.user.name}</Link>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <p className="mt-6 text-sm text-muted">Times are shown in your timezone ({tz}).</p>
    </>
  );
}
