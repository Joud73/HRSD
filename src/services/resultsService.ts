/**
 * Results of an approved or issued assessment (BR-08, BR-09, BR-10, BR-12): frozen per-indicator results,
 * the two generated documents and their lines, issuance with the two PDFs, and recommended programs.
 * Everything is read from the database (assessment_results, views, RPCs); no client formula.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { documentsCopy as d } from "@/lib/copy";
import { ServiceError } from "@/services/errors";
import { mapError } from "@/services/assessmentService";

type Tables = Database["public"]["Tables"];
type Views = Database["public"]["Views"];

export type DocumentKind = Database["public"]["Enums"]["document_kind"];
export type DocumentStatus = Database["public"]["Enums"]["document_status"];
export type DocumentSection = Database["public"]["Enums"]["document_section"];
export type TaskStatus = "not_started" | "in_progress" | "done";

/** Feedback report first, then the improvement plan: the order every screen shows them in. */
export const DOCUMENT_KINDS: DocumentKind[] = ["feedback_report", "improvement_plan"];

export interface IndicatorResult {
  indicatorId: string;
  indicatorNumber: number;
  trackId: string;
  trackNumber: number;
  standardId: string;
  itemsTotal: number;
  selfCounted: number;
  reviewCounted: number;
  selfPct: number;
  reviewPct: number;
  selfLevel: number;
  reviewLevel: number;
  reviewLabel: string;
}

export interface TrackResult {
  trackId: string;
  trackNumber: number;
  indicatorsTotal: number;
  indicatorsBelowComplete: number;
  itemsTotal: number;
  selfCounted: number;
  reviewCounted: number;
  selfPct: number;
  reviewPct: number;
  selfLevel: number;
  reviewLevel: number;
}

export interface OverallResult {
  assessmentId: string;
  organizationId: string;
  cycleId: string;
  frozenAt: string | null;
  itemsTotal: number;
  selfCounted: number;
  reviewCounted: number;
  selfPct: number;
  reviewPct: number;
}

export interface FrozenResults {
  indicators: IndicatorResult[];
  tracks: TrackResult[];
  /** Null until the evaluator approves (nothing frozen yet) */
  overall: OverallResult | null;
}

/** Facts printed on both documents (document_header() in migration 11b). Percentages may be null before scoring. */
export interface DocumentHeader {
  organizationId: string | null;
  organizationName: string | null;
  registrationNumber: string | null;
  socialDevCenter: string | null;
  region: string | null;
  cycleName: string | null;
  /** yyyy-mm-dd */
  selfAssessmentDate: string | null;
  selfPct: number | null;
  reviewPct: number | null;
  cycleAvgReviewPct: number | null;
}

export interface AssessmentDocument {
  id: string;
  assessmentId: string;
  kind: DocumentKind;
  status: DocumentStatus;
  /** ت.م.{رقم التسجيل}|{yy.mm.dd}; null until issued */
  number: string | null;
  header: DocumentHeader;
  generatedAt: string;
  approvedAt: string | null;
  issuedAt: string | null;
  pdfPath: string | null;
  pdfSha256: string | null;
}

export interface DocumentLine {
  id: string;
  documentId: string;
  section: DocumentSection;
  trackId: string;
  standardId: string;
  indicatorId: string | null;
  itemId: string | null;
  sortOrder: number;
  text: string;
  /** The tool text an auto line was generated from; null for manual lines */
  originalText: string | null;
  source: "auto" | "manual";
  included: boolean;
  /** An auto line whose text differs from its original (kept on regeneration) */
  edited: boolean;
  taskStatus: TaskStatus;
}

export interface RecommendedProgram {
  programId: string;
  code: string;
  title: string;
  url: string | null;
  trackId: string | null;
  matchedIndicators: number;
  lowestLevel: number;
  indicatorIds: string[];
}

/** One indicator of the plan's register: its review level and label (frozen results, or the live view before approval). */
export interface RegisterIndicator {
  indicatorId: string;
  reviewLevel: number;
  reviewLabel: string;
}

export interface IssuedPdf {
  kind: DocumentKind;
  path: string;
  sha256: string;
}

const BUCKET = "documents";
const SIGNED_URL_SECONDS = 10 * 60;

// ---------------------------------------------------------------
// Frozen results
// ---------------------------------------------------------------

const toIndicatorResult = (r: Tables["assessment_results"]["Row"]): IndicatorResult => ({
  indicatorId: r.indicator_id,
  indicatorNumber: r.indicator_number,
  trackId: r.track_id,
  trackNumber: r.track_number,
  standardId: r.standard_id,
  itemsTotal: r.items_total,
  selfCounted: r.self_counted,
  reviewCounted: r.review_counted,
  selfPct: r.self_pct,
  reviewPct: r.review_pct,
  selfLevel: r.self_level,
  reviewLevel: r.review_level,
  reviewLabel: r.review_label,
});

const toTrackResult = (r: Views["v_assessment_results_tracks"]["Row"]): TrackResult => ({
  trackId: r.track_id ?? "",
  trackNumber: r.track_number ?? 0,
  indicatorsTotal: r.indicators_total ?? 0,
  indicatorsBelowComplete: r.indicators_below_complete ?? 0,
  itemsTotal: r.items_total ?? 0,
  selfCounted: r.self_counted ?? 0,
  reviewCounted: r.review_counted ?? 0,
  selfPct: r.self_pct ?? 0,
  reviewPct: r.review_pct ?? 0,
  selfLevel: r.self_level ?? 0,
  reviewLevel: r.review_level ?? 0,
});

const toOverallResult = (r: Views["v_assessment_results_overall"]["Row"]): OverallResult => ({
  assessmentId: r.assessment_id ?? "",
  organizationId: r.organization_id ?? "",
  cycleId: r.cycle_id ?? "",
  frozenAt: r.frozen_at,
  itemsTotal: r.items_total ?? 0,
  selfCounted: r.self_counted ?? 0,
  reviewCounted: r.review_counted ?? 0,
  selfPct: r.self_pct ?? 0,
  reviewPct: r.review_pct ?? 0,
});

/** Results frozen at approval. Row-level security hides them from the organization until issuance. */
export async function getFrozenResults(assessmentId: string): Promise<FrozenResults> {
  const [indicators, tracks, overall] = await Promise.all([
    supabase.from("assessment_results").select("*").eq("assessment_id", assessmentId).order("indicator_number"),
    supabase.from("v_assessment_results_tracks").select("*").eq("assessment_id", assessmentId).order("track_number"),
    supabase.from("v_assessment_results_overall").select("*").eq("assessment_id", assessmentId).maybeSingle(),
  ]);
  const error = indicators.error ?? tracks.error ?? overall.error;
  if (error) throw mapError(error, d.err_generic);
  return {
    indicators: (indicators.data ?? []).map(toIndicatorResult),
    tracks: (tracks.data ?? []).map(toTrackResult),
    overall: overall.data ? toOverallResult(overall.data) : null,
  };
}

// ---------------------------------------------------------------
// Documents
// ---------------------------------------------------------------

const str = (v: unknown): string | null => (typeof v === "string" && v !== "" ? v : null);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

function toHeader(json: unknown): DocumentHeader {
  const h = json && typeof json === "object" && !Array.isArray(json) ? (json as Record<string, unknown>) : {};
  return {
    organizationId: str(h.organization_id),
    organizationName: str(h.organization_name),
    registrationNumber: str(h.registration_number),
    socialDevCenter: str(h.social_dev_center),
    region: str(h.region),
    cycleName: str(h.cycle_name),
    selfAssessmentDate: str(h.self_assessment_date),
    selfPct: num(h.self_pct),
    reviewPct: num(h.review_pct),
    cycleAvgReviewPct: num(h.cycle_avg_review_pct),
  };
}

const toDocument = (r: Tables["assessment_documents"]["Row"]): AssessmentDocument => ({
  id: r.id,
  assessmentId: r.assessment_id,
  kind: r.kind,
  status: r.status,
  number: r.number,
  header: toHeader(r.header),
  generatedAt: r.generated_at,
  approvedAt: r.approved_at,
  issuedAt: r.issued_at,
  pdfPath: r.pdf_path,
  pdfSha256: r.pdf_sha256,
});

const toLine = (r: Tables["assessment_document_lines"]["Row"]): DocumentLine => ({
  id: r.id,
  documentId: r.document_id,
  section: r.section,
  trackId: r.track_id,
  standardId: r.standard_id,
  indicatorId: r.indicator_id,
  itemId: r.item_id,
  sortOrder: r.sort_order,
  text: r.text,
  originalText: r.original_text,
  source: r.source === "manual" ? "manual" : "auto",
  included: r.included,
  edited: r.edited,
  taskStatus: (["not_started", "in_progress", "done"] as const).find((s) => s === r.task_status) ?? "not_started",
});

const byKind = (a: AssessmentDocument, b: AssessmentDocument) => DOCUMENT_KINDS.indexOf(a.kind) - DOCUMENT_KINDS.indexOf(b.kind);

/** Both documents of the assessment (none until the last pending verdict is recorded). */
export async function listDocuments(assessmentId: string): Promise<AssessmentDocument[]> {
  const { data, error } = await supabase.from("assessment_documents").select("*").eq("assessment_id", assessmentId);
  if (error) throw mapError(error, d.err_generic);
  return data.map(toDocument).sort(byKind);
}

export async function listDocumentLines(documentId: string): Promise<DocumentLine[]> {
  const { data, error } = await supabase
    .from("assessment_document_lines")
    .select("*")
    .eq("document_id", documentId)
    .order("section")
    .order("sort_order");
  if (error) throw mapError(error, d.err_generic);
  return data.map(toLine);
}

export interface LinePatch {
  text?: string;
  included?: boolean;
  sortOrder?: number;
}

/** The evaluator may change text, included and sort order while the document is a draft under review. */
export async function updateLine(lineId: string, patch: LinePatch): Promise<void> {
  if (patch.text !== undefined && !patch.text.trim()) throw new ServiceError(d.err_line_empty);
  const row = {
    ...(patch.text !== undefined ? { text: patch.text.trim() } : {}),
    ...(patch.included !== undefined ? { included: patch.included } : {}),
    ...(patch.sortOrder !== undefined ? { sort_order: patch.sortOrder } : {}),
  };
  const { data, error } = await supabase.from("assessment_document_lines").update(row).eq("id", lineId).select("id");
  if (error) throw mapLineError(error);
  if (data.length === 0) throw new ServiceError(d.err_not_allowed);
}

export interface ManualLineInput {
  section: DocumentSection;
  trackId: string;
  standardId: string;
  text: string;
}

/** Adds a manual line at the end of its section. The database forces source = manual. */
export async function addManualLine(documentId: string, input: ManualLineInput): Promise<void> {
  if (!input.text.trim()) throw new ServiceError(d.err_line_empty);
  const { data: last, error: lastError } = await supabase
    .from("assessment_document_lines")
    .select("sort_order")
    .eq("document_id", documentId)
    .eq("section", input.section)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastError) throw mapError(lastError, d.err_generic);
  const { error } = await supabase.from("assessment_document_lines").insert({
    document_id: documentId,
    section: input.section,
    track_id: input.trackId,
    standard_id: input.standardId,
    text: input.text.trim(),
    sort_order: (last?.sort_order ?? 0) + 1,
  });
  if (error) throw mapLineError(error);
}

/** Removes a manual line; generated lines are excluded (included = false), never deleted. */
export async function removeManualLine(lineId: string): Promise<void> {
  const { data, error } = await supabase.from("assessment_document_lines").delete().eq("id", lineId).eq("source", "manual").select("id");
  if (error) throw mapLineError(error);
  if (data.length === 0) throw new ServiceError(d.err_not_allowed);
}

/** Rebuilds untouched generated lines from the current verdicts; edited and manual lines stay. */
export async function regenerateDocuments(assessmentId: string): Promise<void> {
  const { error } = await supabase.rpc("generate_assessment_documents", { p_assessment: assessmentId });
  if (error) throw mapError(error, d.err_generic);
}

function mapLineError(error: { message?: string; code?: string; details?: string | null }): ServiceError {
  const text = `${error.message ?? ""} ${error.details ?? ""}`;
  if (text.includes("A document line needs text")) return new ServiceError(d.err_line_empty, error);
  if (error.code === "42501" || /row-level security|Only text, included/i.test(text)) return new ServiceError(d.err_not_allowed, error);
  return mapError(error, d.err_generic);
}

// ---------------------------------------------------------------
// Issuance (final sign-off)
// ---------------------------------------------------------------

/** The number issuance expects today: ت.م.{رقم التسجيل}|{yy.mm.dd}. */
export async function getResultsNumber(assessmentId: string): Promise<string> {
  const { data, error } = await supabase.rpc("results_number", { p_assessment: assessmentId });
  if (error) throw mapError(error, d.err_generic);
  return data;
}

async function sha256Hex(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Uploads one document's PDF to documents/{assessment}/{kind}.pdf (replacing a previous attempt). */
export async function uploadDocumentPdf(assessmentId: string, kind: DocumentKind, blob: Blob): Promise<IssuedPdf> {
  const path = `${assessmentId}/${kind}.pdf`;
  const [sha256, upload] = await Promise.all([
    sha256Hex(blob),
    supabase.storage.from(BUCKET).upload(path, blob, { contentType: "application/pdf", upsert: true }),
  ]);
  if (upload.error) throw mapError(upload.error, d.err_generic);
  return { kind, path, sha256 };
}

/** approved -> issued: numbers and locks both documents, records the PDFs, opens the results to the organization. */
export async function issueResults(assessmentId: string, number: string, pdfs: IssuedPdf[]): Promise<void> {
  const { error } = await supabase.rpc("issue_results", {
    p_assessment: assessmentId,
    p_number: number,
    p_pdfs: pdfs.map((p) => ({ kind: p.kind, path: p.path, sha256: p.sha256 })),
  });
  if (error) throw mapError(error, d.err_generic);
}

/** Signed URL (10 minutes) of an issued document's PDF. */
export async function getDocumentPdfUrl(doc: AssessmentDocument): Promise<string> {
  if (!doc.pdfPath) throw new ServiceError(d.err_generic);
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.pdfPath, SIGNED_URL_SECONDS);
  if (error) throw mapError(error, d.err_generic);
  return data.signedUrl;
}

// ---------------------------------------------------------------
// Programs (طموحي)
// ---------------------------------------------------------------

/** Programs matched to the frozen results (default rule in v_program_recommendations), most indicators first. */
export async function listRecommendedPrograms(assessmentId: string): Promise<RecommendedProgram[]> {
  const { data, error } = await supabase
    .from("v_program_recommendations")
    .select("*")
    .eq("assessment_id", assessmentId)
    .order("matched_indicators", { ascending: false })
    .order("lowest_level");
  if (error) throw mapError(error, d.err_generic);
  return data.map((r) => ({
    programId: r.program_id ?? "",
    code: r.code ?? "",
    title: r.title ?? "",
    url: r.url,
    trackId: r.track_id,
    matchedIndicators: r.matched_indicators ?? 0,
    lowestLevel: r.lowest_level ?? 0,
    indicatorIds: r.indicator_ids ?? [],
  }));
}
