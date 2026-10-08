import { useRef, type ChangeEvent } from "react";
import { Eye, EyeOff, FileText, FolderOpen, Paperclip, Trash2 } from "lucide-react";
import { assessmentCopy as t } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/shared/EmptyState";
import type { EvidenceRecord } from "@/components/assessment/indicatorsData";

interface EvidencePanelProps {
  records: EvidenceRecord[];
  onToggle: (evidenceId: string) => void;
  onDelete: (evidenceId: string) => void;
  onUploadGeneral: (event: ChangeEvent<HTMLInputElement>) => void;
}

/** Every file attached to one indicator, per item or general. */
const EvidencePanel = ({ records, onToggle, onDelete, onUploadGeneral }: EvidencePanelProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const openPicker = () => inputRef.current?.click();

  return (
    <>
      <input ref={inputRef} type="file" onChange={onUploadGeneral} className="hidden" tabIndex={-1} aria-hidden />
      {records.length === 0 ? (
        <EmptyState icon={FolderOpen} message={t.evidence_empty} action={{ label: t.evidence_add_general, onClick: openPicker }} className="py-10" />
      ) : (
        <div className="flex flex-col gap-4">
          <ul className="divide-y divide-border">
            {records.map((evidence) => (
              <li
                key={evidence.id}
                className={cn("flex items-center gap-3 py-3 first:pt-0 transition-opacity duration-ui", evidence.hidden && "opacity-50")}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/5 text-primary">
                  <FileText aria-hidden className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-small font-hrsd-medium text-ink" dir="auto">
                    {evidence.fileName}
                  </p>
                  <p className="flex flex-wrap gap-x-3 text-caption text-muted-foreground">
                    <span>{evidence.itemLabel}</span>
                    <span className="tabular">{evidence.uploadedAt}</span>
                    <span>{evidence.hidden ? t.evidence_hidden : t.evidence_pending_review}</span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggle(evidence.id)}
                    aria-label={evidence.hidden ? t.evidence_show : t.evidence_hide}
                    title={evidence.hidden ? t.evidence_show : t.evidence_hide}
                  >
                    {evidence.hidden ? <EyeOff aria-hidden className="text-primary" /> : <Eye aria-hidden className="text-primary" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(evidence.id)} aria-label={t.evidence_delete} title={t.evidence_delete}>
                    <Trash2 aria-hidden className="text-danger" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <div>
            <Button variant="outline" onClick={openPicker}>
              <Paperclip aria-hidden />
              {t.evidence_add_general}
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default EvidencePanel;
