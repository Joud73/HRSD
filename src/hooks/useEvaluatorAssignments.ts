import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface AssignmentRow {
  id: string;
  association_id: string;
  association_name: string | null;
  year: number;
  status: string;
  completion_percentage: number;
  assigned_at: string;
  updated_at: string;
}

export const statusLabelMap: Record<string, string> = {
  not_started: "لم تبدأ",
  draft: "مسودة",
  submitted: "تم التقديم",
  under_review: "قيد المراجعة",
  needs_revision: "يحتاج تعديل",
  resubmitted: "أعيد التقديم",
  approved: "معتمد",
  completed: "مكتمل",
  in_progress: "قيد التقييم",
  waiting_response: "بانتظار رد الجمعية",
};

export function useEvaluatorAssignments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["evaluator-assignments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: assignments, error } = await supabase
        .from("evaluator_assignments")
        .select("*")
        .eq("evaluator_id", user!.id)
        .order("assigned_at", { ascending: false });

      if (error) throw error;

      // Fetch organization names directly via organization_id
      const orgIds = [...new Set((assignments || []).map((a: any) => a.organization_id).filter(Boolean))];
      let orgNameMap: Record<string, string> = {};

      if (orgIds.length > 0) {
        const { data: orgs } = await supabase
          .from("organizations")
          .select("id, name")
          .in("id", orgIds);

        for (const o of orgs || []) orgNameMap[o.id] = o.name;
      }

      return (assignments || []).map((a: any): AssignmentRow => ({
        id: a.id,
        association_id: a.association_id,
        association_name: a.organization_id ? (orgNameMap[a.organization_id] || "جمعية غير معروفة") : "جمعية غير معروفة",
        year: a.year,
        status: a.status,
        completion_percentage: a.completion_percentage,
        assigned_at: a.assigned_at,
        updated_at: a.updated_at,
      }));
    },
  });
}

export function useEvaluatorStats() {
  const { data: assignments, isLoading } = useEvaluatorAssignments();

  const stats = {
    total: assignments?.length ?? 0,
    notStarted: assignments?.filter((a) => a.status === "not_started").length ?? 0,
    draft: assignments?.filter((a) => a.status === "draft").length ?? 0,
    submitted: assignments?.filter((a) => a.status === "submitted").length ?? 0,
    underReview: assignments?.filter((a) => a.status === "under_review").length ?? 0,
    needsRevision: assignments?.filter((a) => a.status === "needs_revision").length ?? 0,
    approved: assignments?.filter((a) => a.status === "approved").length ?? 0,
    completed: assignments?.filter((a) => a.status === "completed").length ?? 0,
    // Legacy compat
    inProgress: assignments?.filter((a) => ["draft", "in_progress", "submitted", "under_review", "resubmitted"].includes(a.status)).length ?? 0,
    waitingResponse: assignments?.filter((a) => a.status === "needs_revision" || a.status === "waiting_response").length ?? 0,
    completionRate: 0,
  };

  if (stats.total > 0) {
    stats.completionRate = Math.round((stats.completed / stats.total) * 100);
  }

  return { stats, isLoading };
}
