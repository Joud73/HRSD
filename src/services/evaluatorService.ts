/** Evaluators: users with the evaluator role, their profile, and the assessments assigned to them. */
import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { adminCopy as t } from "@/lib/copy";
import { ServiceError } from "@/services/errors";
import type { AssessmentStatus } from "@/services/organizationService";

export interface Evaluator {
  userId: string;
  /** Falls back to the account email when no profile exists yet */
  fullName: string;
  idNumber: string | null;
  mobile: string | null;
  email: string | null;
  employer: string | null;
  isActive: boolean;
  /** Login email from profiles */
  accountEmail: string | null;
  hasProfile: boolean;
}

export type AssignmentCounts = Record<AssessmentStatus, number> & { total: number };

export interface EvaluatorListRow extends Evaluator {
  counts: AssignmentCounts;
}

export interface EvaluatorAssessment {
  assessmentId: string;
  status: AssessmentStatus;
  organizationId: string;
  organizationName: string;
  cycleName: string;
  assignedAt: string;
}

/** One assessment assigned to the signed-in evaluator (assessment_reviews), with its organization and progress. */
export interface ReviewRow {
  assessmentId: string;
  status: AssessmentStatus;
  submittedAt: string | null;
  assignedAt: string;
  organizationId: string;
  organizationName: string;
  registrationNumber: string;
  cycleName: string;
  /** yyyy-mm-dd */
  reviewStart: string;
  progressPct: number;
  scorePct: number;
  /** Review basis (confirmed items); shown once the review has started */
  reviewScorePct: number;
  /** Set when the assessment was returned at least once (the "أعيد إرساله" chip) */
  returnedAt: string | null;
}

export interface EvaluatorProfileInput {
  fullName: string;
  idNumber: string | null;
  mobile: string | null;
  email: string | null;
  employer: string | null;
  isActive: boolean;
}

function mapError(error: PostgrestError): ServiceError {
  const text = `${error.message} ${error.details ?? ""}`;
  if (text.includes("id_number_format")) return new ServiceError(t.err_id_number_format, error);
  if (error.code === "42501") return new ServiceError(t.err_not_allowed, error);
  return new ServiceError(t.err_save_generic, error);
}

const emptyCounts = (): AssignmentCounts => ({ total: 0, draft: 0, submitted: 0, under_review: 0, returned: 0, approved: 0, issued: 0 });

type ProfileRow = {
  user_id: string;
  full_name: string;
  id_number: string | null;
  mobile: string | null;
  email: string | null;
  employer: string | null;
  is_active: boolean;
};

const toEvaluator = (userId: string, p: ProfileRow | undefined, accountEmail: string | null): Evaluator => ({
  userId,
  fullName: p?.full_name ?? accountEmail ?? "-",
  idNumber: p?.id_number ?? null,
  mobile: p?.mobile ?? null,
  email: p?.email ?? null,
  employer: p?.employer ?? null,
  isActive: p?.is_active ?? true,
  accountEmail,
  hasProfile: !!p,
});

const profileColumns = "user_id, full_name, id_number, mobile, email, employer, is_active";

export async function listEvaluators(): Promise<EvaluatorListRow[]> {
  const { data: roles, error: rolesError } = await supabase.from("user_roles").select("user_id").eq("role", "evaluator");
  if (rolesError) throw rolesError;
  const ids = roles.map((r) => r.user_id);
  if (ids.length === 0) return [];

  const [profilesRes, accountsRes, reviewsRes] = await Promise.all([
    supabase.from("evaluator_profiles").select(profileColumns).in("user_id", ids),
    supabase.from("profiles").select("id, email").in("id", ids),
    supabase.from("assessment_reviews").select("evaluator_id, assessments(status)").in("evaluator_id", ids),
  ]);
  if (profilesRes.error) throw profilesRes.error;
  if (accountsRes.error) throw accountsRes.error;
  if (reviewsRes.error) throw reviewsRes.error;

  const profiles = new Map(profilesRes.data.map((p) => [p.user_id, p]));
  const emails = new Map(accountsRes.data.map((a) => [a.id, a.email]));
  const counts = new Map<string, AssignmentCounts>();
  for (const r of reviewsRes.data) {
    const status = r.assessments?.status;
    if (!status) continue;
    const c = counts.get(r.evaluator_id) ?? emptyCounts();
    c.total += 1;
    c[status] += 1;
    counts.set(r.evaluator_id, c);
  }

  return ids
    .map((id) => ({ ...toEvaluator(id, profiles.get(id), emails.get(id) ?? null), counts: counts.get(id) ?? emptyCounts() }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));
}

/** Null when the user does not have the evaluator role. */
export async function getEvaluator(userId: string): Promise<Evaluator | null> {
  const [roleRes, profileRes, accountRes] = await Promise.all([
    supabase.from("user_roles").select("user_id").eq("user_id", userId).eq("role", "evaluator").maybeSingle(),
    supabase.from("evaluator_profiles").select(profileColumns).eq("user_id", userId).maybeSingle(),
    supabase.from("profiles").select("email").eq("id", userId).maybeSingle(),
  ]);
  if (roleRes.error) throw roleRes.error;
  if (profileRes.error) throw profileRes.error;
  if (accountRes.error) throw accountRes.error;
  if (!roleRes.data) return null;
  return toEvaluator(userId, profileRes.data ?? undefined, accountRes.data?.email ?? null);
}

export async function listEvaluatorAssessments(userId: string): Promise<EvaluatorAssessment[]> {
  const { data, error } = await supabase
    .from("assessment_reviews")
    .select("assigned_at, assessments(id, status, organization_id, organizations(name), assessment_cycles(name))")
    .eq("evaluator_id", userId)
    .order("assigned_at", { ascending: false });
  if (error) throw error;
  return data.flatMap((r) =>
    r.assessments
      ? [
          {
            assessmentId: r.assessments.id,
            status: r.assessments.status,
            organizationId: r.assessments.organization_id,
            organizationName: r.assessments.organizations?.name ?? "-",
            cycleName: r.assessments.assessment_cycles?.name ?? "-",
            assignedAt: r.assigned_at,
          },
        ]
      : []
  );
}

/** Assessments assigned to me, newest assignment first. Reads only assessment_reviews and the real assessment tables. */
export async function listMyReviews(): Promise<ReviewRow[]> {
  const { data: session } = await supabase.auth.getSession();
  const me = session.session?.user.id;
  if (!me) return [];
  const { data, error } = await supabase
    .from("assessment_reviews")
    .select(
      "assigned_at, assessments!inner(id, status, submitted_at, returned_at, organization_id, organizations(name, registration_number), assessment_cycles(name, review_start))"
    )
    .eq("evaluator_id", me)
    .order("assigned_at", { ascending: false });
  if (error) throw error;
  const ids = data.map((r) => r.assessments.id);
  const progress = new Map<string, { progress_pct: number | null; score_pct: number | null; review_score_pct: number | null }>();
  if (ids.length > 0) {
    const res = await supabase
      .from("v_assessment_progress")
      .select("assessment_id, progress_pct, score_pct, review_score_pct")
      .in("assessment_id", ids);
    if (res.error) throw res.error;
    for (const p of res.data) if (p.assessment_id) progress.set(p.assessment_id, p);
  }
  return data.map((r) => {
    const a = r.assessments;
    const p = progress.get(a.id);
    return {
      assessmentId: a.id,
      status: a.status,
      submittedAt: a.submitted_at,
      assignedAt: r.assigned_at,
      organizationId: a.organization_id,
      organizationName: a.organizations?.name ?? "-",
      registrationNumber: a.organizations?.registration_number ?? "-",
      cycleName: a.assessment_cycles?.name ?? "-",
      reviewStart: a.assessment_cycles?.review_start ?? "",
      progressPct: p?.progress_pct ?? 0,
      scorePct: p?.score_pct ?? 0,
      reviewScorePct: p?.review_score_pct ?? 0,
      returnedAt: a.returned_at,
    };
  });
}

export async function upsertEvaluatorProfile(userId: string, input: EvaluatorProfileInput): Promise<void> {
  const clean = (v: string | null) => (v && v.trim() ? v.trim() : null);
  const { error } = await supabase.from("evaluator_profiles").upsert(
    {
      user_id: userId,
      full_name: input.fullName.trim(),
      id_number: clean(input.idNumber),
      mobile: clean(input.mobile),
      email: clean(input.email),
      employer: clean(input.employer),
      is_active: input.isActive,
    },
    { onConflict: "user_id" }
  );
  if (error) throw mapError(error);
}

export type EvaluatorContactInput = Pick<EvaluatorProfileInput, "mobile" | "email" | "employer">;

/** The evaluator edits their own contact fields and employer; the ID and name stay with the administrator. */
export async function updateMyContact(userId: string, input: EvaluatorContactInput): Promise<void> {
  const clean = (v: string | null) => (v && v.trim() ? v.trim() : null);
  const { error } = await supabase
    .from("evaluator_profiles")
    .update({ mobile: clean(input.mobile), email: clean(input.email), employer: clean(input.employer) })
    .eq("user_id", userId);
  if (error) throw mapError(error);
}

/**
 * Admin: creates the evaluator account (email invitation through the create-user function), then records
 * the HRSD fields in evaluator_profiles. Returns the new user id.
 */
export async function createEvaluator(input: Omit<EvaluatorProfileInput, "isActive"> & { email: string }): Promise<string> {
  const { data, error } = await supabase.functions.invoke("create-user", { body: { email: input.email.trim(), role: "evaluator" } });
  const message = (data as { error?: string } | null)?.error;
  if (error || message || !data?.id) throw new ServiceError(message ? `${t.users_create_failed}: ${message}` : t.users_create_failed, error ?? undefined);
  await upsertEvaluatorProfile(data.id as string, { ...input, isActive: true });
  return data.id as string;
}

/** Assigns (or reassigns) the evaluator of an assessment. Admin only (MoM point 12); the database enforces it. */
export async function assignEvaluator(assessmentId: string, evaluatorId: string): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  const { error } = await supabase.from("assessment_reviews").upsert(
    {
      assessment_id: assessmentId,
      evaluator_id: evaluatorId,
      assigned_by: session.session?.user.id ?? null,
      assigned_at: new Date().toISOString(),
    },
    { onConflict: "assessment_id" }
  );
  if (error) throw mapError(error);
}
