import { Card, Skeleton } from "@/components/ui/card";

/** Generic loading skeleton for list-like pages. */
export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="max-w-5xl" role="status" aria-label="Loading">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <Card className="mt-6 divide-y divide-line">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="space-y-2 px-5 py-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </Card>
    </div>
  );
}
