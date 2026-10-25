import { CalendarDays, MapPin, User } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AppointmentActions } from "@/components/patient/appointment-actions";
import { AppointmentForm } from "@/components/patient/appointment-form";
import { fmtDateTimeYear, fmtTime } from "@/components/patient/format";
import { AppointmentStatusBadge, type ApptStatus } from "@/components/patient/status";
import { Card, CardHeader, EmptyState, PageHeader } from "@/components/ui/card";
import { requireSession } from "@/server/session";
import { listCareTeam } from "@/server/services/care";
import { listMyAppointments, type PatientAppointment } from "@/components/patient/appointments-data";

export const metadata: Metadata = { title: "Appointments" };

const OPEN: ApptStatus[] = ["REQUESTED", "CONFIRMED", "RESCHEDULE_REQUESTED", "CANCEL_REQUESTED"];

type Appt = PatientAppointment;

function ApptItem({ a, tz }: { a: Appt; tz: string }) {
  const status = a.status as ApptStatus;
  const canAct = (status === "REQUESTED" || status === "CONFIRMED") && a.startsAt.getTime() > Date.now();
  return (
    <li className="space-y-2 px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{a.title}</p>
          <p className="text-sm text-ink2">
            {fmtDateTimeYear(a.startsAt, tz)} - {fmtTime(a.endsAt, tz)}
          </p>
        </div>
        <AppointmentStatusBadge status={status} />
      </div>
      <p className="flex items-center gap-1.5 text-sm text-muted">
        <User className="size-4" aria-hidden /> {a.professional.user.name}
        {a.location && (
          <>
            <MapPin className="ml-2 size-4" aria-hidden /> {a.location}
          </>
        )}
      </p>
      {status === "REQUESTED" && <p className="text-sm text-muted">Waiting for your care team to confirm. Please do not treat this as booked yet.</p>}
      {status === "RESCHEDULE_REQUESTED" && <p className="text-sm text-muted">Your care team will propose a new time.</p>}
      {status === "CANCEL_REQUESTED" && <p className="text-sm text-muted">Your care team will confirm the cancellation.</p>}
      {a.sharedNotes && (
        <p className="rounded-md bg-surface2 px-3 py-2 text-sm">
          <span className="font-medium">Note from your care team: </span>
          <span className="whitespace-pre-line">{a.sharedNotes}</span>
        </p>
      )}
      {canAct && <AppointmentActions id={a.id} status={status as "REQUESTED" | "CONFIRMED"} />}
    </li>
  );
}

export default async function AppointmentsPage() {
  const s = await requireSession("PATIENT");
  const now = new Date();
  const [appts, team] = await Promise.all([listMyAppointments(s), listCareTeam(s)]);
  const tz = s.timezone;
  const upcoming = appts.filter((a) => OPEN.includes(a.status as ApptStatus) && a.endsAt >= now).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const past = appts.filter((a) => !upcoming.includes(a));
  const options = team.filter((r) => r.status === "ACTIVE").map((r) => ({ professionalId: r.professionalId, label: `${r.professional.user.name} (${r.professional.profession})` }));

  return (
    <div className="space-y-6">
      <PageHeader title="Appointments" description="Requests stay as requested until your care team confirms them." />

      <Card>
        <CardHeader title="Upcoming" />
        {upcoming.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No upcoming appointments">
            Request one below.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {upcoming.map((a) => (
              <ApptItem key={a.id} a={a} tz={tz} />
            ))}
          </ul>
        )}
      </Card>

      <Card id="request">
        <CardHeader title="Request an appointment" />
        {options.length === 0 ? (
          <EmptyState title="No connected professionals">
            You can request appointments once you are connected with a professional.{" "}
            <Link href="/patient/care-team" className="font-medium text-accent underline">
              Go to your care team
            </Link>
          </EmptyState>
        ) : (
          <AppointmentForm team={options} tz={tz} nowIso={now.toISOString()} />
        )}
      </Card>

      {past.length > 0 && (
        <Card>
          <CardHeader title="Past and closed" />
          <ul className="divide-y divide-line">
            {past.map((a) => (
              <ApptItem key={a.id} a={a} tz={tz} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
