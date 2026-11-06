import { cn } from "@/lib/cn";

function Bone({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

/** Mirrors the editorial layout: masthead with a photo block, a row of big figures, then ruled rows. */
export function PageSkeleton({ stats = 0, rows = 5 }: { stats?: number; rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="mb-8 grid gap-6 border-b border-line pb-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,36rem)]">
        <div className="flex flex-col justify-end gap-3">
          <Bone className="h-3 w-28" />
          <Bone className="h-10 w-64 max-w-full" />
          <Bone className="h-4 w-full max-w-xl" />
          <Bone className="h-4 w-2/3 max-w-md" />
        </div>
        <Bone className="h-44 sm:h-52 lg:h-56" />
      </div>
      {stats > 0 && (
        <div className="stagger mb-10 grid gap-x-8 gap-y-6 sm:grid-cols-3">
          {Array.from({ length: Math.min(stats, 3) }, (_, i) => (
            <div key={i} className="space-y-3 border-t border-line2 pt-3">
              <Bone className="h-3 w-32" />
              <Bone className="h-12 w-20" />
              <Bone className="h-3 w-40 max-w-full" />
            </div>
          ))}
        </div>
      )}
      <div className="border-t-2 border-ink">
        <ul className="stagger divide-y divide-line">
          {Array.from({ length: rows }, (_, i) => (
            <li key={i} className="space-y-2 py-4">
              <Bone className="h-4 w-1/3" />
              <Bone className="h-3 w-2/3" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
