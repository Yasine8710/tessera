import { BookOpen, CalendarPlus, CheckCircle2, Gauge, MessageSquare, Pill, ShieldAlert, Stethoscope, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DoseRow } from "@/components/patient/dose-row";
import { toDoseView } from "@/components/patient/doses";
import { fmtDateTime, fmtDateTimeYear, fmtMeasurement, isScheduledOn, MEASUREMENT_NAMES } from "@/components/patient/format";
import { AppointmentStatusBadge, type ApptStatus } from "@/components/patient/status";
import { LinkButton } from "@/components/ui/button";
import { Alert, Card, CardHeader, EmptyState, PageHeader } from "@/components/ui/card";
import { localDateString } from "@/domain/schedule";
import { requireSession } from "@/server/session";
import { listInvitationsForPatient } from "@/server/services/care";
import { listDoses } from "@/server/services/clinical";
import { unreadMessageCount } from "@/server/services/messaging";
import { listMyAppointments } from "@/components/patient/appointments-data";
import { listJournal, listMeasurements, listRoutines } from "@/server/services/patient";

export const metadata: Metadata = { title: "Overview" };

const OPEN_APPT = ["REQUESTED", "CONFIRMED", "RESCHEDULE_REQUESTED", "CANCEL_REQUESTED"];

function Progress({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} className="h-2 overflow-hidden rounded-full bg-surface2">
      <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default async function PatientOverview() {
  const s = await requireSession("PATIENT");
  const now = new Date();
  const tz = s.timezone;
  const today = localDateString(now, tz);
  const [doses, appts, routines, invitations, journal, measurements, unread] = await Promise.all([
    listDoses(s, { fromDays: 1, toDays: 1, now }),
    listMyAppointments(s),
    listRoutines(s, now),
    listInvitationsForPatient(s),
    listJournal(s, { pageSize: 3 }),
    listMeasurements(s, undefined, 3),
    unreadMessageCount(s),
  ]);

  const todayDoses = doses.filter((d) => localDateString(d.scheduledFor, tz) === today);
  const recorded = todayDoses.filter((d) => d.effectiveStatus === "TAKEN" || d.effectiveStatus === "SKIPPED").length;
  const unrecorded = doses.filter((d) => d.scheduledFor <= now && (d.effectiveStatus === "MISSED" || d.effectiveStatus === "SCHEDULED")).length;
  const upcomingAppts = appts
    .filter((a) => OPEN_APPT.includes(a.status) && a.endsAt >= now)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
    .slice(0, 3);
  const dueRoutines = routines.filter((r) => r.active && isScheduledOn(r.daysOfWeek, today));
  const doneRoutines = dueRoutines.filter((r) => r.doneToday).length;
  const firstName = s.name.split(" ")[0];
  const nowIso = now.toISOString();
  const hasTasks = invitations.length > 0 || unrecorded > 0;

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${firstName}`} description="Here is what is planned for today, based on your care plan and what you have recorded." />

      <section aria-label="Quick actions" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { href: "/patient/medications", label: "Record a dose", icon: Pill },
          { href: "/patient/journal#entry", label: "Log a symptom", icon: BookOpen },
          { href: "/patient/journal#measurement", label: "Add a measurement", icon: Gauge },
          { href: "/patient/appointments#request", label: "Request appointment", icon: CalendarPlus },
        ].map((a) => (
          <Link key={a.href} href={a.href} className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-sm font-medium shadow-sm hover:border-accent hover:bg-accent-soft">
            <a.icon className="size-5 shrink-0 text-accent" aria-hidden />
            {a.label}
          </Link>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              title="Today's medications"
              description={todayDoses.length ? `${recorded} of ${todayDoses.length} recorded as taken or skipped. These are your own reports.` : undefined}
              action={
                <LinkButton href="/patient/medications" variant="ghost" size="sm">
                  All doses
                </LinkButton>
              }
            />
            {todayDoses.length === 0 ? (
              <EmptyState icon={Pill} title="No doses scheduled today">
                If your care team adds a medication schedule, today&apos;s doses will appear here.
              </EmptyState>
            ) : (
              <>
                <div className="px-5 pt-4">
                  <Progress value={recorded} max={todayDoses.length} label="Doses recorded today" />
                </div>
                <ul className="mt-2 divide-y divide-line">
                  {todayDoses.map((d) => (
                    <DoseRow key={d.id} dose={toDoseView(d)} tz={tz} nowIso={nowIso} compact />
                  ))}
                </ul>
              </>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Upcoming appointments"
              action={
                <LinkButton href="/patient/appointments" variant="ghost" size="sm">
                  Manage
                </LinkButton>
              }
            />
            {upcomingAppts.length === 0 ? (
              <EmptyState icon={CalendarPlus} title="No upcoming appointments" action={<LinkButton href="/patient/appointments#request" variant="secondary" size="sm">Request one</LinkButton>} />
            ) : (
              <ul className="divide-y divide-line">
                {upcomingAppts.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <p className="text-sm text-muted">
                        {fmtDateTime(a.startsAt, tz)} - {a.professional.user.name}
                      </p>
                    </div>
                    <AppointmentStatusBadge status={a.status as ApptStatus} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Recent health entries"
              description="Self-reported; may be incomplete."
              action={
                <LinkButton href="/patient/journal" variant="ghost" size="sm">
                  Journal
                </LinkButton>
              }
            />
            {journal.rows.length === 0 && measurements.length === 0 ? (
              <EmptyState icon={BookOpen} title="Nothing recorded yet">
                Notes and readings you add in your journal show up here.
              </EmptyState>
            ) : (
              <ul className="divide-y divide-line text-sm">
                {measurements.map((m) => (
                  <li key={m.id} className="flex flex-wrap justify-between gap-2 px-5 py-2.5">
                    <span>
                      {MEASUREMENT_NAMES[m.type]}: <span className="font-medium tabular-nums">{fmtMeasurement(m)}</span>
                    </span>
                    <span className="text-muted">{fmtDateTimeYear(m.recordedAt, tz)}</span>
                  </li>
                ))}
                {journal.rows.map((e) => (
                  <li key={e.id} className="flex flex-wrap justify-between gap-2 px-5 py-2.5">
                    <span>
                      Journal entry
                      {e.symptoms.length ? `: ${e.symptoms.slice(0, 3).join(", ")}` : e.wellbeing != null ? `: feeling ${e.wellbeing}/5` : ""}
                    </span>
                    <span className="text-muted">{fmtDateTimeYear(e.recordedAt, tz)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Alert tone="warn" title="Not for emergencies">
            CareSync is not an emergency service and messages are not monitored around the clock. If you may be in danger or feel seriously unwell, call your local emergency number.
          </Alert>

          <Card>
            <CardHeader title="Today's routines" />
            <div className="space-y-3 p-5">
              {dueRoutines.length === 0 ? (
                <p className="text-sm text-muted">No routines planned for today.</p>
              ) : (
                <>
                  <p className="text-sm">
                    <span className="text-2xl font-semibold tabular-nums">{doneRoutines}</span> of {dueRoutines.length} done
                  </p>
                  <Progress value={doneRoutines} max={dueRoutines.length} label="Routines done today" />
                </>
              )}
              <LinkButton href="/patient/routines" variant="secondary" size="sm">
                Open routines
              </LinkButton>
            </div>
          </Card>

          <Card>
            <CardHeader title="To do" />
            {!hasTasks ? (
              <p className="flex items-center gap-2 px-5 py-4 text-sm text-muted">
                <CheckCircle2 className="size-4 text-ok" aria-hidden /> Nothing waiting for you.
              </p>
            ) : (
              <ul className="divide-y divide-line text-sm">
                {invitations.map((i) => (
                  <li key={i.id}>
                    <Link href="/patient/care-team" className="flex items-center gap-3 px-5 py-3 hover:bg-surface2">
                      <UserPlus className="size-4 shrink-0 text-accent" aria-hidden />
                      <span>Invitation from {i.professional.user.name}</span>
                    </Link>
                  </li>
                ))}
                {unrecorded > 0 && (
                  <li>
                    <Link href="/patient/medications" className="flex items-center gap-3 px-5 py-3 hover:bg-surface2">
                      <Stethoscope className="size-4 shrink-0 text-accent" aria-hidden />
                      <span>
                        {unrecorded} dose{unrecorded === 1 ? "" : "s"} without a report
                      </span>
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Messages" />
            <div className="flex items-center justify-between gap-3 p-5">
              <p className="flex items-center gap-2 text-sm">
                <MessageSquare className="size-4 text-accent" aria-hidden />
                {unread > 0 ? `${unread} unread message${unread === 1 ? "" : "s"}` : "No unread messages"}
              </p>
              <LinkButton href="/patient/messages" variant="secondary" size="sm">
                Open
              </LinkButton>
            </div>
          </Card>
          <p className="flex items-start gap-2 text-sm text-muted">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            Doses you report are your own account. Missed means no report was recorded in time.
          </p>
        </div>
      </div>
    </div>
  );
}
