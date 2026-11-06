import Link from "next/link";
import type { MonitoringFlag } from "@/server/services/staff";
import { Badge, type Tone } from "@/components/ui/card";

export const FLAG_META: Record<MonitoringFlag["kind"], { title: string; tone: Tone; explain: string }> = {
  dose_exceptions: {
    title: "Dose exceptions reported",
    tone: "warn",
    explain: "Doses the patient marked as skipped, or did not report within the grace period. A missing report does not prove a dose was missed.",
  },
  routines_incomplete: {
    title: "Routines not marked done today",
    tone: "info",
    explain: "Routines the patient has not ticked off yet today. Only shown late in the patient's day.",
  },
  overdue_task: {
    title: "Overdue follow-up tasks",
    tone: "danger",
    explain: "Open tasks assigned to you whose due time has passed.",
  },
  new_symptoms: {
    title: "New symptom reports",
    tone: "warn",
    explain: "Journal entries the patient shared that list symptoms. These are the patient's own words and may be incomplete.",
  },
  stale: {
    title: "No recent updates",
    tone: "neutral",
    explain: "The patient has shared data with you but has added nothing recently. They may simply be well or busy.",
  },
};

export const FLAG_ORDER: MonitoringFlag["kind"][] = ["dose_exceptions", "new_symptoms", "routines_incomplete", "overdue_task", "stale"];

export const BAR: Record<Tone, string> = {
  neutral: "bg-line2",
  accent: "bg-accent",
  ok: "bg-ok",
  warn: "bg-warn",
  danger: "bg-danger",
  info: "bg-info",
};

/** The coloured edge grows in; rows enter in severity order (FLAG_ORDER) so the most urgent land first. */
export function FlagRow({ flag }: { flag: MonitoringFlag }) {
  const meta = FLAG_META[flag.kind];
  const rank = FLAG_ORDER.indexOf(flag.kind);
  return (
    <li className="relative flex flex-wrap items-center justify-between gap-2 py-3.5 pl-5 pr-3 transition-colors hover:bg-surface2">
      <span aria-hidden className={`anim-grow-y absolute inset-y-2.5 left-0 w-[3px] rounded-sm ${BAR[meta.tone]}`} style={{ animationDelay: `${160 + rank * 90}ms` }} />
      <div className="min-w-0">
        <Link href={`/staff/patients/${flag.patientId}`} className="text-base font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent">
          {flag.patientName}
        </Link>
        <p className="text-sm text-ink2">{flag.detail}</p>
      </div>
      <Badge tone={meta.tone}>{meta.title}</Badge>
    </li>
  );
}
