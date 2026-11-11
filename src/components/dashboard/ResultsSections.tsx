import { AlertCircle, ChevronDown, History } from "lucide-react";
import { assessmentCopy, orgCopy as t } from "@/lib/copy";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAssessmentHistory } from "@/hooks/useAssessment";
import type { LevelBand } from "@/services/toolService";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import { SkeletonPanel } from "@/components/shared/Skeletons";
import { assessmentStatusKey, levelTone } from "@/components/assessment/indicatorUtils";

const range = (b: LevelBand) => (b.minPct === b.maxPct ? `${formatNumber(b.minPct)}%` : assessmentCopy.result_range_span(formatNumber(b.minPct), formatNumber(b.maxPct)));

/** "كيف تُحتسب النتيجة؟": closed by default; three lines and the band table from level_bands and level_labels. */
export const HowCalculated = ({ bands, labels }: { bands: LevelBand[]; labels: Record<number, string> }) => (
  <Collapsible className="rounded-lg border border-border bg-card">
    <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 rounded-lg px-5 py-4 text-start text-body font-hrsd-bold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:px-6">
      {t.how_title}
      <ChevronDown aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-ui group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
    </CollapsibleTrigger>
    <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down motion-reduce:animate-none">
      <div className="flex flex-col gap-4 border-t border-border px-5 py-4 md:px-6">
        <ul className="flex list-disc flex-col gap-1.5 ps-5 text-small text-ink">
          {t.how_lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <table className="w-full max-w-md text-small">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th scope="col" className="py-2 text-start font-hrsd-medium">{t.how_range}</th>
              <th scope="col" className="py-2 text-start font-hrsd-medium">{t.how_level}</th>
            </tr>
          </thead>
          <tbody>
            {[...bands].sort((a, b) => a.minPct - b.minPct).map((b) => (
              <tr key={b.level} className="border-b border-border last:border-0">
                <td className="tabular py-2">{range(b)}</td>
                <td className={cn("py-2 font-hrsd-medium", levelTone(b.level).text)}>{labels[b.level] ?? b.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CollapsibleContent>
  </Collapsible>
);

/** النتائج حسب الدورة: cycle, status, overall result as a percentage only; until issued the result is tagged تقديرية. */
export const HistoryTable = () => {
  const { data, isLoading, isError, refetch } = useAssessmentHistory();
  return (
    <section aria-labelledby="history-title" className="rounded-lg border border-border bg-card">
      <h2 id="history-title" className="border-b border-border px-5 py-4 text-h3 text-ink md:px-6">
        {t.history_title}
      </h2>
      {isLoading ? (
        <SkeletonPanel lines={2} className="border-0" />
      ) : isError ? (
        <EmptyState icon={AlertCircle} message={t.load_error} action={{ label: t.retry, onClick: () => void refetch() }} className="py-10" />
      ) : !data || data.length === 0 ? (
        <EmptyState icon={History} message={t.history_empty} className="py-10" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-small">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th scope="col" className="px-5 py-3 text-start font-hrsd-medium md:px-6">{t.history_cycle}</th>
                <th scope="col" className="px-5 py-3 text-start font-hrsd-medium md:px-6">{t.history_status}</th>
                <th scope="col" className="px-5 py-3 text-start font-hrsd-medium md:px-6">{t.history_score}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                return (
                  <tr key={row.assessmentId} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 font-hrsd-medium text-ink md:px-6">{row.cycleName}</td>
                    <td className="px-5 py-3 md:px-6">
                      <StatusBadge status={assessmentStatusKey(row.status)} />
                    </td>
                    <td className="px-5 py-3 md:px-6">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="tabular font-hrsd-bold text-ink">{formatNumber(row.scorePct)}%</span>
                        {row.status !== "issued" && (
                          <span className="rounded-full bg-section-alt px-2.5 py-0.5 text-caption text-muted-foreground">{t.history_estimated}</span>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
