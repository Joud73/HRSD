import { CheckCircle2, Circle, CircleDot } from "lucide-react";
import { assessmentCopy as t } from "@/lib/copy";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Track } from "@/services/toolService";
import { stripOrdinal } from "@/components/assessment/indicatorUtils";

export type IndicatorState = "not_started" | "in_progress" | "complete";

/** Per-indicator figures from v_indicator_scores (counted over active items). */
export interface IndicatorProgress {
  counted: number;
  total: number;
  state: IndicatorState;
}

interface IndicatorNavProps {
  track: Track;
  selectedId: string;
  onSelect: (indicatorId: string) => void;
  progressOf: (indicatorId: string) => IndicatorProgress;
}

const StateIcon = ({ state }: { state: IndicatorState }) => {
  if (state === "complete") return <CheckCircle2 aria-hidden className="h-4 w-4 shrink-0 text-success" />;
  if (state === "in_progress") return <CircleDot aria-hidden className="h-4 w-4 shrink-0 text-warning" />;
  return <Circle aria-hidden className="h-4 w-4 shrink-0 text-neutral" />;
};

/**
 * Standards and their indicators with counted items per indicator. Desktop: a sticky list on the
 * start side that scrolls on its own. Below lg: a select above the form.
 */
const IndicatorNav = ({ track, selectedId, onSelect, progressOf }: IndicatorNavProps) => (
  <>
    {/* Mobile and tablet */}
    <div className="lg:hidden">
      <label htmlFor="indicator-select" className="mb-2 block text-small font-hrsd-medium text-ink">
        {t.nav_select_label}
      </label>
      <Select value={selectedId} onValueChange={onSelect} dir="rtl">
        <SelectTrigger id="indicator-select" className="h-12 bg-card text-start text-small">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-[60vh]">
          {track.standards.map((standard) => (
            <SelectGroup key={standard.id}>
              <SelectLabel className="text-caption text-muted-foreground">
                {t.standard_label} {formatNumber(standard.number)}: {stripOrdinal(standard.name)}
              </SelectLabel>
              {standard.indicators.map((indicator) => {
                const p = progressOf(indicator.id);
                return (
                  <SelectItem key={indicator.id} value={indicator.id} className="text-small">
                    {t.indicator_label} {formatNumber(indicator.number)} ({formatNumber(p.counted)} {t.of} {formatNumber(p.total)})
                  </SelectItem>
                );
              })}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* Desktop */}
    <nav
      aria-label={t.nav_label}
      className="scrollbar-thin hidden overflow-y-auto rounded-lg border border-border bg-card lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-8rem)]"
    >
      {track.standards.map((standard) => (
        <div key={standard.id} className="border-b border-border last:border-0">
          <p className="px-4 pb-2 pt-4 text-caption font-hrsd-medium text-muted-foreground">
            {t.standard_label} {formatNumber(standard.number)}: {stripOrdinal(standard.name)}
          </p>
          <ul className="flex flex-col pb-2">
            {standard.indicators.map((indicator) => {
              const active = indicator.id === selectedId;
              const p = progressOf(indicator.id);
              return (
                <li key={indicator.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(indicator.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "relative flex w-full items-start gap-3 px-4 py-3 text-start transition-colors duration-micro focus-visible:-outline-offset-2",
                      active ? "bg-primary/5" : "hover:bg-section-alt"
                    )}
                  >
                    {active && <span aria-hidden className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-primary" />}
                    <span className="mt-1">
                      <StateIcon state={p.state} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-small font-hrsd-medium", active ? "text-primary" : "text-ink")}>
                        {t.indicator_label} {formatNumber(indicator.number)}
                      </span>
                      <span className="line-clamp-2 text-caption text-muted-foreground">{stripOrdinal(indicator.text)}</span>
                    </span>
                    <span className="tabular mt-0.5 shrink-0 text-caption text-muted-foreground" aria-label={`${formatNumber(p.counted)} ${t.of} ${formatNumber(p.total)} ${t.items_counted}`}>
                      {formatNumber(p.counted)} {t.of} {formatNumber(p.total)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  </>
);

export default IndicatorNav;
