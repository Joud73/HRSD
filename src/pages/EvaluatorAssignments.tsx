import { useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { copy, evaluatorCopy as t } from "@/lib/copy";
import { STATUS, reviewStatusKey, type StatusKey } from "@/lib/status";
import { useMyReviews } from "@/hooks/useEvaluators";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import SegmentedControl from "@/components/shared/SegmentedControl";
import ReviewsTable from "@/components/evaluator/ReviewsTable";

/** Review statuses in workflow order (a draft never reaches the evaluator's list in practice, but is shown if assigned early) */
const ORDER: StatusKey[] = ["in_progress", "submitted", "under_review", "returned", "approved", "issued"];
type Filter = "all" | StatusKey;

const EvaluatorAssignments = () => {
  const { data: reviews, isLoading, isError, refetch } = useMyReviews();
  const [filter, setFilter] = useState<Filter>("all");
  const rows = useMemo(() => reviews ?? [], [reviews]);
  const filtered = useMemo(() => rows.filter((r) => filter === "all" || reviewStatusKey(r.status) === filter), [rows, filter]);

  const options = [
    { value: "all" as Filter, label: copy.filter_all, count: rows.length },
    ...ORDER.map((k) => ({ value: k as Filter, label: STATUS[k].label, count: rows.filter((r) => reviewStatusKey(r.status) === k).length })),
  ];

  return (
    <>
      <PageHeader
        title={t.assignments_title}
        description={t.assignments_desc}
        breadcrumbs={[{ label: copy.shell_context.evaluator, to: "/evaluator" }, { label: t.assignments_title }]}
      />

      {isError ? (
        <div className="rounded-lg border border-border bg-card">
          <EmptyState icon={AlertCircle} message={t.load_error} action={{ label: t.retry, onClick: () => void refetch() }} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <SegmentedControl<Filter> label={t.filter_status_label} value={filter} onChange={setFilter} options={options} />
          <ReviewsTable
            rows={filtered}
            loading={isLoading}
            caption={t.assignments_title}
            empty={
              rows.length > 0 ? (
                <EmptyState message={t.empty_filtered} action={{ label: t.clear_filter, onClick: () => setFilter("all") }} />
              ) : (
                <EmptyState message={t.empty_assignments} action={{ label: copy.nav_evaluator.dashboard, to: "/evaluator" }} />
              )
            }
          />
        </div>
      )}
    </>
  );
};

export default EvaluatorAssignments;
