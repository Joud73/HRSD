import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getEvaluator, listEvaluatorAssessments, listEvaluators, upsertEvaluatorProfile, type EvaluatorProfileInput,
} from "@/services/evaluatorService";

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
