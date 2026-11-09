import { documentsCopy as d } from "@/lib/copy";
import { getDocumentPdfUrl, type AssessmentDocument, type DocumentKind } from "@/services/resultsService";

/** The organization's results page (the documents' QR code). */
export const resultsUrl = () => `${window.location.origin}/results`;

export const KIND_LABEL: Record<DocumentKind, string> = {
  feedback_report: d.kind_feedback_report,
  improvement_plan: d.kind_improvement_plan,
};

/** Opens an issued PDF through a 10-minute signed URL; the tab opens inside the click so popup blockers allow it. */
export async function openDocumentPdf(doc: AssessmentDocument, onError: (message: string) => void) {
  const tab = window.open("", "_blank");
  try {
    const url = await getDocumentPdfUrl(doc);
    if (tab) {
      tab.opener = null;
      tab.location.href = url;
    } else {
      window.location.assign(url);
    }
  } catch (err) {
    tab?.close();
    onError(err instanceof Error ? err.message : d.err_generic);
  }
}
