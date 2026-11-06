import { Card, Skeleton } from "@/components/ui/card";

export function PageSkeleton({ stats = 0, rows = 5 }: { stats?: number; rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mb-6 mt-2 h-4 w-80 max-w-full" />
      {stats > 0 && (
        <div className="stagger mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: stats }, (_, i) => (
            <Card key={i} className="space-y-2 px-5 py-4"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-16" /></Card>
          ))}
        </div>
      )}
      <Card className="stagger divide-y divide-line">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="space-y-2 px-5 py-4"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-2/3" /></div>
        ))}
      </Card>
    </div>
  );
}
