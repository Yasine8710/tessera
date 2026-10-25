import { Badge, Card } from "@/components/ui/card";
import { ChangeRequestDialog } from "./change-request-dialog";
import { describeDays, fmtPlainDate } from "./format";

export type MedicationPlanView = {
  id: string;
  status: "ACTIVE" | "ENDED";
  dose: string;
  route: string | null;
  instructions: string | null;
  timesOfDay: string[];
  daysOfWeek: number[];
  startDate: Date;
  endDate: Date | null;
  medication: { name: string };
  carePlan: { professional: { user: { name: string } } };
};

/** Read-only: dose and schedule are set by the care team. */
export function MedicationCard({ plan }: { plan: MedicationPlanView }) {
  const active = plan.status === "ACTIVE";
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{plan.medication.name}</h3>
          <p className="text-ink2">
            {plan.dose}
            {plan.route ? ` - ${plan.route}` : ""}
          </p>
        </div>
        <Badge tone={active ? "accent" : "neutral"}>{active ? "Active" : "Ended"}</Badge>
      </div>
      <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">When</dt>
          <dd>
            {[...plan.timesOfDay].sort().join(", ")} - {describeDays(plan.daysOfWeek)}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Prescribed by</dt>
          <dd>{plan.carePlan.professional.user.name}</dd>
        </div>
        <div>
          <dt className="text-muted">Start date</dt>
          <dd>{fmtPlainDate(plan.startDate)}</dd>
        </div>
        <div>
          <dt className="text-muted">End date</dt>
          <dd>{plan.endDate ? fmtPlainDate(plan.endDate) : "No end date set"}</dd>
        </div>
        {plan.instructions && (
          <div className="sm:col-span-2">
            <dt className="text-muted">Instructions from your care team</dt>
            <dd className="whitespace-pre-line">{plan.instructions}</dd>
          </div>
        )}
      </dl>
      {active && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
          <ChangeRequestDialog planId={plan.id} medication={plan.medication.name} />
          <p className="text-sm text-muted">Dose and schedule can only be changed by your care team.</p>
        </div>
      )}
    </Card>
  );
}
