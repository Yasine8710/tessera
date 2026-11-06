import { Card, Skeleton } from "@/components/ui/card";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Card className="space-y-3 p-5">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </Card>
      <Card>
        <div className="border-b border-line p-5">
          <Skeleton className="h-5 w-28" />
        </div>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-line px-5 py-3 last:border-0">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </Card>
    </div>
  );
}
