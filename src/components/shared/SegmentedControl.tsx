import type { ReactNode } from "react";
import { motion } from "motion/react";
import { transition } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: NoInfer<T>) => void;
  /** `activeClassName` replaces the primary fill of the selected pill (a status colour, for a verdict) */
  options: readonly { value: NoInfer<T>; label: string; count?: number; activeClassName?: string; prefix?: ReactNode }[];
  /** Also the shared-layout id of the sliding pill: keep it unique per control on a page */
  label: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Segmented control (radiogroup). The selected pill slides between options. A value that matches no option
 * shows nothing selected (a pending verdict); the first option then takes the keyboard focus.
 */
function SegmentedControl<T extends string>({ value, onChange, options, label, className, disabled = false }: SegmentedControlProps<T>) {
  const selectedIndex = options.findIndex((o) => o.value === value);
  const move = (dir: 1 | -1) => {
    if (disabled) return;
    const next = selectedIndex < 0 ? options[dir === 1 ? 0 : options.length - 1] : options[(selectedIndex + dir + options.length) % options.length];
    onChange(next.value);
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      className={cn("inline-flex max-w-full flex-wrap gap-1 rounded-md border border-border bg-card p-1", disabled && "opacity-70", className)}
      onKeyDown={(e) => {
        // RTL: ArrowLeft moves forward in reading order
        if (e.key === "ArrowLeft") { e.preventDefault(); move(1); }
        if (e.key === "ArrowRight") { e.preventDefault(); move(-1); }
      }}
    >
      {options.map((opt, index) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            tabIndex={active || (selectedIndex < 0 && index === 0) ? 0 : -1}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative h-9 rounded-[6px] px-3 text-small font-hrsd-medium transition-colors duration-micro",
              !disabled && "active:scale-[0.98]",
              active ? "text-primary-foreground" : cn("text-muted-foreground", !disabled && "hover:text-ink"),
              disabled && "cursor-not-allowed"
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${label}`}
                transition={transition.ui}
                className={cn("absolute inset-0 rounded-[6px]", opt.activeClassName ?? "bg-primary")}
              />
            )}
            <span className="relative inline-flex items-center gap-1.5 whitespace-nowrap">
              {opt.prefix}
              {opt.label}
              {opt.count !== undefined && <span className="tabular opacity-80">{opt.count}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
