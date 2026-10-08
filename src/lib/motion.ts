import type { Transition, Variants } from "motion/react";

/** Shared motion tokens (brief principle 5). Every animated element uses these. */
export const duration = {
  micro: 0.15,
  ui: 0.24,
  reveal: 0.42,
} as const;

export const ease = [0.2, 0, 0, 1] as const;

export const stagger = 0.06;

/** Entrance rise, in px */
export const revealDistance = 12;

export const transition = {
  micro: { duration: duration.micro, ease },
  ui: { duration: duration.ui, ease },
  reveal: { duration: duration.reveal, ease },
} satisfies Record<string, Transition>;

/** Once-only viewport trigger for section reveals */
export const inViewOnce = { once: true, amount: 0.3 } as const;

/** Parent of a staggered reveal group */
export const revealGroup: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: stagger } },
};

/** Child of a reveal group: opacity plus a 12px rise */
export const revealItem: Variants = {
  hidden: { opacity: 0, y: revealDistance },
  visible: { opacity: 1, y: 0, transition: transition.reveal },
};

/** Press feedback for buttons and clickable surfaces */
export const press = { scale: 0.98 } as const;
