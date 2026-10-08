import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/** Skeletons shaped like the final content. Use these instead of spinners. */

export const SkeletonKpis = ({ count = 4, className }: { count?: number; className?: string }) => (
  <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)} aria-hidden>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-16" />
      </div>
    ))}
  </div>
);

export const SkeletonTableRows = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <>
    {Array.from({ length: rows }, (_, r) => (
      <tr key={r} aria-hidden className="h-14 border-b border-border last:border-0">
        {Array.from({ length: columns }, (_, c) => (
          <td key={c} className="px-4">
            <Skeleton className={cn("h-4", c === 0 ? "w-40" : "w-20")} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

export const SkeletonPanel = ({ lines = 4, className }: { lines?: number; className?: string }) => (
  <div className={cn("flex flex-col gap-4 rounded-lg border border-border bg-card p-6", className)} aria-hidden>
    <Skeleton className="h-6 w-48" />
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton key={i} className={cn("h-4", i % 2 ? "w-3/4" : "w-full")} />
    ))}
  </div>
);

export const SkeletonProgressRows = ({ rows = 5 }: { rows?: number }) => (
  <div className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card" aria-hidden>
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    ))}
  </div>
);

/** Full internal page placeholder: header, KPI row, panel */
export const SkeletonPage = () => (
  <div className="flex flex-col gap-8" aria-busy>
    <div className="flex flex-col gap-3">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-5 w-96 max-w-full" />
    </div>
    <SkeletonKpis />
    <SkeletonPanel lines={6} />
  </div>
);
