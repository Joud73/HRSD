/**
 * Self-assessment of an organization in the open cycle: answers, evidences, scores and submission.
 * Every function works from an assessment id, so the organization and the supervisor (proxy entry)
 * share the same calls. Scores come only from the database views (migrations 7, 8 and 11b).
 * An item is met only through its evidence: the database derives is_met, the client never sends it.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { assessmentCopy as t, documentsCopy as d } from "@/lib/copy";
import { formatNumber } from "@/lib/format";
import { ServiceError } from "@/services/errors";

type Views = Database["public"]["Views"];

export type AssessmentStatus = Database["public"]["Enums"]["assessment_status"];
export type CycleStatus = Database["public"]["Enums"]["cycle_status"];
export type EvidenceKind = Database["public"]["Enums"]["evidence_kind"];

/**
 * Whose assessment: the signed-in organization's, a given organization's in the open cycle (supervisor and admin),
 * or one assessment by id, read only (the assigned evaluator).
 */
export type AssessmentScope = { kind: "mine" } | { kind: "org"; orgId: string } | { kind: "assessment"; id: string };

export interface AssessmentCycle {
  id: string;
  name: string;
  status: CycleStatus;
  /** Dates are yyyy-mm-dd */
  submissionStart: string;
  submissionEnd: string;
  reviewStart: string;
  reviewEnd: string;
  approvalEnd: string;
}

export interface Assessment {
  id: string;
  cycleId: string;
  organizationId: string;
  status: AssessmentStatus;
  submittedAt: string | null;
  returnedAt: string | null;
  approvedAt: string | null;
  returnNote: string | null;
  /** Admin extension for this organization (yyyy-mm-dd); null = the cycle's submission end */
  submissionDue: string | null;
  cycle: AssessmentCycle;
  /** Effective deadline: submissionDue ?? cycle.submissionEnd */
  deadline: string;
}

export interface AssessmentHistoryRow {
  assessmentId: string;
  cycleId: string;
  cycleName: string;
  cycleStatus: CycleStatus;
  status: AssessmentStatus;
  approvedAt: string | null;
  scorePct: number;
}

export interface ItemResponse {
  /** Derived by the database: true while the item has at least one evidence */
  isMet: boolean;
  orgNote: string | null;
  /** Evaluator verdict: true confirmed, false rejected, null pending (or no evidence) */
  verified: boolean | null;
  /** Internal: evaluator, supervisor and admin only */
  evaluatorNote: string | null;
}

export interface Evidence {
  id: string;
  itemId: string;
  kind: EvidenceKind;
  /** Original file name (files) or the optional label (links) */
  fileName: string | null;
  url: string | null;
  storagePath: string | null;
  sizeBytes: number | null;
  uploadedAt: string;
}

export interface IndicatorScore {
  indicatorId: string;
  indicatorNumber: number;
  standardId: string;
  trackNumber: number;
  itemsTotal: number;
  itemsMet: number;
  itemsCounted: number;
  itemsWithEvidence: number;
  scorePct: number;
  progressPct: number;
  level: number;
  levelLabel: string;
  isComplete: boolean;
  isStarted: boolean;
  /** Review basis: items with evidence the evaluator confirmed */
  itemsReviewCounted: number;
  itemsReviewPending: number;
  itemsReviewRejected: number;
  reviewScorePct: number;
  reviewLevel: number;
  reviewLevelLabel: string;
}

export interface TrackScore {
  trackId: string;
  trackNumber: number;
  indicatorsTotal: number;
  indicatorsStarted: number;
  indicatorsComplete: number;
  itemsTotal: number;
  itemsMet: number;
  itemsCounted: number;
  /** Average of the indicators' score_pct (the track's estimated result) */
  scorePct: number;
  progressPct: number;
  itemsReviewCounted: number;
  itemsReviewPending: number;
  /** Average of the indicators' review_score_pct */
  reviewScorePct: number;
  avgReviewLevel: number;
}

export interface AssessmentProgress {
  indicatorsTotal: number;
  indicatorsStarted: number;
  indicatorsComplete: number;
  itemsTotal: number;
  itemsMet: number;
  itemsWithEvidence: number;
  itemsCounted: number;
  progressPct: number;
  scorePct: number;
  itemsReviewCounted: number;
  itemsReviewPending: number;
  itemsReviewRejected: number;
  reviewScorePct: number;
  avgReviewLevel: number;
}

/** Mirrors the evidences bucket (20 MB, these MIME types). */
export const EVIDENCE_MAX_BYTES = 20 * 1024 * 1024;
export const EVIDENCE_MIME_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};

const BUCKET = "evidences";
const SIGNED_URL_SECONDS = 10 * 60;
const LINK_RE = /^https?:\/\/\S+$/i;

/** Database, storage and RPC errors -> Arabic messages. Text checks run before the code check: some carry 42501. */
export function mapError(error: { message?: string; code?: string; details?: string | null } | null, fallback: string): ServiceError {
  const text = `${error?.message ?? ""} ${error?.details ?? ""}`;
  if (text.includes("not allowed for this user at this time")) return new ServiceError(t.err_cannot_submit, error);
  if (text.includes("No open cycle")) return new ServiceError(t.err_period_closed, error);
  if (text.includes("not linked to an organization")) return new ServiceError(t.err_no_organization, error);
  if (text.includes("Only an administrator or a supervisor")) return new ServiceError(t.err_proxy_not_allowed, error);
  if (text.includes("Organization not found")) return new ServiceError(t.err_org_not_found, error);
  if (text.includes("Item is excluded")) return new ServiceError(t.err_item_excluded, error);
  const pending = text.match(/(\d+) item\(s\) still await a verdict/);
  if (pending) return new ServiceError(d.err_pending_verdicts(formatNumber(Number(pending[1]))), error);
  if (text.includes("needs at least one evidence")) return new ServiceError(d.err_verdict_needs_evidence, error);
  if (text.includes("A note is required")) return new ServiceError(t.err_return_note_required, error);
  if (text.includes("Report number is stale")) return new ServiceError(d.err_stale_number, error);
  if (text.includes("Both documents must be approved")) return new ServiceError(d.err_docs_not_approved, error);
  if (/Only the assigned evaluator|Only the final sign-off|Evaluators cannot change/.test(text)) return new ServiceError(d.err_not_allowed, error);
  if (/payload too large|maximum allowed size/i.test(text)) return new ServiceError(t.err_file_too_large, error);
  if (/mime type|invalid_mime_type/i.test(text)) return new ServiceError(t.err_file_type, error);
  if (error?.code === "42501" || /row-level security|Unauthorized/i.test(text)) return new ServiceError(t.err_not_editable, error);
  return new ServiceError(fallback, error);
}

/** Today in Riyadh as yyyy-mm-dd; the database compares with current_date. */
export const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" });

/** Whole days from today (Riyadh) to a yyyy-mm-dd date; negative once it has passed. */
export function daysUntil(date: string): number {
  const toDay = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
  return Math.round((toDay(date) - toDay(today())) / 86_400_000);
}

// ---------------------------------------------------------------
// Assessment row
// ---------------------------------------------------------------

const assessmentColumns =
  "id, cycle_id, organization_id, status, submitted_at, returned_at, approved_at, return_note, submission_due, assessment_cycles!inner(id, name, status, submission_start, submission_end, review_start, review_end, approval_end)";

type AssessmentRow = {
  id: string;
  cycle_id: string;
  organization_id: string;
  status: AssessmentStatus;
  submitted_at: string | null;
  returned_at: string | null;
  approved_at: string | null;
  return_note: string | null;
  submission_due: string | null;
  assessment_cycles: {
    id: string;
    name: string;
    status: CycleStatus;
    submission_start: string;
    submission_end: string;
    review_start: string;
    review_end: string;
    approval_end: string;
  };
};

const toAssessment = (r: AssessmentRow): Assessment => ({
  id: r.id,
  cycleId: r.cycle_id,
  organizationId: r.organization_id,
  status: r.status,
  submittedAt: r.submitted_at,
  returnedAt: r.returned_at,
  approvedAt: r.approved_at,
  returnNote: r.return_note,
  submissionDue: r.submission_due,
  cycle: {
    id: r.assessment_cycles.id,
    name: r.assessment_cycles.name,
    status: r.assessment_cycles.status,
    submissionStart: r.assessment_cycles.submission_start,
    submissionEnd: r.assessment_cycles.submission_end,
    reviewStart: r.assessment_cycles.review_start,
    reviewEnd: r.assessment_cycles.review_end,
    approvalEnd: r.assessment_cycles.approval_end,
  },
  deadline: r.submission_due ?? r.assessment_cycles.submission_end,
});

async function getAssessmentById(id: string): Promise<Assessment> {
  const { data, error } = await supabase.from("assessments").select(assessmentColumns).eq("id", id).single();
  if (error) throw mapError(error, t.err_load);
  return toAssessment(data as AssessmentRow);
}

async function currentOrgId(): Promise<string | null> {
  const { data, error } = await supabase.rpc("current_org_id");
  if (error) throw mapError(error, t.err_load);
  return data ?? null;
}

/** Opens (or returns) the signed-in organization's assessment in the open cycle. */
export async function ensureMyAssessment(): Promise<Assessment> {
  const { data, error } = await supabase.rpc("ensure_my_assessment");
  if (error) throw mapError(error, t.err_load);
  return getAssessmentById(data.id);
}

/** Opens (or returns) an organization's assessment in the open cycle (supervisor and admin, proxy mode). */
export async function ensureAssessmentFor(orgId: string): Promise<Assessment> {
  const { data, error } = await supabase.rpc("ensure_assessment_for", { p_org: orgId });
  if (error) throw mapError(error, t.err_load);
  return getAssessmentById(data.id);
}

/** The assessment in the open cycle for the scope, or null when none exists yet (or no cycle is open). */
export async function getAssessment(scope: AssessmentScope): Promise<Assessment | null> {
  if (scope.kind === "assessment") {
    const { data, error } = await supabase.from("assessments").select(assessmentColumns).eq("id", scope.id).maybeSingle();
    if (error) throw mapError(error, t.err_load);
    return data ? toAssessment(data as AssessmentRow) : null;
  }
  const orgId = scope.kind === "org" ? scope.orgId : await currentOrgId();
  if (!orgId) return null;
  const { data, error } = await supabase
    .from("assessments")
    .select(assessmentColumns)
    .eq("organization_id", orgId)
    .eq("assessment_cycles.status", "open")
    .maybeSingle();
  if (error) throw mapError(error, t.err_load);
  return data ? toAssessment(data as AssessmentRow) : null;
}

/** Every assessment of the signed-in organization across cycles, newest cycle first, with its score. */
export async function listMyAssessmentHistory(): Promise<AssessmentHistoryRow[]> {
  const orgId = await currentOrgId();
  if (!orgId) return [];
  const { data, error } = await supabase
    .from("assessments")
    .select("id, cycle_id, status, approved_at, assessment_cycles!inner(name, status, submission_start)")
    .eq("organization_id", orgId);
  if (error) throw mapError(error, t.err_load);
  if (data.length === 0) return [];

  const { data: progress, error: progressError } = await supabase
    .from("v_assessment_progress")
    .select("assessment_id, score_pct")
    .in("assessment_id", data.map((a) => a.id));
  if (progressError) throw mapError(progressError, t.err_load);
  const byId = new Map(progress.map((p) => [p.assessment_id, p]));

  return data
    .slice()
    .sort((a, b) => b.assessment_cycles.submission_start.localeCompare(a.assessment_cycles.submission_start))
    .map((a) => ({
      assessmentId: a.id,
      cycleId: a.cycle_id,
      cycleName: a.assessment_cycles.name,
      cycleStatus: a.assessment_cycles.status,
      status: a.status,
      approvedAt: a.approved_at,
      scorePct: byId.get(a.id)?.score_pct ?? 0,
    }));
}

/**
 * Whether answers can change now. Mirror of assessment_editable_by_org(); the database stays the authority.
 * Open cycle, today between submission start and the effective deadline, status draft or returned.
 */
export function isEditable(assessment: Assessment, cycle: AssessmentCycle = assessment.cycle): boolean {
  const day = today();
  return (
    cycle.status === "open" &&
    day >= cycle.submissionStart &&
    day <= assessment.deadline &&
    (assessment.status === "draft" || assessment.status === "returned")
  );
}

// ---------------------------------------------------------------
// Answers
// ---------------------------------------------------------------

export async function listResponses(assessmentId: string): Promise<Map<string, ItemResponse>> {
  const { data, error } = await supabase
    .from("item_responses")
    .select("item_id, is_met, org_note, verified, evaluator_note")
    .eq("assessment_id", assessmentId);
  if (error) throw mapError(error, t.err_load);
  return new Map(
    data.map((r) => [r.item_id, { isMet: r.is_met, orgNote: r.org_note, verified: r.verified, evaluatorNote: r.evaluator_note }])
  );
}

/** Saves the organization's note on one item. Never sends is_met: the database derives it from the evidence. */
export async function saveItemNote(assessmentId: string, itemId: string, orgNote: string | null): Promise<void> {
  const row = { assessment_id: assessmentId, item_id: itemId, org_note: orgNote?.trim() || null };
  const { error } = await supabase.from("item_responses").upsert(row, { onConflict: "assessment_id,item_id" });
  if (error) throw mapError(error, t.err_save);
}

/**
 * The assigned evaluator's verdict on one item with evidence: true confirmed, false rejected, null back to pending.
 * The note is left as is when `evaluatorNote` is undefined. The evidence trigger guarantees the row exists,
 * so an update that touches nothing was refused by row-level security.
 */
export async function setVerdict(
  assessmentId: string,
  itemId: string,
  verified: boolean | null,
  evaluatorNote?: string | null
): Promise<void> {
  const patch = { verified, ...(evaluatorNote !== undefined ? { evaluator_note: evaluatorNote?.trim() || null } : {}) };
  const { data, error } = await supabase
    .from("item_responses")
    .update(patch)
    .eq("assessment_id", assessmentId)
    .eq("item_id", itemId)
    .select("item_id");
  if (error) throw mapError(error, t.err_save);
  if (data.length === 0) throw new ServiceError(d.err_not_allowed);
}

/** Items with evidence that still await the evaluator's verdict (approval gate). */
export async function getPendingVerdicts(assessmentId: string): Promise<number> {
  const { data, error } = await supabase.rpc("pending_verdicts", { p_assessment: assessmentId });
  if (error) throw mapError(error, t.err_load);
  return data ?? 0;
}

// ---------------------------------------------------------------
// Evidences
// ---------------------------------------------------------------

export async function listEvidences(assessmentId: string): Promise<Evidence[]> {
  const { data, error } = await supabase
    .from("evidences")
    .select("id, item_id, kind, file_name, url, storage_path, size_bytes, uploaded_at")
    .eq("assessment_id", assessmentId)
    .order("uploaded_at");
  if (error) throw mapError(error, t.err_load);
  return data.map((e) => ({
    id: e.id,
    itemId: e.item_id,
    kind: e.kind,
    fileName: e.file_name,
    url: e.url,
    storagePath: e.storage_path,
    sizeBytes: e.size_bytes,
    uploadedAt: e.uploaded_at,
  }));
}

async function sessionUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new ServiceError(t.err_not_editable);
  return id;
}

/** Client-side check against the bucket limits; returns the stored extension. */
export function validateEvidenceFile(file: File): string {
  if (file.size > EVIDENCE_MAX_BYTES) throw new ServiceError(t.err_file_too_large);
  const ext = EVIDENCE_MIME_TYPES[file.type];
  if (!ext) throw new ServiceError(t.err_file_type);
  return ext;
}

/** Uploads to {assessment}/{item}/{uuid}.{ext} (never the original name in the path), then records the row. */
export async function addFileEvidence(assessmentId: string, itemId: string, file: File): Promise<void> {
  const ext = validateEvidenceFile(file);
  const userId = await sessionUserId();
  const path = `${assessmentId}/${itemId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw mapError(uploadError, t.err_upload);

  const { error } = await supabase.from("evidences").insert({
    assessment_id: assessmentId,
    item_id: itemId,
    kind: "file",
    storage_path: path,
    file_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    uploaded_by: userId,
  });
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw mapError(error, t.err_upload);
  }
}

export async function addLinkEvidence(assessmentId: string, itemId: string, url: string, label?: string): Promise<void> {
  const clean = url.trim();
  if (!LINK_RE.test(clean)) throw new ServiceError(t.err_link_invalid);
  const userId = await sessionUserId();
  const { error } = await supabase.from("evidences").insert({
    assessment_id: assessmentId,
    item_id: itemId,
    kind: "link",
    url: clean,
    file_name: label?.trim() || null,
    uploaded_by: userId,
  });
  if (error) throw mapError(error, t.err_save);
}

/**
 * Deletes the row, then the stored file. Once the row is gone the evidence no longer counts, so a failed
 * file removal only leaves an orphan object: it is logged, not reported to the user.
 */
export async function removeEvidence(evidence: Evidence): Promise<void> {
  const { error } = await supabase.from("evidences").delete().eq("id", evidence.id);
  if (error) throw mapError(error, t.err_save);
  if (evidence.kind === "file" && evidence.storagePath) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([evidence.storagePath]);
    if (storageError) console.warn("Evidence row deleted but its file was not removed", evidence.storagePath, storageError);
  }
}

/** Signed URL valid for 10 minutes for files; the link itself for links. */
export async function getEvidenceUrl(evidence: Evidence): Promise<string> {
  if (evidence.kind === "link") {
    if (!evidence.url) throw new ServiceError(t.err_evidence_open);
    return evidence.url;
  }
  if (!evidence.storagePath) throw new ServiceError(t.err_evidence_open);
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(evidence.storagePath, SIGNED_URL_SECONDS);
  if (error) throw mapError(error, t.err_evidence_open);
  return data.signedUrl;
}

// ---------------------------------------------------------------
// Deadline extension (admin, MoM point 7)
// ---------------------------------------------------------------

/** Sets this organization's own deadline (yyyy-mm-dd), on or after the cycle's submission start; null restores the cycle's. */
export async function setSubmissionDue(assessment: Assessment, due: string | null): Promise<void> {
  if (due && due < assessment.cycle.submissionStart) throw new ServiceError(t.err_due_before_start);
  const { error } = await supabase.from("assessments").update({ submission_due: due }).eq("id", assessment.id);
  if (error) throw mapError(error, t.err_save);
}

// ---------------------------------------------------------------
// Submission
// ---------------------------------------------------------------

export async function submitAssessment(assessmentId: string): Promise<void> {
  const { error } = await supabase.rpc("transition_assessment", { p_assessment: assessmentId, p_to: "submitted" });
  if (error) throw mapError(error, t.err_cannot_submit);
}

/**
 * Review transitions by the assigned evaluator: submitted -> under_review, under_review -> returned (note) or approved
 * (gate: no pending verdict). Issuance is not a transition: it goes through issue_results() (resultsService).
 */
export type ReviewTransition = "under_review" | "returned" | "approved";

export async function transitionAssessment(assessmentId: string, to: ReviewTransition, note?: string): Promise<void> {
  const { error } = await supabase.rpc("transition_assessment", {
    p_assessment: assessmentId,
    p_to: to,
    ...(note?.trim() ? { p_note: note.trim() } : {}),
  });
  if (!error) return;
  const text = `${error.message} ${error.details ?? ""}`;
  if (text.includes("Cycle is not open")) throw new ServiceError(t.err_cycle_not_open, error);
  if (text.includes("not allowed for this user at this time")) throw new ServiceError(t.err_review_not_allowed, error);
  throw mapError(error, t.err_review_failed);
}

/** Final sign-off sends an approved assessment back to the evaluator (approved -> under_review); the note is required. */
export async function returnToEvaluator(assessmentId: string, note: string): Promise<void> {
  if (!note.trim()) throw new ServiceError(t.err_return_note_required);
  const { error } = await supabase.rpc("transition_assessment", { p_assessment: assessmentId, p_to: "under_review", p_note: note.trim() });
  if (!error) return;
  const text = `${error.message} ${error.details ?? ""}`;
  if (text.includes("Cycle is not open")) throw new ServiceError(t.err_cycle_not_open, error);
  if (text.includes("not allowed for this user at this time")) throw new ServiceError(t.err_review_not_allowed, error);
  throw mapError(error, t.err_review_failed);
}

// ---------------------------------------------------------------
// Scores (views only; no client formula)
// ---------------------------------------------------------------

const toIndicatorScore = (r: Views["v_indicator_scores"]["Row"]): IndicatorScore => ({
  indicatorId: r.indicator_id ?? "",
  indicatorNumber: r.indicator_number ?? 0,
  standardId: r.standard_id ?? "",
  trackNumber: r.track_number ?? 0,
  itemsTotal: r.items_total ?? 0,
  itemsMet: r.items_met ?? 0,
  itemsCounted: r.items_counted ?? 0,
  itemsWithEvidence: r.items_with_evidence ?? 0,
  scorePct: r.score_pct ?? 0,
  progressPct: r.progress_pct ?? 0,
  level: r.level ?? 0,
  levelLabel: r.level_label ?? "",
  isComplete: r.is_complete ?? false,
  isStarted: r.is_started ?? false,
  itemsReviewCounted: r.items_review_counted ?? 0,
  itemsReviewPending: r.items_review_pending ?? 0,
  itemsReviewRejected: r.items_review_rejected ?? 0,
  reviewScorePct: r.review_score_pct ?? 0,
  reviewLevel: r.review_level ?? 0,
  reviewLevelLabel: r.review_level_label ?? "",
});

const toTrackScore = (r: Views["v_track_scores"]["Row"]): TrackScore => ({
  trackId: r.track_id ?? "",
  trackNumber: r.track_number ?? 0,
  indicatorsTotal: r.indicators_total ?? 0,
  indicatorsStarted: r.indicators_started ?? 0,
  indicatorsComplete: r.indicators_complete ?? 0,
  itemsTotal: r.items_total ?? 0,
  itemsMet: r.items_met ?? 0,
  itemsCounted: r.items_counted ?? 0,
  scorePct: r.avg_score_pct ?? 0,
  progressPct: r.progress_pct ?? 0,
  itemsReviewCounted: r.items_review_counted ?? 0,
  itemsReviewPending: r.items_review_pending ?? 0,
  reviewScorePct: r.avg_review_score_pct ?? 0,
  avgReviewLevel: r.avg_review_level ?? 0,
});

const toProgress = (r: Views["v_assessment_progress"]["Row"]): AssessmentProgress => ({
  indicatorsTotal: r.indicators_total ?? 0,
  indicatorsStarted: r.indicators_started ?? 0,
  indicatorsComplete: r.indicators_complete ?? 0,
  itemsTotal: r.items_total ?? 0,
  itemsMet: r.items_met ?? 0,
  itemsWithEvidence: r.items_with_evidence ?? 0,
  itemsCounted: r.items_counted ?? 0,
  progressPct: r.progress_pct ?? 0,
  scorePct: r.score_pct ?? 0,
  itemsReviewCounted: r.items_review_counted ?? 0,
  itemsReviewPending: r.items_review_pending ?? 0,
  itemsReviewRejected: r.items_review_rejected ?? 0,
  reviewScorePct: r.review_score_pct ?? 0,
  avgReviewLevel: r.avg_review_level ?? 0,
});

export async function getIndicatorScores(assessmentId: string): Promise<IndicatorScore[]> {
  const { data, error } = await supabase
    .from("v_indicator_scores")
    .select("*")
    .eq("assessment_id", assessmentId)
    .order("indicator_number");
  if (error) throw mapError(error, t.err_load);
  return data.map(toIndicatorScore);
}

export async function getTrackScores(assessmentId: string): Promise<TrackScore[]> {
  const { data, error } = await supabase.from("v_track_scores").select("*").eq("assessment_id", assessmentId).order("track_number");
  if (error) throw mapError(error, t.err_load);
  return data.map(toTrackScore);
}

export async function getProgress(assessmentId: string): Promise<AssessmentProgress | null> {
  const { data, error } = await supabase.from("v_assessment_progress").select("*").eq("assessment_id", assessmentId).maybeSingle();
  if (error) throw mapError(error, t.err_load);
  return data ? toProgress(data) : null;
}

// ---------------------------------------------------------------
// Cycle scope
// ---------------------------------------------------------------

export async function listExcludedItemIds(cycleId: string): Promise<Set<string>> {
  const { data, error } = await supabase.from("cycle_item_exclusions").select("item_id").eq("cycle_id", cycleId);
  if (error) throw mapError(error, t.err_load);
  return new Set(data.map((x) => x.item_id));
}
