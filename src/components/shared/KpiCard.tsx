import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import CountUp from "@/components/shared/CountUp";

interface KpiCardProps {
  label: string;
  /** null or undefined renders a muted dash, never an invented number */
  value: number | null | undefined;
  suffix?: string;
  icon?: LucideIcon;
  /** One short line under the value */
  hint?: string;
  /** Compact variant for dense data modules */
  size?: "default" | "compact";
  className?: string;
}

/** A single figure with its label. Bordered surface, no shadow; the value counts up once. */
const KpiCard = ({ label, value, suffix, icon: Icon, hint, size = "default", className }: KpiCardProps) => {
  const missing = value === null || value === undefined || Number.isNaN(value);
  return (
    <div className={cn("flex flex-col rounded-lg border border-border bg-card", size === "compact" ? "gap-1 p-4" : "gap-3 p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-small text-muted-foreground">{label}</p>
        {Icon && size === "default" && <Icon aria-hidden className="h-5 w-5 shrink-0 text-primary/70" strokeWidth={1.75} />}
      </div>
      {missing ? (
        <p className={cn("tabular text-muted-foreground", size === "compact" ? "text-h3" : "text-h2")}>—</p>
      ) : (
        <CountUp
          value={value}
          suffix={suffix}
          className={cn("tabular font-hrsd-bold text-ink", size === "compact" ? "text-h3" : "text-h2")}
        />
      )}
      {hint && <p className="text-caption text-muted-foreground">{hint}</p>}
    </div>
  );
};

export default KpiCard;
