import { Eye, FileBarChart } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StatusBadge from "./StatusBadge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface EvaluationRow {
  org: string;
  year: number;
  course: string;
  status: string;
  progress: number;
  evaluator: string;
  date: string;
}

const RecentEvaluationsTable = ({ rows }: { rows: EvaluationRow[] }) => (
  <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-border">
      <h3 className="text-sm font-hrsd-semibold text-foreground">آخر التقييمات</h3>
    </div>
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/30">
          <TableHead className="text-start font-hrsd-medium text-xs">الجمعية</TableHead>
          <TableHead className="text-start font-hrsd-medium text-xs">السنة</TableHead>
          <TableHead className="text-start font-hrsd-medium text-xs">المساق</TableHead>
          <TableHead className="text-start font-hrsd-medium text-xs">الحالة</TableHead>
          <TableHead className="text-start font-hrsd-medium text-xs">نسبة الإنجاز</TableHead>
          <TableHead className="text-start font-hrsd-medium text-xs">المقيم</TableHead>
          <TableHead className="text-start font-hrsd-medium text-xs">تاريخ التقديم</TableHead>
          <TableHead className="text-start font-hrsd-medium text-xs">الإجراءات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={i} className="text-sm font-hrsd">
            <TableCell>{r.org}</TableCell>
            <TableCell>{r.year}</TableCell>
            <TableCell>{r.course}</TableCell>
            <TableCell><StatusBadge status={r.status} /></TableCell>
            <TableCell>{r.progress}%</TableCell>
            <TableCell>{r.evaluator}</TableCell>
            <TableCell>{r.date}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="rounded-lg p-1.5 text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>عرض</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="rounded-lg p-1.5 text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
                      <FileBarChart className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>تقارير</TooltipContent>
                </Tooltip>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export default RecentEvaluationsTable;
