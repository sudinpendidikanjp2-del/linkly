import { db, doc, deleteDoc, updateDoc, setDoc } from "../api";
import { LinkData } from "../types";
import { nanoid } from "nanoid";
import { LinksApi } from "../lib/api/links.api";

export class LinkService {
  static async getLinksRegistry(params: URLSearchParams): Promise<{ links: LinkData[]; totalCount: number; totalPages: number }> {
    return await LinksApi.getLinksRegistry(params);
  }

  static async deleteLink(id: string): Promise<void> {
    await deleteDoc(doc(db, "links", id));
  }

  static async bulkDeleteLinks(ids: string[]): Promise<void> {
    const deletePromises = ids.map(id => deleteDoc(doc(db, "links", id)));
    await Promise.all(deletePromises);
  }

  static async generateAiMetadata(originalUrl: string, currentTitle?: string): Promise<{ title?: string; description?: string }> {
    return await LinksApi.generateAiMetadata(originalUrl, currentTitle);
  }

  static async saveLink(linkId: string | null, linkData: Partial<LinkData>): Promise<string> {
    const finalId = linkId || nanoid();
    if (linkId) {
      await updateDoc(doc(db, "links", linkId), linkData);
    } else {
      await setDoc(doc(db, "links", finalId), linkData);
    }
    return finalId;
  }
}
