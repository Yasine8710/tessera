import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/** Link-based pager; keeps other query params. */
export function Pager({ basePath, params, page, pageSize, total }: { basePath: string; params: Record<string, string | undefined>; page: number; pageSize: number; total: number }) {
  const pages = Math.max(Math.ceil(total / pageSize), 1);
  const href = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const cls = (off: boolean) => buttonClass({ variant: "secondary", size: "sm", className: cn(off && "pointer-events-none opacity-55") });
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 text-sm">
      <p className="text-muted">
        {from}-{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Link href={href(page - 1)} className={cls(page <= 1)} aria-disabled={page <= 1} tabIndex={page <= 1 ? -1 : undefined}>
          <ChevronLeft className="size-4" aria-hidden /> Previous
        </Link>
        <span className="text-muted">
          Page {page} of {pages}
        </span>
        <Link href={href(page + 1)} className={cls(page >= pages)} aria-disabled={page >= pages} tabIndex={page >= pages ? -1 : undefined}>
          Next <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>
    </nav>
  );
}
