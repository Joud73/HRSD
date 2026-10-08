/** Evaluation years: shared type, mock seed and period state (used by the list and detail pages). */
export interface EvaluationYear {
  id: string;
  yearNumber: number;
  submissionStart: string;
  submissionEnd: string;
  evaluationStart: string;
  evaluationEnd: string;
  updatedAt: string;
}

export const yearSeed: EvaluationYear[] = [
  { id: "1", yearNumber: 2024, submissionStart: "2024-01-15", submissionEnd: "2024-03-31", evaluationStart: "2024-04-01", evaluationEnd: "2024-06-30", updatedAt: "2024-06-30" },
  { id: "2", yearNumber: 2025, submissionStart: "2025-01-01", submissionEnd: "2025-04-30", evaluationStart: "2025-05-01", evaluationEnd: "2025-08-31", updatedAt: "2025-02-15" },
  { id: "3", yearNumber: 2026, submissionStart: "2026-06-01", submissionEnd: "2026-08-31", evaluationStart: "2026-09-01", evaluationEnd: "2026-12-31", updatedAt: "2026-01-10" },
];

/** A year's period state. Not an assessment status, so it is shown as plain text, not a StatusBadge. */
export type YearState = "upcoming" | "open" | "closed";

export const getYearState = (y: EvaluationYear): YearState => {
  const today = new Date().toISOString().slice(0, 10);
  if (today < y.submissionStart) return "upcoming";
  if (today <= y.evaluationEnd) return "open";
  return "closed";
};
