import { LinkCollection } from "../../types";

export class CollectionsApi {
  static async getCollections(userId: string): Promise<LinkCollection[]> {
    const res = await fetch(`/api/documents/collections?userId=${userId}`);
    if (!res.ok) throw new Error("Failed to fetch collections");
    return await res.json();
  }
}
