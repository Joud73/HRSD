import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { motion } from "motion/react";
import { assessmentCopy, orgCopy as t } from "@/lib/copy";
import { counted, formatNumber } from "@/lib/format";
import { ease } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { AssessmentProgress, IndicatorScore } from "@/services/assessmentService";
import CountUp from "@/components/shared/CountUp";
import { levelTone } from "@/components/assessment/indicatorUtils";

const RING = 44;

/** Progress ring: fills once to progress_pct. */
const Ring = ({ pct }: { pct: number }) => {
  const reduced = useReducedMotion();
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={RING} fill="none" strokeWidth="8" className="stroke-section-alt" />
        <motion.circle
          cx="50"
          cy="50"
          r={RING}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className="stroke-primary"
          initial={reduced ? false : { pathLength: 0 }}
          animate={{ pathLength: pct / 100 }}
          transition={reduced ? { duration: 0 } : { duration: 0.6, ease }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">
        <CountUp value={pct} suffix="%" className="tabular text-h3 font-hrsd-bold text-ink" />
      </span>
    </div>
  );
};

interface SummaryPanelProps {
  progress: AssessmentProgress;
  evidenceCount: number;
  level: { level: number; label: string };
  /** First indicator with items marked met but not counted (no evidence) */
  firstUncounted: IndicatorScore | undefined;
}

/** إنجاز التقييم and النتيجة التقديرية side by side, split by a rule (stacked on small screens). */
const SummaryPanel = ({ progress: p, evidenceCount, level, firstUncounted }: SummaryPanelProps) => {
  const uncounted = p.itemsMet - p.itemsCounted;
  const tone = levelTone(level.level);
  return (
    <section aria-label={t.summary_label} className="grid rounded-lg border border-border bg-card md:grid-cols-2">
      <div className="flex flex-col gap-4 p-5 md:p-6">
        <h2 className="text-h3 text-ink">{t.progress_title}</h2>
        <div className="flex items-center gap-5">
          <Ring pct={p.progressPct} />
          <div className="flex min-w-0 flex-col gap-2">
            <p className="tabular text-body font-hrsd-medium text-ink">
              {t.progress_items(formatNumber(p.itemsMet), counted(p.itemsTotal, assessmentCopy.items_forms))}
            </p>
            <p className="tabular text-small text-muted-foreground">
              {t.progress_indicators(formatNumber(p.indicatorsComplete), formatNumber(p.indicatorsTotal))}
              <span aria-hidden className="mx-2">
                ·
              </span>
              {t.progress_evidence(formatNumber(evidenceCount))}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-border p-5 md:border-s md:border-t-0 md:p-6">
        <h2 className="text-h3 text-ink">{t.result_title}</h2>
        <div className="flex flex-wrap items-center gap-3">
          <CountUp value={p.scorePct} suffix="%" className="tabular text-h2 font-hrsd-bold text-ink" />
          {level.label && <span className={`rounded-full px-3 py-1 text-small font-hrsd-medium ${tone.chip}`}>{level.label}</span>}
        </div>
        <p className="text-small text-muted-foreground">{t.result_note}</p>
        {uncounted > 0 && firstUncounted && (
          <Link
            to={`/assessment/${firstUncounted.trackNumber}?indicator=${firstUncounted.indicatorId}`}
            className="inline-flex items-center gap-1.5 self-start rounded-md text-small font-hrsd-medium text-warning-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <AlertTriangle aria-hidden className="h-4 w-4 shrink-0" />
            {t.result_warning(counted(uncounted, assessmentCopy.items_forms))}
          </Link>
        )}
      </div>
    </section>
  );
};

export default SummaryPanel;
