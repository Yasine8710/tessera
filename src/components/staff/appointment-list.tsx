import Link from "next/link";
import { Badge, EmptyState, type Tone } from "@/components/ui/card";
import type { PhotoName } from "@/lib/photos";
import { canTransitionAppointment, type AppointmentStatus } from "@/domain/rules";
import { AppointmentActions, type ApptAction } from "./appointment-forms";
import { APPT_LABEL, fmtDateTime } from "./format";

export type ApptRow = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  location: string | null;
  status: AppointmentStatus;
  sharedNotes: string | null;
  patientId: string;
  patient?: { user: { name: string } };
};

const TONE: Record<AppointmentStatus, Tone> = {
  REQUESTED: "warn", CONFIRMED: "ok", RESCHEDULE_REQUESTED: "warn", CANCEL_REQUESTED: "warn", CANCELLED: "neutral", COMPLETED: "info", NO_SHOW: "danger",
};

/** Only the transitions the domain rules allow for this status. */
export function allowedActions(status: AppointmentStatus): ApptAction[] {
  const can = (to: AppointmentStatus) => canTransitionAppointment(status, to);
  const out: ApptAction[] = [];
  if (status === "REQUESTED" && can("CONFIRMED")) out.push("confirm");
  if (status === "RESCHEDULE_REQUESTED" && can("CONFIRMED")) out.push("reschedule");
  if (status === "CANCEL_REQUESTED" && can("CONFIRMED")) out.push("keep");
  if (can("COMPLETED")) out.push("complete");
  if (can("NO_SHOW")) out.push("noshow");
  if (can("CANCELLED")) out.push("cancel");
  return out;
}

export function AppointmentList({ rows, tz, showPatient, empty, photo }: { rows: ApptRow[]; tz: string; showPatient?: boolean; empty: string; photo?: PhotoName }) {
  if (rows.length === 0) return <EmptyState title={empty} photo={photo} />;
  return (
    <div>
      <ul className="stagger divide-y divide-line border-b border-line">
        {rows.map((a) => (
          <li key={a.id} className="flex gap-4 py-4 pr-2 transition-colors hover:bg-surface2/60 sm:pl-2">
            <DateLeaf date={a.startsAt} tz={tz} />
            <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-base font-medium">{a.title}</p>
                <p className="text-sm text-ink2">
                  {fmtDateTime(a.startsAt, tz)} to {new Intl.DateTimeFormat("en-GB", { timeStyle: "short", timeZone: tz }).format(a.endsAt)}
                  {a.location ? ` · ${a.location}` : ""}
                </p>
                {showPatient && a.patient && (
                  <Link href={`/staff/patients/${a.patientId}`} className="text-sm text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent">{a.patient.user.name}</Link>
                )}
              </div>
              <Badge tone={TONE[a.status]}>{APPT_LABEL[a.status]}</Badge>
            </div>
            {a.sharedNotes && (
              <p className="rounded-md border border-line bg-surface px-3 py-2 text-sm"><span className="font-medium">Shared with the patient: </span>{a.sharedNotes}</p>
            )}
            <AppointmentActions id={a.id} title={a.title} tz={tz} actions={allowedActions(a.status)} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Day numeral and month, set like a calendar leaf. Decorative: the full date is in the row text. */
function DateLeaf({ date, tz }: { date: Date; tz: string }) {
  const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone: tz }).format(date);
  const mon = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: tz }).format(date);
  return (
    <div aria-hidden className="hidden w-14 shrink-0 border-r border-line pr-4 text-right sm:block">
      <p className="text-3xl font-semibold leading-none tabular-nums">{day}</p>
      <p className="eyebrow mt-1">{mon}</p>
    </div>
  );
}
