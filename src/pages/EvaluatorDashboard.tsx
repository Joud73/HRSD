import {
  Building2,
  ClipboardList,
  TrendingUp,
  Clock,
  FileCheck,
  MessageSquare,
} from "lucide-react";
import EvaluatorLayout from "@/components/evaluator/EvaluatorLayout";
import KpiCard from "@/components/admin/KpiCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { useEvaluatorStats, statusLabelMap } from "@/hooks/useEvaluatorAssignments";

const EvaluatorDashboard = () => {
  const { stats, isLoading } = useEvaluatorStats();

  if (isLoading) {
    return (
      <EvaluatorLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </EvaluatorLayout>
    );
  }

  const statuses = [
    { label: "لم تبدأ", count: stats.notStarted },
    { label: "قيد التقييم", count: stats.inProgress },
    { label: "بانتظار رد الجمعية", count: stats.waitingResponse },
    { label: "مكتمل", count: stats.completed },
  ];

  return (
    <EvaluatorLayout>
      {/* Page title */}
      <div>
        <h1 className="text-xl font-hrsd-title text-foreground">لوحة تحكم المقيّم</h1>
        <p className="text-sm font-hrsd text-muted-foreground mt-1">
          ملخص التكليفات والتقييمات الخاصة بك
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="إجمالي الجمعيات المكلّفة"
          value={stats.total}
          icon={<Building2 className="h-5 w-5" />}
        />
        <KpiCard
          title="قيد التقييم"
          value={stats.inProgress}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <KpiCard
          title="بانتظار رد الجمعية"
          value={stats.waitingResponse}
          icon={<Clock className="h-5 w-5" />}
        />
        <KpiCard
          title="نسبة الإنجاز الشخصية"
          value={`${stats.completionRate}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          highlight
          showProgress
          progressValue={stats.completionRate}
        />
      </div>

      {/* Status Distribution */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-sm font-hrsd-semibold text-foreground mb-4">
          توزيع حالات التقييم
        </h3>
        <div className="flex flex-wrap gap-3">
          {statuses.map((s) => (
            <StatusBadge key={s.label} status={s.label} count={s.count} />
          ))}
        </div>
      </div>

      {/* Quick stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-full p-2.5 border border-border bg-muted/50 text-muted-foreground">
              <FileCheck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-hrsd-semibold text-foreground">شواهد جديدة</h3>
          </div>
          <p className="text-2xl font-hrsd-bold text-foreground">0</p>
          <p className="text-xs font-hrsd text-muted-foreground mt-1">
            لا توجد شواهد جديدة مرفوعة
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-full p-2.5 border border-border bg-muted/50 text-muted-foreground">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-hrsd-semibold text-foreground">ردود جديدة</h3>
          </div>
          <p className="text-2xl font-hrsd-bold text-foreground">0</p>
          <p className="text-xs font-hrsd text-muted-foreground mt-1">
            لا توجد ردود جديدة من الجمعيات
          </p>
        </div>
      </div>
    </EvaluatorLayout>
  );
};

export default EvaluatorDashboard;
