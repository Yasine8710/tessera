import { Check, Eye, Lock, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Session } from "@/server/session";
import { TabNavClient } from "./tab-nav";

export type TabProps = { session: Session; patientId: string; consents: Record<string, boolean> };

export const TABS = [
  { id: "summary", label: "Summary" },
  { id: "plans", label: "Care plans" },
  { id: "adherence", label: "Adherence" },
  { id: "journal", label: "Journal & measurements" },
  { id: "routines", label: "Routines" },
  { id: "appointments", label: "Appointments" },
  { id: "tasks", label: "Tasks & follow-up" },
  { id: "notes", label: "Internal notes" },
] as const;
export type TabId = (typeof TABS)[number]["id"];

export function TabNav({ patientId, active }: { patientId: string; active: TabId }) {
  return <TabNavClient patientId={patientId} active={active} tabs={TABS} />;
}

/** Thin horizontal meter that grows in. Decorative: the value is always printed next to it. */
export function RateBar({ value, className }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-sm bg-surface2", className)} aria-hidden>
      <div className="anim-grow-x h-full bg-accent" style={{ width: `${v}%` }} />
    </div>
  );
}

export function ConsentIcon({ granted }: { granted: boolean }) {
  return granted ? <Check className="size-4 text-ok" aria-label="shared" /> : <X className="size-4 text-danger" aria-label="not shared" />;
}

export function VisibleToPatient({ text = "Visible to the patient" }: { text?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-info">
      <Eye className="size-3.5" aria-hidden /> {text}
    </span>
  );
}

export function StaffOnlyBanner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 rounded-md border border-warn/40 bg-warn-soft px-3 py-2 text-sm font-semibold text-warn", className)}>
      <Lock className="size-4 shrink-0" aria-hidden /> Staff only — not visible to the patient
    </div>
  );
}
