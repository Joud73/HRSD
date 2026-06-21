import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/* ── Evaluator with profile + assignment stats ── */
export interface EvaluatorRow {
  id: string;
  email: string;
  organization_name: string | null;
  assignedCount: number;
  completedCount: number;
  inProgressCount: number;
}

export function useAdminEvaluators() {
  return useQuery({
    queryKey: ["admin-evaluators"],
    queryFn: async () => {
      const { data: roles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "evaluator");
      if (rolesErr) throw rolesErr;
      if (!roles || roles.length === 0) return [];

      const evaluatorIds = roles.map((r) => r.user_id);

      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("id, email, organization_name")
        .in("id", evaluatorIds);
      if (profErr) throw profErr;

      const { data: assignments, error: assignErr } = await supabase
        .from("evaluator_assignments")
        .select("evaluator_id, status")
        .in("evaluator_id", evaluatorIds);
      if (assignErr) throw assignErr;

      const countMap: Record<string, { total: number; completed: number; inProgress: number }> = {};
      for (const a of assignments || []) {
        if (!countMap[a.evaluator_id]) countMap[a.evaluator_id] = { total: 0, completed: 0, inProgress: 0 };
        countMap[a.evaluator_id].total++;
        if (a.status === "completed") countMap[a.evaluator_id].completed++;
        if (a.status === "in_progress") countMap[a.evaluator_id].inProgress++;
      }

      return (profiles || []).map((p): EvaluatorRow => ({
        id: p.id,
        email: p.email,
        organization_name: p.organization_name,
        assignedCount: countMap[p.id]?.total ?? 0,
        completedCount: countMap[p.id]?.completed ?? 0,
        inProgressCount: countMap[p.id]?.inProgress ?? 0,
      }));
    },
  });
}

/* ── Association (from organizations table) + assignment data ── */
export interface AssociationRow {
  id: string;
  name: string;
  email: string;
  status: string;
  progress: number;
  evaluator_name: string | null;
  evaluator_id: string | null;
  assignment_id: string | null;
  year: number;
  assigned_at: string | null;
}

export function useAdminAssociations() {
  return useQuery({
    queryKey: ["admin-associations"],
    queryFn: async () => {
      // 1. Fetch all organizations
      const { data: orgs, error: orgsErr } = await supabase
        .from("organizations")
        .select("id, name");
      if (orgsErr) throw orgsErr;
      if (!orgs || orgs.length === 0) return [];

      // 2. Find profile user IDs linked to these organizations (for email + assignment lookup)
      const orgIds = orgs.map((o) => o.id);
      const { data: orgProfiles, error: opErr } = await supabase
        .from("profiles")
        .select("id, email, organization_id")
        .in("organization_id", orgIds);
      if (opErr) throw opErr;

      // Map org_id → profile for email lookup
      const orgProfileMap: Record<string, { userId: string; email: string }> = {};
      for (const p of orgProfiles || []) {
        if (p.organization_id) {
          orgProfileMap[p.organization_id] = { userId: p.id, email: p.email };
        }
      }

      // 3. All assignments for these organization user IDs
      const userIds = (orgProfiles || []).map((p) => p.id);
      let assignments: any[] = [];
      if (userIds.length > 0) {
        const { data: aData, error: assignErr } = await supabase
          .from("evaluator_assignments")
          .select("*")
          .in("association_id", userIds);
        if (assignErr) throw assignErr;
        assignments = aData || [];
      }

      // 4. Get evaluator profiles for names
      const evaluatorIds = [...new Set(assignments.map((a) => a.evaluator_id))];
      let evalProfiles: Record<string, string> = {};
      if (evaluatorIds.length > 0) {
        const { data: eProf } = await supabase
          .from("profiles")
          .select("id, email")
          .in("id", evaluatorIds);
        if (eProf) {
          evalProfiles = Object.fromEntries(eProf.map((p) => [p.id, p.email]));
        }
      }

      const statusMap: Record<string, string> = {
        not_started: "لم تبدأ",
        draft: "مسودة",
        submitted: "تم التقديم",
        under_review: "قيد المراجعة",
        needs_revision: "يحتاج تعديل",
        resubmitted: "أعيد التقديم",
        approved: "معتمد",
        completed: "مكتمل",
        in_progress: "قيد التقييم",
        waiting_response: "بانتظار الرد",
      };

      // Build rows
      const rows: AssociationRow[] = [];
      const assignedUserIds = new Set<string>();

      for (const a of assignments) {
        assignedUserIds.add(a.association_id);
        // Find org name from the profile → org mapping
        const profile = (orgProfiles || []).find((p) => p.id === a.association_id);
        const org = profile?.organization_id
          ? orgs.find((o) => o.id === profile.organization_id)
          : null;

        rows.push({
          id: a.association_id,
          name: org?.name || "—",
          email: profile?.email || "—",
          status: statusMap[a.status] || a.status,
          progress: a.completion_percentage,
          evaluator_name: evalProfiles[a.evaluator_id] || null,
          evaluator_id: a.evaluator_id,
          assignment_id: a.id,
          year: a.year,
          assigned_at: a.assigned_at,
        });
      }

      // Orgs with no assignment
      for (const org of orgs) {
        const profile = orgProfileMap[org.id];
        if (profile && !assignedUserIds.has(profile.userId)) {
          rows.push({
            id: profile.userId,
            name: org.name,
            email: profile.email,
            status: "غير مُسندة",
            progress: 0,
            evaluator_name: null,
            evaluator_id: null,
            assignment_id: null,
            year: new Date().getFullYear(),
            assigned_at: null,
          });
        }
      }

      return rows;
    },
  });
}

/* ── All users with roles ── */
export interface AdminUserRow {
  id: string;
  email: string;
  organization_name: string | null;
  role: string;
  roleAr: string;
  status: string;
  statusAr: string;
  created_at: string;
}

const roleArMap: Record<string, string> = {
  admin: "مدير النظام",
  evaluator: "مقيم",
  organization: "جمعية",
  individual: "أفراد",
};

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("id, email, organization_name, status, created_at");
      if (profErr) throw profErr;
      if (!profiles || profiles.length === 0) return [];

      const userIds = profiles.map((p) => p.id);

      const { data: roles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);
      if (rolesErr) throw rolesErr;

      const roleMap: Record<string, string> = {};
      for (const r of roles || []) {
        roleMap[r.user_id] = r.role;
      }

      const statusArMap: Record<string, string> = {
        active: "نشط",
        pending_verification: "بانتظار التحقق",
        profile_incomplete: "ملف غير مكتمل",
      };

      return profiles.map((p): AdminUserRow => ({
        id: p.id,
        email: p.email,
        organization_name: p.organization_name,
        role: roleMap[p.id] || "—",
        roleAr: roleArMap[roleMap[p.id]] || "غير محدد",
        status: p.status,
        statusAr: statusArMap[p.status] || p.status,
        created_at: p.created_at,
      }));
    },
  });
}

/* ── Dashboard aggregate stats ── */
export interface AdminDashboardStats {
  totalAssociations: number;
  totalEvaluators: number;
  ongoingEvaluations: number;
  completedEvaluations: number;
  completionRate: number;
  statusCounts: { label: string; count: number }[];
}

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      // Count organizations from the dedicated table
      const { count: assocCount } = await supabase
        .from("organizations")
        .select("id", { count: "exact", head: true });

      // Count evaluators
      const { count: evalCount } = await supabase
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("role", "evaluator");

      // All assignments for status breakdown
      const { data: assignments } = await supabase
        .from("evaluator_assignments")
        .select("status");

      const total = assignments?.length ?? 0;
      const statusMap: Record<string, number> = {};
      for (const a of assignments || []) {
        statusMap[a.status] = (statusMap[a.status] || 0) + 1;
      }

      const ongoing = (statusMap["draft"] || 0) + (statusMap["submitted"] || 0) +
        (statusMap["under_review"] || 0) + (statusMap["resubmitted"] || 0) +
        (statusMap["in_progress"] || 0) + (statusMap["waiting_response"] || 0) +
        (statusMap["needs_revision"] || 0);
      const completed = (statusMap["completed"] || 0) + (statusMap["approved"] || 0);

      const labelMap: Record<string, string> = {
        not_started: "لم تبدأ",
        draft: "مسودة",
        submitted: "تم التقديم",
        under_review: "قيد المراجعة",
        needs_revision: "يحتاج تعديل",
        resubmitted: "أعيد التقديم",
        approved: "معتمد",
        completed: "مكتمل",
        in_progress: "قيد التقييم",
        waiting_response: "بانتظار الرد",
      };

      const statusCounts = Object.entries(statusMap).map(([key, count]) => ({
        label: labelMap[key] || key,
        count,
      }));

      return {
        totalAssociations: assocCount ?? 0,
        totalEvaluators: evalCount ?? 0,
        ongoingEvaluations: ongoing,
        completedEvaluations: completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        statusCounts,
      } as AdminDashboardStats;
    },
  });
}
