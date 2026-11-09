import { assessmentCopy as t } from "@/lib/copy";
import { counted } from "@/lib/format";
import type { StatusKey } from "@/lib/status";
import { daysUntil, type AssessmentProgress, type AssessmentStatus } from "@/services/assessmentService";

/** Ordinal prefixes in the tool text ("المؤشر الأول: …", "البند الثاني: …") are replaced by numbered labels in the UI. */
const PREFIX = /^(المعيار|المؤشر|البند)\s+[^\s:]+\s*:\s*/;

export const stripOrdinal = (text: string) => text.replace(PREFIX, "").trim();

/** Assessment status -> one of the product statuses. A draft with nothing marked yet has not started. */
export function assessmentStatusKey(status: AssessmentStatus | null | undefined, progress?: AssessmentProgress | null): StatusKey {
  switch (status) {
    case "draft":
      return progress && progress.itemsMet === 0 && progress.itemsWithEvidence === 0 ? "not_started" : "in_progress";
    case "submitted":
    case "under_review":
      return "submitted";
    case "returned":
      return "returned";
    case "approved":
      return "approved";
    case "issued":
      return "issued";
    default:
      return "not_started";
  }
}

/** Days left to the effective deadline, with a warning tone under 7 days and once it has passed. */
export function deadlineCountdown(deadline: string): { text: string; warning: boolean } {
  const days = daysUntil(deadline);
  if (days < 0) return { text: t.deadline_passed, warning: true };
  if (days === 0) return { text: t.deadline_today, warning: true };
  return { text: t.days_left(counted(days, t.days_forms)), warning: days < 7 };
}

/** Colour of a result level (0, 1, 2, 4). Styling only: the level itself comes from the scoring views. */
export const LEVEL_TONE: Record<number, { dot: string; text: string; square: string }> = {
  0: { dot: "bg-neutral", text: "text-ink", square: "border border-neutral bg-transparent" },
  1: { dot: "bg-danger", text: "text-danger", square: "bg-danger/15" },
  2: { dot: "bg-warning", text: "text-warning-ink", square: "bg-warning/20" },
  4: { dot: "bg-success", text: "text-success", square: "bg-success" },
};

export const levelTone = (level: number) => LEVEL_TONE[level] ?? LEVEL_TONE[0];

/** Journey step (1 to 5) from the assessment status: self-assessment, sent, review, approval, improvement plan. */
export function journeyStep(status: AssessmentStatus | undefined): number {
  switch (status) {
    case "submitted":
    case "under_review":
      return 3;
    case "approved":
      return 4;
    case "issued":
      return 5;
    default:
      return 1;
  }
}
