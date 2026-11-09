import { AlertCircle, BarChart3, Building2, CalendarDays, ClipboardList, Download, Users } from "lucide-react";
import { adminSetupCopy as t } from "@/lib/copy";
import { useReportSummary } from "@/hooks/useReports";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import PageHeader from "@/components/shared/PageHeader";
import KpiCard from "@/components/shared/KpiCard";
import EmptyState from "@/components/shared/EmptyState";
import { SkeletonKpis, SkeletonPanel } from "@/components/shared/Skeletons";
import { Panel } from "@/components/admin/AdminParts";
import StatusChart from "@/components/admin/StatusChart";
import { crumbs } from "@/components/admin/setup/crumbs";

/** Export stays visible but disabled until results exist; the tooltip says when it arrives. */
const ExportSoon = () => (
  <Tooltip>
    <TooltipTrigger asChild>
      {/* A disabled button fires no pointer events, so the wrapper carries focus and hover */}
      <span tabIndex={0} className="inline-flex rounded-md focus-ring">
        <Button variant="outline" disabled aria-describedby="reports-export-soon" className="pointer-events-none">
          <Download aria-hidden /> {t.reports_export}
        </Button>
      </span>
    </TooltipTrigger>
    <TooltipContent id="reports-export-soon" side="bottom">
      {t.reports_export_soon}
    </TooltipContent>
  </Tooltip>
);

/** Only what the database answers today: organizations, evaluators, open-cycle assessments by status. */
const AdminReports = () => {
  const { data, isLoading, isError, refetch } = useReportSummary();

  const assessmentsTotal = data ? Object.values(data.assessmentsByStatus).reduce((n, c) => n + c, 0) : null;
  const statusCounts = data
    ? [
        { label: "not_started", count: data.notStarted },
        ...Object.entries(data.assessmentsByStatus).map(([label, count]) => ({ label, count })),
      ]
    : [];

  return (
    <>
      <PageHeader title={crumbs.reports[2].label} description={t.reports_desc} breadcrumbs={crumbs.reports} actions={<ExportSoon />} />

      <div className="flex flex-col gap-6">
        {isLoading ? (
          <>
            <SkeletonKpis count={3} className="lg:grid-cols-3" />
            <SkeletonPanel lines={6} />
          </>
        ) : isError || !data ? (
          <div className="rounded-lg border border-border bg-card">
            <EmptyState icon={AlertCircle} message={t.reports_load_error} action={{ label: t.retry, onClick: () => void refetch() }} />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <KpiCard label={t.reports_kpi_organizations} value={data.organizations} icon={Building2} />
              <KpiCard label={t.reports_kpi_evaluators} value={data.evaluators} icon={Users} />
              <KpiCard label={t.reports_kpi_assessments} value={data.cycle ? assessmentsTotal : null} icon={ClipboardList} />
            </div>

            <Panel title={t.reports_status_title} description={data.cycle ? t.reports_status_cycle(data.cycle.name) : undefined}>
              {data.cycle ? (
                <StatusChart statusCounts={statusCounts} />
              ) : (
                <EmptyState icon={CalendarDays} message={t.reports_no_cycle} className="py-10" />
              )}
            </Panel>
          </>
        )}

        <div className="rounded-lg border border-border bg-card">
          <EmptyState icon={BarChart3} message={t.reports_phase5} />
        </div>
      </div>
    </>
  );
};

export default AdminReports;
