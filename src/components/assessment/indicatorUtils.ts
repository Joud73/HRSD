import { assessmentCopy as t } from "@/lib/copy";

export type ResultType = "pending" | "needs_minor" | "needs_major" | "complete" | "incomplete";

/** Indicator result label and the status dot that encodes it. */
export const RESULT: Record<ResultType, { label: string; dot: string; text: string }> = {
  pending: { label: t.result_pending, dot: "bg-neutral", text: "text-muted-foreground" },
  incomplete: { label: t.result_incomplete, dot: "bg-neutral", text: "text-ink" },
  needs_major: { label: t.result_needs_major, dot: "bg-danger", text: "text-danger" },
  needs_minor: { label: t.result_needs_minor, dot: "bg-warning", text: "text-warning-ink" },
  complete: { label: t.result_complete, dot: "bg-success", text: "text-success" },
};

/** Ordinal prefixes in the data ("المؤشر الأول: …", "البند الثاني: …") are replaced by numbered labels in the UI. */
const PREFIX = /^(المعيار|المؤشر|البند)\s+[^\s:]+\s*:\s*/;

export const stripOrdinal = (text: string) => text.replace(PREFIX, "").trim();

/** Checked state is scoped per indicator, because item ids repeat across indicators in the data. */
export const itemKey = (indicatorId: string, itemId: string) => `${indicatorId}::${itemId}`;
