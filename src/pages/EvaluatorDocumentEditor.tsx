import { useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { ChevronDown, Eye, EyeOff, Info, Plus, Trash2 } from "lucide-react";
import { copy, documentsCopy as d, evaluatorCopy as t } from "@/lib/copy";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useApprovedTool } from "@/hooks/useApprovedTool";
import { useAssessment } from "@/hooks/useAssessment";
import { useAddManualLine, useDocumentBundle, useRemoveManualLine, useUpdateLine } from "@/hooks/useResults";
import { useOrganization } from "@/hooks/useOrganizations";
import { DOCUMENT_KINDS, type DocumentKind, type DocumentLine, type DocumentSection } from "@/services/resultsService";
import type { Standard, Track } from "@/services/toolService";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { SkeletonPanel } from "@/components/shared/Skeletons";
import DocumentScreen from "@/components/documents/DocumentScreen";
import { KIND_LABEL } from "@/components/results/documentUtils";
import { stripOrdinal } from "@/components/assessment/indicatorUtils";

const SECTIONS: Record<DocumentKind, { section: DocumentSection; title: string }[]> = {
  feedback_report: [
    { section: "strength", title: d.report_s4_title },
    { section: "opportunity", title: d.report_s5_title },
  ],
  improvement_plan: [{ section: "task", title: d.plan_s3_title }],
};

const tagOf = (line: DocumentLine) => (line.source === "manual" ? d.line_tag_manual : line.edited ? d.line_tag_edited : d.line_tag_auto);

/** One line: text saved on blur, include switch, origin tag, remove for manual lines. */
const LineRow = ({ assessmentId, line, readOnly }: { assessmentId: string; line: DocumentLine; readOnly: boolean }) => {
  const { toast } = useToast();
  const update = useUpdateLine(assessmentId);
  const remove = useRemoveManualLine(assessmentId);
  const [text, setText] = useState(line.text);
  const fail = (e: Error) => toast({ title: e.message, variant: "destructive" });
  const id = `line-${line.id}`;

  const save = () => {
    if (text.trim() === line.text) return;
    update.mutate({ lineId: line.id, patch: { text } }, { onSuccess: () => toast({ title: d.line_saved }), onError: (e) => (fail(e), setText(line.text)) });
  };

  return (
    <li className={cn("flex flex-col gap-2 px-4 py-3", !line.included && "bg-section-alt")}>
      <label htmlFor={id} className="sr-only">
        {d.line_placeholder}
      </label>
      <Textarea
        id={id}
        rows={2}
        value={text}
        disabled={readOnly}
        placeholder={d.line_placeholder}
        onChange={(e) => setText(e.target.value)}
        onBlur={save}
        className={cn("min-h-[60px] text-small", !line.included && "text-muted-foreground line-through")}
      />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-caption font-hrsd-medium",
            line.source === "manual" ? "bg-primary/10 text-primary" : line.edited ? "bg-accent/20 text-ink" : "bg-neutral/10 text-ink/80"
          )}
        >
          {tagOf(line)}
        </span>
        <label className="flex items-center gap-2 text-caption text-muted-foreground">
          <Switch
            checked={line.included}
            disabled={readOnly || update.isPending}
            onCheckedChange={(included) => update.mutate({ lineId: line.id, patch: { included } }, { onError: fail })}
            aria-label={d.line_include}
          />
          {d.line_include}
        </label>
        {line.source === "manual" && !readOnly && (
          <Button
            variant="ghost"
            size="sm"
            className="ms-auto text-danger hover:text-danger"
            disabled={remove.isPending}
            onClick={() => remove.mutate(line.id, { onError: fail })}
          >
            <Trash2 aria-hidden />
            {d.line_remove}
          </Button>
        )}
      </div>
    </li>
  );
};

/** One standard of one section: its lines and "إضافة سطر" (an inline field, saved with حفظ). */
const StandardBlock = ({
  assessmentId,
  documentId,
  section,
  track,
  standard,
  lines,
  readOnly,
}: {
  assessmentId: string;
  documentId: string;
  section: DocumentSection;
  track: Track;
  standard: Standard;
  lines: DocumentLine[];
  readOnly: boolean;
}) => {
  const { toast } = useToast();
  const add = useAddManualLine(assessmentId);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const fieldId = `add-${section}-${standard.id}`;

  const submit = () =>
    add.mutate(
      { documentId, input: { section, trackId: track.id, standardId: standard.id, text } },
      {
        onSuccess: () => {
          setText("");
          setAdding(false);
          toast({ title: d.line_saved });
        },
        onError: (e) => toast({ title: e.message, variant: "destructive" }),
      }
    );

  return (
    <div className="flex flex-col">
      <p className="px-4 pb-1 pt-3 text-small font-hrsd-medium text-ink">{stripOrdinal(standard.name)}</p>
      {lines.length === 0 ? (
        <p className="px-4 py-2 text-caption text-muted-foreground">{d.none}</p>
      ) : (
        <ul className="divide-y divide-border">
          {lines.map((line) => (
            <LineRow key={line.id} assessmentId={assessmentId} line={line} readOnly={readOnly} />
          ))}
        </ul>
      )}
      {!readOnly &&
        (adding ? (
          <div className="flex flex-col gap-2 px-4 py-3">
            <label htmlFor={fieldId} className="text-caption text-muted-foreground">
              {d.line_add}
            </label>
            <Textarea id={fieldId} rows={2} value={text} autoFocus onChange={(e) => setText(e.target.value)} className="min-h-[60px] text-small" />
            <div className="flex gap-2">
              <Button size="sm" onClick={submit} disabled={add.isPending || !text.trim()}>
                {d.line_add_save}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAdding(false)}>
                {t.cancel}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="m-2 self-start text-primary" onClick={() => setAdding(true)}>
            <Plus aria-hidden />
            {d.line_add}
          </Button>
        ))}
    </div>
  );
};

/** /evaluator/assessments/:assessmentId/documents/:kind: edit the generated lines, with a live preview. */
const EvaluatorDocumentEditor = () => {
  const { assessmentId = "", kind: rawKind = "" } = useParams<{ assessmentId: string; kind: string }>();
  const kind = DOCUMENT_KINDS.find((k) => k === rawKind);
  const current = useAssessment({ kind: "assessment", id: assessmentId }, { ensure: false });
  const tool = useApprovedTool();
  const bundle = useDocumentBundle(assessmentId, kind);
  const { data: org } = useOrganization(current.assessment?.organizationId);
  const [previewOpen, setPreviewOpen] = useState(false);

  const tracks = useMemo(() => tool.data?.tracks ?? [], [tool.data]);
  if (!kind) return <Navigate to={`/evaluator/assessments/${assessmentId}`} replace />;

  const title = d.editor_title(KIND_LABEL[kind]);
  const orgName = org?.name ?? t.assignments_title;
  const crumbs = [
    { label: copy.shell_context.evaluator, to: "/evaluator" },
    { label: t.assignments_title, to: "/evaluator/assignments" },
    { label: orgName, to: `/evaluator/assessments/${assessmentId}` },
    { label: title },
  ];

  if (current.isLoading || bundle.isLoading || tool.isLoading) {
    return (
      <>
        <PageHeader title={title} breadcrumbs={crumbs} />
        <SkeletonPanel lines={8} />
      </>
    );
  }

  const doc = bundle.document;
  if (!current.assessment || !doc) {
    return (
      <>
        <PageHeader title={title} breadcrumbs={crumbs} />
        <div className="rounded-lg border border-border bg-card">
          <EmptyState icon={Info} message={t.review_not_found} action={{ label: t.review_back, to: "/evaluator/assignments" }} />
        </div>
      </>
    );
  }

  const readOnly = doc.status !== "draft" || current.assessment.status !== "under_review";
  const readOnlyReason = doc.status !== "draft" ? d.editor_readonly_approved : d.editor_readonly_status;

  return (
    <>
      <PageHeader title={title} description={d.editor_desc} breadcrumbs={crumbs} />

      {readOnly && (
        <p role="status" className="mb-6 flex items-start gap-3 rounded-lg border border-border bg-section-alt px-5 py-4 text-small text-ink">
          <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          {readOnlyReason}
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          {SECTIONS[kind].map(({ section, title: sectionTitle }) => {
            const own = bundle.lines.filter((l) => l.section === section).sort((a, b) => a.sortOrder - b.sortOrder);
            return (
              <section key={section} aria-labelledby={`section-${section}`} className="flex flex-col gap-3">
                <h2 id={`section-${section}`} className="flex items-baseline gap-3 text-h3 text-ink">
                  {sectionTitle}
                  <span className="tabular text-small text-muted-foreground">
                    {formatNumber(own.filter((l) => l.included).length)} {copy.of} {formatNumber(own.length)}
                  </span>
                </h2>
                {tracks.map((track, i) => (
                  <details key={track.id} open={i === 0} className="group rounded-lg border border-border bg-card">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-body font-hrsd-bold text-ink focus-ring">
                      {track.name}
                      <span className="flex items-center gap-3">
                        <span className="tabular text-caption font-hrsd-regular text-muted-foreground">
                          {formatNumber(own.filter((l) => l.trackId === track.id).length)}
                        </span>
                        <ChevronDown aria-hidden className="h-4 w-4 text-muted-foreground transition-transform duration-micro group-open:rotate-180" />
                      </span>
                    </summary>
                    <div className="divide-y divide-border border-t border-border">
                      {track.standards.map((standard) => (
                        <StandardBlock
                          key={standard.id}
                          assessmentId={assessmentId}
                          documentId={doc.id}
                          section={section}
                          track={track}
                          standard={standard}
                          lines={own.filter((l) => l.standardId === standard.id)}
                          readOnly={readOnly}
                        />
                      ))}
                    </div>
                  </details>
                ))}
              </section>
            );
          })}
        </div>

        <aside aria-label={d.preview} className="flex flex-col gap-3 lg:sticky lg:top-24">
          <Button variant="outline" className="self-start lg:hidden" onClick={() => setPreviewOpen((v) => !v)} aria-expanded={previewOpen}>
            {previewOpen ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
            {d.preview}
          </Button>
          <div className={cn("lg:block lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto", previewOpen ? "block" : "hidden")}>
            <DocumentScreen assessmentId={assessmentId} kind={kind} bare />
          </div>
        </aside>
      </div>
    </>
  );
};

export default EvaluatorDocumentEditor;
