import { MessageSquare } from "lucide-react";
import { assessmentCopy as t } from "@/lib/copy";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FieldShell } from "@/components/shared/FormField";
import type { NoteRecord } from "@/components/assessment/indicatorsData";

interface NotesPanelProps {
  indicatorId: string;
  notes: NoteRecord[];
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onSave: () => void;
}

/** Notes on one indicator from the organization and the auditor, plus a field to add one. */
const NotesPanel = ({ indicatorId, notes, value, error, onChange, onSave }: NotesPanelProps) => {
  const fieldId = `note-${indicatorId}`;
  return (
    <div className="flex flex-col gap-6">
      {notes.length === 0 ? (
        <p className="flex items-center gap-2 text-small text-muted-foreground">
          <MessageSquare aria-hidden className="h-4 w-4 shrink-0" />
          {t.notes_empty}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {notes.map((note) => (
            <li key={note.id} className="py-3 first:pt-0">
              <p className="whitespace-pre-line text-body text-ink">{note.text}</p>
              <p className="mt-1 flex gap-3 text-caption text-muted-foreground">
                <span>{t.note_source[note.source] ?? note.source}</span>
                <span className="tabular">{note.date}</span>
              </p>
            </li>
          ))}
        </ul>
      )}

      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
      >
        <FieldShell id={fieldId} label={t.notes_field} error={error}>
          <Textarea
            id={fieldId}
            dir="rtl"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t.notes_placeholder}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${fieldId}-error` : undefined}
            className="min-h-[112px] resize-y text-body"
          />
        </FieldShell>
        <div>
          <Button type="submit">{t.notes_save}</Button>
        </div>
      </form>
    </div>
  );
};

export default NotesPanel;
