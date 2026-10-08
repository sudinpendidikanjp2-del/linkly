import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api, browserTimeZone, qs } from "@/lib/api";
import type { AnalyticsDTO } from "@/shared/types";

export function useOverview(range: number) {
  return useQuery({
    queryKey: ["analytics", "overview", range],
    queryFn: ({ signal }) => api<AnalyticsDTO>(`/analytics/overview${qs({ range, tz: browserTimeZone() })}`, { signal }),
    placeholderData: keepPreviousData,
  });
}
