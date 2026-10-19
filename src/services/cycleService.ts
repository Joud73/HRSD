/** Assessment cycles: list, read, create, update, delete (drafts only, enforced in the UI). */
import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Tables, TablesInsert } from "@/integrations/supabase/types";
import { adminSetupCopy as t } from "@/lib/copy";
import { getApprovedToolVersionId } from "@/services/toolService";

export type CycleStatus = Database["public"]["Enums"]["cycle_status"];

export interface Cycle {
  id: string;
  name: string;
  status: CycleStatus;
  toolVersionId: string;
  /** Dates are yyyy-mm-dd */
  submissionStart: string;
  submissionEnd: string;
  reviewStart: string;
  reviewEnd: string;
  approvalStart: string;
  approvalEnd: string;
  createdAt: string;
  updatedAt: string;
}

export interface CycleInput {
  name: string;
  status: CycleStatus;
  submissionStart: string;
  submissionEnd: string;
  reviewStart: string;
  reviewEnd: string;
  approvalStart: string;
  approvalEnd: string;
  /** Defaults to the approved tool version on create */
  toolVersionId?: string;
}

/** Error with a user-facing Arabic message; the database error stays on `cause`. */
export class CycleServiceError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "CycleServiceError";
  }
}

const toCycle = (r: Tables<"assessment_cycles">): Cycle => ({
  id: r.id,
  name: r.name,
  status: r.status,
  toolVersionId: r.tool_version_id,
  submissionStart: r.submission_start,
  submissionEnd: r.submission_end,
  reviewStart: r.review_start,
  reviewEnd: r.review_end,
  approvalStart: r.approval_start,
  approvalEnd: r.approval_end,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const toRow = (input: CycleInput) => ({
  name: input.name.trim(),
  status: input.status,
  submission_start: input.submissionStart,
  submission_end: input.submissionEnd,
  review_start: input.reviewStart,
  review_end: input.reviewEnd,
  approval_start: input.approvalStart,
  approval_end: input.approvalEnd,
  ...(input.toolVersionId ? { tool_version_id: input.toolVersionId } : {}),
});

/** Postgres constraint and trigger errors -> Arabic messages. */
function mapError(error: PostgrestError): CycleServiceError {
  const text = `${error.message} ${error.details ?? ""}`;
  if (text.includes("cycle_periods_ordered")) return new CycleServiceError(t.cycle_err_periods, error);
  if (text.includes("uq_one_open_cycle")) return new CycleServiceError(t.cycle_err_one_open, error);
  if (text.includes("cannot reopen")) return new CycleServiceError(t.cycle_err_reopen, error);
  if (text.includes("assessment_cycles_name_key")) return new CycleServiceError(t.cycle_err_name_taken, error);
  return new CycleServiceError(t.cycle_err_generic, error);
}

const columns =
  "id, name, status, tool_version_id, submission_start, submission_end, review_start, review_end, approval_start, approval_end, created_by, created_at, updated_at";

export async function listCycles(): Promise<Cycle[]> {
  const { data, error } = await supabase.from("assessment_cycles").select(columns).order("submission_start", { ascending: false });
  if (error) throw mapError(error);
  return data.map(toCycle);
}

export async function getCycle(id: string): Promise<Cycle | null> {
  const { data, error } = await supabase.from("assessment_cycles").select(columns).eq("id", id).maybeSingle();
  if (error) throw mapError(error);
  return data ? toCycle(data) : null;
}

/** The single open cycle, or null. */
export async function getOpenCycle(): Promise<Cycle | null> {
  const { data, error } = await supabase.from("assessment_cycles").select(columns).eq("status", "open").maybeSingle();
  if (error) throw mapError(error);
  return data ? toCycle(data) : null;
}

export async function createCycle(input: CycleInput): Promise<Cycle> {
  const toolVersionId = input.toolVersionId ?? (await getApprovedToolVersionId());
  if (!toolVersionId) throw new CycleServiceError(t.cycle_err_no_tool);
  const { data: session } = await supabase.auth.getSession();
  const row: TablesInsert<"assessment_cycles"> = {
    ...toRow(input),
    tool_version_id: toolVersionId,
    created_by: session.session?.user.id ?? null,
  };
  const { data, error } = await supabase.from("assessment_cycles").insert(row).select(columns).single();
  if (error) throw mapError(error);
  return toCycle(data);
}

export async function updateCycle(id: string, input: CycleInput): Promise<Cycle> {
  const { data, error } = await supabase.from("assessment_cycles").update(toRow(input)).eq("id", id).select(columns).single();
  if (error) throw mapError(error);
  return toCycle(data);
}

export async function deleteCycle(id: string): Promise<void> {
  const { error } = await supabase.from("assessment_cycles").delete().eq("id", id).eq("status", "draft");
  if (error) throw mapError(error);
}
