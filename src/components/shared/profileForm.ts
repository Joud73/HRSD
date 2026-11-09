/** HRSD profile forms: values, conversions and validation shared by ProfileFields and the pages that save them. */
import { adminCopy } from "@/lib/copy";
import { SAUDI_ID_RE } from "@/services/errors";
import type { DelegateInput, OrganizationDetail, OrganizationInput } from "@/services/organizationService";

/* ── Organization ── */

export type OrganizationFormValues = OrganizationInput & { employees: string };
export type OrganizationErrors = Partial<Record<"name" | "registrationNumber" | "employeesCount", string>>;

export const toOrganizationForm = (org: OrganizationDetail): OrganizationFormValues => ({
  entityType: org.entityType,
  registrationNumber: org.registrationNumber,
  registrationDate: org.registrationDate,
  name: org.name,
  subClassificationId: org.subClassificationId,
  socialDevCenterId: org.socialDevCenterId,
  region: org.region,
  city: org.city,
  district: org.district,
  address: org.address,
  employeesCount: org.employeesCount,
  email: org.email,
  website: org.website,
  employees: org.employeesCount === null ? "" : String(org.employeesCount),
});

/** Returns the errors (empty when valid) and the input to save. */
export function validateOrganization(values: OrganizationFormValues): { errors: OrganizationErrors; input: OrganizationInput } {
  const employees = values.employees.trim();
  const errors: OrganizationErrors = {};
  if (!values.name.trim()) errors.name = adminCopy.error_required;
  if (!values.registrationNumber.trim()) errors.registrationNumber = adminCopy.error_required;
  if (employees && !/^\d+$/.test(employees)) errors.employeesCount = adminCopy.org_err_employees_count;
  const { employees: _employees, ...rest } = values;
  return { errors, input: { ...rest, employeesCount: employees ? Number(employees) : null } };
}

/* ── Delegate ── */

export const toDelegateForm = (org: OrganizationDetail): DelegateInput => ({
  idNumber: org.delegate?.idNumber ?? "",
  fullName: org.delegate?.fullName ?? "",
  mobile: org.delegate?.mobile ?? "",
  email: org.delegate?.email ?? "",
});

/** The ID error, if any (format only; every field is optional for the administrator). */
export const validateDelegateId = (values: DelegateInput) => {
  const id = values.idNumber?.trim();
  return id && !SAUDI_ID_RE.test(id) ? adminCopy.err_id_number_format : undefined;
};

/* ── Evaluator (المقيم) ── */

export interface EvaluatorFormValues {
  idNumber: string;
  fullName: string;
  mobile: string;
  email: string;
  employer: string;
}
export type EvaluatorField = keyof EvaluatorFormValues;
export type EvaluatorErrors = Partial<Record<EvaluatorField, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Name required; ID format when given; email required and valid when `requireEmail` (account creation). */
export function validateEvaluator(values: EvaluatorFormValues, { requireEmail = false } = {}): EvaluatorErrors {
  const errors: EvaluatorErrors = {};
  const id = values.idNumber.trim();
  const email = values.email.trim();
  if (!values.fullName.trim()) errors.fullName = adminCopy.error_required;
  if (id && !SAUDI_ID_RE.test(id)) errors.idNumber = adminCopy.err_id_number_format;
  if (requireEmail && !email) errors.email = adminCopy.error_required;
  else if (email && !EMAIL_RE.test(email)) errors.email = adminCopy.users_error_email;
  return errors;
}
