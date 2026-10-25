import { ListChecks } from "lucide-react";
import type { Metadata } from "next";
import { Alert, Card, CardHeader, EmptyState, PageHeader } from "@/components/ui/card";
import { localDateString } from "@/domain/schedule";
import { isScheduledOn } from "@/components/patient/format";
import { RoutineForm } from "@/components/patient/routine-form";
import { RoutineItem, type RoutineView } from "@/components/patient/routine-item";
import { requireSession } from "@/server/session";
import { listRoutines } from "@/server/services/patient";

export const metadata: Metadata = { title: "Routines" };

export default async function RoutinesPage() {
  const s = await requireSession("PATIENT");
  const now = new Date();
  const today = localDateString(now, s.timezone);
  const rows = await listRoutines(s, now);
  const views: RoutineView[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    kind: r.kind,
    clinicianDefined: r.clinicianDefined,
    active: r.active,
    daysOfWeek: r.daysOfWeek,
    timeOfDay: r.timeOfDay,
    doneToday: r.doneToday,
    scheduledToday: isScheduledOn(r.daysOfWeek, today),
    streak: r.streak,
    week: r.week,
  }));
  const active = views.filter((r) => r.active);
  const paused = views.filter((r) => !r.active);
  const doneCount = active.filter((r) => r.scheduledToday && r.doneToday).length;
  const dueCount = active.filter((r) => r.scheduledToday).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Routines" description="Daily habits you and your care team track. Tick a routine when you have done it today." />
      <Alert tone="info">Wellness routines you add yourself are suggestions you set for yourself, not medical instructions. Follow your care team&apos;s guidance for anything clinical.</Alert>

      <Card>
        <CardHeader title="Today" description={dueCount ? `${doneCount} of ${dueCount} planned routines marked done.` : undefined} />
        {active.length === 0 ? (
          <EmptyState icon={ListChecks} title="No active routines">
            Add your own routine below. Routines from your care team will appear here too.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {active.map((r) => (
              <RoutineItem key={r.id} routine={r} />
            ))}
          </ul>
        )}
      </Card>

      {paused.length > 0 && (
        <Card>
          <CardHeader title="Paused" description="Paused routines do not count toward today." />
          <ul className="divide-y divide-line">
            {paused.map((r) => (
              <RoutineItem key={r.id} routine={r} />
            ))}
          </ul>
        </Card>
      )}

      <Card id="new-routine">
        <CardHeader title="Add your own routine" description="Care team routines cannot be paused or removed here." />
        <RoutineForm />
      </Card>
    </div>
  );
}
