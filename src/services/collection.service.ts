import { db, doc, setDoc, deleteDoc, updateDoc } from "../api";
import { LinkCollection } from "../types";
import { CollectionsApi } from "../lib/api/collections.api";

export class CollectionService {
  static async getCollections(userId: string): Promise<LinkCollection[]> {
    return await CollectionsApi.getCollections(userId);
  }

  static async saveCollection(
    colId: string,
    colData: Partial<LinkCollection>,
    added: string[],
    removed: string[]
  ): Promise<void> {
    await setDoc(doc(db, "collections", colId), colData);
    for (const lId of added) {
      await updateDoc(doc(db, "links", lId), { collectionId: colId });
    }
    for (const lId of removed) {
      await updateDoc(doc(db, "links", lId), { collectionId: "" });
    }
  }

  static async deleteCollection(colId: string, linkIds: string[]): Promise<void> {
    await deleteDoc(doc(db, "collections", colId));
    for (const lId of linkIds) {
      await updateDoc(doc(db, "links", lId), { collectionId: "" });
    }
  }
}
