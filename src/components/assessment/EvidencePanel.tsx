import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ChevronDown, ExternalLink, FileText, Link2, Loader2, Paperclip, Plus, Trash2 } from "lucide-react";
import { assessmentCopy as t } from "@/lib/copy";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FormError, TextField } from "@/components/shared/FormField";
import { dialogUi } from "@/components/admin/adminUi";
import { EVIDENCE_MIME_TYPES, type Evidence } from "@/services/assessmentService";

interface EvidencePanelProps {
  /** Evidences of one item */
  evidences: Evidence[];
  editable: boolean;
  uploading: boolean;
  onAttachFile: (file: File) => void;
  /** Resolves when saved; rejects with a ServiceError whose message is shown in the dialog */
  onAddLink: (url: string, label: string) => Promise<void>;
  onOpen: (evidence: Evidence) => void;
  onDelete: (evidence: Evidence) => void;
}

const ACCEPT = Object.keys(EVIDENCE_MIME_TYPES).join(",");

/** File name, or the link's label or host. */
const evidenceName = (e: Evidence) => {
  if (e.kind === "file") return e.fileName ?? "";
  if (e.fileName) return e.fileName;
  try {
    return new URL(e.url ?? "").host;
  } catch {
    return e.url ?? "";
  }
};

/** Add a link: URL (required) and an optional label. */
const LinkDialog = ({ open, onOpenChange, onSubmit }: { open: boolean; onOpenChange: (v: boolean) => void; onSubmit: EvidencePanelProps["onAddLink"] }) => {
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSubmit(url, label);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className={dialogUi.content}>
        <form onSubmit={submit} noValidate>
          <DialogHeader className={dialogUi.header}>
            <DialogTitle className={dialogUi.title}>{t.link_dialog_title}</DialogTitle>
            <DialogDescription className={dialogUi.description}>{t.link_dialog_desc}</DialogDescription>
          </DialogHeader>
          <div className={dialogUi.body}>
            <FormError message={error} />
            <TextField label={t.link_field} type="url" dir="ltr" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} required autoFocus />
            <TextField label={t.link_label_field} value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <DialogFooter className={dialogUi.footer}>
            <Button type="submit" disabled={saving || !url.trim()}>
              {saving && <Loader2 aria-hidden className="animate-spin motion-reduce:animate-none" />}
              {t.link_submit}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t.cancel}
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/** Evidences of one item, with attach and add-link actions while the assessment is editable. */
const EvidencePanel = ({ evidences, editable, uploading, onAttachFile, onAddLink, onOpen, onDelete }: EvidencePanelProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Evidence | null>(null);

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onAttachFile(file);
  };

  return (
    <div className="flex flex-col gap-3">
      {evidences.length > 0 && (
        <ul aria-label={t.evidence_list_label} className="flex flex-col gap-2">
          {evidences.map((evidence) => {
            const Icon = evidence.kind === "file" ? FileText : Link2;
            const name = evidenceName(evidence);
            return (
              <li key={evidence.id} className="flex items-center gap-3 rounded-md border border-border bg-section-alt/60 py-1.5 pe-1 ps-3">
                <Icon aria-hidden className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate text-small text-ink" dir="auto">
                  {name}
                </span>
                <span className="tabular hidden shrink-0 text-caption text-muted-foreground sm:inline">{formatDate(evidence.uploadedAt)}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpen(evidence)} aria-label={`${t.evidence_open}: ${name}`} title={t.evidence_open}>
                  <ExternalLink aria-hidden className="text-primary" />
                </Button>
                {editable && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPendingDelete(evidence)} aria-label={`${t.evidence_delete}: ${name}`} title={t.evidence_delete}>
                    <Trash2 aria-hidden className="text-danger" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {editable && (
        <div className="flex items-center gap-2">
          {/* Not modal: the link dialog opens right after the menu closes */}
          <DropdownMenu dir="rtl" modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={uploading} className="text-small">
                {uploading ? <Loader2 aria-hidden className="animate-spin motion-reduce:animate-none" /> : <Plus aria-hidden />}
                {uploading ? t.evidence_uploading : t.evidence_add}
                {!uploading && <ChevronDown aria-hidden className="opacity-60" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[220px]">
              <DropdownMenuItem className="gap-2 text-small" onSelect={() => inputRef.current?.click()}>
                <Paperclip aria-hidden className="h-4 w-4" /> {t.evidence_add_file}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-small" onSelect={() => setLinkOpen(true)}>
                <Link2 aria-hidden className="h-4 w-4" /> {t.evidence_add_link}
              </DropdownMenuItem>
              <DropdownMenuLabel className="text-caption font-hrsd-regular text-muted-foreground">{t.evidence_file_hint}</DropdownMenuLabel>
            </DropdownMenuContent>
          </DropdownMenu>
          <input ref={inputRef} type="file" accept={ACCEPT} onChange={handleFile} className="hidden" tabIndex={-1} aria-hidden />
        </div>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className={dialogUi.header}>
            <AlertDialogTitle className={dialogUi.title}>{t.evidence_delete_title}</AlertDialogTitle>
            <AlertDialogDescription className={dialogUi.description}>
              {t.evidence_delete_desc}
              {evidences.length === 1 && ` ${t.evidence_delete_last}`}
              {pendingDelete && (
                <span className="mt-2 block truncate font-hrsd-medium text-ink" dir="auto">
                  {evidenceName(pendingDelete)}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={dialogUi.footer}>
            <AlertDialogAction
              className={dialogUi.danger}
              onClick={() => {
                if (pendingDelete) onDelete(pendingDelete);
                setPendingDelete(null);
              }}
            >
              {t.evidence_delete_confirm}
            </AlertDialogAction>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mounted only while open, so each opening starts empty */}
      {linkOpen && <LinkDialog open={linkOpen} onOpenChange={setLinkOpen} onSubmit={onAddLink} />}
    </div>
  );
};

export default EvidencePanel;
