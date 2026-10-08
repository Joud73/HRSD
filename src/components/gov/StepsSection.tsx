import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ArrowLeft, Check, ChevronDown, FileCheck2, User } from "lucide-react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { copy, homeCopy, JOURNEY_STEPS } from "@/lib/copy";
import { formatNumber, formatPercent } from "@/lib/format";
import { ease, transition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import Section from "@/components/layout/Section";
import ProgressRow from "@/components/shared/ProgressRow";
import StatusBadge from "@/components/shared/StatusBadge";

const ADVANCE_MS = 5000;
const STEP_COUNT = JOURNEY_STEPS.length;

/* ---------- Illustrative fragments, built from real components ---------- */

const DocsFragment = () => (
  <div className="flex flex-col gap-3">
    <ul className="flex flex-col gap-2">
      {homeCopy.fragment_docs.map((doc) => (
        <li key={doc} className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5">
          <FileCheck2 aria-hidden className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} />
          <span className="flex-1 text-small text-ink">{doc}</span>
          <Check aria-hidden className="h-4 w-4 text-success" />
        </li>
      ))}
    </ul>
    <StatusBadge status="approved" className="self-start" />
  </div>
);

const ProgressFragment = () => (
  <div className="rounded-md border border-border bg-card">
    <ProgressRow
      name={homeCopy.fragment_track}
      completed={homeCopy.fragment_items_done}
      total={homeCopy.fragment_items_total}
      status="in_progress"
      className="p-4"
    />
  </div>
);

/** Status moves from submitted to approved shortly after the fragment appears */
const ReviewFragment = () => {
  const reduced = useReducedMotion();
  const [approved, setApproved] = useState(reduced);
  useEffect(() => {
    if (reduced) return;
    const t = window.setTimeout(() => setApproved(true), 1200);
    return () => window.clearTimeout(t);
  }, [reduced]);
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card px-4 py-4">
      <StatusBadge status="submitted" />
      <ArrowLeft aria-hidden className={cn("h-4 w-4 transition-colors duration-ui", approved ? "text-ink" : "text-border")} />
      <span className={cn("transition-opacity duration-ui", approved ? "opacity-100" : "opacity-30")}>
        <StatusBadge status="approved" />
      </span>
    </div>
  );
};

const ResultFragment = () => {
  const reduced = useReducedMotion();
  const value = homeCopy.fragment_result_value;
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-small text-ink">{homeCopy.fragment_result_label}</p>
        <p className="tabular text-small font-hrsd-bold text-ink">{formatPercent(value)}</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-section-alt" aria-hidden>
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={reduced ? false : { width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease }}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {[homeCopy.fragment_strengths, homeCopy.fragment_opportunities, homeCopy.fragment_plan].map((chip) => (
          <span key={chip} className="rounded-full border border-border px-3 py-0.5 text-caption text-muted-foreground">
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
};

const FRAGMENTS = [DocsFragment, ProgressFragment, ReviewFragment, ResultFragment];

/** Title, description, who acts, what it produces, and the illustrative fragment */
const StepDetail = ({ index, headingLevel = "h3" }: { index: number; headingLevel?: "h3" | "p" }) => {
  const step = JOURNEY_STEPS[index];
  const Fragment = FRAGMENTS[index];
  const Heading = headingLevel;
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_minmax(0,360px)] md:gap-10">
      <div className="flex flex-col gap-4">
        <Heading className={cn(headingLevel === "h3" ? "text-h3 text-ink" : "sr-only")}>{step.title}</Heading>
        <p className="max-w-[60ch] text-body text-muted-foreground">{step.desc}</p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/[0.08] px-3 py-1 text-small font-hrsd-medium text-primary">
            <User aria-hidden className="h-4 w-4" />
            <span className="sr-only">{copy.journey_role_label}:</span>
            {step.role}
          </span>
        </div>
        <p className="text-small text-ink">
          <span className="font-hrsd-bold">{copy.journey_output_label}:</span> {step.output}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-caption text-muted-foreground">{homeCopy.journey_example}</p>
        <Fragment />
      </div>
    </div>
  );
};

/* ---------- Section ---------- */

/** "رحلة التقييم": the page's signature module. Tabs with a filling track on desktop, accordion timeline on mobile. */
const StepsSection = () => {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [mobileOpen, setMobileOpen] = useState<string>("step-0");
  const trackRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const inView = useInView(trackRef, { amount: 0.5 });
  // Direction of the last change, so the panel slides the right way
  const [dir, setDir] = useState<1 | -1>(1);

  const autoRunning = !reduced && inView && !paused;

  const go = (next: number, focus = false) => {
    const i = (next + STEP_COUNT) % STEP_COUNT;
    setDir(i >= active ? 1 : -1);
    setActive(i);
    if (focus) tabRefs.current[i]?.focus();
  };

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    // RTL: ArrowLeft moves forward in reading order
    const map: Record<string, number> = { ArrowLeft: active + 1, ArrowRight: active - 1, Home: 0, End: STEP_COUNT - 1 };
    if (e.key in map) {
      e.preventDefault();
      go(map[e.key], true);
    }
  };

  const fillPct = (active / (STEP_COUNT - 1)) * 100;

  return (
    <Section id="steps" tone="white" title={copy.steps_title} subtitle={homeCopy.journey_subtitle}>
      {/* ---------- Desktop ---------- */}
      <div
        className="hidden lg:block"
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false);
        }}
      >
        <div ref={trackRef} className="relative">
          {/* Track: from the first circle's centre to the last one's */}
          <div aria-hidden className="absolute inset-x-[12.5%] top-6 h-0.5 rounded-full bg-border">
            <motion.div
              className="absolute inset-y-0 start-0 rounded-full bg-primary"
              initial={false}
              animate={{ width: `${fillPct}%` }}
              transition={{ duration: reduced ? 0 : 0.6, ease }}
            />
          </div>

          <div role="tablist" aria-label={homeCopy.journey_tablist} aria-orientation="horizontal" className="relative grid grid-cols-4">
            {JOURNEY_STEPS.map((step, i) => {
              const isActive = i === active;
              const isDone = i < active;
              return (
                <button
                  key={step.title}
                  ref={(el) => (tabRefs.current[i] = el)}
                  role="tab"
                  id={`journey-tab-${i}`}
                  aria-selected={isActive}
                  aria-controls="journey-panel"
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => go(i)}
                  onKeyDown={onTabKey}
                  className="group flex flex-col items-center gap-4 rounded-lg px-4 pb-2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
                >
                  <span
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full border-2 text-body font-hrsd-bold transition-[background-color,border-color,color,box-shadow] duration-ui ease-standard",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground ring-8 ring-primary/10"
                        : isDone
                          ? "border-primary bg-background text-primary"
                          : "border-border bg-background text-muted-foreground group-hover:border-primary/50 group-hover:text-primary"
                    )}
                  >
                    {isDone ? <Check aria-hidden className="h-5 w-5" /> : formatNumber(i + 1)}
                  </span>
                  <span
                    className={cn(
                      "max-w-[22ch] text-body transition-colors duration-ui",
                      isActive ? "font-hrsd-bold text-ink" : "font-hrsd-medium text-muted-foreground group-hover:text-ink"
                    )}
                  >
                    {step.title}
                  </span>
                  {/* Auto-advance indicator under the active step */}
                  <span aria-hidden className="h-0.5 w-16 overflow-hidden rounded-full bg-transparent">
                    {isActive && !reduced && (
                      <span
                        key={`${active}-${inView}`}
                        className="block h-full origin-right rounded-full bg-primary/40"
                        style={{
                          animation: `progress-fill ${ADVANCE_MS}ms linear forwards`,
                          animationPlayState: autoRunning ? "running" : "paused",
                        }}
                        onAnimationEnd={() => go(active + 1)}
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          id="journey-panel"
          role="tabpanel"
          aria-labelledby={`journey-tab-${active}`}
          tabIndex={0}
          className="mt-8 overflow-hidden rounded-lg border border-border bg-section-alt/60 p-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={active}
              custom={dir}
              initial={reduced ? { opacity: 0 } : { opacity: 0, x: dir * 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, x: dir * -12 }}
              transition={transition.ui}
            >
              <StepDetail index={active} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ---------- Mobile and tablet: vertical timeline accordion ---------- */}
      <AccordionPrimitive.Root
        type="single"
        collapsible
        value={mobileOpen}
        onValueChange={setMobileOpen}
        dir="rtl"
        className="lg:hidden"
      >
        {JOURNEY_STEPS.map((step, i) => {
          const value = `step-${i}`;
          const open = mobileOpen === value;
          const last = i === STEP_COUNT - 1;
          return (
            <AccordionPrimitive.Item key={step.title} value={value} className="relative ps-14">
              {!last && <span aria-hidden className="absolute bottom-0 start-[19px] top-12 w-0.5 rounded-full bg-border" />}
              <span
                aria-hidden
                className={cn(
                  "absolute start-0 top-2 flex h-10 w-10 items-center justify-center rounded-full border-2 text-small font-hrsd-bold transition-colors duration-ui",
                  open ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"
                )}
              >
                {formatNumber(i + 1)}
              </span>
              <AccordionPrimitive.Header>
                <AccordionPrimitive.Trigger className="group flex min-h-14 w-full items-center justify-between gap-3 rounded-md py-3 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className={cn("text-body", open ? "font-hrsd-bold text-ink" : "font-hrsd-medium text-ink")}>
                    <span className="sr-only">
                      {homeCopy.journey_step} {formatNumber(i + 1)}:{" "}
                    </span>
                    {step.title}
                  </span>
                  <ChevronDown
                    aria-hidden
                    className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-ui ease-standard group-data-[state=open]:rotate-180"
                  />
                </AccordionPrimitive.Trigger>
              </AccordionPrimitive.Header>
              <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <div className="pb-8 pt-1">
                  <StepDetail index={i} headingLevel="p" />
                </div>
              </AccordionPrimitive.Content>
            </AccordionPrimitive.Item>
          );
        })}
      </AccordionPrimitive.Root>
    </Section>
  );
};

export default StepsSection;
