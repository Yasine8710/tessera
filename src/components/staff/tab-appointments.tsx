import { Card, CardHeader } from "@/components/ui/card";
import { listAppointments } from "@/server/services/patient";
import { ScheduleAppointmentForm } from "./appointment-forms";
import { AppointmentList } from "./appointment-list";
import type { TabProps } from "./tab-shared";

export async function AppointmentsTab({ session, patientId }: TabProps) {
  const rows = await listAppointments(session, { patientId });
  return (
    <div className="stagger space-y-6">
      <AppointmentList rows={rows} tz={session.timezone} empty="No appointments with this patient yet" />
      <Card>
        <CardHeader title="Schedule an appointment" />
        <div className="p-5">
          <ScheduleAppointmentForm patientId={patientId} professionalId={session.professionalId ?? ""} tz={session.timezone} />
        </div>
      </Card>
    </div>
  );
}
