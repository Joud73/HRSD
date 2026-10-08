import { forwardRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { copy } from "@/lib/copy";
import { formatNumber, formatPercent } from "@/lib/format";
import { transition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import KpiCard from "@/components/shared/KpiCard";
import { maxCount, national, rankOf, ranked, regions } from "./types";

const byId = new Map(regions.map((r) => [r.id, r]));

/** National totals, or the selected region's figures. Crossfades between the two. */
export const RegionDetailsPanel = ({ selectedId, onClear }: { selectedId: string | null; onClear: () => void }) => {
  const region = selectedId ? byId.get(selectedId) : null;

  return (
    <div aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        {region ? (
          <motion.div
            key={region.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition.ui}
            className="rounded-lg border border-border bg-card p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-h3 text-ink">{region.name}</h3>
                <p className="mt-1 text-small text-muted-foreground">
                  {copy.map_rank} {formatNumber(rankOf(region.id))} {copy.map_rank_of} {formatNumber(regions.length)}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={onClear} className="shrink-0">
                {copy.map_show_all}
              </Button>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              <div>
                <dt className="text-caption text-muted-foreground">{copy.map_total}</dt>
                <dd className="tabular text-h3 font-hrsd-bold text-ink">{formatNumber(region.count)}</dd>
              </div>
              <div>
                <dt className="text-caption text-muted-foreground">{copy.map_association}</dt>
                <dd className="tabular text-h3 font-hrsd-bold text-ink">{formatNumber(region.associations)}</dd>
              </div>
              <div>
                <dt className="text-caption text-muted-foreground">{copy.map_foundation}</dt>
                <dd className="tabular text-h3 font-hrsd-bold text-ink">{formatNumber(region.foundations)}</dd>
              </div>
              <div>
                <dt className="text-caption text-muted-foreground">{copy.map_share}</dt>
                <dd className="tabular text-h3 font-hrsd-bold text-ink">
                  {formatPercent((region.count / national.total) * 100)}
                </dd>
              </div>
            </dl>
          </motion.div>
        ) : (
          <motion.div
            key="national"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition.ui}
            className="grid grid-cols-3 gap-3"
          >
            <KpiCard size="compact" label={copy.map_total} value={national.total} />
            <KpiCard size="compact" label={copy.map_association} value={national.associations} />
            <KpiCard size="compact" label={copy.map_foundation} value={national.foundations} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface RegionRankListProps {
  hoveredId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string | null) => void;
  className?: string;
}

/** All 13 regions ranked: rank, name, count and a thin bar proportional to the maximum. */
export const RegionRankList = forwardRef<HTMLOListElement, RegionRankListProps>(
  ({ hoveredId, selectedId, onHover, onSelect, className }, ref) => (
    <ol ref={ref} aria-label={copy.map_ranking_title} className={cn("flex flex-col", className)}>
      {ranked.map(({ region, rank }) => {
        const active = hoveredId === region.id;
        const selected = selectedId === region.id;
        const dimmed = !!selectedId && !selected;
        return (
          <li key={region.id} data-region={region.id}>
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(selected ? null : region.id)}
              onPointerEnter={() => onHover(region.id)}
              onPointerLeave={() => onHover(null)}
              onFocus={() => onHover(region.id)}
              onBlur={() => onHover(null)}
              className={cn(
                "grid w-full grid-cols-[28px_1fr_auto] items-center gap-x-3 gap-y-1.5 rounded-md px-3 py-2.5 text-start transition-[background-color,opacity] duration-ui ease-standard",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                selected ? "bg-primary/[0.06]" : active ? "bg-section-alt" : "hover:bg-section-alt",
                dimmed && !active && "opacity-60"
              )}
            >
              <span className="tabular text-caption text-muted-foreground">{formatNumber(rank)}</span>
              <span className={cn("truncate text-small", selected ? "font-hrsd-bold text-ink" : "font-hrsd-medium text-ink")}>
                {region.name}
              </span>
              <span className="tabular text-small font-hrsd-bold text-ink">{formatNumber(region.count)}</span>
              <span aria-hidden className="col-start-2 col-end-4 h-1 overflow-hidden rounded-full bg-section-alt">
                <span
                  className="block h-full rounded-full bg-primary transition-[width] duration-reveal ease-standard"
                  style={{ width: `${(region.count / maxCount) * 100}%` }}
                />
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  )
);
RegionRankList.displayName = "RegionRankList";
