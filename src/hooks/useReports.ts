import { useQuery } from "@tanstack/react-query";
import { getReportSummary } from "@/services/reportService";

export function useReportSummary() {
  return useQuery({ queryKey: ["reports", "summary"], queryFn: getReportSummary });
}
