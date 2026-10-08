import { copy } from "@/lib/copy";

/** The only five statuses the product shows (brief phase 6.5). */
export type StatusKey = "not_started" | "in_progress" | "submitted" | "returned" | "approved";

export const STATUS: Record<StatusKey, { label: string; className: string; dot: string }> = {
  not_started: { label: copy.status_not_started, className: "bg-neutral/10 text-ink/80", dot: "bg-neutral" },
  in_progress: { label: copy.status_in_progress, className: "bg-warning/10 text-warning-ink", dot: "bg-warning" },
  submitted: { label: copy.status_submitted, className: "bg-primary/10 text-primary", dot: "bg-primary" },
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

