import { Skeleton } from "@/components/ui/card";

/** Matches the overview: greeting band with photo, numerals, quick actions, two columns. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-12">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] xl:gap-14">
        <div className="space-y-10">
          <div className="space-y-4">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-16 w-4/5" />
            <Skeleton className="h-5 w-3/5" />
          </div>
          <div className="grid grid-cols-2 gap-6 border-t border-line pt-6 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-14 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </div>
        <Skeleton className="hidden min-h-80 lg:block" />
      </div>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:gap-16">
        <div className="space-y-12">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="space-y-3 border-t border-line pt-3">
              <Skeleton className="h-6 w-52" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          ))}
        </div>
        <div className="space-y-10">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="space-y-3 border-t border-line pt-3">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
