import { Link } from "react-router-dom";
import { Building2, ChevronLeft, ClipboardList, TrendingUp, Users } from "lucide-react";
import { copy, adminCopy } from "@/lib/copy";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import KpiCard from "@/components/shared/KpiCard";
import { SkeletonKpis, SkeletonPanel } from "@/components/shared/Skeletons";
import { Panel } from "@/components/admin/AdminParts";
import ExportMenu from "@/components/admin/ExportMenu";
import StatusChart from "@/components/admin/StatusChart";
import RecentEvaluations from "@/components/admin/RecentEvaluations";
import { useReportSummary } from "@/hooks/useReports";
import { useOrganizations } from "@/hooks/useOrganizations";

/** Admin home on the real data: organizations, evaluators and open-cycle assessments (assessments, assessment_reviews). */
const AdminDashboard = () => {
  const { data: summary, isLoading } = useReportSummary();
  const { data: organizations, isLoading: organizationsLoading } = useOrganizations();

  const byStatus = summary?.assessmentsByStatus;
  const total = byStatus ? Object.values(byStatus).reduce((n, c) => n + c, 0) : 0;
  const ongoing = byStatus ? byStatus.draft + byStatus.submitted + byStatus.under_review + byStatus.returned : undefined;
  const completion = byStatus && total > 0 ? Math.round((byStatus.approved / total) * 100) : summary ? 0 : undefined;
  const statusCounts = summary
    ? [
        { label: "not_started", count: summary.notStarted },
        ...Object.entries(summary.assessmentsByStatus).map(([label, count]) => ({ label, count })),
      ]
    : [];

  return (
    <>
      <PageHeader
        title={copy.nav_admin.dashboard}
        description={adminCopy.dashboard_desc}
        breadcrumbs={[{ label: adminCopy.breadcrumb_root }]}
        actions={<ExportMenu />}
      />

      <div className="flex flex-col gap-6">
        {isLoading ? (
          <SkeletonKpis />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label={adminCopy.kpi_associations} value={summary?.organizations} icon={Building2} />
            <KpiCard label={adminCopy.kpi_evaluators} value={summary?.evaluators} icon={Users} />
            <KpiCard label={adminCopy.kpi_ongoing} value={ongoing} icon={ClipboardList} />
            <KpiCard
              label={adminCopy.kpi_completion}
              value={completion}
              suffix="%"
              icon={TrendingUp}
              hint={adminCopy.kpi_completion_hint}
            />
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-5">
          {isLoading ? (
            <SkeletonPanel lines={6} className="xl:col-span-2" />
          ) : (
            <Panel title={adminCopy.chart_title} description={adminCopy.chart_desc} className="xl:col-span-2">
              <StatusChart statusCounts={statusCounts} />
            </Panel>
          )}

          <Panel
            title={adminCopy.recent_title}
            className="min-w-0 xl:col-span-3"
            bodyClassName="p-0"
            aside={
              <Button asChild variant="ghost" size="sm" className="text-primary">
                <Link to="/admin/associations">
                  {adminCopy.recent_view_all}
                  <ChevronLeft aria-hidden />
                </Link>
              </Button>
            }
          >
            <RecentEvaluations rows={organizations} loading={organizationsLoading} />
          </Panel>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
