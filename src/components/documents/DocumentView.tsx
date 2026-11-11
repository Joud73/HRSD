import { useEffect, useMemo, useState, type ReactNode } from "react";
import QRCode from "qrcode";
import { documentsCopy as d } from "@/lib/copy";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useApprovedTool } from "@/hooks/useApprovedTool";
import type { AssessmentDocument, DocumentLine, DocumentSection, RegisterIndicator } from "@/services/resultsService";
import type { Track } from "@/services/toolService";
import { stripOrdinal } from "@/components/assessment/indicatorUtils";
import aolLogo from "@/assets/logos/aol.png";
import aolWhiteLogo from "@/assets/logos/aol-white.png";

export interface DocumentViewProps {
  document: AssessmentDocument;
  lines: DocumentLine[];
  indicators: RegisterIndicator[];
  /** Absolute URL of the organization's results page (the cover's QR code) */
  resultsUrl: string;
  /** Issuance renders the PDFs before the database numbers the documents: the number and date to print */
  number?: string | null;
  issuedAt?: string | null;
}

/** Review level -> chip colour in the plan's register (template: 0 danger, 1 warning, 2 accent, 4 success). */
const LEVEL_CHIP: Record<number, string> = {
  0: "bg-danger/10 text-danger",
  1: "bg-warning/15 text-warning-ink",
  2: "bg-accent/20 text-ink",
  4: "bg-success/10 text-success",
};

const PAGE = "doc-page relative mx-auto w-[210mm] min-h-[297mm] bg-card text-ink";

/* ── Building blocks ── */

const Qr = ({ value }: { value: string }) => {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    let alive = true;
    QRCode.toString(value, { type: "svg", margin: 0, errorCorrectionLevel: "M" }).then((s) => alive && setSvg(s));
    return () => {
      alive = false;
    };
  }, [value]);
  // The SVG string is generated locally by the qrcode library from our own URL
  return <div aria-hidden className="h-[28mm] w-[28mm] [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />;
};

const Cover = ({ title, orgName, year, resultsUrl }: { title: string; orgName: string; year: string; resultsUrl: string }) => (
  <section className={cn(PAGE, "flex h-[297mm] flex-col bg-primary p-[20mm] text-primary-foreground")} aria-label={title}>
    <img src={aolWhiteLogo} alt="" className="h-[16mm] w-auto self-start" />
    <div className="flex flex-1 flex-col justify-center gap-6">
      <span aria-hidden className="h-1 w-24 rounded-full bg-accent" />
      <h1 className="text-display font-hrsd-bold">{title}</h1>
      <p className="text-h3 font-hrsd-medium">{orgName}</p>
    </div>
    <div className="flex items-end justify-between gap-6">
      <p className="text-small opacity-90">{d.cover_rights(year)}</p>
      <div className="rounded-md bg-card p-2">
        <Qr value={resultsUrl} />
      </div>
    </div>
  </section>
);

const BackCover = ({ year }: { year: string }) => (
  <section className={cn(PAGE, "flex h-[297mm] flex-col items-center justify-center gap-6 bg-primary p-[20mm] text-primary-foreground")} aria-hidden>
    <img src={aolWhiteLogo} alt="" className="h-[18mm] w-auto" />
    <p className="tabular text-body" dir="ltr">
      {d.cover_site}
    </p>
    <p className="text-small opacity-90">{d.cover_rights(year)}</p>
  </section>
);

/** Inner page: running head with the logo, the document title and its number. */
const InnerPage = ({ title, number, children }: { title: string; number: string; children: ReactNode }) => (
  <section className={cn(PAGE, "doc-inner space-y-8 px-[18mm] py-[16mm]")}>
    <header className="flex items-center justify-between gap-6 border-b border-border pb-4" data-pdf-break>
      <img src={aolLogo} alt="" className="h-[10mm] w-auto" />
      <p className="text-caption text-muted-foreground">
        {title}
        <span aria-hidden className="mx-2">
          ·
        </span>
        <bdi className="tabular">{number}</bdi>
      </p>
    </header>
    {children}
  </section>
);

const SectionTitle = ({ n, title }: { n: number; title: string }) => (
  <h2 className="flex items-baseline gap-3 text-h3 font-hrsd-bold text-primary">
    <span className="tabular">{formatNumber(n)}.</span>
    {title}
  </h2>
);

const Facts = ({ rows }: { rows: [string, string][] }) => (
  <table className="w-full border-collapse text-small" data-pdf-keep>
    <caption className="mb-3 text-start text-h3 font-hrsd-bold text-primary">{d.facts_title}</caption>
    <tbody>
      {rows.map(([label, value]) => (
        <tr key={label} className="border border-border">
          <th scope="row" className="w-[45mm] bg-section-alt px-4 py-2.5 text-start font-hrsd-medium text-ink">
            {label}
          </th>
          <td className="tabular px-4 py-2.5 text-ink">
            <bdi>{value}</bdi>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const Chip = ({ children, tone }: { children: ReactNode; tone: "track" | "standard" }) => (
  <span
    className={cn(
      "inline-flex rounded-full px-3 py-0.5 text-caption font-hrsd-medium",
      tone === "track" ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
    )}
  >
    {children}
  </span>
);

/** Included lines of one section grouped by track then standard, in tool order; empty standards print "لا يوجد". */
function grouped(tracks: Track[], lines: DocumentLine[], section: DocumentSection) {
  const bySection = lines.filter((l) => l.section === section && l.included).sort((a, b) => a.sortOrder - b.sortOrder);
  return tracks.map((track) => ({
    track,
    standards: track.standards.map((standard) => ({ standard, lines: bySection.filter((l) => l.standardId === standard.id) })),
  }));
}

/** A bullet list drawn with explicit bullets: html2canvas puts RTL list markers on the wrong side. */
const Bullets = ({ items, leading = "leading-6" }: { items: { key: string; text: string }[]; leading?: string }) => (
  <ul className={cn("space-y-1.5 ps-4 text-small text-ink", leading)}>
    {items.map((item) => (
      <li key={item.key} className="flex gap-2.5">
        <span aria-hidden className="shrink-0 text-primary">
          •
        </span>
        <span>{item.text}</span>
      </li>
    ))}
  </ul>
);

const LineGroups = ({ tracks, lines, section }: { tracks: Track[]; lines: DocumentLine[]; section: DocumentSection }) => (
  <div className="space-y-6">
    {grouped(tracks, lines, section).map(({ track, standards }) => (
      <div key={track.id} className="space-y-4">
        {standards.map(({ standard, lines: own }) => (
          <div key={standard.id} className="space-y-2">
            <p className="flex flex-wrap gap-2" data-pdf-break>
              <Chip tone="track">{track.name}</Chip>
              <Chip tone="standard">{stripOrdinal(standard.name)}</Chip>
            </p>
            {own.length === 0 ? (
              <p className="ps-4 text-small text-muted-foreground">{d.none}</p>
            ) : (
              <Bullets items={own.map((l) => ({ key: l.id, text: l.text }))} />
            )}
          </div>
        ))}
      </div>
    ))}
  </div>
);

/* ── The two documents ── */

/**
 * One results document in the template structure, as A4 pages (`.doc-page`): the screen view, the print view and
 * the source of the issued PDF. All fixed texts come from documentsCopy.
 */
const DocumentView = ({ document: doc, lines, indicators, resultsUrl, number, issuedAt }: DocumentViewProps) => {
  const tool = useApprovedTool();
  const tracks = useMemo(() => tool.data?.tracks ?? [], [tool.data]);
  const h = doc.header;
  const orgName = h.organizationName ?? "-";
  const issued = issuedAt ?? doc.issuedAt;
  const docNumber = number ?? doc.number;
  const year = (issued ?? new Date().toISOString()).slice(0, 4);
  const pct = (v: number | null) => (v === null ? "-" : `${formatNumber(v)}%`);

  if (doc.kind === "feedback_report") {
    return (
      <div className="doc-sheets space-y-6">
        <Cover title={d.report_cover_title} orgName={orgName} year={year} resultsUrl={resultsUrl} />
        <InnerPage title={d.report_cover_title} number={docNumber ?? d.number_pending}>
          <Facts
            rows={[
              [d.fact_center, h.socialDevCenter ?? "-"],
              [d.fact_org_name, orgName],
              [d.fact_registration, h.registrationNumber ?? "-"],
              [d.fact_self_assessment_date, h.selfAssessmentDate ? formatDate(h.selfAssessmentDate) : "-"],
              [d.fact_issue_date, issued ? formatDate(issued) : d.status_draft],
              [d.fact_report_number, docNumber ?? d.number_pending],
            ]}
          />
          <section className="space-y-3">
            <SectionTitle n={1} title={d.report_s1_title} />
            <p className="text-small leading-7">{d.report_s1_body(orgName)}</p>
          </section>
          <section className="space-y-3">
            <SectionTitle n={2} title={d.report_s2_title} />
            <p className="text-small leading-7">{d.report_s2_intro}</p>
            <Bullets items={d.report_s2_points.map((point) => ({ key: point, text: point }))} leading="leading-7" />
          </section>
          <section className="space-y-3">
            <SectionTitle n={3} title={d.report_s3_title} />
            <p className="text-small leading-7">{d.report_s3_body}</p>
          </section>
        </InnerPage>
        <InnerPage title={d.report_cover_title} number={docNumber ?? d.number_pending}>
          <section className="space-y-4">
            <SectionTitle n={4} title={d.report_s4_title} />
            <LineGroups tracks={tracks} lines={lines} section="strength" />
          </section>
        </InnerPage>
        <InnerPage title={d.report_cover_title} number={docNumber ?? d.number_pending}>
          <section className="space-y-4">
            <SectionTitle n={5} title={d.report_s5_title} />
            <LineGroups tracks={tracks} lines={lines} section="opportunity" />
          </section>
        </InnerPage>
        <BackCover year={year} />
      </div>
    );
  }

  // خطة التحسين
  const levelOf = new Map(indicators.map((i) => [i.indicatorId, i]));
  const tasks = grouped(tracks, lines, "task");
  return (
    <div className="doc-sheets space-y-6">
      <Cover title={d.plan_cover_title} orgName={orgName} year={year} resultsUrl={resultsUrl} />
      <InnerPage title={d.plan_cover_title} number={docNumber ?? d.number_pending}>
        <Facts
          rows={[
            [d.fact_center, h.socialDevCenter ?? "-"],
            [d.fact_org_name, orgName],
            [d.fact_registration, h.registrationNumber ?? "-"],
            [d.fact_org_assessment_date, h.selfAssessmentDate ? formatDate(h.selfAssessmentDate) : "-"],
            [d.fact_plan_number, docNumber ?? d.number_pending],
          ]}
        />
        <section className="space-y-3">
          <SectionTitle n={1} title={d.plan_s1_title} />
          <p className="text-small leading-7">{d.plan_s1_body}</p>
          <dl className="grid grid-cols-3 border border-border text-center" data-pdf-keep>
            {(
              [
                [d.plan_score_self, pct(h.selfPct)],
                [d.plan_score_review, pct(h.reviewPct)],
                [d.plan_score_average, pct(h.cycleAvgReviewPct)],
              ] as const
            ).map(([label, value], i) => (
              <div key={label} className={cn("flex flex-col gap-1 px-4 py-4", i > 0 && "border-s border-border")}>
                <dt className="text-caption text-muted-foreground">{label}</dt>
                <dd className="tabular text-h3 font-hrsd-bold text-primary">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </InnerPage>
      <InnerPage title={d.plan_cover_title} number={docNumber ?? d.number_pending}>
        <section className="space-y-4">
          <SectionTitle n={2} title={d.plan_s2_title} />
          <table className="w-full border-collapse text-small">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th scope="col" className="px-3 py-2 text-start font-hrsd-medium">{d.plan_s2_col_indicator}</th>
                <th scope="col" className="w-[38mm] px-3 py-2 text-start font-hrsd-medium">{d.plan_s2_col_result}</th>
              </tr>
            </thead>
            <tbody>
              {tracks.flatMap((track) =>
                track.standards.flatMap((standard) =>
                  standard.indicators.map((indicator) => {
                    const r = levelOf.get(indicator.id);
                    return (
                      <tr key={indicator.id} className="border-b border-border align-top">
                        <td className="px-3 py-2.5">
                          <span className="mb-1.5 flex flex-wrap gap-1.5">
                            <Chip tone="track">{track.name}</Chip>
                            <Chip tone="standard">{stripOrdinal(standard.name)}</Chip>
                          </span>
                          <span className="block leading-6">
                            <span className="tabular font-hrsd-medium">{formatNumber(indicator.number)}. </span>
                            {stripOrdinal(indicator.text)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          {r ? (
                            <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-caption font-hrsd-medium", LEVEL_CHIP[r.reviewLevel] ?? LEVEL_CHIP[0])}>
                              {r.reviewLabel}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    );
                  })
                )
              )}
            </tbody>
          </table>
        </section>
      </InnerPage>
      <InnerPage title={d.plan_cover_title} number={docNumber ?? d.number_pending}>
        <section className="space-y-4">
          <SectionTitle n={3} title={d.plan_s3_title} />
          <table className="w-full border-collapse text-small">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th scope="col" className="w-[12mm] px-3 py-2 text-start font-hrsd-medium">
                  <span className="sr-only">#</span>
                </th>
                <th scope="col" className="px-3 py-2 text-start font-hrsd-medium">{d.plan_s3_col_task}</th>
                <th scope="col" className="w-[28mm] px-3 py-2 text-start font-hrsd-medium">{d.plan_s3_col_status}</th>
              </tr>
            </thead>
            <tbody>
              {tasks.flatMap(({ track, standards }) =>
                standards.flatMap(({ standard, lines: own }) => [
                  <tr key={`${standard.id}-head`} className="bg-primary/10">
                    <th colSpan={3} scope="colgroup" className="px-3 py-2 text-start font-hrsd-bold text-primary">
                      {track.name} - {stripOrdinal(standard.name)}
                    </th>
                  </tr>,
                  ...(own.length === 0
                    ? [
                        <tr key={`${standard.id}-none`} className="border-b border-border">
                          <td />
                          <td colSpan={2} className="px-3 py-2.5 text-muted-foreground">
                            {d.none}
                          </td>
                        </tr>,
                      ]
                    : own.map((l, i) => (
                        <tr key={l.id} className="border-b border-border align-top">
                          <td className="tabular px-3 py-2.5 text-muted-foreground">{formatNumber(i + 1)}</td>
                          <td className="px-3 py-2.5 leading-6">{l.text}</td>
                          <td className="px-3 py-2.5">{d.task_status[l.taskStatus]}</td>
                        </tr>
                      ))),
                ])
              )}
            </tbody>
          </table>
        </section>
      </InnerPage>
      <BackCover year={year} />
    </div>
  );
};

export default DocumentView;
