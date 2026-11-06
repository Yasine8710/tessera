import type { Metadata } from "next";
import { AdherenceChart, TrendChart } from "@/components/patient/charts";
import { ChartTable } from "@/components/patient/chart-table";
import { fmtDateTime, fmtLocalDateLabel, fmtShortDay, fmtTime, SELF_REPORT_NOTE } from "@/components/patient/format";
import { isScheduledOn } from "@/components/patient/format";
import { PeriodTabs } from "@/components/patient/period-tabs";
import { SelfReportNote } from "@/components/patient/self-report-note";
import { AppointmentStatusBadge, DoseStatusBadge, type ApptStatus } from "@/components/patient/status";
import { Card, CardHeader, EmptyState, PageHeader, Stat } from "@/components/ui/card";
import { addDaysToLocalDate, localDateString } from "@/domain/schedule";
import { requireSession } from "@/server/session";
import * as clinical from "@/server/services/clinical";
import { listMyAppointments } from "@/components/patient/appointments-data";
import { listMeasurements, listRoutines } from "@/server/services/patient";
import { adherenceReport } from "@/server/services/staff";

export const metadata: Metadata = { title: "Progress" };

const PERIODS = [7, 30, 90];
const DOSE_TABLE_LIMIT = 40;

export default async function ProgressPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const s = await requireSession("PATIENT");
  const sp = await searchParams;
  const days = PERIODS.includes(Number(sp.days)) ? Number(sp.days) : 30;
  const now = new Date();
  const tz = s.timezone;
  const from = new Date(now.getTime() - days * 86400_000);
  const today = localDateString(now, tz);

  const [report, doses, routines, measurementsAll, appts] = await Promise.all([
    adherenceReport(s, s.patientId!, days, now),
    clinical.listDoses(s, { fromDays: days, toDays: 0, now }),
    listRoutines(s, now),
    listMeasurements(s, undefined, 200),
    listMyAppointments(s),
  ]);

  // Medication adherence (what the patient reported)
  const adherenceData = report.series.map((d) => ({ label: fmtLocalDateLabel(d.date), taken: d.taken, skipped: d.skipped, missed: d.missed }));
  const t = report.totals;
  const adherenceSummary = `Doses reported over the last ${days} days: ${t.taken} taken, ${t.skipped} skipped, ${t.missed} missed.`;

  // Routine completion: only 30 days of completions are available from the service.
  const routineDays = Math.min(days, 30);
  const activeRoutines = routines.filter((r) => r.active);
  const routineData = Array.from({ length: routineDays }, (_, i) => {
    const date = addDaysToLocalDate(today, i - (routineDays - 1));
    const due = activeRoutines.filter((r) => isScheduledOn(r.daysOfWeek, date) && localDateString(r.createdAt, tz) <= date);
    const done = due.filter((r) => r.completions.some((c) => c.localDate === date)).length;
    return { date, due: due.length, done, pct: due.length ? Math.round((done / due.length) * 100) : null };
  });
  const routineWithData = routineData.filter((d) => d.pct !== null);
  const routineAvg = routineWithData.length ? Math.round(routineWithData.reduce((n, d) => n + (d.pct ?? 0), 0) / routineWithData.length) : null;

  // Measurements
  const inPeriod = measurementsAll.filter((m) => m.recordedAt >= from).sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
  const bp = inPeriod.filter((m) => m.type === "BLOOD_PRESSURE");
  const weight = inPeriod.filter((m) => m.type === "WEIGHT");
  const bpData = bp.map((m) => ({ label: fmtShortDay(m.recordedAt, tz), systolic: m.value, diastolic: m.value2 }));
  const weightData = weight.map((m) => ({ label: fmtShortDay(m.recordedAt, tz), weight: m.value }));

  const pastAppts = appts.filter((a) => a.startsAt <= now && a.startsAt >= from);
  const doseRows = [...doses].reverse();

  return (
    <div className="space-y-6">
      <PageHeader title="Progress" description="Trends from what you recorded in Tessera." action={<PeriodTabs current={days} options={PERIODS} />} />
      <SelfReportNote>
        {SELF_REPORT_NOTE} These charts are not a clinical assessment. Talk to your care team about what they mean for you.
      </SelfReportNote>

      <section>
        <Card>
          <CardHeader title="Medication reports" description={`Last ${days} days. A dose with no report counts as missed after a grace period.`} />
          <div className="space-y-4 p-5">
            <div className="grid gap-3 sm:grid-cols-4">
              <Stat label="Taken rate" value={t.rate === null ? "-" : `${t.rate}%`} hint={t.rate === null ? "No doses were due" : undefined} />
              <Stat label="Taken" value={t.taken} />
              <Stat label="Skipped" value={t.skipped} />
              <Stat label="Missed" value={t.missed} />
            </div>
            {adherenceData.length === 0 ? (
              <EmptyState title="No doses in this period">Once doses are scheduled by your care team, daily counts appear here.</EmptyState>
            ) : (
              <>
                <AdherenceChart data={adherenceData} summary={adherenceSummary} />
                <ChartTable caption="Doses per day" columns={["Day", "Taken", "Skipped", "Missed"]} rows={adherenceData.map((d) => [d.label, d.taken, d.skipped, d.missed])} />
              </>
            )}
          </div>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader
            title="Routine completion"
            description={`Share of planned routines you marked done each day${days > 30 ? " (last 30 days; older routine history is not shown)" : ""}. Based on routines that are active now.`}
          />
          <div className="p-5">
            {activeRoutines.length === 0 ? (
              <EmptyState title="No active routines">Add or resume a routine to see completion here.</EmptyState>
            ) : (
              <>
                <p className="mb-3 text-sm text-ink2">{routineAvg === null ? "No routines were planned in this period." : `Average: ${routineAvg}% of planned routines marked done.`}</p>
                <TrendChart
                  data={routineData.map((d) => ({ label: fmtLocalDateLabel(d.date), pct: d.pct }))}
                  series={[{ key: "pct", name: "Routines done (%)", color: "#0d7673" }]}
                  summary={routineAvg === null ? "No routine data" : `Routine completion over ${routineDays} days, average ${routineAvg} percent.`}
                  unit="%"
                  domain={[0, 100]}
                />
                <ChartTable caption="Routine completion per day" columns={["Day", "Done", "Planned", "Percent"]} rows={routineData.map((d) => [fmtLocalDateLabel(d.date), d.done, d.due, d.pct === null ? "-" : `${d.pct}%`])} />
              </>
            )}
          </div>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Blood pressure" description="Self-reported readings (mmHg)." />
          <div className="p-5">
            {bpData.length === 0 ? (
              <EmptyState title="No readings in this period">Add a blood pressure reading in your health journal.</EmptyState>
            ) : (
              <>
                <TrendChart
                  data={bpData}
                  series={[
                    { key: "systolic", name: "Systolic", color: "#0d7673" },
                    { key: "diastolic", name: "Diastolic", color: "#3d5159" },
                  ]}
                  summary={`${bpData.length} blood pressure readings. Latest ${bpData[bpData.length - 1].systolic}/${bpData[bpData.length - 1].diastolic} mmHg.`}
                />
                <ChartTable caption="Blood pressure readings" columns={["When", "Reading (mmHg)"]} rows={bp.map((m) => [fmtDateTime(m.recordedAt, tz), `${m.value}/${m.value2}`])} />
              </>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Weight" description="Self-reported readings (kg)." />
          <div className="p-5">
            {weightData.length === 0 ? (
              <EmptyState title="No readings in this period">Add a weight reading in your health journal.</EmptyState>
            ) : (
              <>
                <TrendChart
                  data={weightData}
                  series={[{ key: "weight", name: "Weight (kg)", color: "#0d7673" }]}
                  summary={`${weightData.length} weight readings. Latest ${weightData[weightData.length - 1].weight} kg.`}
                />
                <ChartTable caption="Weight readings" columns={["When", "Weight (kg)"]} rows={weight.map((m) => [fmtDateTime(m.recordedAt, tz), m.value])} />
              </>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Appointment history" description={`Appointments in the last ${days} days.`} />
        {pastAppts.length === 0 ? (
          <EmptyState title="No past appointments in this period" />
        ) : (
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable table">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <caption className="sr-only">Appointments in this period</caption>
              <thead className="border-b border-line text-muted">
                <tr>
                  <th scope="col" className="px-5 py-2 font-medium">When</th>
                  <th scope="col" className="px-3 py-2 font-medium">Appointment</th>
                  <th scope="col" className="px-3 py-2 font-medium">With</th>
                  <th scope="col" className="px-5 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {pastAppts.map((a) => (
                  <tr key={a.id}>
                    <td className="whitespace-nowrap px-5 py-2">
                      {fmtDateTime(a.startsAt, tz)} - {fmtTime(a.endsAt, tz)}
                    </td>
                    <td className="px-3 py-2">{a.title}</td>
                    <td className="px-3 py-2">{a.professional.user.name}</td>
                    <td className="px-5 py-2">
                      <AppointmentStatusBadge status={a.status as ApptStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Dose history" description={doseRows.length > DOSE_TABLE_LIMIT ? `Latest ${DOSE_TABLE_LIMIT} of ${doseRows.length} doses in this period.` : undefined} />
        {doseRows.length === 0 ? (
          <EmptyState title="No doses in this period" />
        ) : (
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable table">
            <table className="w-full min-w-[30rem] text-left text-sm">
              <caption className="sr-only">Doses in this period and their reported status</caption>
              <thead className="border-b border-line text-muted">
                <tr>
                  <th scope="col" className="px-5 py-2 font-medium">Due</th>
                  <th scope="col" className="px-3 py-2 font-medium">Medication</th>
                  <th scope="col" className="px-5 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {doseRows.slice(0, DOSE_TABLE_LIMIT).map((d) => (
                  <tr key={d.id}>
                    <td className="whitespace-nowrap px-5 py-2">{fmtDateTime(d.scheduledFor, tz)}</td>
                    <td className="px-3 py-2">
                      {d.plan.medication.name} <span className="text-muted">{d.plan.dose}</span>
                    </td>
                    <td className="px-5 py-2">
                      <DoseStatusBadge status={d.effectiveStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
