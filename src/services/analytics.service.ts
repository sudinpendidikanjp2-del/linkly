import { ClickEvent } from "../types";
import { AnalyticsApi } from "../lib/api/analytics.api";

export class AnalyticsService {
  static async getDashboardStats(userId: string): Promise<any> {
    return await AnalyticsApi.getDashboardStats(userId);
  }

  static async getAllClicks(userId: string): Promise<ClickEvent[]> {
    return await AnalyticsApi.getAllClicks(userId);
  }
}
