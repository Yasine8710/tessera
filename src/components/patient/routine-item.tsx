"use client";

import { Flame, Lock, Pause, Play } from "lucide-react";
import { setRoutineActiveAction, toggleRoutineAction } from "@/app/actions/patient";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/form";
import { useAction } from "@/components/ui/use-action";
import { cn } from "@/lib/cn";
import { describeDays, fmtLocalDateLabel } from "./format";

export type RoutineView = {
  id: string;
  title: string;
  kind: string;
  clinicianDefined: boolean;
  active: boolean;
  daysOfWeek: number[];
  timeOfDay: string | null;
  doneToday: boolean;
  scheduledToday: boolean;
  streak: number;
  week: { date: string; done: boolean }[];
};

const KIND: Record<string, string> = {
  HYDRATION: "Hydration",
  ACTIVITY: "Activity",
  SLEEP: "Sleep",
  EXERCISE: "Exercise",
  WELLNESS: "Wellness",
  CLINICIAN_TASK: "Care team task",
};

export function WeekDots({ week }: { week: RoutineView["week"] }) {
  const done = week.filter((d) => d.done).length;
  return (
    <div role="img" aria-label={`Last 7 days: ${done} of 7 done. ${week.map((d) => `${fmtLocalDateLabel(d.date)} ${d.done ? "done" : "not done"}`).join(", ")}`} className="flex gap-1">
      {week.map((d) => (
        <span key={d.date} title={`${fmtLocalDateLabel(d.date)}: ${d.done ? "done" : "not done"}`} className={cn("size-3 rounded-full border", d.done ? "border-accent bg-accent" : "border-line2 bg-surface")} />
      ))}
    </div>
  );
}

export function RoutineItem({ routine: r }: { routine: RoutineView }) {
  const { run, pending } = useAction();
  return (
    <li className={cn("flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4", !r.active && "bg-surface2/60")}>
      <div className="min-w-0 flex-1 basis-56">
        <Checkbox
          label={r.title}
          hint={`${KIND[r.kind] ?? r.kind} - ${describeDays(r.daysOfWeek)}${r.timeOfDay ? ` at ${r.timeOfDay}` : ""}`}
          checked={r.doneToday}
          disabled={!r.active || pending}
          onChange={(e) => run(() => toggleRoutineAction(r.id, e.target.checked), e.target.checked ? "Marked done for today" : "Marked not done")}
        />
        <div className="mt-2 flex flex-wrap items-center gap-2 pl-6.5 text-sm">
          {r.clinicianDefined && (
            <Badge tone="info">
              <Lock className="mr-1 size-3" aria-hidden /> Set by your care team
            </Badge>
          )}
          {!r.active && <Badge>Paused</Badge>}
          {r.active && !r.scheduledToday && <span className="text-muted">Not planned for today</span>}
          {r.streak > 0 && (
            <span className="inline-flex items-center gap-1 text-ink2">
              <Flame className="size-4 text-warn" aria-hidden /> {r.streak} day{r.streak === 1 ? "" : "s"} in a row
            </span>
          )}
        </div>
      </div>
      <WeekDots week={r.week} />
      {!r.clinicianDefined && (
        <Button
          variant="secondary"
          size="sm"
          loading={pending}
          onClick={() => run(() => setRoutineActiveAction(r.id, !r.active), r.active ? "Routine paused" : "Routine resumed")}
          aria-label={`${r.active ? "Pause" : "Resume"} ${r.title}`}
        >
          {r.active ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
          {r.active ? "Pause" : "Resume"}
        </Button>
      )}
    </li>
  );
}
