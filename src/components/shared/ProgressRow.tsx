import { Link } from "react-router-dom";
import { copy } from "@/lib/copy";
import { ChevronLeft } from "lucide-react";
import { motion } from "motion/react";
import { formatNumber } from "@/lib/format";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import StatusBadge, { type StatusKey } from "@/components/shared/StatusBadge";

interface ProgressRowProps {
  name: string;
  completed: number;
  total: number;
  status?: StatusKey | string;
  /** Overrides the status label, keeping its colour */
  statusLabel?: string;
  /** Link to continue; the whole row becomes the link */
  to?: string;
  linkLabel?: string;
  className?: string;
}

/** Name, completed over total, animated bar (fills once when visible), status and a continue link. */
const ProgressRow = ({ name, completed, total, status, statusLabel, to, linkLabel, className }: ProgressRowProps) => {
  const reduced = useReducedMotion();
  const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

  const body = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-body font-hrsd-bold text-ink">{name}</p>
        <div className="flex items-center gap-3">
          {status !== undefined && <StatusBadge status={status} label={statusLabel} />}
          {to && (
            <span className="inline-flex items-center gap-1 text-small font-hrsd-medium text-primary">
              {linkLabel}
              <ChevronLeft aria-hidden className="h-4 w-4 transition-transform duration-micro group-hover:-translate-x-0.5" />
            </span>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={completed}
          aria-label={name}
          className="h-2 flex-1 overflow-hidden rounded-full bg-section-alt"
        >
          {reduced ? (
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          ) : (
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              whileInView={{ width: `${pct}%` }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.6, ease }}
            />
          )}
        </div>
        <p className="tabular shrink-0 text-small text-muted-foreground">
          {formatNumber(completed)} {copy.of} {formatNumber(total)}
        </p>
      </div>
    </>
  );

  const base = cn("block p-5", className);
  return to ? (
    <Link to={to} className={cn(base, "group transition-colors duration-micro hover:bg-section-alt/60 focus-visible:-outline-offset-2")}>
      {body}
    </Link>
  ) : (
    <div className={base}>{body}</div>
  );
};

export default ProgressRow;
