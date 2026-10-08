import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Counts from 0 to `target` once, the first time the returned ref enters the viewport.
 * Under reduced motion the final value shows immediately.
 */
export function useCountUp<T extends Element = HTMLSpanElement>(target: number, durationSec = 0.9) {
  const ref = useRef<T>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduced = useReducedMotion();
  const [value, setValue] = useState(reduced ? target : 0);

  useEffect(() => {
    if (reduced) {
      setValue(target);
      return;
    }
    if (!inView) return;
    const controls = animate(0, target, {
      duration: durationSec,
      ease: [0.2, 0, 0, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduced, target, durationSec]);

  return { ref, value };
}
