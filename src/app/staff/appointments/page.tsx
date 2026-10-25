import type { Metadata } from "next";
import { AppointmentList, type ApptRow } from "@/components/staff/appointment-list";
import { PageHeader } from "@/components/ui/card";
import { listAppointments } from "@/server/services/patient";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Appointments" };

const PENDING = ["REQUESTED", "RESCHEDULE_REQUESTED", "CANCEL_REQUESTED"];

export default async function StaffAppointmentsPage() {
  const session = await requireSession("PROFESSIONAL");
  const all = (await listAppointments(session)) as ApptRow[];
  const now = Date.now();
  // Confirmed visits whose time has passed still need an outcome (completed or no-show).
  const needs = all.filter((a) => PENDING.includes(a.status) || (a.status === "CONFIRMED" && a.endsAt.getTime() < now));
  const needsIds = new Set(needs.map((a) => a.id));
  const upcoming = all.filter((a) => !needsIds.has(a.id) && a.status === "CONFIRMED").reverse();
  const past = all.filter((a) => !needsIds.has(a.id) && a.status !== "CONFIRMED");
  const tz = session.timezone;
  return (
    <>
      <PageHeader title="Appointments" description={`Times are shown in your timezone (${tz}). Patients are notified of every change. Schedule new appointments from a patient's profile.`} />
      <div className="space-y-8">
        <section aria-labelledby="needs">
          <h2 id="needs" className="mb-3 text-lg font-semibold">Needs action ({needs.length})</h2>
          <AppointmentList rows={needs} tz={tz} showPatient empty="Nothing needs your attention" />
        </section>
        <section aria-labelledby="up">
          <h2 id="up" className="mb-3 text-lg font-semibold">Upcoming ({upcoming.length})</h2>
          <AppointmentList rows={upcoming} tz={tz} showPatient empty="No upcoming confirmed appointments" />
        </section>
        <section aria-labelledby="past">
          <h2 id="past" className="mb-3 text-lg font-semibold">Past and closed ({past.length})</h2>
          <AppointmentList rows={past} tz={tz} showPatient empty="No past appointments" />
        </section>
      </div>
    </>
  );
}
