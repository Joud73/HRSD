import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  addManualLine, getFrozenResults, getResultsNumber, issueResults, listDocumentLines, listDocuments,
  listRecommendedPrograms, regenerateDocuments, removeManualLine, updateLine,
  type IssuedPdf, type LinePatch, type ManualLineInput,
} from "@/services/resultsService";

/** Frozen results and programs live under ["results", id]; documents and their lines under ["documents", id]. */
export const resultsKey = (assessmentId: string | undefined) => ["results", assessmentId] as const;
export const documentsKey = (assessmentId: string | undefined) => ["documents", assessmentId] as const;
const linesKey = (assessmentId: string | undefined, documentId: string | undefined) =>
  [...documentsKey(assessmentId), "lines", documentId] as const;

/**
 * After any results or documents change: the documents, the frozen results and the assessment itself
 * (status, scores, pending verdicts) refresh together.
 */
function invalidateAll(queryClient: QueryClient, assessmentId: string | undefined) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: documentsKey(assessmentId) }),
    queryClient.invalidateQueries({ queryKey: resultsKey(assessmentId) }),
    queryClient.invalidateQueries({ queryKey: ["assessment", assessmentId] }),
  ]);
}

export function useFrozenResults(assessmentId: string | undefined) {
  return useQuery({
    queryKey: resultsKey(assessmentId),
    queryFn: () => getFrozenResults(assessmentId as string),
    enabled: !!assessmentId,
  });
}

export function useRecommendedPrograms(assessmentId: string | undefined) {
  return useQuery({
    queryKey: [...resultsKey(assessmentId), "programs"],
    queryFn: () => listRecommendedPrograms(assessmentId as string),
    enabled: !!assessmentId,
  });
}

export function useDocuments(assessmentId: string | undefined) {
  return useQuery({
    queryKey: documentsKey(assessmentId),
    queryFn: () => listDocuments(assessmentId as string),
    enabled: !!assessmentId,
  });
}

export function useDocumentLines(assessmentId: string | undefined, documentId: string | undefined) {
  return useQuery({
    queryKey: linesKey(assessmentId, documentId),
    queryFn: () => listDocumentLines(documentId as string),
    enabled: !!assessmentId && !!documentId,
  });
}

/** The number issuance expects; always refetched (it carries today's date). */
export function useResultsNumber(assessmentId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: [...resultsKey(assessmentId), "number"],
    queryFn: () => getResultsNumber(assessmentId as string),
    enabled: !!assessmentId && enabled,
    staleTime: 0,
  });
}

function useResultsMutation<TInput>(assessmentId: string | undefined, mutationFn: (input: TInput) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["documents", assessmentId],
    mutationFn,
    onSuccess: () => invalidateAll(queryClient, assessmentId),
  });
}

export function useUpdateLine(assessmentId: string | undefined) {
  return useResultsMutation(assessmentId, ({ lineId, patch }: { lineId: string; patch: LinePatch }) => updateLine(lineId, patch));
}

export function useAddManualLine(assessmentId: string | undefined) {
  return useResultsMutation(assessmentId, ({ documentId, input }: { documentId: string; input: ManualLineInput }) =>
    addManualLine(documentId, input)
  );
}

export function useRemoveManualLine(assessmentId: string | undefined) {
  return useResultsMutation(assessmentId, (lineId: string) => removeManualLine(lineId));
}

export function useRegenerateDocuments(assessmentId: string | undefined) {
  return useResultsMutation(assessmentId, () => regenerateDocuments(assessmentId as string));
}

/** Issuance also changes the assessment status, so the lists that show it refresh too. */
export function useIssueResults(assessmentId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ number, pdfs }: { number: string; pdfs: IssuedPdf[] }) => issueResults(assessmentId as string, number, pdfs),
    onSuccess: () =>
      Promise.all([
        invalidateAll(queryClient, assessmentId),
        queryClient.invalidateQueries({ queryKey: ["assessment", "scope"] }),
        queryClient.invalidateQueries({ queryKey: ["evaluator", "reviews"] }),
        queryClient.invalidateQueries({ queryKey: ["organizations"] }),
      ]),
  });
}
