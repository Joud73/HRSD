import { useQuery } from "@tanstack/react-query";
import { getApprovedTool } from "@/services/toolService";

/** The approved assessment tool tree. It is immutable, so it stays fresh for 10 minutes. */
export function useApprovedTool() {
  return useQuery({
    queryKey: ["tool", "approved"],
    queryFn: getApprovedTool,
    staleTime: 10 * 60 * 1000,
  });
}
