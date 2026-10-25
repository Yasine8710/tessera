import { Lock } from "lucide-react";
import Link from "next/link";
import { Alert, Card, CardHeader, EmptyState, Stat } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { adherenceReport } from "@/server/services/staff";
import { AdherenceChart } from "./adherence-chart";
import type { TabProps } from "./tab-shared";

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
    <div className="space-y-6">
      <Alert tone="info" title="Reported by patient">
        Doses are what the patient recorded in the app. An unreported dose counts as missed after a 2 hour grace period, which may not reflect what happened.
      </Alert>
      <div className="flex gap-2" role="group" aria-label="Period">
        {PERIODS.map((p) => (
          <Link key={p} href={`/staff/patients/${patientId}?tab=adherence&days=${p}`} aria-current={p === days ? "true" : undefined} className={cn("rounded-md border px-3 py-1.5 text-sm", p === days ? "border-accent bg-accent-soft font-medium text-accent-hover" : "border-line2 hover:bg-surface2")}>
            {p} days
          </Link>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Reported adherence" value={t.rate === null ? "n/a" : `${t.rate}%`} hint="Taken of doses due" />
        <Stat label="Taken" value={t.taken} />
        <Stat label="Skipped" value={t.skipped} />
        <Stat label="Missed or unreported" value={t.missed} />
      </div>
      <Card>
        <CardHeader title={`Doses per day, last ${days} days`} description={`${r.exceptions} exception${r.exceptions === 1 ? "" : "s"} (skipped or missed) in this period.`} />
        <div className="p-5">
          {r.series.length === 0 ? <p className="text-sm text-muted">No scheduled doses in this period.</p> : <AdherenceChart series={r.series} />}
        </div>
      </Card>
    </div>
  );
}
