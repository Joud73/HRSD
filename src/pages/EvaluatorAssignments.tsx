import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import EvaluatorLayout from "@/components/evaluator/EvaluatorLayout";
import StatusBadge from "@/components/admin/StatusBadge";
import {
  useEvaluatorAssignments,
  statusLabelMap,
} from "@/hooks/useEvaluatorAssignments";

const statusFilterOptions = [
  { value: "all", label: "الكل" },
  { value: "not_started", label: "لم تبدأ" },
  { value: "draft", label: "مسودة" },
  { value: "submitted", label: "تم التقديم" },
  { value: "under_review", label: "قيد المراجعة" },
  { value: "needs_revision", label: "يحتاج تعديل" },
  { value: "resubmitted", label: "أعيد التقديم" },
  { value: "approved", label: "معتمد" },
  { value: "completed", label: "مكتمل" },
];

const EvaluatorAssignments = () => {
  const navigate = useNavigate();
  const { data: assignments, isLoading } = useEvaluatorAssignments();
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  const years = useMemo(() => {
    if (!assignments) return [];
    const set = new Set(assignments.map((a) => a.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [assignments]);

  const filtered = useMemo(() => {
    if (!assignments) return [];
    return assignments.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (yearFilter !== "all" && a.year !== Number(yearFilter)) return false;
      return true;
    });
  }, [assignments, statusFilter, yearFilter]);

  return (
    <EvaluatorLayout>
      <div>
        <h1 className="text-xl font-hrsd-title text-foreground">الجمعيات المكلّفة</h1>
        <p className="text-sm font-hrsd text-muted-foreground mt-1">
          قائمة الجمعيات المسندة إليك للتقييم
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 text-sm font-hrsd-medium">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            {statusFilterOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {years.length > 0 && (
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-32 text-sm font-hrsd-medium">
              <SelectValue placeholder="السنة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm font-hrsd">
            لا توجد تكليفات
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right font-hrsd-semibold">اسم الجمعية</TableHead>
                <TableHead className="text-right font-hrsd-semibold">السنة</TableHead>
                <TableHead className="text-right font-hrsd-semibold">الحالة</TableHead>
                <TableHead className="text-right font-hrsd-semibold">نسبة الإنجاز</TableHead>
                <TableHead className="text-right font-hrsd-semibold">تاريخ التكليف</TableHead>
                <TableHead className="text-right font-hrsd-semibold">آخر تحديث</TableHead>
                <TableHead className="text-right font-hrsd-semibold">إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-hrsd-medium">{row.association_name}</TableCell>
                  <TableCell className="font-hrsd">{row.year}</TableCell>
                  <TableCell>
                    <StatusBadge status={statusLabelMap[row.status] || row.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${row.completion_percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-hrsd-bold text-primary">
                        {row.completion_percentage}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-hrsd text-muted-foreground">
                    {new Date(row.assigned_at).toLocaleDateString("ar-SA")}
                  </TableCell>
                  <TableCell className="font-hrsd text-muted-foreground">
                    {new Date(row.updated_at).toLocaleDateString("ar-SA")}
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            navigate(`/evaluator/assignment/${row.id}`)
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>عرض التفاصيل</TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </EvaluatorLayout>
  );
};

export default EvaluatorAssignments;
