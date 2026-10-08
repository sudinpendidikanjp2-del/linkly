import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CollectionDTO } from "@/shared/types";
import type { CollectionInput } from "@/shared/schemas";

export function useCollections() {
  return useQuery({ queryKey: ["collections"], queryFn: ({ signal }) => api<CollectionDTO[]>("/collections", { signal }) });
}

function useRefreshCollections() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["collections"] });
    void queryClient.invalidateQueries({ queryKey: ["links"] });
    void queryClient.invalidateQueries({ queryKey: ["bio"] });
  };
}

export function useSaveCollection() {
  const refresh = useRefreshCollections();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: CollectionInput }) =>
      id ? api<CollectionDTO>(`/collections/${id}`, { method: "PATCH", body: input }) : api<CollectionDTO>("/collections", { method: "POST", body: input }),
    onSuccess: refresh,
  });
}

export function useDeleteCollection() {
  const refresh = useRefreshCollections();
  return useMutation({
    mutationFn: (id: string) => api<{ ok: true }>(`/collections/${id}`, { method: "DELETE" }),
    onSuccess: refresh,
  });
}
