import { useState } from "react";
import {
  Building2, Users, ClipboardList, TrendingUp,
  FileSpreadsheet, FileText, Printer, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import KpiCard from "@/components/admin/KpiCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { useAdminDashboardStats } from "@/hooks/useAdminData";

const AdminDashboard = () => {
  const { toast } = useToast();
  const { data: stats, isLoading } = useAdminDashboardStats();

  const comingSoon = () =>
    toast({ title: "قريبًا", description: "سيتم توفير هذه الميزة لاحقًا" });

  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-[hsl(220,20%,97%)]">
      <AdminHeader />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto px-8 py-7 space-y-7">
          <div>
            <h1 className="text-xl font-hrsd-title text-foreground">لوحة التحكم</h1>
            <p className="text-sm font-hrsd text-muted-foreground mt-1">نظرة شاملة وفورية عن حالة المنصة</p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="flex items-center gap-0 rounded-[10px] border border-border overflow-hidden">
              <Button variant="ghost" size="sm" onClick={comingSoon} className="rounded-none border-e border-border gap-2 text-xs font-hrsd-medium px-4 h-9">
                تصدير Excel <FileSpreadsheet className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={comingSoon} className="rounded-none border-e border-border gap-2 text-xs font-hrsd-medium px-4 h-9">
                تصدير PDF <FileText className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={comingSoon} className="rounded-none gap-2 text-xs font-hrsd-medium px-4 h-9">
                طباعة <Printer className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <KpiCard title="إجمالي الجمعيات المسجلة" value={stats?.totalAssociations ?? 0} icon={<Building2 className="h-5 w-5" />} />
                <KpiCard title="عدد المقيمين" value={stats?.totalEvaluators ?? 0} icon={<Users className="h-5 w-5" />} />
                <KpiCard title="التقييمات الجارية" value={stats?.ongoingEvaluations ?? 0} icon={<ClipboardList className="h-5 w-5" />} />
                <KpiCard
                  title="نسبة الإنجاز العامة"
                  value={`${stats?.completionRate ?? 0}%`}
                  icon={<TrendingUp className="h-5 w-5" />}
                  highlight
                  showProgress
                  progressValue={stats?.completionRate ?? 0}
                />
              </div>

              {/* Status Distribution */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-sm font-hrsd-semibold text-foreground mb-4">حالة التقييمات</h3>
                {(stats?.statusCounts?.length ?? 0) > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {stats!.statusCounts.map((s) => (
                      <StatusBadge key={s.label} status={s.label} count={s.count} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-hrsd text-muted-foreground">لا توجد تقييمات حاليًا</p>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
