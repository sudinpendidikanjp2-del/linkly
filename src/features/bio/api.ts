import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, qs } from "@/lib/api";
import type { BioDTO } from "@/shared/types";
import type { BioInput } from "@/shared/schemas";

export function useBio() {
  return useQuery({ queryKey: ["bio"], queryFn: ({ signal }) => api<BioDTO>("/bio", { signal }) });
}

export function useSaveBio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BioInput) => api<BioDTO>("/bio", { method: "PUT", body: input }),
    onSuccess: (data) => queryClient.setQueryData(["bio"], data),
  });
}

export function checkHandle(handle: string) {
  return api<{ available: boolean; reason: string | null }>(`/bio/handle-available${qs({ handle })}`);
}
