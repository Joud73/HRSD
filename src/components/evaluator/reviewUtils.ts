import type { ReviewRow } from "@/services/evaluatorService";

/**
 * The queue first: submitted assessments, oldest submission first; then the rest in their given order
 * (newest assignment first). Stable, so equal rows keep the list's order.
 */
export function sortReviews(rows: ReviewRow[]): ReviewRow[] {
  const waiting = rows
    .filter((r) => r.status === "submitted")
    .sort((a, b) => (a.submittedAt ?? "").localeCompare(b.submittedAt ?? ""));
  return [...waiting, ...rows.filter((r) => r.status !== "submitted")];
}
