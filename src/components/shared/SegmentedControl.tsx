import { motion } from "motion/react";
import { transition } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: NoInfer<T>) => void;
  options: readonly { value: NoInfer<T>; label: string; count?: number }[];
  label: string;
  className?: string;
}

/** Filter as a segmented control (radiogroup). The selected pill slides between options. */
function SegmentedControl<T extends string>({ value, onChange, options, label, className }: SegmentedControlProps<T>) {
  const move = (dir: 1 | -1) => {
    const i = options.findIndex((o) => o.value === value);
    const next = options[(i + dir + options.length) % options.length];
    onChange(next.value);
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex max-w-full flex-wrap gap-1 rounded-md border border-border bg-card p-1", className)}
      onKeyDown={(e) => {
        // RTL: ArrowLeft moves forward in reading order
        if (e.key === "ArrowLeft") { e.preventDefault(); move(1); }
        if (e.key === "ArrowRight") { e.preventDefault(); move(-1); }
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative h-9 rounded-[6px] px-3 text-small font-hrsd-medium transition-colors duration-micro active:scale-[0.98]",
              active ? "text-primary-foreground" : "text-muted-foreground hover:text-ink"
            )}
          >
            {active && (
              <motion.span layoutId={`seg-${label}`} transition={transition.ui} className="absolute inset-0 rounded-[6px] bg-primary" />
            )}
            <span className="relative inline-flex items-center gap-1.5">
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
