import { useMemo } from "react";
import { resultsCopy as t } from "@/lib/copy";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useApprovedTool } from "@/hooks/useApprovedTool";
import type { FrozenResults, IndicatorResult } from "@/services/resultsService";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { levelTone } from "@/components/assessment/indicatorUtils";

/** One 14px square per indicator, coloured by its review level; the label is in the tooltip and for screen readers. */
const IndicatorSquares = ({ trackName, indicators }: { trackName: string; indicators: IndicatorResult[] }) => (
  <ul aria-label={t.indicators_label(trackName)} className="flex flex-wrap gap-1.5">
    {indicators.map((ind) => {
      const label = t.indicator_square(formatNumber(ind.indicatorNumber), ind.reviewLabel, formatNumber(ind.reviewPct));
      return (
        <li key={ind.indicatorId}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0} aria-label={label} className={cn("block h-3.5 w-3.5 rounded-[3px] focus-ring", levelTone(ind.reviewLevel).square)} />
            </TooltipTrigger>
            <TooltipContent side="top">{label}</TooltipContent>
          </Tooltip>
        </li>
      );
    })}
  </ul>
);

const Stat = ({ label, value, strong }: { label: string; value: number; strong?: boolean }) => (
  <div className="flex flex-col gap-1">
    <dt className="text-small text-muted-foreground">{label}</dt>
    <dd className={cn("tabular font-hrsd-bold", strong ? "text-h2 text-ink" : "text-h3 text-muted-foreground")}>{formatNumber(value)}%</dd>
  </div>
);

/**
 * Frozen results: the overall review result next to the self-assessment (a percentage only, no overall level),
 * then one row per track with both percentages and its indicators coloured by review level.
 */
const ResultsOverview = ({ results }: { results: FrozenResults }) => {
  const tool = useApprovedTool();
  const names = useMemo(() => new Map((tool.data?.tracks ?? []).map((tr) => [tr.number, tr.name])), [tool.data]);
  const byTrack = useMemo(() => {
    const map = new Map<number, IndicatorResult[]>();
    for (const ind of results.indicators) map.set(ind.trackNumber, [...(map.get(ind.trackNumber) ?? []), ind]);
    return map;
  }, [results.indicators]);
  // Legend: the levels that occur, with their labels from the frozen rows
  const legend = useMemo(() => {
    const seen = new Map<number, string>();
    for (const ind of results.indicators) if (!seen.has(ind.reviewLevel)) seen.set(ind.reviewLevel, ind.reviewLabel);
    return [...seen.entries()].sort((a, b) => b[0] - a[0]);
  }, [results.indicators]);

  const overall = results.overall;

  return (
    <div className="flex flex-col gap-6">
      {overall && (
        <section aria-label={t.overall_label} className="rounded-lg border border-border bg-card p-5 md:p-6">
          <dl className="flex flex-wrap gap-x-12 gap-y-4">
            <Stat label={t.review_pct} value={overall.reviewPct} strong />
            <Stat label={t.self_pct} value={overall.selfPct} />
          </dl>
          <p className="mt-3 text-small text-muted-foreground">{t.review_note}</p>
        </section>
      )}

      <section aria-labelledby="tracks-results-title" className="rounded-lg border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 md:px-6">
          <h2 id="tracks-results-title" className="text-h3 text-ink">
            {t.tracks_title}
          </h2>
          {legend.length > 0 && (
            <ul aria-label={t.legend_label} className="flex flex-wrap gap-x-4 gap-y-1">
              {legend.map(([level, label]) => (
                <li key={level} className="flex items-center gap-1.5 text-caption text-muted-foreground">
                  <span aria-hidden className={cn("h-3 w-3 rounded-[3px]", levelTone(level).square)} />
                  {label}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-small">
            <caption className="sr-only">{t.tracks_title}</caption>
            <thead>
              <tr className="border-b border-border text-start text-caption text-muted-foreground">
                <th scope="col" className="px-5 py-3 text-start font-hrsd-medium md:px-6">{t.col_track}</th>
                <th scope="col" className="px-3 py-3 text-start font-hrsd-medium">{t.col_self}</th>
                <th scope="col" className="px-3 py-3 text-start font-hrsd-medium">{t.col_review}</th>
                <th scope="col" className="px-5 py-3 text-start font-hrsd-medium md:px-6">{t.col_indicators}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {results.tracks.map((tr) => {
                const name = names.get(tr.trackNumber) ?? formatNumber(tr.trackNumber);
                return (
                  <tr key={tr.trackId}>
                    <th scope="row" className="px-5 py-4 text-start font-hrsd-bold text-ink md:px-6">{name}</th>
                    <td className="tabular px-3 py-4 text-muted-foreground">{formatNumber(tr.selfPct)}%</td>
                    <td className="tabular px-3 py-4 font-hrsd-medium text-ink">{formatNumber(tr.reviewPct)}%</td>
                    <td className="px-5 py-4 md:px-6">
                      <IndicatorSquares trackName={name} indicators={byTrack.get(tr.trackNumber) ?? []} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ResultsOverview;
