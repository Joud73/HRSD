import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  enroll, getMyIssuedAssessment, getProgram, getTrackReadiness, listCatalog, listIndicatorResults, listLessonGaps,
  listLessonProgress, listMyEnrollments, listRecommendations, setLessonDone, withdraw,
  type Enrollment,
} from "@/services/tamohiService";

/** Every طموحي query lives under ["tamohi", ...]. */
export const tamohiKeys = {
  all: ["tamohi"] as const,
  catalog: () => ["tamohi", "catalog"] as const,
  program: (code: string | undefined) => ["tamohi", "program", code] as const,
  issued: () => ["tamohi", "issued"] as const,
  recommendations: (assessmentId: string | undefined) => ["tamohi", "recommendations", assessmentId] as const,
  readiness: (assessmentId: string | undefined) => ["tamohi", "readiness", assessmentId] as const,
  gaps: (assessmentId: string | undefined, programId?: string) => ["tamohi", "gaps", assessmentId, programId ?? "all"] as const,
  indicatorResults: (assessmentId: string | undefined, programId: string | undefined) =>
    ["tamohi", "indicator-results", assessmentId, programId] as const,
  enrollments: () => ["tamohi", "enrollments"] as const,
  progress: (enrollmentId: string | undefined) => ["tamohi", "progress", enrollmentId] as const,
};

/** The catalog changes only with a new tool version: cache it for the session. */
const STATIC = 30 * 60_000;

export function useCatalog() {
  return useQuery({ queryKey: tamohiKeys.catalog(), queryFn: listCatalog, staleTime: STATIC });
}

export function useProgram(code: string | undefined) {
  return useQuery({ queryKey: tamohiKeys.program(code), queryFn: () => getProgram(code as string), enabled: !!code, staleTime: STATIC });
}

/** Organizations only: the latest issued assessment that personalises the catalog (null when none). */
export function useIssuedAssessment() {
  const { userRole } = useAuth();
  const isOrg = userRole === "organization";
  return useQuery({ queryKey: tamohiKeys.issued(), queryFn: getMyIssuedAssessment, enabled: isOrg });
}

export function useRecommendations(assessmentId: string | undefined) {
  return useQuery({
    queryKey: tamohiKeys.recommendations(assessmentId),
    queryFn: () => listRecommendations(assessmentId as string),
    enabled: !!assessmentId,
  });
}

export function useReadiness(assessmentId: string | undefined) {
  return useQuery({
    queryKey: tamohiKeys.readiness(assessmentId),
    queryFn: () => getTrackReadiness(assessmentId as string),
    enabled: !!assessmentId,
  });
}

export function useLessonGaps(assessmentId: string | undefined, programId?: string) {
  return useQuery({
    queryKey: tamohiKeys.gaps(assessmentId, programId),
    queryFn: () => listLessonGaps(assessmentId as string, programId),
    enabled: !!assessmentId && (programId === undefined || !!programId),
  });
}

export function useIndicatorResults(assessmentId: string | undefined, programId: string | undefined, indicatorIds: string[]) {
  return useQuery({
    queryKey: tamohiKeys.indicatorResults(assessmentId, programId),
    queryFn: () => listIndicatorResults(assessmentId as string, indicatorIds),
    enabled: !!assessmentId && !!programId && indicatorIds.length > 0,
  });
}

/** Organizations only: their enrollments with lessons done / total. */
export function useMyEnrollments() {
  const { userRole } = useAuth();
  return useQuery({ queryKey: tamohiKeys.enrollments(), queryFn: listMyEnrollments, enabled: userRole === "organization" });
}

export function useLessonProgress(enrollmentId: string | undefined) {
  return useQuery({
    queryKey: tamohiKeys.progress(enrollmentId),
    queryFn: () => listLessonProgress(enrollmentId as string),
    enabled: !!enrollmentId,
  });
}

/** Enrollments and progress refresh together after every change. */
function invalidateEnrollments(queryClient: QueryClient, enrollmentId?: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: tamohiKeys.enrollments() }),
    queryClient.invalidateQueries({ queryKey: enrollmentId ? tamohiKeys.progress(enrollmentId) : ["tamohi", "progress"] }),
  ]);
}

export function useEnroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ programId, assessmentId }: { programId: string; assessmentId: string | null }) => enroll(programId, assessmentId),
    onSettled: () => invalidateEnrollments(queryClient),
  });
}

export function useWithdraw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enrollmentId: string) => withdraw(enrollmentId),
    onSettled: (_d, _e, enrollmentId) => invalidateEnrollments(queryClient, enrollmentId),
  });
}

/** Marks a lesson done or not done, optimistically: the check and the counts move at once, rolled back on error. */
export function useSetLessonDone(enrollmentId: string | undefined) {
  const queryClient = useQueryClient();
  const progressKey = tamohiKeys.progress(enrollmentId);
  return useMutation({
    mutationFn: ({ lessonId, done }: { lessonId: string; done: boolean }) => setLessonDone(enrollmentId as string, lessonId, done),
    onMutate: async ({ lessonId, done }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: progressKey }),
        queryClient.cancelQueries({ queryKey: tamohiKeys.enrollments() }),
      ]);
      const previousProgress = queryClient.getQueryData<Set<string>>(progressKey);
      const previousEnrollments = queryClient.getQueryData<Enrollment[]>(tamohiKeys.enrollments());
      const next = new Set(previousProgress ?? []);
      const had = next.has(lessonId);
      if (done) next.add(lessonId);
      else next.delete(lessonId);
      queryClient.setQueryData(progressKey, next);
      if (previousEnrollments && had !== done) {
        queryClient.setQueryData<Enrollment[]>(
          tamohiKeys.enrollments(),
          previousEnrollments.map((e) => {
            if (e.enrollmentId !== enrollmentId) return e;
            const lessonsDone = e.lessonsDone + (done ? 1 : -1);
            const status = lessonsDone >= e.lessonsTotal ? "completed" : lessonsDone > 0 ? "in_progress" : "enrolled";
            return { ...e, lessonsDone, status };
          })
        );
      }
      return { previousProgress, previousEnrollments };
    },
    onError: (_e, _v, context) => {
      queryClient.setQueryData(progressKey, context?.previousProgress);
      queryClient.setQueryData(tamohiKeys.enrollments(), context?.previousEnrollments);
    },
    onSettled: () => invalidateEnrollments(queryClient, enrollmentId),
  });
}

/**
 * Personalisation for the signed-in user: organizations get their latest issued assessment, its
 * recommendations (by program) and their enrollments (by program); other roles get none of it.
 */
export function useTamohiPersonal() {
  const { userRole } = useAuth();
  const isOrg = userRole === "organization";
  const issued = useIssuedAssessment();
  const assessmentId = issued.data?.id;
  const recommendations = useRecommendations(assessmentId);
  const enrollments = useMyEnrollments();
  const recs = useMemo(() => recommendations.data ?? [], [recommendations.data]);
  const byProgram = useMemo(() => new Map(recs.map((r) => [r.programId, r])), [recs]);
  const enrollmentByProgram = useMemo(
    () => new Map((enrollments.data ?? []).map((e) => [e.programId, e])),
    [enrollments.data]
  );
  return {
    isOrg,
    issued: issued.data ?? null,
    assessmentId,
    recommendations: recs,
    recommendationByProgram: byProgram,
    enrollments: enrollments.data ?? [],
    enrollmentByProgram,
    loading: isOrg && (issued.isLoading || (!!assessmentId && recommendations.isLoading) || enrollments.isLoading),
    error: issued.error ?? recommendations.error ?? enrollments.error ?? null,
  };
}
