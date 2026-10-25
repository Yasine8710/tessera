import { ListChecks } from "lucide-react";
import { Badge, Card, CardHeader, EmptyState } from "@/components/ui/card";
import { listTasks } from "@/server/services/staff";
import { fmtDateTime } from "./format";
import { CompleteTaskButton, CreateTaskForm } from "./task-note-forms";
import { StaffOnlyBanner, type TabProps } from "./tab-shared";

export async function TasksTab({ session, patientId }: TabProps) {
  const tasks = await listTasks(session, { patientId });
  const tz = session.timezone;
  const open = tasks.filter((t) => t.status === "OPEN");
  const done = tasks.filter((t) => t.status === "DONE");
  const now = Date.now();
  return (
    <div className="space-y-6">
      <StaffOnlyBanner />
      <Card>
        <CardHeader title="Open follow-up tasks" />
        {open.length === 0 ? (
          <EmptyState icon={ListChecks} title="No open tasks for this patient" />
        ) : (
          <ul className="divide-y divide-line">
            {open.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                <div>
                  <p className="font-medium">{t.title}</p>
                  <p className="text-sm text-ink2">
                    Due {fmtDateTime(t.dueAt, tz)} · assigned to {t.assignee.user.name}{" "}
                    {t.dueAt.getTime() < now && <Badge tone="danger">Overdue</Badge>}
                  </p>
                </div>
                {t.assigneeId === session.professionalId ? <CompleteTaskButton id={t.id} title={t.title} /> : <span className="text-sm text-muted">Only the assignee can complete it</span>}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card>
        <CardHeader title="Create a task" />
        <div className="p-5"><CreateTaskForm patientId={patientId} tz={tz} /></div>
      </Card>
      <Card>
        <CardHeader title="Follow-up history" description="Completed tasks for this patient that you created or were assigned." />
        {done.length === 0 ? (
          <p className="px-5 py-4 text-sm text-muted">Nothing completed yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {done.map((t) => (
              <li key={t.id} className="px-5 py-3 text-sm">
                <p className="font-medium">{t.title}</p>
                <p className="text-muted">{t.completedAt ? `Completed ${fmtDateTime(t.completedAt, tz)}` : "Completed"} · {t.assignee.user.name}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
