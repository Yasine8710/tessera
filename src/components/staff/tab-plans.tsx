import { FileText } from "lucide-react";
import { Card, CardHeader, EmptyState } from "@/components/ui/card";
import { localDateString } from "@/domain/schedule";
import { listCarePlans } from "@/server/services/clinical";
import { CreatePlanForm } from "./care-plan-forms";
import { PlanCard } from "./plan-card";
import type { TabProps } from "./tab-shared";

export async function PlansTab({ session, patientId }: TabProps) {
  const plans = await listCarePlans(session, patientId);
  const today = localDateString(new Date(), session.timezone);
  return (
    <div className="space-y-6">
      {plans.length === 0 ? (
        <Card><EmptyState icon={FileText} title="No care plans yet">Create the first plan below. The patient sees it straight away.</EmptyState></Card>
      ) : (
        plans.map((p) => <PlanCard key={p.id} plan={p} mine={p.professionalId === session.professionalId} tz={session.timezone} today={today} />)
      )}
      <Card>
        <CardHeader title="Create a care plan" />
        <div className="p-5"><CreatePlanForm patientId={patientId} today={today} /></div>
      </Card>
    </div>
  );
}
