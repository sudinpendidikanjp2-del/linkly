import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, browserTimeZone, qs } from "@/lib/api";
import type { AnalyticsDTO, BulkImportResultDTO, LinkDTO, LinkListDTO } from "@/shared/types";
import type { BulkActionInput, BulkImportInput, CreateLinkInput, UpdateLinkInput } from "@/shared/schemas";

export interface LinkFilters {
  page: number;
  pageSize: number;
  search: string;
  status: string;
  collectionId: string;
  protected: string;
  sort: string;
  order: "asc" | "desc";
}

export const linkKeys = {
  all: ["links"] as const,
  list: (filters: object) => ["links", "list", filters] as const,
  detail: (id: string) => ["links", "detail", id] as const,
  analytics: (id: string, range: number) => ["links", "analytics", id, range] as const,
};

export function useLinkList(filters: LinkFilters) {
  return useQuery({
    queryKey: linkKeys.list(filters),
    queryFn: ({ signal }) => api<LinkListDTO>(`/links${qs({ ...filters, status: filters.status === "all" ? "" : filters.status, collectionId: filters.collectionId === "all" ? "" : filters.collectionId, protected: filters.protected === "all" ? "" : filters.protected })}`, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function useLink(id: string) {
  return useQuery({ queryKey: linkKeys.detail(id), queryFn: ({ signal }) => api<LinkDTO>(`/links/${id}`, { signal }), retry: false });
}

export function useLinkAnalytics(id: string, range: number) {
  return useQuery({
    queryKey: linkKeys.analytics(id, range),
    queryFn: ({ signal }) => api<AnalyticsDTO>(`/links/${id}/analytics${qs({ range, tz: browserTimeZone() })}`, { signal }),
    placeholderData: keepPreviousData,
  });
}

function useInvalidateLinks() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: linkKeys.all });
    void queryClient.invalidateQueries({ queryKey: ["analytics"] });
    void queryClient.invalidateQueries({ queryKey: ["collections"] });
    void queryClient.invalidateQueries({ queryKey: ["bio"] });
  };
}

export function useCreateLink() {
  const invalidate = useInvalidateLinks();
  return useMutation({
    mutationFn: (input: CreateLinkInput) => api<LinkDTO>("/links", { method: "POST", body: input }),
    onSuccess: invalidate,
  });
}

export function useUpdateLink(id: string) {
  const invalidate = useInvalidateLinks();
  return useMutation({
    mutationFn: (input: UpdateLinkInput) => api<LinkDTO>(`/links/${id}`, { method: "PATCH", body: input }),
    onSuccess: invalidate,
  });
}

export function useDeleteLink() {
  const invalidate = useInvalidateLinks();
  return useMutation({
    mutationFn: (id: string) => api<{ ok: true }>(`/links/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

export function useToggleLink() {
  const invalidate = useInvalidateLinks();
  return useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) => api<LinkDTO>(`/links/${id}`, { method: "PATCH", body: { isEnabled } }),
    onSuccess: invalidate,
  });
}

export function useBulkLinks() {
  const invalidate = useInvalidateLinks();
  return useMutation({
    mutationFn: (input: BulkActionInput) => api<{ affected: number }>("/links/bulk", { method: "POST", body: input }),
    onSuccess: invalidate,
  });
}

export function useImportLinks() {
  const invalidate = useInvalidateLinks();
  return useMutation({
    mutationFn: (input: BulkImportInput) => api<BulkImportResultDTO>("/links/import", { method: "POST", body: input }),
    onSuccess: invalidate,
  });
}

export function fetchPageTitle(url: string) {
  return api<{ title: string }>("/links/metadata", { method: "POST", body: { url } });
}

export function checkSlug(slug: string, exceptId?: string) {
  return api<{ available: boolean; reason: string | null }>(`/links/slug-available${qs({ slug, exceptId })}`);
}
