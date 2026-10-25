import { Card, Skeleton } from "@/components/ui/card";

/** Generic loading state: header + n content cards. */
export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: cards }, (_, i) => (
          <Card key={i} className="space-y-3 p-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4" />
            <Skeleton className="h-4 w-4/5" />
          </Card>
        ))}
      </div>
    </div>
  );
}
