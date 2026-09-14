import { db, doc, getDoc, getDocs, collection, query, where } from "../api";
import { LinkData } from "../types";
import { setDoc } from "../api";
import { TreeApi } from "../lib/api/tree.api";

export class TreeService {
  static async getLinkTree(userId: string): Promise<any> {
    return await TreeApi.getLinkTree(userId);
  }

  static async getPublicTree(targetUid: string): Promise<{ treeData: any; linksData: LinkData[]; colsData: any[] } | null> {
    if (!targetUid) return null;
    const snapSettings = await getDoc(doc(db, "link_trees", targetUid));
    const treeData = snapSettings.exists() ? snapSettings.data() : null;

    let linksData: LinkData[] = [];
    const treeLinks = treeData?.treeLinks || [];
    if (Array.isArray(treeLinks) && treeLinks.length > 0) {
      const fetched = await Promise.all(
        treeLinks.map(async (id: string) => {
          const snap = await getDoc(doc(db, "links", id));
          return snap.exists() ? { id, ...snap.data() } as LinkData : null;
        })
      );
      linksData = fetched.filter(Boolean) as LinkData[];
    } else {
      linksData = [];
    }

    const activeCollectionIds = Array.from(new Set(
      linksData
        .map(l => l.collectionId)
        .filter((id): id is string => typeof id === "string" && id !== "")
    ));

    let colsData: any[] = [];
    if (activeCollectionIds.length > 0) {
      const fetchedCols = await Promise.all(
        activeCollectionIds.map(async (id: string) => {
          const snap = await getDoc(doc(db, "collections", id));
          return snap.exists() ? { id, ...snap.data() } : null;
        })
      );
      colsData = fetchedCols.filter(Boolean);
    }

    return {
      treeData,
      linksData,
      colsData
    };
  }

  static async saveLinkTree(userId: string, treeData: any): Promise<void> {
    await setDoc(doc(db, "link_trees", userId), treeData, { merge: true });
  }
}
