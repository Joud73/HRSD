import { CheckCircle2, Circle, CircleDot } from "lucide-react";
import { assessmentCopy as t } from "@/lib/copy";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Course, Indicator } from "@/components/assessment/indicatorsData";
import { stripOrdinal } from "@/components/assessment/indicatorUtils";

export type IndicatorState = "not_started" | "in_progress" | "complete";

interface IndicatorNavProps {
  course: Course;
  selectedId: string;
  onSelect: (indicatorId: string) => void;
  answered: (indicator: Indicator) => number;
  stateOf: (indicator: Indicator) => IndicatorState;
}

const StateIcon = ({ state }: { state: IndicatorState }) => {
  if (state === "complete") return <CheckCircle2 aria-hidden className="h-4 w-4 shrink-0 text-success" />;
  if (state === "in_progress") return <CircleDot aria-hidden className="h-4 w-4 shrink-0 text-warning" />;
  return <Circle aria-hidden className="h-4 w-4 shrink-0 text-neutral" />;
};

/**
 * Standards and their indicators with per-indicator completion. Desktop: a sticky list on the
 * start side that scrolls on its own. Below lg: a select above the form.
 */
const IndicatorNav = ({ course, selectedId, onSelect, answered, stateOf }: IndicatorNavProps) => (
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
          {course.criteria.map((criterion, ci) => (
            <SelectGroup key={criterion.id}>
              <SelectLabel className="text-caption text-muted-foreground">
                {t.standard_label} {formatNumber(ci + 1)}: {stripOrdinal(criterion.name)}
              </SelectLabel>
              {criterion.indicators.map((indicator, ii) => (
                <SelectItem key={indicator.id} value={indicator.id} className="text-small">
                  {t.indicator_label} {formatNumber(ci + 1)}.{formatNumber(ii + 1)} ({formatNumber(answered(indicator))}/
                  {formatNumber(indicator.items.length)})
                </SelectItem>
              ))}
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
      {course.criteria.map((criterion, ci) => (
        <div key={criterion.id} className="border-b border-border last:border-0">
          <p className="px-4 pb-2 pt-4 text-caption font-hrsd-medium text-muted-foreground">
            {t.standard_label} {formatNumber(ci + 1)}: {stripOrdinal(criterion.name)}
          </p>
          <ul className="flex flex-col pb-2">
            {criterion.indicators.map((indicator, ii) => {
              const active = indicator.id === selectedId;
              const state = stateOf(indicator);
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
                      <StateIcon state={state} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-small font-hrsd-medium", active ? "text-primary" : "text-ink")}>
                        {t.indicator_label} {formatNumber(ci + 1)}.{formatNumber(ii + 1)}
                      </span>
                      <span className="line-clamp-2 text-caption text-muted-foreground">{stripOrdinal(indicator.title)}</span>
                    </span>
                    <span className="tabular mt-0.5 shrink-0 text-caption text-muted-foreground">
                      {formatNumber(answered(indicator))}/{formatNumber(indicator.items.length)}
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
