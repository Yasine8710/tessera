import { Check, Eye, Lock, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { Session } from "@/server/session";

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
  return (
    <nav aria-label="Patient sections" className="-mx-4 mb-6 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1">
        {TABS.map((t) => (
          <li key={t.id}>
            <Link
              href={`/staff/patients/${patientId}?tab=${t.id}`}
              aria-current={active === t.id ? "page" : undefined}
              className={cn(
                "inline-block whitespace-nowrap border-b-2 px-3 py-2.5 text-sm",
                active === t.id ? "border-accent font-medium text-accent-hover" : "border-transparent text-ink2 hover:text-ink",
              )}
            >
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
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
