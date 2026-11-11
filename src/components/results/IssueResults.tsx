import { useRef, useState } from "react";
import { CheckCircle2, Circle, FileCheck2, Loader2 } from "lucide-react";
import { documentsCopy as d } from "@/lib/copy";
import { pagesToPdf } from "@/lib/pdf";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useDocumentBundle, useIssueResults, useResultsNumber } from "@/hooks/useResults";
import { getResultsNumber, uploadDocumentPdf, type DocumentKind, type IssuedPdf } from "@/services/resultsService";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { FormError } from "@/components/shared/FormField";
import { dialogUi } from "@/components/admin/adminUi";
import DocumentView from "@/components/documents/DocumentView";
import { resultsUrl } from "@/components/results/documentUtils";

type Step = "report" | "plan" | "publish";
const STEPS: { key: Step; label: string }[] = [
  { key: "report", label: d.issue_step_report },
  { key: "plan", label: d.issue_step_plan },
  { key: "publish", label: d.issue_step_publish },
];

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

/** Waits until the off-screen documents are painted: fonts, images and the QR codes (generated asynchronously). */
async function settled(root: HTMLElement) {
  await nextFrame();
  await document.fonts.ready;
  for (let i = 0; i < 50; i += 1) {
    const covers = root.querySelectorAll(".doc-sheets").length;
    const qrs = root.querySelectorAll(".doc-sheets svg").length;
    const images = [...root.querySelectorAll("img")];
    if (covers > 0 && qrs >= covers && images.every((img) => img.complete)) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  await nextFrame();
}

/**
 * "إصدار النتائج" (final sign-off): confirms the report number, renders both documents with that number off-screen,
 * turns each into an A4 PDF, uploads both, then issue_results(). A stale number (the date changed) is fetched again
 * and the PDFs rebuilt once.
 */
const IssueResults = ({ assessmentId }: { assessmentId: string }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step | null>(null);
  const [printing, setPrinting] = useState<{ number: string; issuedAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const number = useResultsNumber(assessmentId, open);
  const report = useDocumentBundle(assessmentId, "feedback_report");
  const plan = useDocumentBundle(assessmentId, "improvement_plan");
  const issue = useIssueResults(assessmentId);
  const busy = step !== null;
  const ready = !!report.document && !!plan.document && !report.isLoading && !plan.isLoading;

  const buildPdf = async (kind: DocumentKind): Promise<IssuedPdf> => {
    const root = rootRef.current?.querySelector<HTMLElement>(`[data-kind="${kind}"]`);
    if (!root) throw new Error(d.err_generic);
    const blob = await pagesToPdf([...root.querySelectorAll<HTMLElement>(".doc-page")]);
    return uploadDocumentPdf(assessmentId, kind, blob);
  };

  const attempt = async (value: string) => {
    setPrinting({ number: value, issuedAt: new Date().toISOString() });
    await nextFrame();
    if (rootRef.current) await settled(rootRef.current);
    setStep("report");
    const reportPdf = await buildPdf("feedback_report");
    setStep("plan");
    const planPdf = await buildPdf("improvement_plan");
    setStep("publish");
    await issue.mutateAsync({ number: value, pdfs: [reportPdf, planPdf] });
  };

  const run = async () => {
    if (!number.data) return;
    setError(null);
    try {
      try {
        await attempt(number.data);
      } catch (err) {
        if (!(err instanceof Error) || err.message !== d.err_stale_number) throw err;
        // The date moved on since the dialog opened: take the new number and rebuild once
        await attempt(await getResultsNumber(assessmentId));
      }
      toast({ title: d.issue_done });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : d.err_generic);
    } finally {
      setStep(null);
      setPrinting(null);
    }
  };

  const stepIndex = step ? STEPS.findIndex((s) => s.key === step) : -1;

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={!ready}>
        <FileCheck2 aria-hidden />
        {d.issue}
      </Button>

      <Dialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
        <DialogContent dir="rtl" className={dialogUi.content}>
          <DialogHeader className={dialogUi.header}>
            <DialogTitle className={dialogUi.title}>{d.issue_title}</DialogTitle>
            <DialogDescription className={dialogUi.description}>{d.issue_desc}</DialogDescription>
          </DialogHeader>
          <div className={dialogUi.body}>
            <FormError message={error ?? (number.error instanceof Error ? number.error.message : null)} />
            <dl className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
              <dt className="text-small text-muted-foreground">{d.issue_number_label}</dt>
              <dd className="tabular text-small font-hrsd-bold text-ink">
                {number.isLoading ? <Loader2 aria-hidden className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <bdi>{number.data ?? "-"}</bdi>}
              </dd>
            </dl>
            {busy && (
              <ol aria-live="polite" className="flex flex-col gap-2">
                {STEPS.map((s, i) => (
                  <li key={s.key} className={cn("flex items-center gap-2 text-small", i > stepIndex ? "text-muted-foreground" : "text-ink")}>
                    {i < stepIndex ? (
                      <CheckCircle2 aria-hidden className="h-4 w-4 text-success" />
                    ) : i === stepIndex ? (
                      <Loader2 aria-hidden className="h-4 w-4 animate-spin text-primary motion-reduce:animate-none" />
                    ) : (
                      <Circle aria-hidden className="h-4 w-4" />
                    )}
                    {s.label}
                  </li>
                ))}
              </ol>
            )}
          </div>
          <DialogFooter className={dialogUi.footer}>
            <Button onClick={run} disabled={busy || !number.data}>
              {busy && <Loader2 aria-hidden className="animate-spin motion-reduce:animate-none" />}
              {d.issue_confirm}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              {d.cancel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Off-screen render of both documents with the number being issued; the PDFs are drawn from it */}
      {printing && report.document && plan.document && (
        <div ref={rootRef} aria-hidden className="pointer-events-none fixed top-0 start-[-10000px] w-[210mm]">
          <div data-kind="feedback_report">
            <DocumentView
              document={report.document}
              lines={report.lines}
              indicators={report.indicators}
              resultsUrl={resultsUrl()}
              number={printing.number}
              issuedAt={printing.issuedAt}
            />
          </div>
          <div data-kind="improvement_plan">
            <DocumentView
              document={plan.document}
              lines={plan.lines}
              indicators={plan.indicators}
              resultsUrl={resultsUrl()}
              number={printing.number}
              issuedAt={printing.issuedAt}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default IssueResults;
