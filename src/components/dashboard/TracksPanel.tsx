import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { assessmentCopy, orgCopy as t } from "@/lib/copy";
import { counted, formatNumber } from "@/lib/format";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { IndicatorScore, TrackScore } from "@/services/assessmentService";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import StatusBadge from "@/components/shared/StatusBadge";
import { levelTone } from "@/components/assessment/indicatorUtils";

export interface TrackRow {
  number: number;
  name: string;
  score: TrackScore | undefined;
  indicators: IndicatorScore[];
}

type State = "not_started" | "in_progress" | "complete";
const stateOf = (s: TrackScore | undefined): State =>
  !s || s.itemsCounted === 0 ? "not_started" : s.indicatorsTotal > 0 && s.indicatorsComplete === s.indicatorsTotal ? "complete" : "in_progress";

const LEVELS = [0, 1, 2, 4];

/** One 14px square per indicator, coloured by level; opens the indicator in the track page. */
const IndicatorStrip = ({ track, indicators }: { track: TrackRow; indicators: IndicatorScore[] }) => {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  return (
    <ul aria-label={t.indicators_label(track.name)} className="flex flex-wrap gap-1.5">
      {indicators.map((ind, i) => {
        const label = t.indicator_square(formatNumber(ind.indicatorNumber), ind.levelLabel, formatNumber(ind.scorePct));
        return (
          <li key={ind.indicatorId}>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  type="button"
                  aria-label={label}
                  onClick={() => navigate(`/assessment/${track.number}?indicator=${ind.indicatorId}`)}
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: reduced ? 0 : i * 0.015 }}
                  className={cn(
                    "block h-3.5 w-3.5 rounded-[3px] transition-shadow duration-micro hover:ring-2 hover:ring-primary hover:ring-offset-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                    levelTone(ind.level).square
                  )}
                />
              </TooltipTrigger>
              <TooltipContent side="top">{label}</TooltipContent>
            </Tooltip>
          </li>
        );
      })}
    </ul>
  );
};

/** Five tracks: items, progress bar, status, action, and the indicator strip. Legend from level_labels. */
const TracksPanel = ({ tracks, levelLabels, editable }: { tracks: TrackRow[]; levelLabels: Record<number, string>; editable: boolean }) => {
  const reduced = useReducedMotion();
  return (
    <section aria-labelledby="tracks-title" className="rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <h2 id="tracks-title" className="text-h3 text-ink">
          {t.tracks_title}
        </h2>
        <ul aria-label={t.tracks_legend} className="flex flex-wrap gap-x-4 gap-y-2">
          {LEVELS.filter((l) => levelLabels[l]).map((l) => (
            <li key={l} className="flex items-center gap-2 text-caption text-muted-foreground">
              <span aria-hidden className={cn("h-3.5 w-3.5 rounded-[3px]", levelTone(l).square)} />
              {levelLabels[l]}
            </li>
          ))}
        </ul>
      </div>

      <ul className="divide-y divide-border">
        {tracks.map((tr) => {
          const s = tr.score;
          const state = stateOf(s);
          const pct = s && s.itemsTotal > 0 ? Math.round((s.itemsCounted / s.itemsTotal) * 100) : 0;
          const action = !editable || state === "complete" ? t.track_view : state === "not_started" ? t.track_start : t.track_continue;
          return (
            <li key={tr.number} className="flex flex-col gap-3 px-5 py-4 md:px-6">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <p className="min-w-0 flex-1 text-body font-hrsd-bold text-ink">
                  {tr.name}
                </p>
                <p className="tabular text-small text-muted-foreground">
                  {t.track_items(formatNumber(s?.itemsCounted ?? 0), counted(s?.itemsTotal ?? 0, assessmentCopy.items_forms))}
                </p>
                <div
                  role="progressbar"
                  aria-label={tr.name}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pct}
                  className="h-1.5 w-full overflow-hidden rounded-full bg-section-alt sm:w-32"
                >
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={reduced ? false : { width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={reduced ? { duration: 0 } : { duration: 0.6, ease }}
                  />
                </div>
                <StatusBadge status={state === "complete" ? "approved" : state} label={state === "complete" ? t.track_complete : undefined} />
                <Button asChild variant="ghost" size="sm" className="text-primary">
                  <Link to={`/assessment/${tr.number}`} aria-label={t.track_action_label(action, tr.name)}>
                    {action}
                    <ArrowLeft aria-hidden />
                  </Link>
                </Button>
              </div>
              {tr.indicators.length > 0 && <IndicatorStrip track={tr} indicators={tr.indicators} />}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default TracksPanel;
