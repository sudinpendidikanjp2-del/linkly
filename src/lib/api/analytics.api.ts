import { ClickEvent } from "../../types";

export class AnalyticsApi {
  static async getDashboardStats(userId: string): Promise<any> {
    const res = await fetch(`/api/dashboard/stats?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error("Failed to fetch dashboard stats");
    return await res.json();
  }

  static async getAllClicks(userId: string): Promise<ClickEvent[]> {
    const res = await fetch(`/api/documents/clicks?userId=${userId}`);
    if (!res.ok) throw new Error("Failed to fetch all clicks");
    return await res.json();
  }
}
