import { Link } from "react-router-dom";
import { Download, FileText } from "lucide-react";
import { documentsCopy as d } from "@/lib/copy";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { AssessmentDocument, DocumentStatus } from "@/services/resultsService";
import { KIND_LABEL, openDocumentPdf } from "@/components/results/documentUtils";
import { Button } from "@/components/ui/button";

const STATUS_CHIP: Record<DocumentStatus, { label: string; className: string }> = {
  draft: { label: d.status_draft, className: "bg-neutral/10 text-ink/80" },
  approved: { label: d.status_approved, className: "bg-primary/10 text-primary" },
  issued: { label: d.status_issued, className: "bg-success/10 text-success" },
};

interface DocumentCardsProps {
  documents: AssessmentDocument[];
  /** Where a card's main action goes (editor or read-only view); no link when omitted */
  linkTo?: (doc: AssessmentDocument) => string;
  linkLabel?: string;
}

/** The two results documents as a pair of cards: name, status, number once issued, and their actions. */
const DocumentCards = ({ documents, linkTo, linkLabel }: DocumentCardsProps) => {
  const { toast } = useToast();
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {documents.map((doc) => {
        const chip = STATUS_CHIP[doc.status];
        return (
          <li key={doc.id} className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
            <div className="flex items-start gap-3">
              <FileText aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h3 className="text-body font-hrsd-bold text-ink">{KIND_LABEL[doc.kind]}</h3>
                <p className="tabular text-caption text-muted-foreground">
                  <bdi>{doc.number ?? d.number_pending}</bdi>
                  {doc.issuedAt && (
                    <>
                      <span aria-hidden className="mx-2">
                        ·
                      </span>
                      {formatDate(doc.issuedAt)}
                    </>
                  )}
                </p>
              </div>
              <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-caption font-hrsd-medium", chip.className)}>{chip.label}</span>
            </div>
            {(linkTo || doc.pdfPath) && (
              <div className="flex flex-wrap gap-3">
                {linkTo && (
                  <Button asChild variant="outline" size="sm">
                    <Link to={linkTo(doc)}>{linkLabel}</Link>
                  </Button>
                )}
                {doc.pdfPath && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDocumentPdf(doc, (message) => toast({ title: message, variant: "destructive" }))}
                  >
                    <Download aria-hidden />
                    {d.download_pdf}
                  </Button>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default DocumentCards;
