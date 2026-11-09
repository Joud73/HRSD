import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCycle, deleteCycle, excludeItem, getCycle, getOpenCycle, includeItem, listCycles, listExclusions, updateCycle, type CycleInput,
} from "@/services/cycleService";

const CYCLES_KEY = ["cycles"] as const;

export function useCycles() {
  return useQuery({ queryKey: [...CYCLES_KEY, "list"], queryFn: listCycles });
}

export function useCycle(id: string | undefined) {
  return useQuery({
    queryKey: [...CYCLES_KEY, "detail", id],
    queryFn: () => getCycle(id as string),
    enabled: !!id,
  });
}

export function useOpenCycle() {
  return useQuery({ queryKey: [...CYCLES_KEY, "open"], queryFn: getOpenCycle });
}

/** Create, update and delete; each refreshes every cycle query on success. */
export function useCycleMutations() {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: CYCLES_KEY });
  return {
    create: useMutation({ mutationFn: (input: CycleInput) => createCycle(input), onSuccess }),
    update: useMutation({ mutationFn: ({ id, input }: { id: string; input: CycleInput }) => updateCycle(id, input), onSuccess }),
    remove: useMutation({ mutationFn: (id: string) => deleteCycle(id), onSuccess }),
  };
}

/**
 * Item exclusions with their reasons. Kept apart from useExcludedItems (["cycles", id, "exclusions"], a Set),
 * which the assessment form reads; invalidating ["cycles"] refreshes both.
 */
export function useCycleExclusions(cycleId: string | undefined) {
  return useQuery({
    queryKey: [...CYCLES_KEY, cycleId, "exclusions", "detail"],
    queryFn: () => listExclusions(cycleId as string),
    enabled: !!cycleId,
  });
}

/** Exclude or include items in one batch; refreshes cycles, open assessments (scores, form) and organization progress. */
export function useCycleScopeMutations(cycleId: string) {
  const queryClient = useQueryClient();
  const onSuccess = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: CYCLES_KEY }),
      queryClient.invalidateQueries({ queryKey: ["assessment"] }),
      queryClient.invalidateQueries({ queryKey: ["organizations"] }),
    ]);
  return {
    exclude: useMutation({
      mutationFn: ({ itemIds, reason }: { itemIds: string[]; reason: string | null }) => excludeItem(cycleId, itemIds, reason),
      onSuccess,
    }),
    include: useMutation({ mutationFn: (itemIds: string[]) => includeItem(cycleId, itemIds), onSuccess }),
  };
}
