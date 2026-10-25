import Link from "next/link";
import { Badge, Card, EmptyState, type Tone } from "@/components/ui/card";
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

export function AppointmentList({ rows, tz, showPatient, empty }: { rows: ApptRow[]; tz: string; showPatient?: boolean; empty: string }) {
  if (rows.length === 0) return <Card><EmptyState title={empty} /></Card>;
  return (
    <Card>
      <ul className="divide-y divide-line">
        {rows.map((a) => (
          <li key={a.id} className="space-y-2 px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium">{a.title}</p>
                <p className="text-sm text-ink2">
                  {fmtDateTime(a.startsAt, tz)} to {new Intl.DateTimeFormat("en-GB", { timeStyle: "short", timeZone: tz }).format(a.endsAt)}
                  {a.location ? ` · ${a.location}` : ""}
                </p>
                {showPatient && a.patient && (
                  <Link href={`/staff/patients/${a.patientId}`} className="text-sm text-accent underline underline-offset-2 hover:no-underline">{a.patient.user.name}</Link>
                )}
              </div>
              <Badge tone={TONE[a.status]}>{APPT_LABEL[a.status]}</Badge>
            </div>
            {a.sharedNotes && (
              <p className="rounded-md bg-surface2 px-3 py-2 text-sm"><span className="font-medium">Shared with the patient: </span>{a.sharedNotes}</p>
            )}
            <AppointmentActions id={a.id} title={a.title} tz={tz} actions={allowedActions(a.status)} />
          </li>
        ))}
      </ul>
    </Card>
  );
}
