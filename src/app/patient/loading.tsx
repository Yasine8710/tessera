import { Card, Skeleton } from "@/components/ui/card";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Card key={i} className="space-y-3 p-5">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
          ))}
        </div>
        <div className="space-y-6">
          {Array.from({ length: 3 }, (_, i) => (
            <Card key={i} className="space-y-3 p-5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
