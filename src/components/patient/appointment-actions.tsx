"use client";

import { appointmentChangeAction } from "@/app/actions/patient";
import { ConfirmButton } from "@/components/ui/confirm";
import { useAction } from "@/components/ui/use-action";

/** Patients can only ask; the care team confirms any change. */
export function AppointmentActions({ id, status }: { id: string; status: "REQUESTED" | "CONFIRMED" }) {
  const { run, pending, error } = useAction();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "CONFIRMED" && (
        <ConfirmButton
          variant="secondary"
          label="Request reschedule"
          title="Request a new time?"
          message="Your care team will be asked to suggest a new time. The current appointment stays in place until they confirm a change."
          confirmLabel="Send request"
          disabled={pending}
          onConfirm={() => run(() => appointmentChangeAction(id, "RESCHEDULE"), "Reschedule requested")}
        />
      )}
      <ConfirmButton
        label={status === "REQUESTED" ? "Withdraw request" : "Request cancellation"}
        title={status === "REQUESTED" ? "Withdraw this request?" : "Request cancellation?"}
        message={
          status === "REQUESTED"
            ? "The appointment request will be cancelled."
            : "Your care team will be notified. The appointment is cancelled once they confirm."
        }
        confirmLabel={status === "REQUESTED" ? "Withdraw request" : "Send request"}
        disabled={pending}
        onConfirm={() => run(() => appointmentChangeAction(id, "CANCEL"), status === "REQUESTED" ? "Request withdrawn" : "Cancellation requested")}
      />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
