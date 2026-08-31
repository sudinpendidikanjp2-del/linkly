import { LinkData, BulkImportItem, BulkImportResult } from "../../types";

export class LinksApi {
  static async getLinksRegistry(params: URLSearchParams): Promise<{ links: LinkData[]; totalCount: number; totalPages: number }> {
    const res = await fetch(`/api/links/registry?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch links registry");
    return await res.json();
  }

  static async generateAiMetadata(originalUrl: string, currentTitle?: string): Promise<{ title?: string; description?: string }> {
    const response = await fetch("/api/generate-metadata", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ originalUrl, currentTitle })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.details || "Gagal menghasilkan metadata.");
    }
    return data;
  }

  static async bulkImportLinks(userId: string, items: BulkImportItem[]): Promise<BulkImportResult> {
    const response = await fetch("/api/links/bulk-import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userId, items })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Gagal melakukan impor massal.");
    }
    return data;
  }
}
