import { Alert, Card, CardHeader } from "@/components/ui/card";
import { RoutineForm } from "./routine-form";
import type { TabProps } from "./tab-shared";

export function RoutinesTab({ patientId, consents }: TabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Add a clinician-defined routine" description="Appears in the patient's routines list, marked as set by their care team. The patient cannot edit or switch it off." />
        <div className="p-5"><RoutineForm patientId={patientId} /></div>
      </Card>
      <Alert tone="info" title="Routine completion">
        {consents.ROUTINES
          ? "The patient shares routine completion with you. Missed routines appear as indicators on the Monitoring page."
          : "The patient has not shared routine completion with you, so you will not see whether routines are done."}
      </Alert>
    </div>
  );
}
