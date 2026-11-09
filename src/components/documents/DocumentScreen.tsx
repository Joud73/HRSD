import { createPortal } from "react-dom";
import { AlertCircle, Download, Printer } from "lucide-react";
import { documentsCopy as d } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useDocumentBundle } from "@/hooks/useResults";
import type { DocumentKind } from "@/services/resultsService";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/shared/EmptyState";
import { SkeletonPanel } from "@/components/shared/Skeletons";
import DocumentView from "@/components/documents/DocumentView";
import { openDocumentPdf, resultsUrl } from "@/components/results/documentUtils";

interface DocumentScreenProps {
  assessmentId: string;
  kind: DocumentKind;
  /** Hide the toolbar (the editor's live preview) */
  bare?: boolean;
}

/**
 * One document on screen: toolbar (print, and the issued PDF), the A4 sheets in a horizontally scrollable frame,
 * and a print-only copy mounted on <body> so the print stylesheet can drop the app shell entirely.
 */
const DocumentScreen = ({ assessmentId, kind, bare = false }: DocumentScreenProps) => {
  const { toast } = useToast();
  const bundle = useDocumentBundle(assessmentId, kind);
  const doc = bundle.document;

  if (bundle.isLoading) return <SkeletonPanel lines={8} />;
  if (bundle.isError || !doc) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <EmptyState icon={AlertCircle} message={d.err_generic} action={{ label: d.retry, onClick: () => void bundle.refetch() }} />
      </div>
    );
  }

  const view = <DocumentView document={doc} lines={bundle.lines} indicators={bundle.indicators} resultsUrl={resultsUrl()} />;

  return (
    <div className="flex flex-col gap-4">
      {!bare && (
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer aria-hidden />
            {d.print}
          </Button>
          {doc.pdfPath && (
            <Button variant="outline" onClick={() => openDocumentPdf(doc, (message) => toast({ title: message, variant: "destructive" }))}>
              <Download aria-hidden />
              {d.download_pdf}
            </Button>
          )}
        </div>
      )}
      <div className="scrollbar-thin overflow-x-auto rounded-lg border border-border bg-section-alt p-4 md:p-6">
        {/* The editor's preview column is narrower than A4: the sheets are shown smaller there */}
        <div className={cn("mx-auto w-[210mm] [&_.doc-page]:border [&_.doc-page]:border-border", bare && "[zoom:0.6]")}>{view}</div>
      </div>
      {!bare && createPortal(<div className="print-portal">{view}</div>, document.body)}
    </div>
  );
};

export default DocumentScreen;
