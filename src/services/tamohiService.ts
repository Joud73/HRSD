/**
 * طموحي: the learning catalog built on the approved tool (program = standard, module = indicator,
 * lesson = verification item). Personalisation reads the organization's latest issued results only.
 * Gaps, recommendations, priority and enrollment status all come from the database (views and triggers).
 */
import { supabase } from "@/integrations/supabase/client";
import { tamohiCopy as t } from "@/lib/copy";
import { ServiceError } from "@/services/errors";

export type Delivery = "online" | "in_person" | "blended" | "self_paced";
export type LessonKind = "practice" | "template" | "checkpoint";
export type Priority = "high" | "medium";
export type EnrollmentStatus = "enrolled" | "in_progress" | "completed";

export interface CatalogProgram {
  programId: string;
  code: string;
  title: string;
  subtitle: string | null;
  summary: string | null;
  audience: string | null;
  outcomes: string[];
  delivery: Delivery | null;
  sortOrder: number;
  trackId: string;
  trackNumber: number;
  trackName: string;
  standardId: string;
  standardNumber: number;
  standardName: string;
  modulesCount: number;
  lessonsCount: number;
  totalMinutes: number;
}

export interface ProgramModule {
  id: string;
  number: number;
  title: string;
  summary: string | null;
  indicatorId: string | null;
}

export interface ProgramLesson {
  id: string;
  moduleId: string;
  itemId: string | null;
  number: number;
  /** What the organization has in place after the lesson (the item text): the completion criterion */
  title: string;
  /** How to get there (the item's improvement action): the application steps */
  objective: string;
  kind: LessonKind;
  durationMinutes: number;
}

export interface ProgramIndicator {
  id: string;
  number: number;
  text: string;
}

export interface ProgramDetail {
  program: CatalogProgram;
  modules: ProgramModule[];
  lessons: ProgramLesson[];
  indicators: ProgramIndicator[];
}

export interface IssuedAssessment {
  id: string;
  cycleName: string;
  issuedAt: string;
}

export interface Recommendation {
  programId: string;
  code: string;
  title: string;
  url: string | null;
  trackId: string | null;
  matchedIndicators: number;
  lowestLevel: number;
  indicatorIds: string[];
  gapLessons: number;
  lessonsTotal: number;
  priority: Priority;
  rank: number;
}

export interface TrackReadiness {
  trackId: string;
  trackNumber: number;
  reviewPct: number;
  itemsTotal: number;
  reviewCounted: number;
}

export interface Readiness {
  overallPct: number;
  itemsTotal: number;
  reviewCounted: number;
  tracks: TrackReadiness[];
}

export interface IndicatorLevel {
  indicatorId: string;
  reviewLevel: number;
  reviewLabel: string;
}

export interface Enrollment {
  enrollmentId: string;
  programId: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  completedAt: string | null;
  lessonsDone: number;
  lessonsTotal: number;
}

/** Database errors to the Arabic messages of this area. */
export function mapTamohiError(error: { message?: string; code?: string; details?: string | null } | null, fallback: string = t.err_generic) {
  const text = `${error?.message ?? ""} ${error?.details ?? ""}`;
  if (error?.code === "23505" || /duplicate key/i.test(text)) return new ServiceError(t.err_already_enrolled, error);
  if (text.includes("Enrollments change through lesson progress only")) return new ServiceError(t.err_not_allowed, error);
  if (error?.code === "42501" || /row-level security|permission denied/i.test(text)) return new ServiceError(t.err_not_allowed, error);
  return new ServiceError(fallback, error);
}

type CatalogRow = {
  program_id: string | null; code: string | null; title: string | null; subtitle: string | null; summary: string | null;
  audience: string | null; outcomes: string[] | null; delivery: string | null; sort_order: number | null;
  track_id: string | null; track_number: number | null; track_name: string | null;
  standard_id: string | null; standard_number: number | null; standard_name: string | null;
  modules_count: number | null; lessons_count: number | null; total_minutes: number | null;
};

const toProgram = (r: CatalogRow): CatalogProgram => ({
  programId: r.program_id ?? "",
  code: r.code ?? "",
  title: r.title ?? "",
  subtitle: r.subtitle,
  summary: r.summary,
  audience: r.audience,
  outcomes: r.outcomes ?? [],
  delivery: (r.delivery as Delivery | null) ?? null,
  sortOrder: r.sort_order ?? 0,
  trackId: r.track_id ?? "",
  trackNumber: r.track_number ?? 0,
  trackName: r.track_name ?? "",
  standardId: r.standard_id ?? "",
  standardNumber: r.standard_number ?? 0,
  standardName: r.standard_name ?? "",
  modulesCount: r.modules_count ?? 0,
  lessonsCount: r.lessons_count ?? 0,
  totalMinutes: r.total_minutes ?? 0,
});

/* ── Catalog ── */

export async function listCatalog(): Promise<CatalogProgram[]> {
  const { data, error } = await supabase.from("v_program_catalog").select("*").order("sort_order");
  if (error) throw mapTamohiError(error, t.load_error);
  return data.map(toProgram);
}

/** A program with its modules, lessons and indicators; null when the code does not exist (or is inactive). */
export async function getProgram(code: string): Promise<ProgramDetail | null> {
  const { data: row, error } = await supabase.from("v_program_catalog").select("*").eq("code", code).maybeSingle();
  if (error) throw mapTamohiError(error, t.load_error);
  if (!row) return null;
  const program = toProgram(row);

  const [modules, indicators] = await Promise.all([
    supabase.from("program_modules").select("id, number, title, summary, indicator_id").eq("program_id", program.programId).order("number"),
    supabase.from("program_indicators").select("indicators!inner(id, number, text)").eq("program_id", program.programId),
  ]);
  if (modules.error) throw mapTamohiError(modules.error, t.load_error);
  if (indicators.error) throw mapTamohiError(indicators.error, t.load_error);

  const moduleIds = modules.data.map((m) => m.id);
  const lessons = moduleIds.length
    ? await supabase
        .from("program_lessons")
        .select("id, module_id, item_id, number, title, objective, kind, duration_minutes")
        .in("module_id", moduleIds)
        .order("number")
    : { data: [], error: null };
  if (lessons.error) throw mapTamohiError(lessons.error, t.load_error);

  const moduleOrder = new Map(modules.data.map((m) => [m.id, m.number]));
  return {
    program,
    modules: modules.data.map((m) => ({ id: m.id, number: m.number, title: m.title, summary: m.summary, indicatorId: m.indicator_id })),
    lessons: lessons.data
      .map((l) => ({
        id: l.id,
        moduleId: l.module_id,
        itemId: l.item_id,
        number: l.number,
        title: l.title,
        objective: l.objective,
        kind: l.kind as LessonKind,
        durationMinutes: l.duration_minutes,
      }))
      .sort((a, b) => (moduleOrder.get(a.moduleId) ?? 0) - (moduleOrder.get(b.moduleId) ?? 0) || a.number - b.number),
    indicators: indicators.data
      .map((r) => r.indicators as unknown as ProgramIndicator)
      .sort((a, b) => a.number - b.number),
  };
}

/* ── Personalisation (issued results only) ── */

/** The signed-in organization's latest issued assessment, or null. */
export async function getMyIssuedAssessment(): Promise<IssuedAssessment | null> {
  const { data, error } = await supabase
    .from("assessments")
    .select("id, issued_at, assessment_cycles!inner(name)")
    .eq("status", "issued")
    .order("issued_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw mapTamohiError(error, t.load_error);
  if (!data) return null;
  const cycle = data.assessment_cycles as unknown as { name: string };
  return { id: data.id, cycleName: cycle.name, issuedAt: data.issued_at ?? "" };
}

export async function listRecommendations(assessmentId: string): Promise<Recommendation[]> {
  const { data, error } = await supabase.from("v_program_recommendations").select("*").eq("assessment_id", assessmentId).order("rank");
  if (error) throw mapTamohiError(error, t.load_error);
  return data.map((r) => ({
    programId: r.program_id ?? "",
    code: r.code ?? "",
    title: r.title ?? "",
    url: r.url,
    trackId: r.track_id,
    matchedIndicators: r.matched_indicators ?? 0,
    lowestLevel: r.lowest_level ?? 0,
    indicatorIds: r.indicator_ids ?? [],
    gapLessons: r.gap_lessons ?? 0,
    lessonsTotal: r.lessons_total ?? 0,
    priority: (r.priority as Priority) ?? "medium",
    rank: r.rank ?? 0,
  }));
}

/** Review percentage per track and overall, from the results frozen at approval. */
export async function getTrackReadiness(assessmentId: string): Promise<Readiness> {
  const [tracks, overall] = await Promise.all([
    supabase.from("v_assessment_results_tracks").select("*").eq("assessment_id", assessmentId).order("track_number"),
    supabase.from("v_assessment_results_overall").select("*").eq("assessment_id", assessmentId).maybeSingle(),
  ]);
  if (tracks.error) throw mapTamohiError(tracks.error, t.load_error);
  if (overall.error) throw mapTamohiError(overall.error, t.load_error);
  return {
    overallPct: overall.data?.review_pct ?? 0,
    itemsTotal: overall.data?.items_total ?? 0,
    reviewCounted: overall.data?.review_counted ?? 0,
    tracks: tracks.data.map((r) => ({
      trackId: r.track_id ?? "",
      trackNumber: r.track_number ?? 0,
      reviewPct: r.review_pct ?? 0,
      itemsTotal: r.items_total ?? 0,
      reviewCounted: r.review_counted ?? 0,
    })),
  };
}

/** Lessons whose item the evaluator did not confirm, for the whole catalog or one program. */
export async function listLessonGaps(assessmentId: string, programId?: string): Promise<Set<string>> {
  let query = supabase.from("v_program_lesson_gaps").select("lesson_id").eq("assessment_id", assessmentId).eq("is_gap", true);
  if (programId) query = query.eq("program_id", programId);
  const { data, error } = await query;
  if (error) throw mapTamohiError(error, t.load_error);
  return new Set(data.map((r) => r.lesson_id ?? "").filter(Boolean));
}

export async function listIndicatorResults(assessmentId: string, indicatorIds: string[]): Promise<IndicatorLevel[]> {
  if (indicatorIds.length === 0) return [];
  const { data, error } = await supabase
    .from("assessment_results")
    .select("indicator_id, review_level, review_label")
    .eq("assessment_id", assessmentId)
    .in("indicator_id", indicatorIds);
  if (error) throw mapTamohiError(error, t.load_error);
  return data.map((r) => ({ indicatorId: r.indicator_id, reviewLevel: r.review_level, reviewLabel: r.review_label }));
}

/* ── Enrollment and progress (organization) ── */

export async function listMyEnrollments(): Promise<Enrollment[]> {
  const { data, error } = await supabase.from("v_enrollment_progress").select("*").order("enrolled_at");
  if (error) throw mapTamohiError(error, t.load_error);
  return data.map((r) => ({
    enrollmentId: r.enrollment_id ?? "",
    programId: r.program_id ?? "",
    status: (r.status as EnrollmentStatus) ?? "enrolled",
    enrolledAt: r.enrolled_at ?? "",
    completedAt: r.completed_at,
    lessonsDone: r.lessons_done ?? 0,
    lessonsTotal: r.lessons_total ?? 0,
  }));
}

/** Enrolls the signed-in organization; status and timestamps are set by the database. */
export async function enroll(programId: string, assessmentId: string | null): Promise<string> {
  const { data: orgId, error: orgError } = await supabase.rpc("current_org_id");
  if (orgError || !orgId) throw mapTamohiError(orgError, t.err_not_allowed);
  const { data, error } = await supabase
    .from("program_enrollments")
    .insert({ program_id: programId, organization_id: orgId, assessment_id: assessmentId })
    .select("id")
    .single();
  if (error) throw mapTamohiError(error);
  return data.id;
}

/** Withdraws while nothing is done yet (the database refuses afterwards: 0 rows). */
export async function withdraw(enrollmentId: string): Promise<void> {
  const { data, error } = await supabase.from("program_enrollments").delete().eq("id", enrollmentId).select("id");
  if (error) throw mapTamohiError(error);
  if (data.length === 0) throw new ServiceError(t.err_cannot_withdraw);
}

export async function listLessonProgress(enrollmentId: string): Promise<Set<string>> {
  const { data, error } = await supabase.from("lesson_progress").select("lesson_id").eq("enrollment_id", enrollmentId);
  if (error) throw mapTamohiError(error, t.load_error);
  return new Set(data.map((r) => r.lesson_id));
}

export async function setLessonDone(enrollmentId: string, lessonId: string, done: boolean): Promise<void> {
  if (done) {
    const { error } = await supabase.from("lesson_progress").insert({ enrollment_id: enrollmentId, lesson_id: lessonId });
    // Already recorded (double click, another tab): the outcome is the same
    if (error && error.code !== "23505") throw mapTamohiError(error, t.err_progress);
  } else {
    const { error } = await supabase.from("lesson_progress").delete().eq("enrollment_id", enrollmentId).eq("lesson_id", lessonId);
    if (error) throw mapTamohiError(error, t.err_progress);
  }
}
