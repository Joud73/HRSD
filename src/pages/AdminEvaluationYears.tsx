import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Eye, Pencil, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import StatusBadge from "@/components/admin/StatusBadge";

export interface EvaluationYear {
  id: string;
  yearNumber: number;
  submissionStart: string;
  submissionEnd: string;
  evaluationStart: string;
  evaluationEnd: string;
  updatedAt: string;
}

const seed: EvaluationYear[] = [
  {
    id: "1",
    yearNumber: 2024,
    submissionStart: "2024-01-15",
    submissionEnd: "2024-03-31",
    evaluationStart: "2024-04-01",
    evaluationEnd: "2024-06-30",
    updatedAt: "2024-06-30",
  },
  {
    id: "2",
    yearNumber: 2025,
    submissionStart: "2025-01-01",
    submissionEnd: "2025-04-30",
    evaluationStart: "2025-05-01",
    evaluationEnd: "2025-08-31",
    updatedAt: "2025-02-15",
  },
  {
    id: "3",
    yearNumber: 2026,
    submissionStart: "2026-06-01",
    submissionEnd: "2026-08-31",
    evaluationStart: "2026-09-01",
    evaluationEnd: "2026-12-31",
    updatedAt: "2026-01-10",
  },
];

export const getYearStatus = (y: EvaluationYear): string => {
  const today = new Date().toISOString().slice(0, 10);
  if (today < y.submissionStart) return "لم يبدأ بعد";
  if (today <= y.evaluationEnd) return "جاري";
  return "مكتمل";
};

const statusToBadge: Record<string, string> = {
  "لم يبدأ بعد": "لم تبدأ",
  "جاري": "قيد التقييم",
  "مكتمل": "مكتمل",
};

const formatDate = (d: string) => {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

const AdminEvaluationYears = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [years, setYears] = useState<EvaluationYear[]>(seed);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<EvaluationYear | null>(null);

  const filtered = useMemo(() => {
    return years.filter((y) => {
      const status = getYearStatus(y);
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (search && !String(y.yearNumber).includes(search)) return false;
      return true;
    });
  }, [years, search, statusFilter]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    setYears((prev) => prev.filter((y) => y.id !== deleteTarget.id));
    toast({ title: "تم حذف سنة التقييم" });
    setDeleteTarget(null);
  };

  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-[hsl(220,20%,97%)]">
      <AdminHeader />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto px-8 py-7 space-y-7">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-hrsd-title text-foreground">إدارة سنوات التقييم</h1>
              <p className="text-sm font-hrsd text-muted-foreground mt-1">تحديد فترات التقديم والتقييم لكل سنة</p>
            </div>
            <Button size="sm" className="gap-2" onClick={() => navigate("/admin/performance/evaluation-years/new")}>
              <Plus className="h-4 w-4" /> إضافة سنة تقييم
            </Button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative w-52">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="بحث بالسنة..." value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9 text-sm font-hrsd" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44 text-sm font-hrsd">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="لم يبدأ بعد">لم يبدأ بعد</SelectItem>
                <SelectItem value="جاري">جاري</SelectItem>
                <SelectItem value="مكتمل">مكتمل</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-10 text-center text-sm font-hrsd text-muted-foreground">
                لا توجد سنوات تقييم
                <br />
                <Button size="sm" variant="outline" className="mt-3" onClick={() => navigate("/admin/performance/evaluation-years/new")}>
                  إضافة سنة تقييم
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right font-hrsd-medium">السنة</TableHead>
                    <TableHead className="text-right font-hrsd-medium">فترة التقديم</TableHead>
                    <TableHead className="text-right font-hrsd-medium">فترة التقييم</TableHead>
                    <TableHead className="text-right font-hrsd-medium">الحالة</TableHead>
                    <TableHead className="text-right font-hrsd-medium">آخر تحديث</TableHead>
                    <TableHead className="text-right font-hrsd-medium">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((y) => {
                    const status = getYearStatus(y);
                    return (
                      <TableRow key={y.id}>
                        <TableCell className="font-hrsd-semibold text-sm">{y.yearNumber}</TableCell>
                        <TableCell className="text-sm font-hrsd text-muted-foreground">
                          {formatDate(y.submissionStart)} — {formatDate(y.submissionEnd)}
                        </TableCell>
                        <TableCell className="text-sm font-hrsd text-muted-foreground">
                          {formatDate(y.evaluationStart)} — {formatDate(y.evaluationEnd)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={statusToBadge[status] ?? status} />
                        </TableCell>
                        <TableCell className="text-sm font-hrsd text-muted-foreground">{formatDate(y.updatedAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" onClick={() => navigate(`/admin/performance/evaluation-years/${y.id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => navigate(`/admin/performance/evaluation-years/${y.id}`)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteTarget(y)}>
                              <CalendarDays className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Delete confirmation */}
          <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
            <DialogContent className="sm:max-w-sm" dir="rtl">
              <DialogHeader>
                <DialogTitle className="font-hrsd-semibold">حذف سنة التقييم</DialogTitle>
                <DialogDescription className="font-hrsd text-sm">
                  هل أنت متأكد من حذف سنة {deleteTarget?.yearNumber}؟ لا يمكن التراجع عن هذا الإجراء.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
                <Button variant="destructive" onClick={handleDelete}>حذف</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
};

export default AdminEvaluationYears;
