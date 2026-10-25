import { Info } from "lucide-react";

export function SelfReportNote({ children }: { children?: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-sm text-muted">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children ?? "Information here is reported by you and may be incomplete. It is not a verified clinical record."}</span>
    </p>
  );
}
