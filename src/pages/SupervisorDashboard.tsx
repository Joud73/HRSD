import { AlertCircle, BadgeCheck, Building2, CalendarDays, ClipboardList, FileCheck2, Users } from "lucide-react";
import { copy, supervisorCopy as t } from "@/lib/copy";
import { useReportSummary } from "@/hooks/useReports";
import PageHeader from "@/components/shared/PageHeader";
import KpiCard from "@/components/shared/KpiCard";
import EmptyState from "@/components/shared/EmptyState";
import { SkeletonKpis, SkeletonPanel } from "@/components/shared/Skeletons";
import { Panel } from "@/components/admin/AdminParts";
import StatusChart from "@/components/admin/StatusChart";

/** المشرف الفني: organizations, evaluators and open-cycle assessments by status. */
const SupervisorDashboard = () => {
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
      <PageHeader title={t.dashboard_title} description={t.dashboard_desc} breadcrumbs={[{ label: copy.shell_context.supervisor, to: "/supervisor" }, { label: t.dashboard_title }]} />

      <div className="flex flex-col gap-6">
        {isLoading ? (
          <>
            <SkeletonKpis count={5} className="lg:grid-cols-5" />
            <SkeletonPanel lines={6} />
          </>
        ) : isError || !data ? (
          <div className="rounded-lg border border-border bg-card">
            <EmptyState icon={AlertCircle} message={t.load_error} action={{ label: t.retry, onClick: () => void refetch() }} />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <KpiCard label={t.kpi_organizations} value={data.organizations} icon={Building2} />
              <KpiCard label={t.kpi_evaluators} value={data.evaluators} icon={Users} />
              <KpiCard label={t.kpi_assessments} value={data.cycle ? assessmentsTotal : null} icon={ClipboardList} />
              <KpiCard label={t.kpi_awaiting_issue} value={data.cycle ? data.assessmentsByStatus.approved : null} icon={BadgeCheck} />
              <KpiCard label={t.kpi_issued} value={data.cycle ? data.assessmentsByStatus.issued : null} icon={FileCheck2} />
            </div>

            <Panel title={t.status_title} description={data.cycle ? t.status_cycle(data.cycle.name) : undefined}>
              {data.cycle ? (
                <StatusChart statusCounts={statusCounts} />
              ) : (
                <EmptyState icon={CalendarDays} message={t.no_cycle} className="py-10" />
              )}
            </Panel>

            <div>
              <EmptyState icon={Building2} message={t.organizations_desc} action={{ label: t.open_organizations, to: "/supervisor/organizations" }} className="rounded-lg border border-border bg-card" />
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default SupervisorDashboard;
