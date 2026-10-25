import type { Session } from "@/server/session";
import { listAppointments } from "@/server/services/patient";

export type PatientAppointment = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  location: string | null;
  status: string;
  sharedNotes: string | null;
  professional: { user: { name: string } };
};

/** listAppointments returns a patient/professional union; for a patient session it is always this shape. */
export async function listMyAppointments(s: Session): Promise<PatientAppointment[]> {
  return (await listAppointments(s)) as unknown as PatientAppointment[];
}
