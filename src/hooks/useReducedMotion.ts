import { useReducedMotion as useMotionReducedMotion } from "motion/react";

/**
 * Single source for prefers-reduced-motion. When true: no transforms, no counters,
 * no auto-advance; state changes stay instant.
 */
export function useReducedMotion(): boolean {
  return useMotionReducedMotion() ?? false;
}
