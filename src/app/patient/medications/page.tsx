import { EditorialHeader, Plate } from "@/components/patient/editorial";
import type { Metadata } from "next";
import { Alert, Badge, Card, CardHeader, EmptyState } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { DoseRow } from "@/components/patient/dose-row";
import { toDoseView } from "@/components/patient/doses";
import { fmtDateTime, fmtDateTimeYear } from "@/components/patient/format";
import { MedicationCard } from "@/components/patient/medication-card";
import { SelfReportNote } from "@/components/patient/self-report-note";
import { DoseStatusBadge } from "@/components/patient/status";
import { requireSession } from "@/server/session";
import * as clinical from "@/server/services/clinical";

export const metadata: Metadata = { title: "Medications" };

const HISTORY_STEPS = [7, 30, 90];

export default async function MedicationsPage({ searchParams }: { searchParams: Promise<{ history?: string }> }) {
  const s = await requireSession("PATIENT");
  const sp = await searchParams;
  const historyDays = HISTORY_STEPS.includes(Number(sp.history)) ? Number(sp.history) : 7;
  const now = new Date();
  const [plans, doses, requests] = await Promise.all([
    clinical.listMedicationPlans(s),
    clinical.listDoses(s, { fromDays: historyDays, toDays: 2, now }),
    clinical.listChangeRequests(s, s.patientId!),
  ]);
  const tz = s.timezone;
  const twoDaysAgo = now.getTime() - 2 * 86400_000;
  const upcoming = doses.filter((d) => d.scheduledFor > now);
  const recent = doses.filter((d) => d.scheduledFor <= now && d.scheduledFor.getTime() >= twoDaysAgo).reverse();
  const older = doses.filter((d) => d.scheduledFor.getTime() < twoDaysAgo).reverse();
  const active = plans.filter((p) => p.status === "ACTIVE");
  const ended = plans.filter((p) => p.status !== "ACTIVE");
  const nextStep = HISTORY_STEPS.find((d) => d > historyDays);
  const nowIso = now.toISOString();

  return (
    <div className="space-y-8">
      <EditorialHeader eyebrow="Medicines" title="Medications" description="Your medications as set by your care team, and the doses you report." />
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_17rem] 2xl:grid-cols-[minmax(0,1fr)_22rem] [&>*]:min-w-0">
      <div className="space-y-8">
      <SelfReportNote>Taken and skipped doses are what you report. A dose with no report shows as Missed after a grace period; it is not a verified record.</SelfReportNote>

      <section aria-labelledby="active-h" className="space-y-4">
        <h2 id="active-h" className="text-lg font-semibold">
          Current medications
        </h2>
        {active.length === 0 ? (
          <Card className="overflow-hidden">
            <EmptyState photo="meds-table" title="No active medications">
              Your care team adds medications to your care plan. Nothing has been added yet.
            </EmptyState>
          </Card>
        ) : (
          active.map((p) => <MedicationCard key={p.id} plan={p} />)
        )}
      </section>

      {requests.length > 0 && (
        <section>
          <Card className="overflow-hidden">
            <CardHeader title="Your questions about medications" description="Replies come from your care team." />
            <ul className="stagger divide-y divide-line">
              {requests.map((r) => (
                <li key={r.id} className="space-y-1 px-5 py-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{r.plan.medication.name}</span>
                    <Badge tone={r.status === "OPEN" ? "warn" : "ok"}>{r.status === "OPEN" ? "Awaiting reply" : "Answered"}</Badge>
                    <span className="text-muted">{fmtDateTimeYear(r.createdAt, tz)}</span>
                  </div>
                  <p className="whitespace-pre-line">{r.message}</p>
                  {r.response && (
                    <p className="rounded-md bg-surface2 px-3 py-2">
                      <span className="font-medium">Care team reply: </span>
                      {r.response}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      <section aria-labelledby="doses-h" className="space-y-4">
        <h2 id="doses-h" className="text-lg font-semibold">
          Doses
        </h2>
        {doses.length === 0 && (
          <Card className="overflow-hidden">
            <EmptyState photo="pill-organizer" title="No doses in this period">
              Doses appear here once your care team sets a medication schedule.
            </EmptyState>
          </Card>
        )}
        {upcoming.length > 0 && (
          <Card className="overflow-hidden">
            <CardHeader title="Upcoming" />
            <ul className="stagger divide-y divide-line">
              {upcoming.map((d) => (
                <DoseRow key={d.id} dose={toDoseView(d)} tz={tz} nowIso={nowIso} showDate />
              ))}
            </ul>
          </Card>
        )}
        {recent.length > 0 && (
          <Card className="overflow-hidden">
            <CardHeader title="Last 2 days" description="Record whether you took or skipped a dose. You can report doses up to 14 days back." />
            <ul className="stagger divide-y divide-line">
              {recent.map((d) => (
                <DoseRow key={d.id} dose={toDoseView(d)} tz={tz} nowIso={nowIso} showDate />
              ))}
            </ul>
          </Card>
        )}
      </section>

      {doses.length > 0 && (
        <section>
          <Card className="overflow-hidden">
            <CardHeader title={`History: older doses (up to ${historyDays} days)`} />
            {older.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted">No older doses in this period.</p>
            ) : (
              <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable table">
                <table className="w-full min-w-[34rem] text-left text-sm">
                  <caption className="sr-only">Past doses and their status</caption>
                  <thead className="border-b border-line text-muted">
                    <tr>
                      <th scope="col" className="px-5 py-2 font-medium">
                        Due
                      </th>
                      <th scope="col" className="px-3 py-2 font-medium">
                        Medication
                      </th>
                      <th scope="col" className="px-3 py-2 font-medium">
                        Status
                      </th>
                      <th scope="col" className="px-5 py-2 font-medium">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {older.map((d) => (
                      <tr key={d.id}>
                        <td className="whitespace-nowrap px-5 py-2">{fmtDateTime(d.scheduledFor, tz)}</td>
                        <td className="px-3 py-2">
                          {d.plan.medication.name} <span className="text-muted">{d.plan.dose}</span>
                        </td>
                        <td className="px-3 py-2">
                          <DoseStatusBadge status={d.effectiveStatus} />
                        </td>
                        <td className="px-5 py-2 text-muted">
                          {d.effectiveStatus === "TAKEN" || d.effectiveStatus === "SKIPPED" ? "Reported by you" : "No report recorded"}
                          {d.note ? ` - "${d.note}"` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {nextStep && (
              <div className="border-t border-line px-5 py-3">
                <LinkButton href={`/patient/medications?history=${nextStep}`} variant="secondary" size="sm" scroll={false}>
                  Show {nextStep} days
                </LinkButton>
              </div>
            )}
          </Card>
        </section>
      )}

      {ended.length > 0 && (
        <section aria-labelledby="ended-h" className="space-y-4">
          <h2 id="ended-h" className="text-lg font-semibold">
            Past medications
          </h2>
          {ended.map((p) => (
            <MedicationCard key={p.id} plan={p} />
          ))}
        </section>
      )}

      <Alert tone="info">Do not change or stop a medication on your own. Contact your care team or pharmacist with questions. If you feel very unwell, call your local emergency number.</Alert>
      </div>
      <aside className="hidden xl:block" aria-hidden>
        <div className="sticky top-0">
          <Plate name="meds-table" focal="50% 50%" caption="Your regular routine" className="[&>div]:h-[28rem] 2xl:[&>div]:h-[34rem]" />
        </div>
      </aside>
    </div>
    </div>
  );
}
