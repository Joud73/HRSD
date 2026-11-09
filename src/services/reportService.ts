/** Report figures the database can answer today (before results exist). */
import { supabase } from "@/integrations/supabase/client";
import { getOpenCycle } from "@/services/cycleService";
import type { AssessmentStatus } from "@/services/organizationService";

export interface ReportSummary {
  organizations: number;
  evaluators: number;
  /** Null when no cycle is open */
  cycle: { id: string; name: string } | null;
  /** Assessments in the open cycle per status */
  assessmentsByStatus: Record<AssessmentStatus, number>;
  /** Organizations without an assessment in the open cycle */
  notStarted: number;
}

export async function getReportSummary(): Promise<ReportSummary> {
  const [orgRes, evalRes, cycle] = await Promise.all([
    supabase.from("organizations").select("id", { count: "exact", head: true }),
    supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "evaluator"),
    getOpenCycle(),
  ]);
  if (orgRes.error) throw orgRes.error;
  if (evalRes.error) throw evalRes.error;

  const assessmentsByStatus: Record<AssessmentStatus, number> = { draft: 0, submitted: 0, under_review: 0, returned: 0, approved: 0 };
  if (cycle) {
    const { data, error } = await supabase.from("assessments").select("status").eq("cycle_id", cycle.id);
    if (error) throw error;
    for (const a of data) assessmentsByStatus[a.status] += 1;
  }

  const organizations = orgRes.count ?? 0;
  const started = Object.values(assessmentsByStatus).reduce((n, c) => n + c, 0);
  return {
    organizations,
    evaluators: evalRes.count ?? 0,
    cycle: cycle ? { id: cycle.id, name: cycle.name } : null,
    assessmentsByStatus,
    notStarted: cycle ? Math.max(organizations - started, 0) : 0,
  };
}
