import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, BadgeCheck, Building2, ClipboardCheck, Inbox, Undo2 } from "lucide-react";
import { copy, evaluatorCopy as t } from "@/lib/copy";
import { useMyReviews } from "@/hooks/useEvaluators";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import KpiCard from "@/components/shared/KpiCard";
import EmptyState from "@/components/shared/EmptyState";
import { SkeletonKpis, SkeletonPanel } from "@/components/shared/Skeletons";
import ReviewsTable from "@/components/evaluator/ReviewsTable";
import { sortReviews } from "@/components/evaluator/reviewUtils";

const RECENT_COUNT = 5;

/** Evaluator home: counts by review status and the latest assigned assessments (assessment_reviews only). */
const EvaluatorDashboard = () => {
  const { data: reviews, isLoading, isError, refetch } = useMyReviews();
  const rows = reviews ?? [];
  const count = (status: string) => rows.filter((r) => r.status === status).length;

  return (
    <>
      <PageHeader
        title={t.dashboard_title}
        description={t.dashboard_desc}
        breadcrumbs={[{ label: copy.shell_context.evaluator, to: "/evaluator" }, { label: t.dashboard_crumb }]}
        actions={
          rows.length > 0 ? (
            <Button asChild variant="outline">
              <Link to="/evaluator/assignments">
                {t.view_all}
                <ArrowLeft aria-hidden />
              </Link>
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="flex flex-col gap-8" aria-busy>
          <SkeletonKpis count={5} className="lg:grid-cols-5" />
          <SkeletonPanel lines={5} />
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-border bg-card">
          <EmptyState icon={AlertCircle} message={t.load_error} action={{ label: t.retry, onClick: () => void refetch() }} />
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard label={t.kpi_assigned} value={rows.length} icon={Building2} />
            <KpiCard label={t.kpi_waiting} value={count("submitted")} icon={Inbox} />
            <KpiCard label={t.kpi_in_review} value={count("under_review")} icon={ClipboardCheck} />
            <KpiCard label={t.kpi_returned} value={count("returned")} icon={Undo2} />
            <KpiCard label={t.kpi_approved} value={count("approved")} icon={BadgeCheck} />
          </div>

          <section aria-labelledby="recent-title" className="flex flex-col gap-4">
            <h2 id="recent-title" className="text-h3 text-ink">
              {t.recent_title}
            </h2>
            <ReviewsTable rows={sortReviews(rows).slice(0, RECENT_COUNT)} caption={t.recent_title} empty={<EmptyState message={t.empty_assignments} />} />
          </section>
        </div>
      )}
    </>
  );
};

export default EvaluatorDashboard;
