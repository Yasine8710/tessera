import { Lock } from "lucide-react";
import { Alert, Card, EmptyState } from "@/components/ui/card";
import { CountUp } from "./count-up";
import { Figure, Panel } from "./editorial";
import { adherenceReport } from "@/server/services/staff";
import { AdherenceChart } from "./adherence-chart";
import { PeriodLinks } from "./tab-nav";
import { RateBar, type TabProps } from "./tab-shared";

export const PERIODS = [7, 30, 90] as const;

export async function AdherenceTab({ session, patientId, consents, days }: TabProps & { days: number }) {
  if (!consents.MEDICATION_ADHERENCE) {
    return (
      <Card>
        <EmptyState icon={Lock} title="Medication adherence is not shared with you">
          This patient has not chosen to share dose records. They can change this in their own settings; you cannot request it from here.
        </EmptyState>
      </Card>
    );
  }
  const r = await adherenceReport(session, patientId, days);
  const t = r.totals;
  return (
    <div className="stagger space-y-6">
      <Alert tone="info" title="Reported by patient">
        Doses are what the patient recorded in the app. An unreported dose counts as missed after a 2 hour grace period, which may not reflect what happened.
      </Alert>
      <PeriodLinks items={PERIODS.map((p) => ({ label: `${p} days`, href: `/staff/patients/${patientId}?tab=adherence&days=${p}`, active: p === days }))} />
      <div className="stagger grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
        <Figure label="Reported adherence" value={t.rate === null ? "n/a" : <CountUp value={t.rate} suffix="%" />} hint="Taken of doses due">
          {t.rate !== null && <RateBar value={t.rate} className="mt-3" />}
        </Figure>
        <Figure label="Taken" value={t.taken} tone="ok" />
        <Figure label="Skipped" value={t.skipped} />
        <Figure label="Missed or unreported" value={t.missed} />
      </div>
      <Panel title={`Doses per day, last ${days} days`} description={`${r.exceptions} exception${r.exceptions === 1 ? "" : "s"} (skipped or missed) in this period.`}>
        <div className="pt-2">
          {r.series.length === 0 ? <p className="text-sm text-muted">No scheduled doses in this period.</p> : <AdherenceChart series={r.series} />}
        </div>
      </Panel>
    </div>
  );
}
