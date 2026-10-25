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

export function FlagRow({ flag }: { flag: MonitoringFlag }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
      <div className="min-w-0">
        <Link href={`/staff/patients/${flag.patientId}`} className="font-medium text-accent underline underline-offset-2 hover:no-underline">
          {flag.patientName}
        </Link>
        <p className="text-sm text-ink2">{flag.detail}</p>
      </div>
      <Badge tone={FLAG_META[flag.kind].tone}>{FLAG_META[flag.kind].title}</Badge>
    </li>
  );
}
