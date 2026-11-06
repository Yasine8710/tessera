import Link from "next/link";
import { cn } from "@/lib/cn";

/** Period selector driven by ?days= so it works without client JS. */
export function PeriodTabs({ current, options }: { current: number; options: number[] }) {
  return (
    <nav aria-label="Time period" className="inline-flex rounded-md border border-line2 bg-surface p-0.5">
      {options.map((d) => (
        <Link
          key={d}
          href={`/patient/progress?days=${d}`}
          scroll={false}
          aria-current={d === current ? "true" : undefined}
          className={cn("press rounded-sm px-3 py-1.5 text-sm", d === current ? "bg-accent font-medium text-onaccent" : "text-ink2 hover:bg-surface2")}
        >
          {d} days
        </Link>
      ))}
    </nav>
  );
}
