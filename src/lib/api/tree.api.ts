export class TreeApi {
  static async getLinkTree(userId: string): Promise<any> {
    const res = await fetch(`/api/documents/link_trees/${userId}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to fetch link tree");
    }
    return await res.json();
  }
}
