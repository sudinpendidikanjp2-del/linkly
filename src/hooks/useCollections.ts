import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LinkCollection } from "../types";
import { CollectionService } from "../services/collection.service";
import { User } from "../api";

export function useCollections(user: User | null, currentTab: string) {
  const [isColModalOpen, setIsColModalOpen] = useState(false);
  const [colEditing, setColEditing] = useState<LinkCollection | null>(null);
  const [colName, setColName] = useState("");
  const [colDesc, setColDesc] = useState("");
  const [colSelectedLinkIds, setColSelectedLinkIds] = useState<string[]>([]);
  const [formCollectionId, setFormCollectionId] = useState("");
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [isSavingCollection, setIsSavingCollection] = useState(false);

  // TanStack Query (Collections Query) - SINGLE SOURCE OF TRUTH
  const { data: queryCollections, isLoading: isCollectionsLoading } = useQuery({
    queryKey: ["collections", user?.uid],
    queryFn: async () => {
      if (!user) return [];
      return await CollectionService.getCollections(user.uid);
    },
    enabled: !!user && (currentTab === "collections" || currentTab === "link-tree"),
    staleTime: 1000 * 60 * 5, // 5 minutes stale time
  });

  const collections = queryCollections || [];

  return {
    collections,
    isCollectionsLoading,
    isColModalOpen,
    setIsColModalOpen,
    colEditing,
    setColEditing,
    colName,
    setColName,
    colDesc,
    setColDesc,
    colSelectedLinkIds,
    setColSelectedLinkIds,
    formCollectionId,
    setFormCollectionId,
    activeCollectionId,
    setActiveCollectionId,
    isSavingCollection,
    setIsSavingCollection,
  };
}
