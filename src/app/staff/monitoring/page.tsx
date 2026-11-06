import { CheckCircle2, ListChecks } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { FLAG_META, FLAG_ORDER, FlagRow } from "@/components/staff/flags";
import { fmtDateTime } from "@/components/staff/format";
import { CompleteTaskButton } from "@/components/staff/task-note-forms";
import { Alert, Badge, Card, CardHeader, EmptyState, PageHeader } from "@/components/ui/card";
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
      <PageHeader title="Monitoring" description="Workflow indicators to help you decide who to look at first." />
      <Alert tone="info" title="How to read this page" className="mb-6">
        Indicators are configurable workflow rules, not diagnoses or predictions. They use only what patients reported and chose to share, are recalculated when you open this page, and are not continuous monitoring. Patients with no shared data do not appear. &ldquo;No recent updates&rdquo; means nothing was reported in {STALE_DAYS_DEFAULT} days.
      </Alert>

      <div className="space-y-6">
        {flags.length === 0 && (
          <Card><EmptyState icon={CheckCircle2} title="No indicators right now">Nothing matches the current rules for the patients sharing data with you.</EmptyState></Card>
        )}
        {FLAG_ORDER.map((kind) => {
          const items = flags.filter((f) => f.kind === kind);
          if (!items.length) return null;
          const m = FLAG_META[kind];
          return (
            <Card key={kind} className="anim-up" style={{ animationDelay: `${FLAG_ORDER.indexOf(kind) * 70}ms` }}>
              <CardHeader title={`${m.title} (${items.length})`} description={m.explain} />
              <ul className="stagger divide-y divide-line">{items.map((f, i) => <FlagRow key={`${f.patientId}${i}`} flag={f} />)}</ul>
            </Card>
          );
        })}

        <Card>
          <CardHeader title="Your open follow-up tasks" description="Tasks assigned to you. Create new ones from a patient's profile." />
          {open.length === 0 ? (
            <EmptyState icon={ListChecks} title="No open tasks" />
          ) : (
            <ul className="stagger divide-y divide-line">
              {open.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 transition-colors hover:bg-surface2">
                  <div className="min-w-0">
                    <p className="font-medium">{t.title}</p>
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
        </Card>
      </div>
    </>
  );
}
