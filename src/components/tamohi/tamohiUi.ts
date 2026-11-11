import { tamohiCopy as t } from "@/lib/copy";
import { formatNumber } from "@/lib/format";
import type { Delivery, EnrollmentStatus, Priority } from "@/services/tamohiService";

/**
 * Track colours as literal class names (Tailwind only generates classes it can read in the source).
 * Meaning only: track dot, the program card's start edge, ring arcs and curriculum accents.
 */
export const TRACK_UI: Record<number, { dot: string; edge: string; hoverEdge: string; stroke: string; text: string; fill: string; soft: string }> = {
  1: { dot: "bg-track-1", edge: "border-s-track-1", hoverEdge: "hover:border-s-track-1", stroke: "stroke-track-1", text: "text-track-1", fill: "bg-track-1", soft: "stroke-track-1/15" },
  2: { dot: "bg-track-2", edge: "border-s-track-2", hoverEdge: "hover:border-s-track-2", stroke: "stroke-track-2", text: "text-track-2", fill: "bg-track-2", soft: "stroke-track-2/15" },
  3: { dot: "bg-track-3", edge: "border-s-track-3", hoverEdge: "hover:border-s-track-3", stroke: "stroke-track-3", text: "text-track-3", fill: "bg-track-3", soft: "stroke-track-3/15" },
  4: { dot: "bg-track-4", edge: "border-s-track-4", hoverEdge: "hover:border-s-track-4", stroke: "stroke-track-4", text: "text-track-4", fill: "bg-track-4", soft: "stroke-track-4/15" },
  5: { dot: "bg-track-5", edge: "border-s-track-5", hoverEdge: "hover:border-s-track-5", stroke: "stroke-track-5", text: "text-track-5", fill: "bg-track-5", soft: "stroke-track-5/15" },
};
export const trackUi = (n: number) => TRACK_UI[n] ?? TRACK_UI[1];

/** Review level chips, the same scale as the improvement plan's register. */
export const LEVEL_CHIP: Record<number, string> = {
  0: "bg-danger/10 text-danger",
  1: "bg-warning/15 text-warning-ink",
  2: "bg-accent/20 text-ink",
  4: "bg-success/10 text-success",
};

export const PRIORITY_CHIP: Record<Priority, string> = {
  high: "bg-warning/15 text-warning-ink",
  medium: "bg-neutral/10 text-ink/80",
};

export const ENROLLMENT_CHIP: Record<EnrollmentStatus, string> = {
  enrolled: "bg-primary/10 text-primary",
  in_progress: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
};

export const chipClass = "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-caption font-hrsd-medium";

/** Hours from minutes, one decimal only when it is not whole (e.g. 11.5). */
export const hours = (minutes: number) => {
  const h = Math.round((minutes / 60) * 10) / 10;
  return formatNumber(h);
};

export const deliveryLabel = (d: Delivery | null) => (d ? t.delivery[d] ?? d : "-");

export const pct = (done: number, total: number) => (total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0);

export const programPath = (code: string) => `/tamohi/programs/${code}`;
