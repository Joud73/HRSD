import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight, Users, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import StatusBadge from "@/components/admin/StatusBadge";

/* ── Mock reviewers (mirrors main page) ── */
const reviewersMap: Record<string, { name: string; email: string; phone: string; status: string; assignedCount: number; avgDurationDays: number; avgScorePercent: number }> = {
  r1: { name: "أحمد محمد العتيبي", email: "ahmed@hrsd.gov.sa", phone: "0501234567", status: "نشط", assignedCount: 12, avgDurationDays: 5, avgScorePercent: 85 },
  r2: { name: "سارة علي القحطاني", email: "sara@hrsd.gov.sa", phone: "0559876543", status: "نشط", assignedCount: 9, avgDurationDays: 4, avgScorePercent: 91 },
  r3: { name: "خالد عمر الشهري", email: "khaled@hrsd.gov.sa", phone: "0541112233", status: "نشط", assignedCount: 7, avgDurationDays: 6, avgScorePercent: 78 },
  r4: { name: "نورة سعد المالكي", email: "noura@hrsd.gov.sa", phone: "0533344556", status: "موقوف", assignedCount: 3, avgDurationDays: 8, avgScorePercent: 65 },
  r5: { name: "فهد ناصر الدوسري", email: "fahad@hrsd.gov.sa", phone: "0567788990", status: "نشط", assignedCount: 15, avgDurationDays: 3, avgScorePercent: 92 },
};

const mockEvaluations = [
  { id: "e1", association: "جمعية البر الخيرية", year: 2026, track: "مساق التوجه", status: "قيد التقييم", completion: 60, assignedDate: "2026-01-15" },
  { id: "e2", association: "جمعية إنسان", year: 2026, track: "مساق الفريق", status: "تسليم كامل", completion: 100, assignedDate: "2026-01-12" },
  { id: "e3", association: "جمعية تكافل", year: 2026, track: "مساق التوجه", status: "تسليم جزئي", completion: 45, assignedDate: "2026-01-10" },
  { id: "e4", association: "مؤسسة العطاء", year: 2025, track: "مساق الفريق", status: "تسليم كامل", completion: 100, assignedDate: "2025-11-20" },
  { id: "e5", association: "جمعية رعاية", year: 2025, track: "مساق التوجه", status: "تسليم كامل", completion: 100, assignedDate: "2025-10-05" },
];

const AdminReviewerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const reviewer = reviewersMap[id || ""] ?? reviewersMap.r1;

  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-[hsl(220,20%,97%)]">
      <AdminHeader />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto px-8 py-7 space-y-7">
          {/* Back + Title */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/reviewers")} className="text-muted-foreground hover:text-primary">
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-hrsd-title text-foreground">أداء المقيم</h1>
              <p className="text-sm font-hrsd text-muted-foreground mt-0.5">{reviewer.name}</p>
            </div>
          </div>

          {/* Info Card */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-hrsd-semibold text-foreground mb-4">بيانات المقيم</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm font-hrsd">
              <div><span className="text-muted-foreground">الاسم:</span> <span className="font-hrsd-medium">{reviewer.name}</span></div>
              <div><span className="text-muted-foreground">البريد:</span> <span className="font-hrsd-medium">{reviewer.email}</span></div>
              <div><span className="text-muted-foreground">الجوال:</span> <span className="font-hrsd-medium">{reviewer.phone}</span></div>
              <div><span className="text-muted-foreground">الحالة:</span> <StatusBadge status={reviewer.status === "نشط" ? "مكتمل" : "لم تبدأ"} /></div>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="flex flex-wrap gap-4">
            {[
              { label: "عدد التقييمات", value: reviewer.assignedCount, icon: Users },
              { label: "متوسط مدة التقييم", value: `${reviewer.avgDurationDays} يوم`, icon: Clock },
              { label: "متوسط الدرجات", value: `${reviewer.avgScorePercent}%`, icon: TrendingUp },
            ].map((kpi) => (
              <div key={kpi.label} className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <kpi.icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-xs font-hrsd text-muted-foreground">{kpi.label}</p>
                  <p className="text-base font-hrsd-bold text-foreground">{kpi.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Evaluations Table */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-sm font-hrsd-semibold text-foreground">التقييمات المسندة</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  {["الجمعية", "السنة", "المساق", "الحالة", "نسبة الإنجاز", "تاريخ الإسناد"].map((h) => (
                    <TableHead key={h} className="text-start font-hrsd-medium text-xs">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockEvaluations.map((ev) => (
                  <TableRow key={ev.id} className="text-sm font-hrsd">
                    <TableCell className="font-hrsd-medium">{ev.association}</TableCell>
                    <TableCell>{ev.year}</TableCell>
                    <TableCell>{ev.track}</TableCell>
                    <TableCell><StatusBadge status={ev.status} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs w-10">{ev.completion}%</span>
                        <Progress value={ev.completion} className="h-1.5 w-20" />
                      </div>
                    </TableCell>
                    <TableCell>{ev.assignedDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminReviewerDetail;
