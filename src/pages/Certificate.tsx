import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Award, CalendarDays, Download, FileText, Printer, QrCode, type LucideIcon } from "lucide-react";
import { copy, pagesCopy } from "@/lib/copy";
import { formatDate, formatNumber, formatPercent } from "@/lib/format";
import OrganizationJourney from "@/components/OrganizationJourney";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import aolLogo from "@/assets/logos/aol.png";
import visionLogo from "@/assets/logos/vision-2030-colored.png";

/** html2canvas cannot read CSS variables in its options, so resolve the background token first. */
const resolveBackground = () => {
  const value = getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
  return value ? `hsl(${value.split(/\s+/).join(", ")})` : null;
};

const CertificateFact = ({ icon: Icon, label, value, ltr }: { icon: LucideIcon; label: string; value: string; ltr?: boolean }) => (
  <div className="flex flex-col items-center gap-2 text-center">
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/5 text-primary">
      <Icon aria-hidden className="h-5 w-5" strokeWidth={1.5} />
    </span>
    <p className="text-caption text-muted-foreground">{label}</p>
    <p className="tabular text-body font-hrsd-bold text-ink" dir={ltr ? "ltr" : undefined}>
      {value}
    </p>
  </div>
);

const Certificate = () => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Mock data - in production, this would come from the database
  const isCertified = true;
  const organizationName = pagesCopy.cert_sample_org;

  // Final result data - supports percentage OR score format
  const finalPercentage: number | null = 87; // Example: 87%
  const finalScore: number | null = null; // Example: 87 / 100

  const issueDate = formatDate(new Date());
  // Generated once per visit so the preview, the PDF and its file name agree.
  const [certificateId] = useState(
    () => `CERT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`
  );
  const [verificationCode] = useState(() => `VRF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);

  // Get display value for final result
  const getFinalResultDisplay = () => {
    if (finalPercentage !== null && finalPercentage !== undefined) {
      return formatPercent(finalPercentage);
    }
    if (finalScore !== null && finalScore !== undefined) {
      return `${formatNumber(finalScore)} ${copy.of} ${formatNumber(100)}`;
    }
    return null;
  };

  const finalResultValue = getFinalResultDisplay();

  const breadcrumbs = [{ label: copy.account_dashboard, to: "/dashboard" }, { label: pagesCopy.cert_page_title }];

  if (!isCertified) {
    return (
      <>
        <PageHeader title={pagesCopy.cert_page_title} breadcrumbs={breadcrumbs} />
        <div className="rounded-lg border border-border bg-card">
          <EmptyState message={pagesCopy.cert_unavailable} icon={Award} action={{ label: pagesCopy.cert_back, to: "/dashboard" }} />
        </div>
      </>
    );
  }

  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;

    try {
      // Create canvas from the certificate card
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: resolveBackground(),
        logging: false,
      });

      // Calculate dimensions for A4 PDF
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? "portrait" : "landscape",
        unit: "mm",
        format: "a4",
      });

      // Add the canvas as image
      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Center the image on the page
      const scaleFactor = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * 0.9;
      const scaledWidth = imgWidth * scaleFactor;
      const scaledHeight = imgHeight * scaleFactor;
      const xOffset = (pdfWidth - scaledWidth) / 2;
      const yOffset = (pdfHeight - scaledHeight) / 2;

      pdf.addImage(imgData, "PNG", xOffset, yOffset, scaledWidth, scaledHeight);

      // Download the PDF
      pdf.save(`Certificate-${certificateId}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await handleDownloadPDF();
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <PageHeader
        className="print:hidden"
        title={pagesCopy.cert_page_title}
        description={pagesCopy.cert_page_desc}
        breadcrumbs={breadcrumbs}
        actions={
          <>
            <Button onClick={handleDownload} disabled={isDownloading} aria-busy={isDownloading} className="h-11 px-6">
              <Download aria-hidden />
              {isDownloading ? pagesCopy.cert_downloading : pagesCopy.cert_download}
            </Button>
            <Button variant="outline" onClick={handlePrint} className="h-11 px-6">
              <Printer aria-hidden />
              {pagesCopy.cert_print}
            </Button>
          </>
        }
      />

      <div className="mb-8 print:hidden">
        <OrganizationJourney />
      </div>

      {/* Preview panel */}
      <div className="rounded-lg border border-border bg-card p-4 md:p-8 print:border-0 print:p-0">
        {/* Certificate artwork: exported to PDF and printed as-is */}
        <div id="certificate-card" ref={certificateRef} className="mx-auto max-w-[880px] border border-border bg-card">
          <div className="h-1.5 bg-primary" />

          <div className="px-6 py-10 md:px-12 md:py-12 lg:px-16 lg:py-14">
            {/* Logos: Academy of Learning at the start, Vision 2030 at the end */}
            <div className="mb-10 flex items-start justify-between gap-6">
              <img src={aolLogo} alt={copy.logo_alt} className="h-12 w-auto object-contain md:h-16" />
              <img src={visionLogo} alt={copy.vision_alt} className="h-14 w-auto object-contain md:h-20" />
            </div>

            <div className="mb-10 flex flex-col items-center gap-4 text-center">
              <p className="font-hrsd-title text-h1 text-primary md:text-display">{pagesCopy.cert_title}</p>
              <span aria-hidden className="h-0.5 w-16 bg-accent" />
            </div>

            <p className="mb-6 text-center text-body text-muted-foreground md:text-h3">{pagesCopy.cert_granting}</p>

            <p className="mb-6 text-center font-hrsd-bold text-h2 text-primary md:text-h1">{organizationName}</p>

            <p className="mx-auto mb-10 max-w-[600px] text-center text-body text-ink">{pagesCopy.cert_confirm}</p>

            {finalResultValue && (
              <div className="mb-10 flex flex-col items-center gap-1 text-center">
                <p className="text-small text-muted-foreground">{pagesCopy.cert_result}</p>
                <p className="tabular font-hrsd-bold text-h2 text-primary" dir="ltr">
                  {finalResultValue}
                </p>
              </div>
            )}

            <div aria-hidden className="mb-10 h-px bg-border" />

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              <CertificateFact icon={CalendarDays} label={pagesCopy.cert_issue_date} value={issueDate} />
              <CertificateFact icon={FileText} label={pagesCopy.cert_id} value={certificateId} ltr />
              <CertificateFact icon={QrCode} label={pagesCopy.cert_verification} value={verificationCode} ltr />
            </div>

            {/* Official seal placeholder */}
            <div className="mt-10 flex justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-border px-3 text-center text-caption text-muted-foreground">
                {pagesCopy.cert_seal}
              </div>
            </div>
          </div>

          <div className="h-1.5 bg-primary" />
        </div>
      </div>

      {/* Print styles: A4, certificate only */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm;
          }

          html, body {
            height: 100%;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide everything by default */
          body > * {
            visibility: hidden !important;
          }

          /* Show only the certificate container */
          #certificate-card,
          #certificate-card * {
            visibility: visible !important;
          }

          #certificate-card {
            position: absolute !important;
            inset-inline-start: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Ensure background colors print */
          #certificate-card * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default Certificate;
