import { EditorialHeader } from "@/components/patient/editorial";
import type { Metadata } from "next";
import { describeDays, fmtDateTimeYear, fmtPlainDate } from "@/components/patient/format";
import { Alert, Badge, Card, EmptyState } from "@/components/ui/card";
import { requireSession } from "@/server/session";
import { listCarePlans } from "@/server/services/clinical";

export const metadata: Metadata = { title: "Care plan" };

export default async function CarePlanPage() {
  const s = await requireSession("PATIENT");
  const plans = await listCarePlans(s, s.patientId!);
  const tz = s.timezone;

  return (
    <div className="space-y-6">
      <EditorialHeader eyebrow="Plan" title="Care plan" description="The plan your care team wrote for you. You can read it here; only your care team can change it." />

      {plans.length === 0 ? (
        <Card className="overflow-hidden">
          <EmptyState photo="pill-organizer" title="No care plan yet">
            When a professional on your care team shares a plan, it will appear here.
          </EmptyState>
        </Card>
      ) : (
        plans.map((p) => (
          <Card key={p.id}>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">{p.title}</h2>
                <p className="text-sm text-muted">
                  By {p.professional.user.name} - {fmtPlainDate(p.startDate)}
                  {p.endDate ? ` to ${fmtPlainDate(p.endDate)}` : " (no end date)"} - version {p.version}
                </p>
              </div>
              <Badge tone={p.status === "ACTIVE" ? "accent" : "neutral"}>{p.status === "ACTIVE" ? "Active" : "Ended"}</Badge>
            </div>
            <div className="space-y-5 px-5 py-4">
              <section aria-label="Instructions">
                <h3 className="text-sm font-semibold text-muted">Instructions</h3>
                <p className="mt-1 whitespace-pre-line">{p.instructions}</p>
              </section>

              <section aria-label="Medications in this plan">
                <h3 className="text-sm font-semibold text-muted">Medications in this plan</h3>
                {p.medications.length === 0 ? (
                  <p className="mt-1 text-sm text-muted">No medications in this plan.</p>
                ) : (
                  <ul className="mt-1 divide-y divide-line rounded-md border border-line">
                    {p.medications.map((m) => (
                      <li key={m.id} className="px-4 py-2.5 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{m.medication.name}</span>
                          <span>{m.dose}</span>
                          {m.status !== "ACTIVE" && <Badge>Ended</Badge>}
                        </div>
                        <p className="text-muted">
                          {[...m.timesOfDay].sort().join(", ")} - {describeDays(m.daysOfWeek)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section aria-label="Version history">
                <h3 className="text-sm font-semibold text-muted">Version history</h3>
                <ol className="mt-1 space-y-2 text-sm">
                  {p.versions.map((v) => (
                    <li key={v.id} className="flex flex-wrap gap-x-3">
                      <span className="font-medium">Version {v.version}</span>
                      <span className="text-muted">{fmtDateTimeYear(v.createdAt, tz)}</span>
                      <span className="basis-full sm:basis-auto">{v.reason}</span>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </Card>
        ))
      )}

      <Alert tone="info" title="Questions about your plan?">
        This page does not give medical advice. Message your care team or ask about a medication change from the Medications page.
      </Alert>
    </div>
  );
}
