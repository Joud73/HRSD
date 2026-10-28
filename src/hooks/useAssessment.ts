import { useEffect, useRef, useState } from "react";
import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { assessmentCopy } from "@/lib/copy";
import { ServiceError } from "@/services/errors";
import {
  addFileEvidence, addLinkEvidence, ensureAssessmentFor, ensureMyAssessment, getAssessment, getIndicatorScores,
  getProgress, getTrackScores, isEditable, listEvidences, listExcludedItemIds, listMyAssessmentHistory, listResponses,
  removeEvidence, setItemMet, setSubmissionDue, submitAssessment,
  type Assessment, type AssessmentScope, type Evidence, type ItemResponse,
} from "@/services/assessmentService";

/** Everything about one assessment lives under ["assessment", id]; one invalidation refreshes answers, scores and progress. */
const assessmentKey = (id: string | undefined) => ["assessment", id] as const;
/** Lookups by scope (which assessment is mine, or an organization's) sit apart, since the id is not known yet. */
const SCOPE_KEY = ["assessment", "scope"] as const;
const HISTORY_KEY = ["assessment", "history"] as const;

const scopeKey = (scope: AssessmentScope) => (scope.kind === "mine" ? [...SCOPE_KEY, "mine"] : [...SCOPE_KEY, "org", scope.orgId]);

/** No cycle in its submission period: not an error for the page, it shows the empty state. */
const isPeriodClosed = (err: unknown) => err instanceof ServiceError && err.message === assessmentCopy.err_period_closed;

/**
 * The assessment in the open cycle for the scope. When none exists it is opened once: by the organization
 * itself (`mine`), or on its behalf by a supervisor or admin (`org`). Null when no cycle accepts submissions.
 * With `ensure: false` it only reads (admin pages that must not open an assessment by being viewed).
 */
export function useAssessment(scope: AssessmentScope, { ensure = true }: { ensure?: boolean } = {}) {
  const { userRole } = useAuth();
  const ensured = useRef<string | null>(null);
  // Read-only lookups get their own key: one key, one query function
  const key = ensure ? scopeKey(scope) : [...scopeKey(scope), "read"];
  const keyId = key.join(":");
  const canEnsure = ensure && (scope.kind === "org" || userRole === "organization");

  const query = useQuery({
    queryKey: key,
    enabled: scope.kind === "org" || userRole !== null,
    // A retry would skip ensure (it runs once) and resolve to null, hiding the real error behind the no-cycle state
    retry: false,
    queryFn: async (): Promise<Assessment | null> => {
      const existing = await getAssessment(scope);
      if (existing || !canEnsure || ensured.current === keyId) return existing;
      ensured.current = keyId;
      try {
        return scope.kind === "org" ? await ensureAssessmentFor(scope.orgId) : await ensureMyAssessment();
      } catch (err) {
        if (isPeriodClosed(err)) return null;
        ensured.current = null; // a manual refetch tries again
        throw err;
      }
    },
  });

  const assessment = query.data ?? null;
  return {
    ...query,
    assessment,
    cycle: assessment?.cycle ?? null,
    deadline: assessment?.deadline ?? null,
    editable: assessment ? isEditable(assessment) : false,
  };
}

/** The signed-in organization's assessments across cycles, with scores (results by cycle). */
export function useAssessmentHistory() {
  return useQuery({ queryKey: HISTORY_KEY, queryFn: listMyAssessmentHistory });
}

export function useResponses(assessmentId: string | undefined) {
  return useQuery({
    queryKey: [...assessmentKey(assessmentId), "responses"],
    queryFn: () => listResponses(assessmentId as string),
    enabled: !!assessmentId,
  });
}

export function useEvidences(assessmentId: string | undefined) {
  return useQuery({
    queryKey: [...assessmentKey(assessmentId), "evidences"],
    queryFn: () => listEvidences(assessmentId as string),
    enabled: !!assessmentId,
  });
}

export function useIndicatorScores(assessmentId: string | undefined) {
  return useQuery({
    queryKey: [...assessmentKey(assessmentId), "indicator-scores"],
    queryFn: () => getIndicatorScores(assessmentId as string),
    enabled: !!assessmentId,
  });
}

export function useTrackScores(assessmentId: string | undefined) {
  return useQuery({
    queryKey: [...assessmentKey(assessmentId), "track-scores"],
    queryFn: () => getTrackScores(assessmentId as string),
    enabled: !!assessmentId,
  });
}

export function useProgress(assessmentId: string | undefined) {
  return useQuery({
    queryKey: [...assessmentKey(assessmentId), "progress"],
    queryFn: () => getProgress(assessmentId as string),
    enabled: !!assessmentId,
  });
}

/** Items excluded from the cycle. Keyed under ["cycles", id] so the admin's scope edits refresh it. */
export function useExcludedItems(cycleId: string | undefined) {
  return useQuery({
    queryKey: ["cycles", cycleId, "exclusions"],
    queryFn: () => listExcludedItemIds(cycleId as string),
    enabled: !!cycleId,
  });
}

// ---------------------------------------------------------------
// Mutations. All share mutationKey ["assessment", id] so a page can show one saving state
// (useIsMutating) and all invalidate ["assessment", id] so scores and progress follow.
// ---------------------------------------------------------------

type ItemMetInput = { itemId: string; isMet: boolean; orgNote?: string | null };

/** Saves one item immediately with an optimistic update of the answers map; rolls back on error. */
export function useSetItemMet(assessmentId: string | undefined) {
  const queryClient = useQueryClient();
  const responsesKey = [...assessmentKey(assessmentId), "responses"];
  return useMutation({
    mutationKey: assessmentKey(assessmentId),
    mutationFn: ({ itemId, isMet, orgNote }: ItemMetInput) => setItemMet(assessmentId as string, itemId, isMet, orgNote),
    onMutate: async ({ itemId, isMet, orgNote }: ItemMetInput) => {
      await queryClient.cancelQueries({ queryKey: responsesKey });
      const previous = queryClient.getQueryData<Map<string, ItemResponse>>(responsesKey);
      const next = new Map(previous ?? []);
      const current = next.get(itemId);
      next.set(itemId, { isMet, orgNote: orgNote !== undefined ? orgNote?.trim() || null : current?.orgNote ?? null });
      queryClient.setQueryData(responsesKey, next);
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(responsesKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: assessmentKey(assessmentId) }),
  });
}

function useAssessmentMutation<TInput>(assessmentId: string | undefined, mutationFn: (input: TInput) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: assessmentKey(assessmentId),
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assessmentKey(assessmentId) }),
  });
}

export function useAddFileEvidence(assessmentId: string | undefined) {
  return useAssessmentMutation(assessmentId, ({ itemId, file }: { itemId: string; file: File }) =>
    addFileEvidence(assessmentId as string, itemId, file)
  );
}

export function useAddLinkEvidence(assessmentId: string | undefined) {
  return useAssessmentMutation(assessmentId, ({ itemId, url, label }: { itemId: string; url: string; label?: string }) =>
    addLinkEvidence(assessmentId as string, itemId, url, label)
  );
}

export function useRemoveEvidence(assessmentId: string | undefined) {
  return useAssessmentMutation(assessmentId, (evidence: Evidence) => removeEvidence(evidence));
}

/** Submission also changes the assessment row itself, so the scope lookups and history refresh too. */
export function useSubmitAssessment(assessmentId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: assessmentKey(assessmentId),
    mutationFn: () => submitAssessment(assessmentId as string),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: assessmentKey(assessmentId) }),
        queryClient.invalidateQueries({ queryKey: SCOPE_KEY }),
        queryClient.invalidateQueries({ queryKey: HISTORY_KEY }),
      ]),
  });
}

/**
 * Saving state for the page header: `saving` while any mutation of the assessment runs, `savedAt` = time of
 * the last successful one. Read from the mutation cache, so it outlives finished mutations being cleared.
 */
export function useSaveStatus(assessmentId: string | undefined) {
  const queryClient = useQueryClient();
  const saving = useIsMutating({ mutationKey: assessmentKey(assessmentId) }) > 0;
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(
    () =>
      queryClient.getMutationCache().subscribe((event) => {
        const key = event.mutation?.options.mutationKey;
        if (event.type === "updated" && event.action.type === "success" && key?.[0] === "assessment" && key[1] === assessmentId) {
          setSavedAt(new Date());
        }
      }),
    [queryClient, assessmentId]
  );

  return { saving, savedAt };
}

/**
 * Admin: the deadline extension of one organization (null restores the cycle deadline), opening its assessment
 * first when it has none. Refreshes the assessment lookups and the organization lists.
 */
export function useSetSubmissionDue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orgId, assessment, due }: { orgId: string; assessment: Assessment | null; due: string | null }) =>
      setSubmissionDue(assessment ?? (await ensureAssessmentFor(orgId)), due),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: SCOPE_KEY }),
        queryClient.invalidateQueries({ queryKey: ["organizations"] }),
      ]),
  });
}
