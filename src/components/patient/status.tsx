import { Badge, type Tone } from "@/components/ui/card";

type Dose = "SCHEDULED" | "TAKEN" | "SKIPPED" | "MISSED";
const DOSE: Record<Dose, { label: string; tone: Tone }> = {
  SCHEDULED: { label: "Scheduled", tone: "info" },
  TAKEN: { label: "Taken", tone: "ok" },
  SKIPPED: { label: "Skipped", tone: "neutral" },
  MISSED: { label: "Missed", tone: "warn" },
};

export function DoseStatusBadge({ status }: { status: Dose }) {
  const s = DOSE[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export type ApptStatus = "REQUESTED" | "CONFIRMED" | "RESCHEDULE_REQUESTED" | "CANCEL_REQUESTED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
const APPT: Record<ApptStatus, { label: string; tone: Tone }> = {
  REQUESTED: { label: "Requested - awaiting confirmation", tone: "warn" },
  CONFIRMED: { label: "Confirmed", tone: "ok" },
  RESCHEDULE_REQUESTED: { label: "Reschedule requested", tone: "warn" },
  CANCEL_REQUESTED: { label: "Cancellation requested", tone: "warn" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
  COMPLETED: { label: "Completed", tone: "neutral" },
  NO_SHOW: { label: "Marked as not attended", tone: "neutral" },
};

export function AppointmentStatusBadge({ status }: { status: ApptStatus }) {
  const s = APPT[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
