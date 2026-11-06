import { Card, Skeleton } from "@/components/ui/card";

/** Generic loading state: editorial title block + n content cards, with a side plate on wide screens. */
export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="mb-8 space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-12 w-72 max-w-full" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_17rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          {Array.from({ length: cards }, (_, i) => (
            <Card key={i} className="space-y-3 p-5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4" />
              <Skeleton className="h-4 w-4/5" />
            </Card>
          ))}
        </div>
        <Skeleton className="hidden h-[28rem] xl:block" />
      </div>
    </div>
  );
}
