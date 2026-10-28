/** Organizations: HRSD profile, delegate (representative), and the admin list with current-cycle status. */
import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { adminCopy as t, authCopy } from "@/lib/copy";
import { getOpenCycle } from "@/services/cycleService";
import { ServiceError } from "@/services/errors";

export type EntityType = Database["public"]["Enums"]["entity_type"];
export type AssessmentStatus = Database["public"]["Enums"]["assessment_status"];

export interface Organization {
  id: string;
  name: string;
  registrationNumber: string;
  entityType: EntityType | null;
  /** yyyy-mm-dd */
  registrationDate: string | null;
  subClassificationId: string | null;
  subClassificationName: string | null;
  socialDevCenterId: string | null;
  socialDevCenterName: string | null;
  region: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  employeesCount: number | null;
  email: string | null;
  website: string | null;
  createdAt: string;
}

export interface Delegate {
  id: string;
  userId: string | null;
  fullName: string | null;
  idNumber: string | null;
  mobile: string | null;
  email: string | null;
}

export interface OrganizationDetail extends Organization {
  delegate: Delegate | null;
}

export type OrganizationInput = Omit<Organization, "id" | "subClassificationName" | "socialDevCenterName" | "createdAt">;
export type DelegateInput = Omit<Delegate, "id" | "userId">;

export interface OrganizationListRow {
  id: string;
  name: string;
  registrationNumber: string;
  entityType: EntityType | null;
  /** Assessment in the open cycle; null when the organization has not started one (or no cycle is open) */
  assessmentId: string | null;
  assessmentStatus: AssessmentStatus | null;
  evaluatorId: string | null;
  evaluatorName: string | null;
  /** Effective self-assessment deadline (yyyy-mm-dd): the extension, else the cycle submission end; null without a cycle */
  deadline: string | null;
  /** Admin extension of the deadline for this organization */
  submissionDue: string | null;
  /** progress_pct from v_assessment_progress; null without an assessment */
  progressPct: number | null;
}

/** Constraint and trigger errors -> Arabic messages. */
function mapError(error: PostgrestError): ServiceError {
  const text = `${error.message} ${error.details ?? ""}`;
  if (text.includes("organizations_registration_number_key")) return new ServiceError(t.org_err_registration_taken, error);
  if (text.includes("id_number_format")) return new ServiceError(t.err_id_number_format, error);
  if (text.includes("employees_count_check")) return new ServiceError(t.org_err_employees_count, error);
  if (error.code === "42501") return new ServiceError(t.err_not_allowed, error);
  return new ServiceError(t.err_save_generic, error);
}

const orgColumns =
  "id, name, registration_number, entity_type, registration_date, sub_classification_id, social_dev_center_id, region, city, district, address, employees_count, email, website, created_at, sub_classifications(name), social_dev_centers(name)";

export async function getOrganization(id: string): Promise<OrganizationDetail | null> {
  const [orgRes, delegateRes] = await Promise.all([
    supabase.from("organizations").select(orgColumns).eq("id", id).maybeSingle(),
    supabase
      .from("delegates")
      .select("id, user_id, full_name, id_number, mobile, email")
      .eq("organization_id", id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (orgRes.error) throw orgRes.error;
  if (delegateRes.error) throw delegateRes.error;
  const o = orgRes.data;
  if (!o) return null;
  const d = delegateRes.data;
  return {
    id: o.id,
    name: o.name,
    registrationNumber: o.registration_number,
    entityType: o.entity_type,
    registrationDate: o.registration_date,
    subClassificationId: o.sub_classification_id,
    subClassificationName: o.sub_classifications?.name ?? null,
    socialDevCenterId: o.social_dev_center_id,
    socialDevCenterName: o.social_dev_centers?.name ?? null,
    region: o.region,
    city: o.city,
    district: o.district,
    address: o.address,
    employeesCount: o.employees_count,
    email: o.email,
    website: o.website,
    createdAt: o.created_at,
    delegate: d
      ? { id: d.id, userId: d.user_id, fullName: d.full_name, idNumber: d.id_number, mobile: d.mobile, email: d.email }
      : null,
  };
}

/** Empty strings are stored as null. */
const clean = (v: string | null) => (v && v.trim() ? v.trim() : null);

export async function updateOrganization(id: string, input: OrganizationInput): Promise<void> {
  const { error } = await supabase
    .from("organizations")
    .update({
      name: input.name.trim(),
      registration_number: input.registrationNumber.trim(),
      entity_type: input.entityType,
      registration_date: input.registrationDate || null,
      sub_classification_id: input.subClassificationId,
      social_dev_center_id: input.socialDevCenterId,
      region: clean(input.region),
      city: clean(input.city),
      district: clean(input.district),
      address: clean(input.address),
      employees_count: input.employeesCount,
      email: clean(input.email),
      website: clean(input.website),
    })
    .eq("id", id);
  if (error) throw mapError(error);
}

/**
 * Updates the organization's delegate, or creates one linked to the organization's account
 * (the first profile of the organization) when none exists yet.
 */
export async function saveDelegate(organizationId: string, delegateId: string | null, input: DelegateInput): Promise<void> {
  const row = {
    full_name: clean(input.fullName),
    id_number: clean(input.idNumber),
    mobile: clean(input.mobile),
    email: clean(input.email),
  };
  if (delegateId) {
    const { error } = await supabase.from("delegates").update(row).eq("id", delegateId);
    if (error) throw mapError(error);
    return;
  }
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("organization_id", organizationId)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (profileError) throw mapError(profileError);
  const { error } = await supabase.from("delegates").insert({ ...row, organization_id: organizationId, user_id: profile?.id ?? null });
  if (error) throw mapError(error);
}

/** Every organization with its assessment status and assigned evaluator in the open cycle. */
export async function listOrganizations(): Promise<OrganizationListRow[]> {
  const [orgRes, cycle] = await Promise.all([
    supabase.from("organizations").select("id, name, registration_number, entity_type").order("name"),
    getOpenCycle(),
  ]);
  if (orgRes.error) throw orgRes.error;

  let assessments: { id: string; organization_id: string; status: AssessmentStatus; evaluator_id: string | null; submission_due: string | null }[] = [];
  const progress = new Map<string, number>();
  if (cycle) {
    const [assessRes, progressRes] = await Promise.all([
      supabase.from("assessments").select("id, organization_id, status, submission_due, assessment_reviews(evaluator_id)").eq("cycle_id", cycle.id),
      supabase.from("v_assessment_progress").select("assessment_id, progress_pct").eq("cycle_id", cycle.id),
    ]);
    if (assessRes.error) throw assessRes.error;
    if (progressRes.error) throw progressRes.error;
    assessments = assessRes.data.map((a) => ({
      id: a.id,
      organization_id: a.organization_id,
      status: a.status,
      evaluator_id: a.assessment_reviews?.evaluator_id ?? null,
      submission_due: a.submission_due,
    }));
    for (const p of progressRes.data) if (p.assessment_id) progress.set(p.assessment_id, p.progress_pct ?? 0);
  }

  const evaluatorIds = [...new Set(assessments.map((a) => a.evaluator_id).filter((v): v is string => !!v))];
  const names = new Map<string, string>();
  if (evaluatorIds.length > 0) {
    const { data, error } = await supabase.from("evaluator_profiles").select("user_id, full_name").in("user_id", evaluatorIds);
    if (error) throw error;
    for (const p of data) names.set(p.user_id, p.full_name);
  }

  const byOrg = new Map(assessments.map((a) => [a.organization_id, a]));
  return orgRes.data.map((o) => {
    const a = byOrg.get(o.id);
    return {
      id: o.id,
      name: o.name,
      registrationNumber: o.registration_number,
      entityType: o.entity_type,
      assessmentId: a?.id ?? null,
      assessmentStatus: a?.status ?? null,
      evaluatorId: a?.evaluator_id ?? null,
      evaluatorName: a?.evaluator_id ? names.get(a.evaluator_id) ?? null : null,
      submissionDue: a?.submission_due ?? null,
      deadline: cycle ? a?.submission_due ?? cycle.submissionEnd : null,
      progressPct: a ? progress.get(a.id) ?? 0 : null,
    };
  });
}

export interface OrganizationRequestInput {
  entityType: EntityType;
  registrationNumber: string;
  registrationDate: string;
  organizationName: string;
  subClassificationId: string;
  socialDevCenterId: string;
  region: string;
  city: string;
  district: string | null;
  address: string | null;
  employeesCount: number | null;
  organizationEmail: string;
  website: string | null;
  /** Account (login) email; the account is created when the request is approved */
  email: string;
  delegateName: string;
  delegateIdNumber: string;
  delegateMobile: string;
  delegateEmail: string;
}

/** Public registration: one pending request with every field the approval copies into organizations and delegates. */
export async function submitOrganizationRequest(input: OrganizationRequestInput): Promise<void> {
  const { error } = await supabase.from("organization_requests").insert({
    entity_type: input.entityType,
    registration_number: input.registrationNumber.trim(),
    registration_date: input.registrationDate,
    organization_name: input.organizationName.trim(),
    sub_classification_id: input.subClassificationId,
    social_dev_center_id: input.socialDevCenterId,
    region: input.region.trim(),
    city: input.city.trim(),
    district: clean(input.district),
    address: clean(input.address),
    employees_count: input.employeesCount,
    organization_email: input.organizationEmail.trim(),
    website: clean(input.website),
    email: input.email.trim(),
    delegate_name: input.delegateName.trim(),
    delegate_id_number: input.delegateIdNumber.trim(),
    delegate_mobile: input.delegateMobile.trim(),
    delegate_email: input.delegateEmail.trim(),
  });
  if (!error) return;
  const text = `${error.message} ${error.details ?? ""}`;
  if (text.includes("idx_org_requests_email_pending")) throw new ServiceError(authCopy.error_request_email_pending, error);
  if (text.includes("idx_org_requests_reg_number_pending")) throw new ServiceError(authCopy.error_request_reg_pending, error);
  if (text.includes("id_number_format")) throw new ServiceError(authCopy.error_id_invalid, error);
  throw new ServiceError(authCopy.error_save_failed, error);
}
