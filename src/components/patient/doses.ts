import type { DoseView } from "./dose-row";

type DoseRowLike = {
  id: string;
  scheduledFor: Date;
  takenAt: Date | null;
  note: string | null;
  effectiveStatus: DoseView["status"];
  plan: { dose: string; route: string | null; medication: { name: string } };
};

/** Serialisable shape for client components. */
export function toDoseView(r: DoseRowLike): DoseView {
  return {
    id: r.id,
    scheduledFor: r.scheduledFor.toISOString(),
    status: r.effectiveStatus,
    takenAt: r.takenAt?.toISOString() ?? null,
    note: r.note,
    name: r.plan.medication.name,
    dose: r.plan.dose,
    route: r.plan.route,
  };
}
