import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getOrganization, listOrganizations, saveDelegate, updateOrganization,
  type DelegateInput, type OrganizationInput,
} from "@/services/organizationService";

const ORGS_KEY = ["organizations"] as const;

export function useOrganizations() {
  return useQuery({ queryKey: [...ORGS_KEY, "list"], queryFn: listOrganizations });
}

export function useOrganization(id: string | undefined) {
  return useQuery({
    queryKey: [...ORGS_KEY, "detail", id],
    queryFn: () => getOrganization(id as string),
    enabled: !!id,
  });
}

/** Profile and delegate edits; each refreshes every organization query on success. */
export function useOrganizationMutations(id: string) {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: ORGS_KEY });
  return {
    update: useMutation({ mutationFn: (input: OrganizationInput) => updateOrganization(id, input), onSuccess }),
    saveDelegate: useMutation({
      mutationFn: ({ delegateId, input }: { delegateId: string | null; input: DelegateInput }) => saveDelegate(id, delegateId, input),
      onSuccess,
    }),
  };
}
