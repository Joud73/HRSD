import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, ClipboardList, PieChart, Undo2 } from "lucide-react";
import { motion } from "motion/react";
import { copy, evaluatorCopy as t } from "@/lib/copy";
import { formatDate } from "@/lib/format";
import { STATUS, toStatusKey, type StatusKey } from "@/lib/status";
import { revealGroup, revealItem, inViewOnce } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import KpiCard from "@/components/shared/KpiCard";
import StatusBadge from "@/components/shared/StatusBadge";
import DataTable, { type Column } from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import { SkeletonKpis, SkeletonPanel } from "@/components/shared/Skeletons";
import { useEvaluatorAssignments, type AssignmentRow } from "@/hooks/useEvaluatorAssignments";

/** Assignment codes that src/lib/status.ts does not know yet */
const statusOf = (raw: string) => toStatusKey(raw);

const STATUS_KEYS = Object.keys(STATUS) as StatusKey[];
const RECENT_COUNT = 5;

const columns: Column<AssignmentRow>[] = [
  {
    key: "association",
    header: t.col_association,
    cell: (r) => <span className="font-hrsd-medium">{r.association_name || t.unknown_association}</span>,
  },
  { key: "year", header: t.col_year, cell: (r) => <span className="tabular">{r.year ?? "—"}</span> },
  { key: "status", header: t.col_status, cell: (r) => <StatusBadge status={statusOf(r.status)} /> },
  { key: "updated", header: t.col_updated, cell: (r) => <span className="text-muted-foreground">{formatDate(r.updated_at)}</span> },
];

const EvaluatorDashboard = () => {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const { data: assignments, isLoading } = useEvaluatorAssignments();

  const counts = useMemo(() => {
    const c = Object.fromEntries(STATUS_KEYS.map((k) => [k, 0])) as Record<StatusKey, number>;
    for (const a of assignments ?? []) c[statusOf(a.status)] += 1;
    return c;
  }, [assignments]);

  const total = assignments?.length ?? 0;
  const completion = total > 0 ? Math.round((counts.approved / total) * 100) : null;
  const recent = (assignments ?? []).slice(0, RECENT_COUNT);

  const header = (
    <PageHeader
      title={t.dashboard_title}
      description={t.dashboard_desc}
      breadcrumbs={[{ label: copy.shell_context.evaluator, to: "/evaluator" }, { label: t.dashboard_crumb }]}
      actions={
        total > 0 ? (
          <Button asChild variant="outline">
            <Link to="/evaluator/assignments">
              {t.view_all}
              <ArrowLeft aria-hidden />
            </Link>
          </Button>
        ) : undefined
      }
    />
  );

  if (isLoading) {
    return (
      <>
        {header}
        <div className="flex flex-col gap-8" aria-busy>
          <SkeletonKpis />
          <SkeletonPanel lines={5} />
        </div>
      </>
    );
  }

  return (
    <>
      {header}
      <motion.div
        variants={revealGroup}
        initial={reduced ? false : "hidden"}
        whileInView="visible"
        viewport={inViewOnce}
        className="flex flex-col gap-8"
      >
        <motion.div variants={revealItem} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label={t.kpi_total} value={total} icon={Building2} />
          <KpiCard label={STATUS.submitted.label} value={counts.submitted} icon={ClipboardList} />
          <KpiCard label={t.kpi_returned} value={counts.returned} icon={Undo2} />
          <KpiCard label={t.kpi_completion} value={completion} suffix="%" icon={PieChart} hint={t.kpi_completion_hint} />
        </motion.div>

        <motion.section variants={revealItem} aria-labelledby="distribution-title" className="rounded-lg border border-border bg-card p-5">
          <h2 id="distribution-title" className="text-h3 text-ink">
            {t.distribution_title}
          </h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            {STATUS_KEYS.map((k) => (
              <li key={k}>
                <StatusBadge status={k} count={counts[k]} />
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.section variants={revealItem} aria-labelledby="recent-title" className="flex flex-col gap-4">
          <h2 id="recent-title" className="text-h3 text-ink">
            {t.recent_title}
          </h2>
          <DataTable
            columns={columns}
            rows={recent}
            getRowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/evaluator/assignment/${r.id}`)}
            rowLabel={(r) => `${t.open_assignment} ${r.association_name || t.unknown_association}`}
            caption={t.recent_title}
            empty={<EmptyState message={t.empty_assignments} action={{ label: t.view_all, to: "/evaluator/assignments" }} />}
          />
        </motion.section>
      </motion.div>
    </>
  );
};

export default EvaluatorDashboard;
