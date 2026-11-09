import { Check } from "lucide-react";
import { motion } from "motion/react";
import { pagesCopy } from "@/lib/copy";
import { formatNumber } from "@/lib/format";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export interface JourneyStep {
  id: number;
  title: string;
  description?: string;
}

interface JourneyStepperProps {
  steps: readonly JourneyStep[];
  /** id of the active step */
  current: number;
  /** Accessible name of the step list */
  label: string;
  onSelect?: (id: number) => void;
  /** Which steps respond to onSelect (default: none) */
  isSelectable?: (id: number) => boolean;
  /** inverse: white on the deep green band (done solid white, current gold ring, upcoming white at 40%), vertical list under md */
  tone?: "default" | "inverse";
  className?: string;
}

/** Inverse tone: the organization dashboard's identity band. Vertical list on small screens. */
const InverseStepper = ({ steps, current, label, className }: Pick<JourneyStepperProps, "steps" | "current" | "label" | "className">) => {
  const reduced = useReducedMotion();
  const count = steps.length;
  const activeIndex = Math.max(0, steps.findIndex((s) => s.id === current));
  const fill = count > 1 ? (activeIndex / (count - 1)) * 100 : 0;
  const inset = `${50 / count}%`;

  const circle = (index: number) => {
    const done = index < activeIndex;
    const isActive = index === activeIndex;
    return (
      <motion.span
        initial={isActive && !reduced ? { scale: 0.6 } : false}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, ease }}
        className={cn(
          "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-small font-hrsd-bold md:h-10 md:w-10",
          done && "bg-primary-foreground text-primary",
          isActive && "bg-primary text-primary-foreground ring-2 ring-accent ring-offset-2 ring-offset-primary",
          !done && !isActive && "border-2 border-primary-foreground/40 text-primary-foreground/40"
        )}
      >
        {done ? <Check aria-hidden className="h-4 w-4" strokeWidth={2.5} /> : <span className="tabular">{formatNumber(index + 1)}</span>}
      </motion.span>
    );
  };

  const text = (step: JourneyStep, index: number) => {
    const done = index < activeIndex;
    const isActive = index === activeIndex;
    return (
      <span className="flex min-w-0 flex-col gap-1">
        <span className={`text-small font-hrsd-bold ${isActive || done ? "text-primary-foreground" : "text-primary-foreground/60"}`}>{step.title}</span>
        {step.description && <span className={`text-caption ${isActive || done ? "text-primary-foreground/75" : "text-primary-foreground/50"}`}>{step.description}</span>}
        {done && <span className="sr-only">{pagesCopy.step_completed}</span>}
      </span>
    );
  };

  return (
    <div className={className}>
      {/* md and up: horizontal track */}
      <div className="relative hidden md:block">
        <div aria-hidden className="absolute top-5 h-0.5 -translate-y-1/2 bg-primary-foreground/25" style={{ insetInlineStart: inset, insetInlineEnd: inset }}>
          <motion.div
            className="absolute inset-y-0 start-0 bg-primary-foreground"
            initial={reduced ? false : { width: 0 }}
            animate={{ width: `${fill}%` }}
            transition={reduced ? { duration: 0 } : { duration: 0.6, ease }}
          />
        </div>
        <ol aria-label={label} className="relative grid" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
          {steps.map((step, index) => (
            <li key={step.id} aria-current={index === activeIndex ? "step" : undefined} className="flex flex-col items-center gap-3 px-2 text-center">
              {circle(index)}
              {text(step, index)}
            </li>
          ))}
        </ol>
      </div>

      {/* Small screens: vertical list */}
      <ol aria-label={label} className="flex flex-col md:hidden">
        {steps.map((step, index) => (
          <li key={step.id} aria-current={index === activeIndex ? "step" : undefined} className="relative flex gap-3 pb-5 last:pb-0">
            {index < count - 1 && (
              <span aria-hidden className={cn("absolute start-4 top-9 h-[calc(100%-2.5rem)] w-0.5 -translate-x-1/2 rtl:translate-x-1/2", index < activeIndex ? "bg-primary-foreground" : "bg-primary-foreground/25")} />
            )}
            {circle(index)}
            <span className="pt-1">{text(step, index)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};

/**
 * Horizontal journey track, same language as the home journey: completed steps
 * carry a check, the active step is solid primary with a soft ring, upcoming
 * steps are outlined. The line fills in primary up to the active step.
 * On small screens labels collapse into one "step n of N" caption.
 */
const JourneyStepper = (props: JourneyStepperProps) =>
  props.tone === "inverse" ? <InverseStepper {...props} /> : <DefaultStepper {...props} />;

const DefaultStepper = ({ steps, current, label, onSelect, isSelectable, className }: JourneyStepperProps) => {
  const reduced = useReducedMotion();
  const count = steps.length;
  const activeIndex = Math.max(0, steps.findIndex((s) => s.id === current));
  const fill = count > 1 ? (activeIndex / (count - 1)) * 100 : 0;
  // The track runs from the centre of the first circle to the centre of the last one.
  const inset = `${50 / count}%`;
  const active = steps[activeIndex];

  return (
    <div className={className}>
      <div className="relative">
        <div aria-hidden className="absolute top-4 h-0.5 -translate-y-1/2 bg-border md:top-5" style={{ insetInlineStart: inset, insetInlineEnd: inset }}>
          <motion.div
            className="absolute inset-y-0 start-0 bg-primary"
            initial={false}
            animate={{ width: `${fill}%` }}
            transition={reduced ? { duration: 0 } : { duration: 0.6, ease }}
          />
        </div>

        <ol aria-label={label} className="relative grid" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
          {steps.map((step, index) => {
            const done = index < activeIndex;
            const isActive = index === activeIndex;
            const selectable = Boolean(onSelect && isSelectable?.(step.id)) && !isActive;

            const content = (
              <>
                <span
                  className={cn(
                    "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-small font-hrsd-bold transition-[background-color,border-color,color,box-shadow] duration-ui ease-standard md:h-10 md:w-10",
                    done && "border-2 border-primary bg-card text-primary",
                    isActive && "bg-primary text-primary-foreground ring-4 ring-primary/15",
                    !done && !isActive && "border-2 border-border bg-card text-muted-foreground",
                    selectable && "group-hover:bg-primary/5"
                  )}
                >
                  {done ? <Check aria-hidden className="h-4 w-4" strokeWidth={2.5} /> : <span className="tabular">{formatNumber(index + 1)}</span>}
                </span>
                <span className="hidden flex-col gap-1 px-2 md:flex">
                  <span
                    className={cn(
                      "text-small font-hrsd-bold transition-colors duration-micro",
                      isActive ? "text-primary" : done ? "text-ink" : "text-muted-foreground",
                      selectable && "group-hover:text-primary"
                    )}
                  >
                    {step.title}
                  </span>
                  {step.description && <span className="text-caption text-muted-foreground">{step.description}</span>}
                </span>
                <span className="sr-only md:hidden">{step.title}</span>
                {done && <span className="sr-only">{pagesCopy.step_completed}</span>}
              </>
            );

            const itemClass = "group flex w-full flex-col items-center gap-3 text-center";
            return (
              <li key={step.id} aria-current={isActive ? "step" : undefined} className="flex justify-center">
                {selectable ? (
                  <button type="button" onClick={() => onSelect?.(step.id)} className={cn(itemClass, "rounded-md")}>
                    {content}
                  </button>
                ) : (
                  <div className={itemClass}>{content}</div>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {active && (
        <p className="mt-4 text-small text-muted-foreground md:hidden" aria-hidden>
          {pagesCopy.step_of(activeIndex + 1, count)}
          <span className="mx-2">·</span>
          <span className="font-hrsd-bold text-ink">{active.title}</span>
        </p>
      )}
    </div>
  );
};

export default JourneyStepper;
