import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { assessmentCopy as t } from "@/lib/copy";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FieldShell } from "@/components/shared/FormField";

const NO_ASSIGNEE = "__none";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  /** Automatic tasks keep their text; only the assignee can change */
  isAuto?: boolean;
  taskText: string;
  onTaskTextChange: (value: string) => void;
  assignee: string;
  onAssigneeChange: (value: string) => void;
  teamMembers: string[];
  memberName: string;
  onMemberNameChange: (value: string) => void;
  onAddMember: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}

/** Add or edit an improvement task: description, assignee, and adding a team member inline. */
const TaskDialog = ({
  open,
  onOpenChange,
  mode,
  isAuto = false,
  taskText,
  onTaskTextChange,
  assignee,
  onAssigneeChange,
  teamMembers,
  memberName,
  onMemberNameChange,
  onAddMember,
  onSubmit,
  onCancel,
}: TaskDialogProps) => {
  const [attempted, setAttempted] = useState(false);
  useEffect(() => {
    if (open) setAttempted(false);
  }, [open]);

  const textError = attempted && !isAuto && !taskText.trim() ? t.field_task_required : undefined;
  const idPrefix = `task-${mode}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader className="text-start">
          <DialogTitle className="text-h3 text-primary">{mode === "add" ? t.dialog_add_title : t.dialog_edit_title}</DialogTitle>
          <DialogDescription className="text-small text-muted-foreground">{t.dialog_desc}</DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            setAttempted(true);
            if (!isAuto && !taskText.trim()) return;
            onSubmit();
          }}
        >
          {isAuto ? (
            <div className="flex flex-col gap-2">
              <p className="text-small font-hrsd-medium text-ink">{t.field_task_auto}</p>
              <p className="rounded-md bg-section-alt p-3 text-small text-muted-foreground">{taskText}</p>
            </div>
          ) : (
            <FieldShell id={`${idPrefix}-text`} label={t.field_task} error={textError} required>
              <Textarea
                id={`${idPrefix}-text`}
                value={taskText}
                onChange={(e) => onTaskTextChange(e.target.value)}
                placeholder={t.field_task_placeholder}
                aria-invalid={textError ? true : undefined}
                aria-describedby={textError ? `${idPrefix}-text-error` : undefined}
                className="min-h-[100px] text-body"
              />
            </FieldShell>
          )}

          <FieldShell id={`${idPrefix}-assignee`} label={t.field_assignee}>
            <Select
              value={assignee || NO_ASSIGNEE}
              onValueChange={(v) => onAssigneeChange(v === NO_ASSIGNEE ? "" : v)}
              dir="rtl"
            >
              <SelectTrigger id={`${idPrefix}-assignee`} className="h-11 text-body">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_ASSIGNEE}>{t.field_assignee_none}</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member} value={member}>
                    {member}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldShell>

          <FieldShell id={`${idPrefix}-member`} label={t.field_member_label}>
            <div className="flex gap-2">
              <Input
                id={`${idPrefix}-member`}
                value={memberName}
                onChange={(e) => onMemberNameChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onAddMember();
                  }
                }}
                placeholder={t.field_member_placeholder}
                className="h-11 flex-1 text-body"
              />
              <Button type="button" variant="outline" className="h-11" onClick={onAddMember}>
                <UserPlus aria-hidden />
                {t.member_add}
              </Button>
            </div>
          </FieldShell>

          <DialogFooter className="flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-start sm:gap-3 sm:space-x-0">
            <Button type="submit">{mode === "add" ? t.save_task : t.save_changes}</Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              {t.cancel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;
