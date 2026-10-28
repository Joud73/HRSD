import { copy } from "@/lib/copy";

/**
 * Statuses the product shows. Organizations see five (under review reads as submitted, brief phase 6.5);
 * the evaluator also sees قيد المراجعة, through reviewStatusKey().
 */
export type StatusKey = "not_started" | "in_progress" | "submitted" | "under_review" | "returned" | "approved";

export const STATUS: Record<StatusKey, { label: string; className: string; dot: string }> = {
  not_started: { label: copy.status_not_started, className: "bg-neutral/10 text-ink/80", dot: "bg-neutral" },
  in_progress: { label: copy.status_in_progress, className: "bg-warning/10 text-warning-ink", dot: "bg-warning" },
  submitted: { label: copy.status_submitted, className: "bg-primary/10 text-primary", dot: "bg-primary" },
  under_review: { label: copy.status_under_review, className: "bg-accent/15 text-ink", dot: "bg-accent" },
  returned: { label: copy.status_returned, className: "bg-danger/10 text-danger", dot: "bg-danger" },
  approved: { label: copy.status_approved, className: "bg-success/10 text-success", dot: "bg-success" },
};

/**
 * Maps every legacy status value (Arabic labels and database codes) onto the five states.
 * Unknown values fall back to not_started.
 */
const LEGACY: Record<string, StatusKey> = {
  // Arabic labels used across the prototype
  "لم يبدأ": "not_started",
  "لم تبدأ": "not_started",
  "قيد التقييم": "in_progress",
  "قيد التنفيذ": "in_progress",
  "تسليم جزئي": "in_progress",
  "قيد المراجعة": "submitted",
  "تسليم كامل": "submitted",
  "مرسل للمراجعة": "submitted",
  "بانتظار رد الجمعية": "returned",
  "معاد للاستكمال": "returned",
  "مسودة": "in_progress",
  "تم التقديم": "submitted",
  "أعيد التقديم": "submitted",
  "يحتاج تعديل": "returned",
  "بانتظار الرد": "returned",
  "غير مُسندة": "not_started",
  "غير مسندة": "not_started",
  "مكتمل": "approved",
  "معتمد": "approved",
  // Database codes
  not_started: "not_started",
  pending: "not_started",
  draft: "in_progress",
  in_progress: "in_progress",
  partial: "in_progress",
  submitted: "submitted",
  under_review: "submitted",
  completed: "approved",
  complete: "approved",
  approved: "approved",
  returned: "returned",
  resubmitted: "submitted",
  waiting_response: "returned",
  needs_revision: "returned",
  rejected: "returned",
};

export function toStatusKey(raw: string | null | undefined): StatusKey {
  if (!raw) return "not_started";
  return LEGACY[raw] ?? LEGACY[raw.toLowerCase()] ?? "not_started";
}


/** Evaluator view: an assessment's database status, with under_review kept apart from submitted. */
export function reviewStatusKey(status: string): StatusKey {
  return status === "under_review" ? "under_review" : toStatusKey(status);
}
