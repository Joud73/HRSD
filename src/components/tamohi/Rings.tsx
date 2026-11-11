import { useEffect, useState } from "react";
import { animate, motion } from "motion/react";
import { ease, duration } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { trackUi } from "@/components/tamohi/tamohiUi";

/** 0 → 1 once on mount (data reveal); 1 at once under reduced motion. */
function useReveal(seconds = 1.1) {
  const reduced = useReducedMotion();
  const [p, setP] = useState(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) {
      setP(1);
      return;
    }
    const controls = animate(0, 1, { duration: seconds, ease, onUpdate: setP });
    return () => controls.stop();
  }, [reduced, seconds]);
  return p;
}

const R = 70;
const STROKE = 14;
const SIZE = (R + STROKE) * 2;
/** Gap between two arcs, as a fraction of the circle */
const GAP = 0.012;

export interface ReadinessArc {
  trackNumber: number;
  name: string;
  /** 0 to 100 */
  pct: number;
}

/**
 * The readiness map: five equal arcs, one per track, each filled to the track's review % in its colour,
 * the overall review % in the centre. Arcs run from the top in reading order (right to left).
 */
export const ReadinessRing = ({ arcs, overall, label, centerLabel }: { arcs: ReadinessArc[]; overall: number; label: string; centerLabel: string }) => {
  const p = useReveal();
  const share = 1 / Math.max(arcs.length, 1);
  const segment = share - GAP;
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[240px]">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={label} className="h-full w-full">
        {/* Start at 12 o'clock, then mirror so arcs run counter-clockwise (right to left) */}
        <g transform={`translate(${SIZE} 0) scale(-1 1) rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
          {arcs.map((arc, i) => {
            const ui = trackUi(arc.trackNumber);
            const start = i * share + GAP / 2;
            const filled = segment * Math.max(0, Math.min(arc.pct, 100)) / 100 * p;
            return (
              <g key={arc.trackNumber}>
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={R}
                  pathLength={1}
                  fill="none"
                  strokeWidth={STROKE}
                  className={ui.soft}
                  strokeDasharray={`${segment} ${1 - segment}`}
                  strokeDashoffset={-start}
                />
                {filled > 0 && (
                  <circle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={R}
                    pathLength={1}
                    fill="none"
                    strokeWidth={STROKE}
                    className={ui.stroke}
                    strokeDasharray={`${filled} ${1 - filled}`}
                    strokeDashoffset={-start}
                  />
                )}
              </g>
            );
          })}
        </g>
      </svg>
      <div aria-hidden className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular text-h1 font-hrsd-bold text-ink">{Math.round(overall * p)}%</span>
        <span className="text-caption text-muted-foreground">{centerLabel}</span>
      </div>
    </div>
  );
};

/** A small progress ring (enrolled program, path summary): value of total, in the primary colour. */
export const ProgressRing = ({
  done,
  total,
  size = 56,
  className,
  label,
}: {
  done: number;
  total: number;
  size?: number;
  className?: string;
  label: string;
}) => {
  const reduced = useReducedMotion();
  const r = 22;
  const value = total > 0 ? Math.min(done / total, 1) : 0;
  return (
    <svg viewBox="0 0 56 56" width={size} height={size} role="img" aria-label={label} className={cn("shrink-0", className)}>
      <circle cx={28} cy={28} r={r} fill="none" strokeWidth={6} className="stroke-primary/10" />
      <motion.circle
        cx={28}
        cy={28}
        r={r}
        fill="none"
        strokeWidth={6}
        strokeLinecap="round"
        className="stroke-primary"
        transform="translate(56 0) scale(-1 1) rotate(-90 28 28)"
        initial={false}
        animate={{ pathLength: value }}
        transition={reduced ? { duration: 0 } : { duration: duration.reveal, ease }}
        style={{ opacity: value > 0 ? 1 : 0 }}
      />
    </svg>
  );
};
