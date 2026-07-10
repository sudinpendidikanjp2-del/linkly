import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClickEvent } from "../types";
import { AnalyticsService } from "../services/analytics.service";
import { User } from "../api";

export function useAnalytics(user: User | null, currentTab: string) {
  const [analyticsTab, setAnalyticsTab] = useState<'trends' | 'geo' | 'devices'>('trends');

  // TanStack Query (All Clicks Query) - SINGLE SOURCE OF TRUTH
  const { data: queryAllClicks, isLoading: isAllClicksLoading } = useQuery({
    queryKey: ["all_clicks", user?.uid, currentTab],
    queryFn: async () => {
      if (!user) return [];
      return await AnalyticsService.getAllClicks(user.uid);
    },
    enabled: !!user && (currentTab === "dashboard" || currentTab === "link-detail"),
    staleTime: 1000 * 60 * 3, // 3 minutes stale time
  });

  const allClicks = queryAllClicks || [];

  return {
    allClicks,
    isAllClicksLoading,
    analyticsTab,
    setAnalyticsTab,
  };
}
