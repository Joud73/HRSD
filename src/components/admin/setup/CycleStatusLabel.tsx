import { adminSetupCopy as t } from "@/lib/copy";
import { cn } from "@/lib/utils";
import type { CycleStatus } from "@/services/cycleService";

const dot: Record<CycleStatus, string> = {
  draft: "bg-neutral",
  open: "bg-primary",
  closed: "bg-muted-foreground/50",
  archived: "bg-muted-foreground/50",
};

/** Plain-text status of an evaluation cycle (not an assessment status). */
const CycleStatusLabel = ({ status, className }: { status: CycleStatus; className?: string }) => (
  <span className={cn("inline-flex items-center gap-2 whitespace-nowrap text-small", status === "open" ? "font-hrsd-medium text-primary" : "text-muted-foreground", className)}>
    <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot[status])} />
    {t.cycle_status[status]}
  </span>
);

export default CycleStatusLabel;
