import { useQuery } from "@tanstack/react-query";
import { getSocialDevCenters, getSubClassifications } from "@/services/lookupService";

/** Reference lists change rarely; keep them fresh for an hour. */
const LOOKUP_STALE = 60 * 60 * 1000;

export function useSubClassifications() {
  return useQuery({ queryKey: ["lookups", "sub-classifications"], queryFn: getSubClassifications, staleTime: LOOKUP_STALE });
}

export function useSocialDevCenters() {
  return useQuery({ queryKey: ["lookups", "social-dev-centers"], queryFn: getSocialDevCenters, staleTime: LOOKUP_STALE });
}
