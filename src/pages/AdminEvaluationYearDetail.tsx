import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon, ArrowRight, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import StatusBadge from "@/components/admin/StatusBadge";
import type { EvaluationYear } from "./AdminEvaluationYears";
import { getYearStatus } from "./AdminEvaluationYears";

const seed: EvaluationYear[] = [
  { id: "1", yearNumber: 2024, submissionStart: "2024-01-15", submissionEnd: "2024-03-31", evaluationStart: "2024-04-01", evaluationEnd: "2024-06-30", updatedAt: "2024-06-30" },
  { id: "2", yearNumber: 2025, submissionStart: "2025-01-01", submissionEnd: "2025-04-30", evaluationStart: "2025-05-01", evaluationEnd: "2025-08-31", updatedAt: "2025-02-15" },
  { id: "3", yearNumber: 2026, submissionStart: "2026-06-01", submissionEnd: "2026-08-31", evaluationStart: "2026-09-01", evaluationEnd: "2026-12-31", updatedAt: "2026-01-10" },
];

const statusToBadge: Record<string, string> = {
  "لم يبدأ بعد": "لم تبدأ",
  "جاري": "قيد التقييم",
  "مكتمل": "مكتمل",
};

const toDate = (s: string) => new Date(s + "T00:00:00");
const toStr = (d: Date) => d.toISOString().slice(0, 10);

const AdminEvaluationYearDetail = () => {
  const { yearId } = useParams<{ yearId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = yearId === "new";

  const existing = !isNew ? seed.find((y) => y.id === yearId) : null;

  const [yearNumber, setYearNumber] = useState(existing?.yearNumber ?? new Date().getFullYear());
  const [submissionStart, setSubmissionStart] = useState<Date | undefined>(existing ? toDate(existing.submissionStart) : undefined);
  const [submissionEnd, setSubmissionEnd] = useState<Date | undefined>(existing ? toDate(existing.submissionEnd) : undefined);
  const [evaluationStart, setEvaluationStart] = useState<Date | undefined>(existing ? toDate(existing.evaluationStart) : undefined);
  const [evaluationEnd, setEvaluationEnd] = useState<Date | undefined>(existing ? toDate(existing.evaluationEnd) : undefined);
  const [errors, setErrors] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const currentYear: EvaluationYear | null = submissionStart && submissionEnd && evaluationStart && evaluationEnd
    ? { id: yearId ?? "new", yearNumber, submissionStart: toStr(submissionStart), submissionEnd: toStr(submissionEnd), evaluationStart: toStr(evaluationStart), evaluationEnd: toStr(evaluationEnd), updatedAt: new Date().toISOString().slice(0, 10) }
    : null;
  const status = currentYear ? getYearStatus(currentYear) : null;

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!submissionStart) errs.push("بداية التقديم مطلوبة");
    if (!submissionEnd) errs.push("نهاية التقديم مطلوبة");
    if (!evaluationStart) errs.push("بداية التقييم مطلوبة");
    if (!evaluationEnd) errs.push("نهاية التقييم مطلوبة");
    if (submissionStart && submissionEnd && submissionEnd < submissionStart) errs.push("نهاية التقديم يجب أن تكون بعد بدايته");
    if (evaluationStart && evaluationEnd && evaluationEnd < evaluationStart) errs.push("نهاية التقييم يجب أن تكون بعد بدايته");
    if (evaluationStart && submissionStart && evaluationStart < submissionStart) errs.push("بداية التقييم يجب أن تكون بعد بداية التقديم");
    return errs;
  };

  const save = () => {
    const errs = validate();
    setErrors(errs);
    if (errs.length > 0) return;
    toast({ title: isNew ? "تمت إضافة سنة التقييم" : "تم حفظ التعديلات" });
    navigate("/admin/performance/evaluation-years");
  };

  const handleDelete = () => {
    toast({ title: "تم حذف سنة التقييم" });
    navigate("/admin/performance/evaluation-years");
  };

  const DateField = ({ label, value, onChange }: { label: string; value?: Date; onChange: (d?: Date) => void }) => (
    <div className="space-y-1.5">
      <label className="block text-sm font-hrsd-medium">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full justify-start text-sm font-hrsd", !value && "text-muted-foreground")}>
            <CalendarIcon className="h-4 w-4 ms-2" />
            {value ? format(value, "yyyy/MM/dd") : "اختر تاريخ"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={value} onSelect={(d) => onChange(d ?? undefined)} initialFocus className={cn("p-3 pointer-events-auto")} />
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-[hsl(220,20%,97%)]">
      <AdminHeader />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto px-8 py-7 space-y-6">
          {/* Back + Title */}
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" onClick={() => navigate("/admin/performance/evaluation-years")}>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-hrsd-title text-foreground">
                {isNew ? "إضافة سنة تقييم" : `سنة التقييم ${existing?.yearNumber ?? ""}`}
              </h1>
            </div>
          </div>

          {/* Info card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-hrsd-semibold">معلومات السنة</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <div className="space-y-1.5 w-40">
                <label className="block text-sm font-hrsd-medium">السنة</label>
                <Input type="number" value={yearNumber} onChange={(e) => setYearNumber(Number(e.target.value))} className="font-hrsd" disabled={!isNew} />
              </div>
              {status && (
                <div className="space-y-1.5">
                  <label className="block text-sm font-hrsd-medium">الحالة</label>
                  <StatusBadge status={statusToBadge[status] ?? status} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dates card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-hrsd-semibold">إعدادات الفترات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <DateField label="بداية التقديم" value={submissionStart} onChange={setSubmissionStart} />
                <DateField label="نهاية التقديم" value={submissionEnd} onChange={setSubmissionEnd} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <DateField label="بداية التقييم" value={evaluationStart} onChange={setEvaluationStart} />
                <DateField label="نهاية التقييم" value={evaluationEnd} onChange={setEvaluationEnd} />
              </div>
              {errors.length > 0 && (
                <div className="rounded-lg bg-destructive/10 p-3 space-y-1">
                  {errors.map((e, i) => (
                    <p key={i} className="text-xs font-hrsd text-destructive">{e}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button className="gap-2" onClick={save}>
              <Save className="h-4 w-4" /> حفظ
            </Button>
            {!isNew && (
              <Button variant="destructive" className="gap-2" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" /> حذف السنة
              </Button>
            )}
          </div>

          {/* Delete modal */}
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent className="sm:max-w-sm" dir="rtl">
              <DialogHeader>
                <DialogTitle className="font-hrsd-semibold">حذف سنة التقييم</DialogTitle>
                <DialogDescription className="font-hrsd text-sm">
                  هل أنت متأكد من حذف سنة {yearNumber}؟ لا يمكن التراجع عن هذا الإجراء.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>إلغاء</Button>
                <Button variant="destructive" onClick={handleDelete}>حذف</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
};

export default AdminEvaluationYearDetail;
