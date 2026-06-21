import { useNavigate } from "react-router-dom";
import { Building2, ListTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

const tiles = [
  {
    title: "تعريف الكيانات الأهلية",
    desc: "تعريف أنواع الكيانات المستخدمة في التقييم",
    icon: Building2,
    path: "/admin/performance/evaluation-setup/entities",
  },
  {
    title: "تهيئة نموذج التقييم",
    desc: "إدارة المساقات والمعايير والمؤشرات والبنود",
    icon: ListTree,
    path: "/admin/performance/evaluation-setup/rubric",
  },
];

const AdminEvaluationSetup = () => {
  const navigate = useNavigate();

  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-[hsl(220,20%,97%)]">
      <AdminHeader />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto px-8 py-7 space-y-7">
          <div>
            <h1 className="text-xl font-hrsd-title text-foreground">تهيئة التقييم</h1>
            <p className="text-sm font-hrsd text-muted-foreground mt-1">
              إعداد وتهيئة عناصر التقييم الأساسية
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {tiles.map((t) => (
              <div
                key={t.path}
                className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <t.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-base font-hrsd-semibold text-foreground">{t.title}</h2>
                </div>
                <p className="text-sm font-hrsd text-muted-foreground">{t.desc}</p>
                <Button size="sm" className="self-start" onClick={() => navigate(t.path)}>
                  فتح
                </Button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminEvaluationSetup;
