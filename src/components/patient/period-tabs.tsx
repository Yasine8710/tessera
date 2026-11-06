import Link from "next/link";
import { cn } from "@/lib/cn";

/** Period selector driven by ?days= so it works without client JS. A sliding indicator moves to the current option. */
export function PeriodTabs({ current, options }: { current: number; options: number[] }) {
  const idx = Math.max(0, options.indexOf(current));
  return (
    <nav aria-label="Time period" className="relative inline-grid rounded-sm border border-line2 bg-surface p-0.5" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      <span
        aria-hidden
        className="absolute inset-y-0.5 left-0.5 rounded-[2px] bg-accent transition-transform duration-[var(--t-slow)] ease-[var(--ease)]"
        style={{ width: `calc((100% - 4px) / ${options.length})`, transform: `translateX(${idx * 100}%)` }}
      />
      {options.map((d) => (
        <Link
          key={d}
          href={`/patient/progress?days=${d}`}
          scroll={false}
          aria-current={d === current ? "true" : undefined}
          className={cn("press relative px-4 py-1.5 text-center text-sm transition-colors", d === current ? "font-medium text-onaccent" : "text-ink2 hover:text-ink")}
        >
          {d} days
        </Link>
      ))}
    </nav>
  );
}
