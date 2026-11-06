import { EditorialHeader, Plate } from "@/components/patient/editorial";
import { Eye, EyeOff } from "lucide-react";
import type { Metadata } from "next";
import { fmtDateTimeYear, fmtMeasurement, MEASUREMENT_NAMES } from "@/components/patient/format";
import { JournalForm } from "@/components/patient/journal-form";
import { MeasurementForm, type Limits } from "@/components/patient/measurement-form";
import { Pagination } from "@/components/patient/pagination";
import { SelfReportNote } from "@/components/patient/self-report-note";
import { Badge, Card, CardHeader, EmptyState } from "@/components/ui/card";
import { MEASUREMENT_LIMITS } from "@/domain/rules";
import { requireSession } from "@/server/session";
import { listJournal, listMeasurements } from "@/server/services/patient";

export const metadata: Metadata = { title: "Health journal" };

const PAGE_SIZE = 10;
const WELLBEING = ["", "Very low", "Low", "Okay", "Good", "Very good"];

export default async function JournalPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const s = await requireSession("PATIENT");
  const sp = await searchParams;
  const page = Math.max(Number.parseInt(sp.page ?? "1", 10) || 1, 1);
  const [journal, measurements] = await Promise.all([listJournal(s, { page, pageSize: PAGE_SIZE }), listMeasurements(s, undefined, 15)]);
  const tz = s.timezone;
  const nowIso = new Date().toISOString();

  return (
    <div className="space-y-6">
      <EditorialHeader eyebrow="Journal" title="Health journal" description="Keep notes and readings between visits. You choose what to share with your care team." />
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_17rem] 2xl:grid-cols-[minmax(0,1fr)_22rem] [&>*]:min-w-0">
      <div className="space-y-6">
      <SelfReportNote />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card id="entry">
          <CardHeader title="Add a journal entry" />
          <JournalForm tz={tz} nowIso={nowIso} />
        </Card>
        <Card id="measurement">
          <CardHeader title="Add a measurement" />
          <MeasurementForm limits={MEASUREMENT_LIMITS as unknown as Limits} tz={tz} nowIso={nowIso} />
        </Card>
      </div>

      <Card>
        <CardHeader title="Recent measurements" description="Self-reported readings." />
        {measurements.length === 0 ? (
          <EmptyState title="No measurements yet">Add a reading above and it will appear here.</EmptyState>
        ) : (
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable table">
            <table className="w-full min-w-[26rem] text-left text-sm">
              <caption className="sr-only">Your most recent self-reported measurements</caption>
              <thead className="border-b border-line text-muted">
                <tr>
                  <th scope="col" className="px-5 py-2 font-medium">
                    When
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Type
                  </th>
                  <th scope="col" className="px-5 py-2 font-medium">
                    Reading
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {measurements.map((m) => (
                  <tr key={m.id}>
                    <td className="whitespace-nowrap px-5 py-2">{fmtDateTimeYear(m.recordedAt, tz)}</td>
                    <td className="px-3 py-2">{MEASUREMENT_NAMES[m.type] ?? m.type}</td>
                    <td className="px-5 py-2 font-medium tabular-nums">{fmtMeasurement(m)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="Journal history" description={journal.total ? `${journal.total} ${journal.total === 1 ? "entry" : "entries"}` : undefined} />
        {journal.rows.length === 0 ? (
          <EmptyState photo="blossom" title="No journal entries yet">
            Your entries will be listed here, newest first.
          </EmptyState>
        ) : (
          <ul className="stagger divide-y divide-line">
            {journal.rows.map((e) => (
              <li key={e.id} className="space-y-2 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{fmtDateTimeYear(e.recordedAt, tz)}</p>
                  <Badge tone={e.sharedWithTeam ? "accent" : "neutral"}>
                    {e.sharedWithTeam ? <Eye className="mr-1 size-3" aria-hidden /> : <EyeOff className="mr-1 size-3" aria-hidden />}
                    {e.sharedWithTeam ? "Shared with care team" : "Private"}
                  </Badge>
                </div>
                {(e.wellbeing != null || e.painScore != null) && (
                  <p className="text-sm text-ink2">
                    {e.wellbeing != null && <span>Feeling: {e.wellbeing}/5 ({WELLBEING[e.wellbeing]})</span>}
                    {e.wellbeing != null && e.painScore != null && " - "}
                    {e.painScore != null && <span>Pain: {e.painScore}/10</span>}
                  </p>
                )}
                {e.symptoms.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5" aria-label="Symptoms">
                    {e.symptoms.map((x) => (
                      <li key={x}>
                        <Badge>{x}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
                {e.text && <p className="whitespace-pre-line text-sm">{e.text}</p>}
              </li>
            ))}
          </ul>
        )}
        <Pagination page={journal.page} pageSize={journal.pageSize} total={journal.total} href={(p) => `/patient/journal?page=${p}`} />
      </Card>
      </div>
      <aside className="hidden xl:block" aria-hidden>
        <div className="sticky top-0">
          <Plate name="blossom" focal="50% 40%" caption="Notes for yourself" className="[&>div]:h-[28rem] 2xl:[&>div]:h-[34rem]" />
        </div>
      </aside>
    </div>
    </div>
  );
}
