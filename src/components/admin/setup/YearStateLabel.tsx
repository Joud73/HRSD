import { adminSetupCopy as t } from "@/lib/copy";
import { cn } from "@/lib/utils";
import type { YearState } from "./evaluationYears";

const dot: Record<YearState, string> = {
  upcoming: "bg-neutral",
  open: "bg-primary",
  closed: "bg-muted-foreground/50",
};

/** Plain-text period state of an evaluation year (not an assessment status). */
const YearStateLabel = ({ state, className }: { state: YearState; className?: string }) => (
  <span className={cn("inline-flex items-center gap-2 whitespace-nowrap text-small", state === "open" ? "font-hrsd-medium text-primary" : "text-muted-foreground", className)}>
    <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot[state])} />
    {t.year_state[state]}
  </span>
);

export default YearStateLabel;
