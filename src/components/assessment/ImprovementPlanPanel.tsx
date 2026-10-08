import { ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import { assessmentCopy as t } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from "@/components/shared/EmptyState";
import type { ImprovementTask } from "@/components/assessment/indicatorsData";

type TaskStatus = ImprovementTask["status"];

const STATUS_LABEL: Record<TaskStatus, string> = {
  "تحت التنفيذ": t.task_status_in_progress,
  "تم": t.task_status_done,
};

interface ImprovementPlanPanelProps {
  tasks: ImprovementTask[];
  onAdd: () => void;
  onEdit: (task: ImprovementTask) => void;
  onDelete: (task: ImprovementTask) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}

/** Improvement tasks for one indicator: automatic tasks from unchecked items plus manual ones. */
const ImprovementPlanPanel = ({ tasks, onAdd, onEdit, onDelete, onStatusChange }: ImprovementPlanPanelProps) => {
  if (tasks.length === 0) {
    return <EmptyState icon={ListChecks} message={t.plan_empty} action={{ label: t.plan_add, onClick: onAdd }} className="py-10" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="divide-y divide-border">
        {tasks.map((task) => (
          <li key={task.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-body text-ink">{task.taskText}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-muted-foreground">
                <span className="rounded-full bg-section-alt px-2 py-0.5 text-ink">
                  {task.isAuto ? t.task_type_auto : t.task_type_manual}
                </span>
                <span className="tabular">
                  {t.task_date}: {task.date}
                </span>
                <span>
                  {t.task_assignee}: {task.assignee || "—"}
                </span>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Select value={task.status} onValueChange={(v) => onStatusChange(task.id, v as TaskStatus)} dir="rtl">
                <SelectTrigger aria-label={t.task_status_label} className="me-1 h-9 w-[132px] text-small">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABEL) as TaskStatus[]).map((s) => (
                    <SelectItem key={s} value={s} className="text-small">
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => onEdit(task)} aria-label={t.task_edit} title={t.task_edit}>
                <Pencil aria-hidden className="text-primary" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(task)}
                aria-label={t.task_delete}
                aria-disabled={task.isAuto || undefined}
                title={task.isAuto ? t.task_delete_blocked_title : t.task_delete}
                className={cn(task.isAuto && "opacity-40")}
              >
                <Trash2 aria-hidden className="text-danger" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <div>
        <Button variant="outline" onClick={onAdd}>
          <Plus aria-hidden />
          {t.plan_add}
        </Button>
      </div>
    </div>
  );
};

export default ImprovementPlanPanel;
