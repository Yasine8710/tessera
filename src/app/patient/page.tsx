import { ArrowUpRight, CheckCircle2, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Numeral, Plate, Section } from "@/components/patient/editorial";
import { CountUp, ProgressBar, ProgressRing } from "@/components/patient/motion";
import { DoseRow } from "@/components/patient/dose-row";
import { toDoseView } from "@/components/patient/doses";
import { fmtDateTime, fmtDateTimeYear, fmtMeasurement, isScheduledOn, MEASUREMENT_NAMES } from "@/components/patient/format";
import { AppointmentStatusBadge, type ApptStatus } from "@/components/patient/status";
import { LinkButton } from "@/components/ui/button";
import { Alert, EmptyState } from "@/components/ui/card";
import { Photo } from "@/components/ui/photo";
import { localDateString } from "@/domain/schedule";
import { requireSession } from "@/server/session";
import { listInvitationsForPatient } from "@/server/services/care";
import { listDoses } from "@/server/services/clinical";
import { unreadMessageCount } from "@/server/services/messaging";
import { listMyAppointments } from "@/components/patient/appointments-data";
import { listJournal, listMeasurements, listRoutines } from "@/server/services/patient";

export const metadata: Metadata = { title: "Overview" };

const OPEN_APPT = ["REQUESTED", "CONFIRMED", "RESCHEDULE_REQUESTED", "CANCEL_REQUESTED"];

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
  const dateLabel = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: tz }).format(now);

  return (
    <div className="space-y-12">
      {/* Greeting band: type on the left, photo on the right. */}
      <header className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-stretch xl:gap-14">
        <div className="flex flex-col justify-between gap-10">
          <div className="anim-up">
            <p className="eyebrow mb-3">{dateLabel}</p>
            <h1 className="display-xl">Welcome, {firstName}</h1>
            <p className="lede mt-4 max-w-xl">Here is what is planned for today, based on your care plan and what you have recorded.</p>
          </div>
          <div className="stagger grid grid-cols-2 gap-x-6 gap-y-8 border-t border-line pt-6 sm:grid-cols-4">
            <Numeral label="Doses recorded">
              <span className="sr-only">Doses recorded today: </span>
              <CountUp value={recorded} />
              <span className="text-2xl font-medium text-muted">/{todayDoses.length}</span>
            </Numeral>
            <Numeral label="Routines done">
              <CountUp value={doneRoutines} />
              <span className="text-2xl font-medium text-muted">/{dueRoutines.length}</span>
            </Numeral>
            <Numeral label="Appointments">
              <CountUp value={upcomingAppts.length} />
            </Numeral>
            <Numeral label="Unread messages">
              <CountUp value={unread} />
            </Numeral>
          </div>
        </div>
        <div className="group mask-up hidden overflow-hidden rounded-sm lg:block">
          <Photo name="pill-organizer" focal="50% 62%" className="kenburns h-full min-h-80 w-full" sizes="(min-width: 1024px) 40vw, 100vw" priority />
        </div>
      </header>

      <section aria-label="Quick actions">
        <ul className="stagger grid grid-cols-1 border-y border-line sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-line">
          {[
            { href: "/patient/medications", label: "Record a dose" },
            { href: "/patient/journal#entry", label: "Log a symptom" },
            { href: "/patient/journal#measurement", label: "Add a measurement" },
            { href: "/patient/appointments#request", label: "Request appointment" },
          ].map((a, i) => (
            <li key={a.href} className="border-b border-line last:border-b-0 sm:border-b-0 sm:[&:nth-child(-n+2)]:border-b lg:[&:nth-child(-n+2)]:border-b-0">
              <Link href={a.href} className="group/a press flex items-center justify-between gap-3 px-1 py-4 text-base font-medium transition-colors hover:text-accent lg:px-5">
                <span className="flex items-baseline gap-3">
                  <span className="eyebrow tabular-nums" aria-hidden>
                    0{i + 1}
                  </span>
                  {a.label}
                </span>
                <ArrowUpRight className="size-4 shrink-0 text-muted transition-transform duration-[var(--t-base)] ease-[var(--ease)] group-hover/a:-translate-y-0.5 group-hover/a:translate-x-0.5 group-hover/a:text-accent" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:gap-16">
        <div className="space-y-12">
          <Section
            n="01"
            title="Today's medications"
            description={todayDoses.length ? `${recorded} of ${todayDoses.length} recorded as taken or skipped. These are your own reports.` : undefined}
            action={
              <LinkButton href="/patient/medications" variant="ghost" size="sm">
                All doses
              </LinkButton>
            }
          >
            {todayDoses.length === 0 ? (
              <EmptyState photo="meds-table" title="No doses scheduled today">
                If your care team adds a medication schedule, today&apos;s doses will appear here.
              </EmptyState>
            ) : (
              <>
                <div className="flex items-center gap-5 py-4">
                  <ProgressRing value={recorded} max={todayDoses.length} size={88} label="Doses recorded today">
                    {recorded}/{todayDoses.length}
                  </ProgressRing>
                  <p className="text-sm text-ink2">
                    <span className="block text-5xl font-semibold leading-none tracking-tight tabular-nums text-ink">
                      <CountUp value={Math.round((recorded / todayDoses.length) * 100)} suffix="%" />
                    </span>
                    <span className="mt-2 block">recorded today</span>
                  </p>
                </div>
                <ul className="stagger divide-y divide-line border-y border-line">
                  {todayDoses.map((d) => (
                    <DoseRow key={d.id} dose={toDoseView(d)} tz={tz} nowIso={nowIso} compact />
                  ))}
                </ul>
              </>
            )}
          </Section>

          <Section
            n="02"
            title="Upcoming appointments"
            action={
              <LinkButton href="/patient/appointments" variant="ghost" size="sm">
                Manage
              </LinkButton>
            }
          >
            {upcomingAppts.length === 0 ? (
              <EmptyState photo="waiting-room" title="No upcoming appointments" action={<LinkButton href="/patient/appointments#request" variant="secondary" size="sm">Request one</LinkButton>} />
            ) : (
              <ul className="stagger divide-y divide-line border-y border-line">
                {upcomingAppts.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-4">
                    <div>
                      <p className="text-lg font-medium">{a.title}</p>
                      <p className="text-sm text-muted">
                        {fmtDateTime(a.startsAt, tz)} - {a.professional.user.name}
                      </p>
                    </div>
                    <AppointmentStatusBadge status={a.status as ApptStatus} />
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section
            n="03"
            title="Recent health entries"
            description="Self-reported; may be incomplete."
            action={
              <LinkButton href="/patient/journal" variant="ghost" size="sm">
                Journal
              </LinkButton>
            }
          >
            {journal.rows.length === 0 && measurements.length === 0 ? (
              <EmptyState photo="blossom" title="Nothing recorded yet">
                Notes and readings you add in your journal show up here.
              </EmptyState>
            ) : (
              <ul className="stagger divide-y divide-line border-y border-line text-sm">
                {measurements.map((m) => (
                  <li key={m.id} className="flex flex-wrap justify-between gap-2 py-3">
                    <span>
                      {MEASUREMENT_NAMES[m.type]}: <span className="font-medium tabular-nums">{fmtMeasurement(m)}</span>
                    </span>
                    <span className="text-muted">{fmtDateTimeYear(m.recordedAt, tz)}</span>
                  </li>
                ))}
                {journal.rows.map((e) => (
                  <li key={e.id} className="flex flex-wrap justify-between gap-2 py-3">
                    <span>
                      Journal entry
                      {e.symptoms.length ? `: ${e.symptoms.slice(0, 3).join(", ")}` : e.wellbeing != null ? `: feeling ${e.wellbeing}/5` : ""}
                    </span>
                    <span className="text-muted">{fmtDateTimeYear(e.recordedAt, tz)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <aside className="space-y-10 lg:sticky lg:top-0 lg:self-start">
          <Alert tone="warn" title="Not for emergencies">
            Tessera is not an emergency service and messages are not monitored around the clock. If you may be in danger or feel seriously unwell, call your local emergency number.
          </Alert>

          <Section title="Today's routines">
            {dueRoutines.length === 0 ? (
              <p className="text-sm text-muted">No routines planned for today.</p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm">
                  <CountUp value={doneRoutines} className="text-5xl font-semibold leading-none tracking-tight" /> of {dueRoutines.length} done
                </p>
                <ProgressBar value={doneRoutines} max={dueRoutines.length} label="Routines done today" />
              </div>
            )}
            <LinkButton href="/patient/routines" variant="secondary" size="sm" className="mt-4">
              Open routines
            </LinkButton>
          </Section>

          <Section title="To do">
            {!hasTasks ? (
              <p className="flex items-center gap-2 text-sm text-muted">
                <CheckCircle2 className="size-4 text-ok" aria-hidden /> Nothing waiting for you.
              </p>
            ) : (
              <ul className="divide-y divide-line border-y border-line text-sm">
                {invitations.map((i) => (
                  <li key={i.id}>
                    <Link href="/patient/care-team" className="group/a flex items-center justify-between gap-3 py-3 hover:text-accent">
                      <span>Invitation from {i.professional.user.name}</span>
                      <ArrowUpRight className="size-4 shrink-0 text-muted transition-transform group-hover/a:-translate-y-0.5 group-hover/a:translate-x-0.5" aria-hidden />
                    </Link>
                  </li>
                ))}
                {unrecorded > 0 && (
                  <li>
                    <Link href="/patient/medications" className="group/a flex items-center justify-between gap-3 py-3 hover:text-accent">
                      <span>
                        {unrecorded} dose{unrecorded === 1 ? "" : "s"} without a report
                      </span>
                      <ArrowUpRight className="size-4 shrink-0 text-muted transition-transform group-hover/a:-translate-y-0.5 group-hover/a:translate-x-0.5" aria-hidden />
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </Section>

          <Section title="Messages">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm">{unread > 0 ? `${unread} unread message${unread === 1 ? "" : "s"}` : "No unread messages"}</p>
              <LinkButton href="/patient/messages" variant="secondary" size="sm">
                Open
              </LinkButton>
            </div>
          </Section>

          <Plate name="walk-coat" focal="50% 40%" className="hidden h-72 lg:block [&>div]:h-full" />

          <p className="flex items-start gap-2 text-sm text-muted">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            Doses you report are your own account. Missed means no report was recorded in time.
          </p>
        </aside>
      </div>
    </div>
  );
}
