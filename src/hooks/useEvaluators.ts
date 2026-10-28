import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignEvaluator, getEvaluator, listEvaluatorAssessments, listEvaluators, upsertEvaluatorProfile, type EvaluatorProfileInput,
} from "@/services/evaluatorService";
import { ensureAssessmentFor } from "@/services/assessmentService";

const EVALUATORS_KEY = ["evaluators"] as const;

export function useEvaluators() {
  return useQuery({ queryKey: [...EVALUATORS_KEY, "list"], queryFn: listEvaluators });
}

export function useEvaluator(userId: string | undefined) {
  return useQuery({
    queryKey: [...EVALUATORS_KEY, "detail", userId],
    queryFn: () => getEvaluator(userId as string),
    enabled: !!userId,
  });
}

export function useEvaluatorAssessments(userId: string | undefined) {
  return useQuery({
    queryKey: [...EVALUATORS_KEY, "assessments", userId],
    queryFn: () => listEvaluatorAssessments(userId as string),
    enabled: !!userId,
  });
}

export function useUpsertEvaluatorProfile(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EvaluatorProfileInput) => upsertEvaluatorProfile(userId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EVALUATORS_KEY }),
  });
}

/**
 * Admin: assigns the evaluator of an organization's assessment in the open cycle, opening the assessment
 * first when the organization has none. Refreshes organization lists, evaluator counts and assessment lookups.
 */
export function useAssignEvaluator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orgId, assessmentId, evaluatorId }: { orgId: string; assessmentId: string | null; evaluatorId: string }) => {
      const id = assessmentId ?? (await ensureAssessmentFor(orgId)).id;
      await assignEvaluator(id, evaluatorId);
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["organizations"] }),
        queryClient.invalidateQueries({ queryKey: EVALUATORS_KEY }),
        queryClient.invalidateQueries({ queryKey: ["assessment", "scope"] }),
      ]),
  });
}
