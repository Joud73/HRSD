import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCycle, deleteCycle, getCycle, getOpenCycle, listCycles, updateCycle, type CycleInput,
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
