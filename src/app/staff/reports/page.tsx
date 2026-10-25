import { Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { APPT_LABEL, first } from "@/components/staff/format";
import { Alert, Card, CardHeader, PageHeader, Stat } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { teamReport } from "@/server/services/staff";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Reports" };

const PERIODS = [7, 30, 90];

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ days?: string | string[] }> }) {
  const session = await requireSession("PROFESSIONAL");
  const n = Number(first((await searchParams).days));
  const days = PERIODS.includes(n) ? n : 30;
  const r = await teamReport(session, days);
  const appts = Object.entries(r.appointments);
  const inc = r.patientsIncluded;
  return (
    <>
      <PageHeader
        title="Reports"
        description={`Summary of your caseload over the last ${days} days.`}
        action={
          <a href={`/staff/reports/export?days=${days}`} className={buttonClass({ variant: "secondary" })}>
            <Download className="size-4" aria-hidden /> Download CSV
          </a>
        }
      />
      <div className="mb-6 flex gap-2" role="group" aria-label="Period">
        {PERIODS.map((p) => (
          <Link key={p} href={`/staff/reports?days=${p}`} aria-current={p === days ? "true" : undefined} className={cn("rounded-md border px-3 py-1.5 text-sm", p === days ? "border-accent bg-accent-soft font-medium text-accent-hover" : "border-line2 hover:bg-surface2")}>
            {p} days
          </Link>
        ))}
      </div>

      <Alert tone="info" title="Who is included" className="mb-6">
        Only patients who chose to share each kind of data are counted: adherence {inc.adherence}, journal {inc.journal}, routines {inc.routines}. All patient figures are self-reported and may be incomplete. The CSV contains adherence counts only for the patients included in the adherence figures.
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Reported adherence" value={r.adherence.rate === null ? "n/a" : `${r.adherence.rate}%`} hint={`${inc.adherence} patient${inc.adherence === 1 ? "" : "s"} sharing`} />
        <Stat label="Symptom entries shared" value={r.symptomEntries} hint="Journal entries listing symptoms" />
        <Stat label="Routine completions" value={r.routineCompletions} hint="Marked done by patients" />
        <Stat label="Open / overdue tasks" value={`${r.openTasks} / ${r.overdueTasks}`} hint="Assigned to you" tone={r.overdueTasks ? "warn" : undefined} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Doses (patient-reported)" />
          <TableWrap caption="Doses by outcome" rows={[["Taken", r.adherence.taken], ["Skipped", r.adherence.skipped], ["Missed or unreported", r.adherence.missed], ["Still scheduled", r.adherence.scheduled]]} head={["Outcome", "Doses"]} />
        </Card>
        <Card>
          <CardHeader title="Appointments in this period" />
          {appts.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted">No appointments in this period.</p>
          ) : (
            <TableWrap caption="Appointments by status" head={["Status", "Count"]} rows={appts.map(([s, c]) => [APPT_LABEL[s] ?? s, c])} />
          )}
        </Card>
      </div>
    </>
  );
}

function TableWrap({ caption, head, rows }: { caption: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable table">
      <table className="w-full text-left text-sm tabular-nums">
        <caption className="sr-only">{caption}</caption>
        <thead className="text-muted"><tr><th className="px-5 py-2 font-medium">{head[0]}</th><th className="px-5 text-right font-medium">{head[1]}</th></tr></thead>
        <tbody>
          {rows.map(([a, b]) => (
            <tr key={a} className="border-t border-line"><td className="px-5 py-2">{a}</td><td className="px-5 text-right">{b}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
