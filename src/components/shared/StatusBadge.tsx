import { motion } from "motion/react";
import { STATUS, toStatusKey, type StatusKey } from "@/lib/status";
import { transition } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  /** A StatusKey or any legacy value (mapped with toStatusKey) */
  status: StatusKey | string | null | undefined;
  /** Optional count shown after the label (status summaries) */
  count?: number;
  /** Overrides the label, keeping the status colour (e.g. a completed track shown in the approved colour as مكتمل) */
  label?: string;
  className?: string;
}

const StatusBadge = ({ status, count, label, className }: StatusBadgeProps) => {
  const key = status && status in STATUS ? (status as StatusKey) : toStatusKey(status);
  const s = STATUS[key];
  return (
    <motion.span
      key={key}
      initial={{ opacity: 0.4 }}
      animate={{ opacity: 1 }}
      transition={transition.ui}
      className={cn(
        "inline-flex h-7 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 text-caption font-hrsd-medium",
        s.className,
        className
      )}
    >
      <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full", s.dot)} />
      {label ?? s.label}
      {count !== undefined && <span className="tabular font-hrsd-bold">{count}</span>}
    </motion.span>
  );
};

export type { StatusKey };
export default StatusBadge;
