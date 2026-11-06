import { Lock, NotebookPen } from "lucide-react";
import Link from "next/link";
import { Alert, Badge, Card, CardHeader, EmptyState } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { listJournal, listMeasurements } from "@/server/services/patient";
import { fmtDateTime, MEASUREMENT_LABEL } from "./format";
import type { TabProps } from "./tab-shared";

export async function JournalTab({ session, patientId, consents, page }: TabProps & { page: number }) {
  const tz = session.timezone;
  const [journal, measurements] = await Promise.all([
    consents.JOURNAL ? listJournal(session, { patientId, page }) : null,
    consents.MEASUREMENTS ? listMeasurements(session, patientId, 50) : null,
  ]);
  const pages = journal ? Math.max(1, Math.ceil(journal.total / journal.pageSize)) : 1;
  return (
    <div className="stagger space-y-6">
      <Alert tone="info" title="Reported by patient">
        Everything here is self-reported and may be incomplete. Entries the patient marked private are never shown to you.
      </Alert>

      <Card>
        <CardHeader title="Shared journal entries" />
        {!journal ? (
          <EmptyState icon={Lock} title="Journal is not shared with you">The patient has not chosen to share their journal.</EmptyState>
        ) : journal.rows.length === 0 ? (
          <EmptyState icon={NotebookPen} title="No shared entries yet" />
        ) : (
          <ul className="stagger divide-y divide-line">
            {journal.rows.map((e) => (
              <li key={e.id} className="space-y-1 px-5 py-3.5 transition-colors hover:bg-surface2">
                <p className="text-sm text-muted">{fmtDateTime(e.recordedAt, tz)}</p>
                <p className="flex flex-wrap gap-x-4 text-sm">
                  {e.wellbeing != null && <span>Wellbeing {e.wellbeing}/5</span>}
                  {e.painScore != null && <span>Pain {e.painScore}/10</span>}
                </p>
                {e.symptoms.length > 0 && (
                  <p className="flex flex-wrap gap-1.5">{e.symptoms.map((s) => <Badge key={s} tone="warn">{s}</Badge>)}</p>
                )}
                {e.text && <p className="whitespace-pre-line text-ink2">{e.text}</p>}
              </li>
            ))}
          </ul>
        )}
        {journal && pages > 1 && (
          <nav aria-label="Journal pages" className="flex items-center justify-between border-t border-line px-5 py-3 text-sm">
            <span className="text-muted">Page {page} of {pages}</span>
            <span className="flex gap-2">
              {page > 1 && <Link className={buttonClass({ variant: "secondary", size: "sm" })} href={`/staff/patients/${patientId}?tab=journal&page=${page - 1}`}>Newer</Link>}
              {page < pages && <Link className={buttonClass({ variant: "secondary", size: "sm" })} href={`/staff/patients/${patientId}?tab=journal&page=${page + 1}`}>Older</Link>}
            </span>
          </nav>
        )}
      </Card>

      <Card>
        <CardHeader title="Measurements" description="Entered by the patient, not by a device." />
        {!measurements ? (
          <EmptyState icon={Lock} title="Measurements are not shared with you">The patient has not chosen to share measurements.</EmptyState>
        ) : measurements.length === 0 ? (
          <EmptyState title="No measurements yet" />
        ) : (
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable table">
            <table className="w-full min-w-80 text-left text-sm">
              <caption className="sr-only">Patient-reported measurements, newest first</caption>
              <thead className="bg-surface2 text-xs uppercase tracking-wide text-muted"><tr><th className="px-5 py-2 font-semibold">When</th><th className="font-semibold">Type</th><th className="pr-5 font-semibold">Value</th></tr></thead>
              <tbody>
                {measurements.map((m) => (
                  <tr key={m.id} className="border-t border-line transition-colors hover:bg-surface2">
                    <td className="px-5 py-2">{fmtDateTime(m.recordedAt, tz)}</td>
                    <td>{MEASUREMENT_LABEL[m.type] ?? m.type}</td>
                    <td className="pr-5 tabular-nums">{m.value2 != null ? `${m.value}/${m.value2}` : m.value} {m.unit}</td>
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
