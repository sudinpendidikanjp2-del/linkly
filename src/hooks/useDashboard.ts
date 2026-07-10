import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClickEvent, LinkData } from "../types";
import { AnalyticsService } from "../services/analytics.service";
import { User } from "../api";

export function useDashboard(user: User | null) {
  const [currentTab, setCurrentTab] = useState<"dashboard" | "links-list" | "link-detail" | "link-tree" | "collections">("dashboard");
  const [lastLoadedLinkData, setLastLoadedLinkData] = useState<LinkData | null>(null);

  // TanStack Query (Dashboard Stats Query) - SINGLE SOURCE OF TRUTH
  const { data: queryDashboardStats, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["dashboard_stats", user?.uid],
    queryFn: async () => {
      if (!user) return null;
      return await AnalyticsService.getDashboardStats(user.uid);
    },
    enabled: !!user && currentTab === "dashboard",
    staleTime: 1000 * 60, // 1 minute stale time for real-time dashboard stats
  });

  const recentClicks = queryDashboardStats?.latestActivity || [];

  return {
    currentTab,
    setCurrentTab,
    recentClicks,
    isDashboardLoading,
    queryDashboardStats,
    lastLoadedLinkData,
    setLastLoadedLinkData,
  };
}
