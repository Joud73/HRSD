/**
 * Client-side PDF from rendered DOM (html2canvas + jsPDF). Used by the certificate and the results documents.
 * Text is rasterised: the PDF is a faithful picture of the screen render, which keeps Arabic shaping and the
 * HRSDGov font exactly as the browser draws them.
 */
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const A4 = { width: 210, height: 297 } as const; // mm
const SCALE = 2;

/** html2canvas cannot read CSS variables in its options, so resolve a colour token first. */
export function resolveColor(token: string): string | null {
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  return value ? `hsl(${value.split(/\s+/).join(", ")})` : null;
}

/** Text baselines rely on the html2canvas metric fix in index.css (its sample image must stay inline). */
function capture(element: HTMLElement, background: string | null) {
  return html2canvas(element, { scale: SCALE, useCORS: true, allowTaint: true, backgroundColor: background, logging: false });
}

/** One element centred on a single A4 page (the certificate). */
export async function elementToPdf(element: HTMLElement, fileName: string): Promise<void> {
  const canvas = await capture(element, resolveColor("--background"));
  const imgWidth = A4.width;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const pdf = new jsPDF({ orientation: imgHeight > imgWidth ? "portrait" : "landscape", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const factor = Math.min(pageWidth / imgWidth, pageHeight / imgHeight) * 0.9;
  const w = imgWidth * factor;
  const h = imgHeight * factor;
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", (pageWidth - w) / 2, (pageHeight - h) / 2, w, h);
  pdf.save(fileName);
}

/**
 * Where a tall page may be cut: the bottom edge of every line-level block (list items, table rows, paragraphs,
 * headings), in CSS pixels from the top of the page element. Elements marked data-pdf-keep are never split.
 */
function breakPoints(page: HTMLElement): number[] {
  const top = page.getBoundingClientRect().top;
  const points = new Set<number>();
  page.querySelectorAll<HTMLElement>("li, tr, p, h2, h3, [data-pdf-break]").forEach((el) => {
    if (el.closest("[data-pdf-keep]") && !el.matches("[data-pdf-keep]")) return;
    points.add(Math.round(el.getBoundingClientRect().bottom - top));
  });
  return [...points].sort((a, b) => a - b);
}

/**
 * Slices [0, total] into A4 segments, cutting at the last break point that fits. The first segment already holds
 * the page's top padding, so it only keeps room for the bottom one; continuations keep room for both.
 */
function segments(total: number, a4: number, padding: number, points: number[]): [number, number][] {
  const out: [number, number][] = [];
  let start = 0;
  for (;;) {
    const max = start === 0 ? a4 - padding : a4 - 2 * padding;
    if (total - start <= (start === 0 ? a4 : max + padding)) break;
    const limit = start + max;
    const cut = points.filter((p) => p > start + max * 0.5 && p <= limit).pop() ?? limit;
    out.push([start, cut]);
    start = cut;
  }
  out.push([start, total]);
  return out;
}

export interface PdfProgress {
  page: number;
  pages: number;
}

/**
 * A4 PDF from a set of page elements (each `.doc-page`, rendered at A4 width). A page taller than A4 continues on
 * the next PDF page, cut between lines. Each PDF page keeps the page element's top and bottom padding.
 */
export async function pagesToPdf(pages: HTMLElement[], onProgress?: (p: PdfProgress) => void): Promise<Blob> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const background = resolveColor("--card") ?? "#ffffff";
  let first = true;
  for (let i = 0; i < pages.length; i += 1) {
    onProgress?.({ page: i + 1, pages: pages.length });
    const page = pages[i];
    const cssWidth = page.offsetWidth;
    const cssHeight = page.offsetHeight;
    const a4Css = (cssWidth * A4.height) / A4.width; // one A4 page in CSS pixels at this width
    const padding = parseFloat(getComputedStyle(page).paddingTop) || 0;
    const canvas = await capture(page, background);
    const ratio = canvas.width / cssWidth;

    // Continuation pages repeat the page's vertical padding, so content never touches the paper edge
    const parts = cssHeight <= a4Css + 1 ? [[0, cssHeight] as [number, number]] : segments(cssHeight, a4Css, padding, breakPoints(page));
    for (const [from, to] of parts) {
      const slice = document.createElement("canvas");
      const offsetTop = parts.length > 1 && from > 0 ? padding : 0;
      slice.width = canvas.width;
      slice.height = Math.ceil(a4Css * ratio);
      const ctx = slice.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context unavailable");
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, from * ratio, canvas.width, (to - from) * ratio, 0, offsetTop * ratio, canvas.width, (to - from) * ratio);
      if (!first) pdf.addPage("a4", "portrait");
      first = false;
      pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, A4.width, A4.height);
    }
  }
  return pdf.output("blob");
}
