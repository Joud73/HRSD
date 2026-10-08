import { toStatusKey, type StatusKey } from "@/lib/status";

/* ── Class recipes shared by every admin page (dialogs, tabs, danger actions) ── */

export const dialogUi = {
  content: "sm:max-w-lg",
  header: "text-start sm:text-start",
  title: "text-h3 font-hrsd-bold text-ink",
  description: "text-small text-muted-foreground",
  body: "flex flex-col gap-5 py-2",
  /** Primary first, at the start; cancel after it */
  footer: "gap-3 sm:justify-start sm:space-x-0",
  danger: "bg-danger text-danger-foreground hover:bg-danger/90 focus-visible:ring-danger",
} as const;

export const tabsUi = {
  list: "flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-border bg-transparent p-0 scrollbar-thin",
  trigger:
    "relative -mb-px h-12 shrink-0 rounded-none border-b-2 border-transparent bg-transparent px-4 text-small font-hrsd-medium text-muted-foreground transition-colors duration-micro hover:text-ink data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none focus-visible:ring-offset-0",
  content: "mt-6 flex flex-col gap-6 data-[state=active]:animate-in data-[state=active]:fade-in-0 motion-reduce:animate-none",
} as const;

/* ── Status mapping ── */

/** Labels produced by useAdminData that the shared mapper does not know yet. */
const ADMIN_LEGACY: Record<string, StatusKey> = {
  "مسودة": "in_progress",
  "تم التقديم": "submitted",
  "أعيد التقديم": "submitted",
  "يحتاج تعديل": "returned",
  "بانتظار الرد": "returned",
  "غير مُسندة": "not_started",
  resubmitted: "submitted",
  waiting_response: "returned",
};

/** Any assessment status (database code or Arabic label) onto the five product states. */
export const assessmentStatus = (raw: string | null | undefined): StatusKey =>
  (raw && ADMIN_LEGACY[raw]) || toStatusKey(raw);

/* ── Formatting ── */

