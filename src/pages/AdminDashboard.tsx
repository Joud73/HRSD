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
import { useAdminAssociations, useAdminDashboardStats } from "@/hooks/useAdminData";

const AdminDashboard = () => {
  const { data: stats, isLoading } = useAdminDashboardStats();
  const { data: associations, isLoading: associationsLoading } = useAdminAssociations();

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
            <KpiCard label={adminCopy.kpi_associations} value={stats?.totalAssociations} icon={Building2} />
            <KpiCard label={adminCopy.kpi_evaluators} value={stats?.totalEvaluators} icon={Users} />
            <KpiCard label={adminCopy.kpi_ongoing} value={stats?.ongoingEvaluations} icon={ClipboardList} />
            <KpiCard
              label={adminCopy.kpi_completion}
              value={stats?.completionRate}
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
              <StatusChart statusCounts={stats?.statusCounts ?? []} />
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
            <RecentEvaluations rows={associations} loading={associationsLoading} />
          </Panel>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
