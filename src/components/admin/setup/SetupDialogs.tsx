import type { FormEvent, ReactNode } from "react";
import { adminSetupCopy as t } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const headerClass = "space-y-1 text-start sm:text-start";
const footerClass = "flex-col gap-3 sm:flex-row sm:justify-start sm:space-x-0";

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onSubmit: () => void;
  submitLabel?: string;
  children: ReactNode;
  className?: string;
}

/** Add / edit dialog: title (h3), fields, primary action first at the start, cancel as outline. */
export const FormDialog = ({ open, onOpenChange, title, description, onSubmit, submitLabel = t.save, children, className }: FormDialogProps) => {
  const handle = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className={cn("max-h-[90vh] gap-6 overflow-y-auto rounded-lg sm:max-w-md", className)}>
        <form onSubmit={handle} className="flex flex-col gap-6" noValidate>
          <DialogHeader className={headerClass}>
            <DialogTitle className="text-h3 font-hrsd-title text-ink">{title}</DialogTitle>
            {description && <DialogDescription className="text-small text-muted-foreground">{description}</DialogDescription>}
          </DialogHeader>
          <div className="flex flex-col gap-5">{children}</div>
          <DialogFooter className={footerClass}>
            <Button type="submit">{submitLabel}</Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface ConfirmDeleteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  onConfirm: () => void;
  confirmLabel?: string;
}

/** Destructive confirmation: danger confirm first, cancel as outline. */
export const ConfirmDelete = ({ open, onOpenChange, title, description, onConfirm, confirmLabel = t.delete }: ConfirmDeleteProps) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent dir="rtl" className="gap-6 rounded-lg sm:max-w-md">
      <AlertDialogHeader className={headerClass}>
        <AlertDialogTitle className="text-h3 font-hrsd-title text-ink">{title}</AlertDialogTitle>
        <AlertDialogDescription className="text-small text-muted-foreground">{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className={footerClass}>
        <AlertDialogAction onClick={onConfirm} className={cn(buttonVariants(), "bg-danger text-danger-foreground hover:bg-danger/90")}>
          {confirmLabel}
        </AlertDialogAction>
        <AlertDialogCancel className="mt-0">{t.cancel}</AlertDialogCancel>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

/** Switch row with a visible state label, for the active/inactive field */
export const fieldRowClass = "flex items-center justify-between gap-4 rounded-md border border-border px-4 py-3";
