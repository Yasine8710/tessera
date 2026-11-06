import { Eye, Lock } from "lucide-react";
import { Badge, Card } from "@/components/ui/card";
import type { listCarePlans } from "@/server/services/clinical";
import { EditPlanForm } from "./care-plan-forms";
import { describeDays, fmtDateOnly, fmtDateTime } from "./format";
import { AddMedicationForm, StopMedicationControl } from "./medication-forms";
import { asSnap, summarizeDiff } from "./snapshot";

type Plan = Awaited<ReturnType<typeof listCarePlans>>[number];
const iso = (d: Date) => d.toISOString().slice(0, 10);

export function PlanCard({ plan, mine, tz, today }: { plan: Plan; mine: boolean; tz: string; today: string }) {
  const versions = [...plan.versions].sort((a, b) => a.version - b.version);
  return (
    <Card className="anim-up">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-line px-5 py-3.5">
        <div>
          <h3 className="text-base font-semibold">{plan.title}</h3>
          <p className="text-sm text-muted">
            By {plan.professional.user.name} {mine && "(you)"} · version {plan.version} · {fmtDateOnly(plan.startDate)}
            {plan.endDate ? ` to ${fmtDateOnly(plan.endDate)}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge tone={plan.status === "ACTIVE" ? "ok" : "neutral"}>{plan.status === "ACTIVE" ? "Active" : "Ended"}</Badge>
          <Badge tone="info"><Eye className="mr-1 size-3" aria-hidden /> Visible to the patient</Badge>
        </div>
      </div>
      <div className="space-y-5 px-5 py-4">
        <p className="whitespace-pre-line text-ink2">{plan.instructions}</p>

        <section aria-label="Medications">
          <h4 className="text-sm font-semibold">Medication schedules</h4>
          {plan.medications.length === 0 ? (
            <p className="mt-1 text-sm text-muted">No medications on this plan.</p>
          ) : (
            <ul className="stagger mt-2 divide-y divide-line rounded-md border border-line">
              {plan.medications.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 transition-colors hover:bg-surface2">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {m.medication.name} <span className="font-normal text-ink2">{m.dose}{m.route ? `, ${m.route}` : ""}</span>{" "}
                      {m.status === "ENDED" && <Badge>Stopped</Badge>}
                    </p>
                    <p className="text-sm text-muted tabular-nums">
                      {m.timesOfDay.join(", ")} · {describeDays(m.daysOfWeek)} · from {fmtDateOnly(m.startDate)}
                      {m.endDate ? ` to ${fmtDateOnly(m.endDate)}` : ""}
                    </p>
                    {m.instructions && <p className="text-sm text-ink2">{m.instructions}</p>}
                  </div>
                  {mine && m.status === "ACTIVE" && <StopMedicationControl medicationPlanId={m.id} name={m.medication.name} />}
                </li>
              ))}
            </ul>
          )}
        </section>

        {mine && plan.status === "ACTIVE" ? (
          <div className="space-y-2">
            <details className="rounded-md border border-line">
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium transition-colors hover:bg-surface2">Add a medication schedule</summary>
              <div className="anim-fade border-t border-line p-4"><AddMedicationForm planId={plan.id} today={today} /></div>
            </details>
            <details className="rounded-md border border-line">
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium transition-colors hover:bg-surface2">Edit plan (creates a new version)</summary>
              <div className="anim-fade border-t border-line p-4">
                <EditPlanForm
                  planId={plan.id}
                  initial={{ title: plan.title, instructions: plan.instructions, startDate: iso(plan.startDate), endDate: plan.endDate ? iso(plan.endDate) : "" }}
                />
              </div>
            </details>
          </div>
        ) : (
          !mine && (
            <p className="flex items-center gap-2 text-sm text-muted">
              <Lock className="size-4" aria-hidden /> Read-only: only {plan.professional.user.name} can change this plan.
            </p>
          )
        )}

        <details className="rounded-md border border-line">
          <summary className="cursor-pointer px-3 py-2 text-sm font-medium transition-colors hover:bg-surface2">Version history ({versions.length})</summary>
          <ol className="stagger divide-y divide-line border-t border-line">
            {[...versions].reverse().map((v) => {
              const idx = versions.findIndex((x) => x.id === v.id);
              const changes = summarizeDiff(asSnap(versions[idx - 1]?.snapshot), asSnap(v.snapshot));
              return (
                <li key={v.id} className="px-3 py-3 text-sm">
                  <p className="font-medium">Version {v.version} <span className="font-normal text-muted">· {fmtDateTime(v.createdAt, tz)}</span></p>
                  <p className="text-ink2">Reason: {v.reason}</p>
                  {changes.length > 0 && (
                    <ul className="mt-1 list-disc pl-5 text-muted">
                      {changes.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </details>
      </div>
    </Card>
  );
}
