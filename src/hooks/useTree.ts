import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { LinkData } from "../types";
import { TreeService } from "../services/tree.service";
import { User } from "../api";

export function useTree(user: User | null, currentTab: string, isLinkTreePath: boolean = false) {
  const path = window.location.pathname;
  const targetUid = isLinkTreePath ? path.split("/")[2] : null;

  const [treeTitle, setTreeTitle] = useState("");
  const [treeBio, setTreeBio] = useState("");
  const [treeAvatar, setTreeAvatar] = useState("");
  const [treeTheme, setTreeTheme] = useState("slate");
  const [treeLinks, setTreeLinks] = useState<string[]>([]);
  const [treeBgImage, setTreeBgImage] = useState("");
  const [treeButtonStyle, setTreeButtonStyle] = useState("classic");
  const [treeShowFolders, setTreeShowFolders] = useState(true);
  const [treeInstagram, setTreeInstagram] = useState("");
  const [treeTwitter, setTreeTwitter] = useState("");
  const [treeLinkedIn, setTreeLinkedIn] = useState("");
  const [treeYoutube, setTreeYoutube] = useState("");
  const [treeGithub, setTreeGithub] = useState("");
  const [treeVideoUrl, setTreeVideoUrl] = useState("");
  const [treeButtonBgImage, setTreeButtonBgImage] = useState("");

  const [treeSavedSuccess, setTreeSavedSuccess] = useState(false);
  const [copiedTreeUrl, setCopiedTreeUrl] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [isSavingTree, setIsSavingTree] = useState(false);

  const [isTreeFormInitialized, setIsTreeFormInitialized] = useState(false);

  // Private Link Tree Query - SINGLE SOURCE OF TRUTH
  const { data: queryLinkTree } = useQuery({
    queryKey: ["link_tree", user?.uid],
    queryFn: async () => {
      if (!user) return null;
      return await TreeService.getLinkTree(user.uid);
    },
    enabled: !!user && (currentTab === "link-tree" || currentTab === "dashboard"),
    staleTime: 1000 * 60 * 5, // 5 minutes stale time
  });

  // Synchronize Private Link Tree values to local form state ONCE when loaded
  useEffect(() => {
    if (user && !isTreeFormInitialized) {
      if (queryLinkTree) {
        setTreeTitle(queryLinkTree.treeTitle || user.displayName || "Tautan Saya");
        setTreeBio(queryLinkTree.treeBio || "Selamat datang di Link Tree kustom saya!");
        setTreeAvatar(queryLinkTree.treeAvatar || user.photoURL || "");
        setTreeTheme(queryLinkTree.treeTheme || "slate");
        setTreeLinks(queryLinkTree.treeLinks || []);
        setTreeBgImage(queryLinkTree.treeBgImage || "");
        setTreeButtonStyle(queryLinkTree.treeButtonStyle || "classic");
        setTreeShowFolders(queryLinkTree.treeShowFolders !== false);
        setTreeInstagram(queryLinkTree.treeInstagram || "");
        setTreeTwitter(queryLinkTree.treeTwitter || "");
        setTreeLinkedIn(queryLinkTree.treeLinkedIn || "");
        setTreeYoutube(queryLinkTree.treeYoutube || "");
        setTreeGithub(queryLinkTree.treeGithub || "");
        setTreeVideoUrl(queryLinkTree.treeVideoUrl || "");
        setTreeButtonBgImage(queryLinkTree.treeButtonBgImage || "");
        setIsTreeFormInitialized(true);
      } else if (queryLinkTree === null) {
        setTreeTitle(user.displayName || "Tautan Saya");
        setTreeBio("Selamat datang di Link Tree kustom saya!");
        setTreeAvatar(user.photoURL || "");
        setTreeTheme("slate");
        setTreeLinks([]);
        setTreeBgImage("");
        setTreeButtonStyle("classic");
        setTreeShowFolders(true);
        setTreeInstagram("");
        setTreeTwitter("");
        setTreeLinkedIn("");
        setTreeYoutube("");
        setTreeGithub("");
        setTreeVideoUrl("");
        setTreeButtonBgImage("");
        setIsTreeFormInitialized(true);
      }
    }
  }, [queryLinkTree, user, isTreeFormInitialized]);

  // Reset form initialization when user logs out or switches
  useEffect(() => {
    if (!user) {
      setIsTreeFormInitialized(false);
    }
  }, [user]);

  // Public Tree, Links, and Collections Combined Query - SINGLE SOURCE OF TRUTH (using select mapping)
  const { data: publicTreeData, isLoading: publicLoading, isError: publicError } = useQuery({
    queryKey: ["public_tree", targetUid],
    queryFn: async () => {
      if (!targetUid) return null;
      return await TreeService.getPublicTree(targetUid);
    },
    enabled: isLinkTreePath && !!targetUid,
    staleTime: 1000 * 60 * 10, // 10 minutes stale time for public profiles
    select: (data) => {
      if (!data) return null;
      const { treeData, linksData, colsData } = data;
      const settings = treeData ? {
        treeTitle: treeData.treeTitle || "Tautan Saya",
        treeBio: treeData.treeBio || "Selamat datang di Link Tree kustom saya!",
        treeAvatar: treeData.treeAvatar || "",
        treeTheme: treeData.treeTheme || "slate",
        treeLinks: treeData.treeLinks || [],
        treeBgImage: treeData.treeBgImage || "",
        treeButtonStyle: treeData.treeButtonStyle || "classic",
        treeShowFolders: treeData.treeShowFolders !== false,
        treeInstagram: treeData.treeInstagram || "",
        treeTwitter: treeData.treeTwitter || "",
        treeLinkedIn: treeData.treeLinkedIn || "",
        treeYoutube: treeData.treeYoutube || "",
        treeGithub: treeData.treeGithub || "",
        treeVideoUrl: treeData.treeVideoUrl || "",
        treeButtonBgImage: treeData.treeButtonBgImage || ""
      } : {
        treeTitle: "Tautan Saya",
        treeBio: "Selamat datang di Link Tree kustom saya!",
        treeAvatar: "",
        treeTheme: "slate",
        treeLinks: [],
        treeBgImage: "",
        treeButtonStyle: "classic",
        treeShowFolders: true,
        treeInstagram: "",
        treeTwitter: "",
        treeLinkedIn: "",
        treeYoutube: "",
        treeGithub: "",
        treeVideoUrl: "",
        treeButtonBgImage: ""
      };
      return {
        settings,
        links: linksData,
        collections: colsData,
      };
    }
  });

  const publicTreeSettings = publicTreeData?.settings || null;
  const publicTreeLinks = publicTreeData?.links || [];
  const publicTreeCollections = publicTreeData?.collections || [];

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    let videoId = "";
    if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    } else if (url.includes("youtube.com/watch")) {
      try {
        const urlParams = new URLSearchParams(new URL(url).search);
        videoId = urlParams.get("v") || "";
      } catch (e) {
        // ignore
      }
    } else if (url.includes("youtube.com/embed/")) {
      videoId = url.split("youtube.com/embed/")[1].split("?")[0];
    } else if (url.includes("youtube.com/shorts/")) {
      videoId = url.split("youtube.com/shorts/")[1].split("?")[0];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const handleSaveTree = async () => {
    if (!user) return;
    setIsSavingTree(true);
    try {
      const treeData = {
        treeTitle,
        treeBio,
        treeAvatar,
        treeTheme,
        treeLinks,
        treeBgImage,
        treeButtonStyle,
        treeShowFolders,
        treeInstagram,
        treeTwitter,
        treeLinkedIn,
        treeYoutube,
        treeGithub,
        treeVideoUrl,
        treeButtonBgImage,
        updatedAt: new Date().toISOString()
      };
      await TreeService.saveLinkTree(user.uid, treeData);
      setTreeSavedSuccess(true);
      setTimeout(() => setTreeSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving tree:", err);
    } finally {
      setIsSavingTree(false);
    }
  };

  return {
    treeTitle,
    setTreeTitle,
    treeBio,
    setTreeBio,
    treeAvatar,
    setTreeAvatar,
    treeTheme,
    setTreeTheme,
    treeLinks,
    setTreeLinks,
    treeBgImage,
    setTreeBgImage,
    treeButtonStyle,
    setTreeButtonStyle,
    treeShowFolders,
    setTreeShowFolders,
    treeInstagram,
    setTreeInstagram,
    treeTwitter,
    setTreeTwitter,
    treeLinkedIn,
    setTreeLinkedIn,
    treeYoutube,
    setTreeYoutube,
    treeGithub,
    setTreeGithub,
    treeVideoUrl,
    setTreeVideoUrl,
    treeButtonBgImage,
    setTreeButtonBgImage,
    treeSavedSuccess,
    setTreeSavedSuccess,
    copiedTreeUrl,
    setCopiedTreeUrl,
    expandedFolders,
    setExpandedFolders,
    isSavingTree,
    setIsSavingTree,
    publicTreeSettings,
    publicTreeLinks,
    publicTreeCollections,
    publicLoading,
    publicError,
    isTreeFormInitialized,
    setIsTreeFormInitialized,
    queryLinkTree,
    getYouTubeEmbedUrl,
    handleSaveTree,
  };
}
