import { CheckCircle2, ListChecks } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { FLAG_META, FLAG_ORDER, FlagRow } from "@/components/staff/flags";
import { fmtDateTime } from "@/components/staff/format";
import { CompleteTaskButton } from "@/components/staff/task-note-forms";
import { Alert, Badge, EmptyState } from "@/components/ui/card";
import { Photo } from "@/components/ui/photo";
import { Figure, Masthead, Panel } from "@/components/staff/editorial";
import { monitoring, listTasks, STALE_DAYS_DEFAULT } from "@/server/services/staff";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Monitoring" };

export default async function MonitoringPage() {
  const session = await requireSession("PROFESSIONAL");
  const [flags, tasks] = await Promise.all([monitoring(session), listTasks(session)]);
  const tz = session.timezone;
  const open = tasks.filter((t) => t.status === "OPEN" && t.assigneeId === session.professionalId);
  const now = Date.now();
  return (
    <>
      <Masthead eyebrow="Workflow indicators" title="Monitoring" description="Workflow indicators to help you decide who to look at first." />
      <Alert tone="info" title="How to read this page" className="mb-8">
        Indicators are configurable workflow rules, not diagnoses or predictions. They use only what patients reported and chose to share, are recalculated when you open this page, and are not continuous monitoring. Patients with no shared data do not appear. &ldquo;No recent updates&rdquo; means nothing was reported in {STALE_DAYS_DEFAULT} days.
      </Alert>

      <div className="grid items-start gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] [&>*]:min-w-0">
        <div className="space-y-10">
          {flags.length === 0 && (
            <EmptyState icon={CheckCircle2} photo="colleagues" title="No indicators right now">Nothing matches the current rules for the patients sharing data with you.</EmptyState>
          )}
          {FLAG_ORDER.map((kind) => {
            const items = flags.filter((f) => f.kind === kind);
            if (!items.length) return null;
            const m = FLAG_META[kind];
            return (
              <Panel key={kind} title={`${m.title} (${items.length})`} description={m.explain} delay={FLAG_ORDER.indexOf(kind) * 70}>
                <ul className="stagger divide-y divide-line border-b border-line">{items.map((f, i) => <FlagRow key={`${f.patientId}${i}`} flag={f} />)}</ul>
              </Panel>
            );
          })}

          <Panel title="Your open follow-up tasks" description="Tasks assigned to you. Create new ones from a patient's profile." delay={FLAG_ORDER.length * 70}>
            {open.length === 0 ? (
              <EmptyState icon={ListChecks} title="No open tasks" />
            ) : (
              <ul className="stagger divide-y divide-line border-b border-line">
                {open.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-3.5 pr-3 transition-colors hover:bg-surface2 sm:pl-2">
                    <div className="min-w-0">
                      <p className="text-base font-medium">{t.title}</p>
                      <p className="text-sm text-ink2">
                        <Link href={`/staff/patients/${t.patientId}?tab=tasks`} className="text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent">{t.patient.user.name}</Link>
                        {" · due "}{fmtDateTime(t.dueAt, tz)} {t.dueAt.getTime() < now && <Badge tone="danger">Overdue</Badge>}
                      </p>
                    </div>
                    <CompleteTaskButton id={t.id} title={t.title} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <aside aria-label="Summary" className="space-y-6">
          <Figure label="Indicators raised" value={flags.length} hint={flags.length ? "Across the groups listed" : "All clear"} tone={flags.length ? "warn" : "ok"} />
          <Figure size="sm" label="Open tasks" value={open.length} hint="Assigned to you" />
          <div className="group mask-up kenburns overflow-hidden rounded-lg">
            <Photo name={flags.length ? "colleagues" : "walk-autumn"} focal="50% 30%" className="h-56 lg:h-80" sizes="(min-width: 1280px) 22rem, 100vw" />
          </div>
        </aside>
      </div>
    </>
  );
}
