import React, { useState, useEffect } from "react";
import { auth, db, onAuthStateChanged, User, signInWithPopup, googleProvider, signOut, collection, doc, getDoc, setDoc, onSnapshot, query, where, deleteDoc, updateDoc, Timestamp, increment, getDocFromServer, getDocs } from "./api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link2, LayoutDashboard, Settings, LogOut, Plus, Search, Filter, ArrowUpDown, QrCode, ExternalLink, Trash2, Edit2, Copy, Check, AlertCircle, Clock, MousePointer2, Lock, Unlock, Layers, Activity, Sparkles, CheckSquare, Square, Download, RefreshCw, Globe, Laptop, Smartphone, Tablet, Shield, Compass, User as UserIcon, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Calendar, SlidersHorizontal, List, Eye, EyeOff, Sun, Moon, Upload, Image, Instagram, Twitter, Linkedin, Folder, FolderPlus, FolderOpen, Share2, Youtube, Github } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { jsPDF } from "jspdf";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from "recharts";
import { format } from "date-fns";
import { nanoid } from "nanoid";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { LinkData, ClickEvent, LinkCollection, GlobalSettings, OperationType, FirestoreErrorInfo, BulkImportItem, BulkImportSkippedItem, BulkImportResult } from "./types";
import { TRANSLATIONS, APP_THEME_CONFIGS, THEME_PALETTES, THEME_STYLES } from "./constants";

// Import modular pages
import AuthPage from "./pages/AuthPage";
import PublicLinkTree from "./pages/PublicLinkTree";
import DashboardPage from "./pages/DashboardPage";
import LinksListPage from "./pages/LinksListPage";
import LinkDetailPage from "./pages/LinkDetailPage";
import CollectionsPage from "./pages/CollectionsPage";
import LinkTreePage from "./pages/LinkTreePage";

// Import modular components
import CreateLinkModal from "./components/CreateLinkModal";
import BulkImportModal from "./components/BulkImportModal";
import DuplicateSlugAlertModal from "./components/DuplicateSlugAlertModal";

// Import services for business logic abstraction (Phase 1)
import { AuthService } from "./services/auth.service";
import { LinkService } from "./services/link.service";
import { CollectionService } from "./services/collection.service";
import { AnalyticsService } from "./services/analytics.service";
import { TreeService } from "./services/tree.service";

// Import custom hooks (Phase 2)
import { useToast } from "./hooks/useToast";
import { useLanguage } from "./hooks/useLanguage";
import { useTheme } from "./hooks/useTheme";
import { useLinks } from "./hooks/useLinks";
import { useCollections } from "./hooks/useCollections";
import { useDashboard } from "./hooks/useDashboard";
import { useAnalytics } from "./hooks/useAnalytics";
import { useTree } from "./hooks/useTree";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  // Check if current route is a public Link Tree profile
  const path = window.location.pathname;
  const isLinkTreePath = path.startsWith("/tree/") || path.startsWith("/lt/") || path.startsWith("/t/");

  // Use custom theme, language, and toast hooks
  const {
    isLightMode,
    appTheme,
    setAppTheme,
    curT,
    themeInlineVars,
    toggleLightMode,
    dashboardBg,
    sidebarBg,
    cardBg,
    inputBg,
    textMuted,
    textTitle,
    borderClassic,
    hoverBg,
    tabActiveBg,
  } = useTheme();

  const {
    lang,
    toggleLang,
    t,
  } = useLanguage();

  const {
    customToast,
    customToastType,
    showToast,
  } = useToast();

  // Core App Auth and configuration state (retained in App.tsx)
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings] = useState<GlobalSettings>({ registrationEnabled: true });

  // Use custom query-driven hooks - TanStack Query is now the SINGLE SOURCE OF TRUTH (Phase 4)
  const {
    currentTab,
    setCurrentTab,
    recentClicks,
    queryDashboardStats,
    lastLoadedLinkData,
    setLastLoadedLinkData,
  } = useDashboard(user);

  const {
    links,
    totalPages,
    totalCount,
    selectedLinkIds,
    setSelectedLinkIds,
    isModalOpen,
    setIsModalOpen,
    editingLink,
    setEditingLink,
    searchTerm,
    setSearchTerm,
    sortConfig,
    setSortConfig,
    filterStatus,
    setFilterStatus,
    copiedId,
    setCopiedId,
    copiedQr,
    setCopiedQr,
    qrLink,
    setQrLink,
    qrFgColor,
    setQrFgColor,
    qrBgColor,
    setQrBgColor,
    landingEnabled,
    setLandingEnabled,
    slugValue,
    setSlugValue,
    showQrLogo,
    setShowQrLogo,
    qrLogoUrl,
    setQrLogoUrl,
    selectedDetailLinkId,
    setSelectedDetailLinkId,
    listCurrentPage,
    setListCurrentPage,
    listItemsPerPage,
    setListItemsPerPage,
    listFilterPassword,
    setListFilterPassword,
    listFilterPortal,
    setListFilterPortal,
    showAdvancedFilters,
    setShowAdvancedFilters,
    listFilterCategory,
    setListFilterCategory,
    modalPassword,
    setModalPassword,
    formCategory,
    setFormCategory,
    detailCategory,
    setDetailCategory,
    detailEditTitle,
    setDetailEditTitle,
    detailEditUrl,
    setDetailEditUrl,
    detailEditSlug,
    setDetailEditSlug,
    detailEditExpiry,
    setDetailEditExpiry,
    detailEditActivation,
    setDetailEditActivation,
    detailEditPassword,
    setDetailEditPassword,
    detailEditPortalEnabled,
    setDetailEditPortalEnabled,
    detailEditPortalDescription,
    setDetailEditPortalDescription,
    detailEditPortalAvatar,
    setDetailEditPortalAvatar,
    detailFormSaved,
    setDetailFormSaved,
    detailAnalyticsTab,
    setDetailAnalyticsTab,
    detailIpSearch,
    setDetailIpSearch,
    detailEditEnabled,
    setDetailEditEnabled,
    isSavingLink,
    setIsSavingLink,
    isSavingDetailLink,
    setIsSavingDetailLink,
    formTitle,
    setFormTitle,
    formLandingDescription,
    setFormLandingDescription,
    formLinkEnabled,
    setFormLinkEnabled,
    isGeneratingAi,
    setIsGeneratingAi,
    aiError,
    setAiError,
  } = useLinks(user, currentTab);

  const {
    collections,
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
  } = useCollections(user, currentTab);

  const {
    allClicks,
    analyticsTab,
    setAnalyticsTab,
  } = useAnalytics(user, currentTab);

  const {
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
    copiedTreeUrl,
    setCopiedTreeUrl,
    expandedFolders,
    setExpandedFolders,
    isSavingTree,
    publicTreeSettings,
    publicTreeLinks,
    publicTreeCollections,
    publicLoading,
    publicError,
    handleSaveTree,
    getYouTubeEmbedUrl,
  } = useTree(user, currentTab, isLinkTreePath);

  // Bulk Import States & Handler
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isDuplicateAlertOpen, setIsDuplicateAlertOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [skippedItems, setSkippedItems] = useState<BulkImportSkippedItem[]>([]);
  const [importedCount, setImportedCount] = useState(0);

  const handleBulkImport = async (items: BulkImportItem[]) => {
    if (!user) return;
    setIsImporting(true);
    try {
      const result = await LinkService.bulkImportLinks(user.uid, items);
      setImportedCount(result.importedCount);
      setSkippedItems(result.skipped);
      
      // Invalidate queries so that the link list and dashboard update
      await queryClient.invalidateQueries({ queryKey: ["links_registry"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard_stats"] });
      await queryClient.invalidateQueries({ queryKey: ["links", user.uid] });

      setIsBulkImportOpen(false);

      if (result.skippedCount > 0) {
        setIsDuplicateAlertOpen(true);
        showToast(
          lang === "id"
            ? `Berhasil mengimpor ${result.importedCount} tautan. ${result.skippedCount} dilewati.`
            : `Successfully imported ${result.importedCount} links. ${result.skippedCount} skipped.`,
          "error"
        );
      } else {
        showToast(
          lang === "id"
            ? `Berhasil mengimpor ${result.importedCount} tautan baru!`
            : `Successfully imported ${result.importedCount} new links!`,
          "success"
        );
      }
    } catch (error: any) {
      showToast(
        lang === "id"
          ? "Gagal melakukan impor massal."
          : "Failed to perform bulk import.",
        "error"
      );
    } finally {
      setIsImporting(false);
    }
  };

  // Synchronize QR code default foreground color when app theme moves
  useEffect(() => {
    setQrFgColor(curT.qrFg);
  }, [appTheme, curT.qrFg]);

  // Query Client Setup
  const queryClient = useQueryClient();

  // Dynamic Document Title Updater
  useEffect(() => {
    if (isLinkTreePath) {
      if (publicLoading) {
        document.title = "Loading... | Linkly Bio";
      } else if (publicError) {
        document.title = "Not Found | Linkly Bio";
      } else {
        const titleStr = publicTreeSettings?.treeTitle || "Bio";
        document.title = `${titleStr} | Linkly Bio`;
      }
    } else if (!user) {
      document.title = `${t("login")} | Linkly SaaS`;
    } else {
      switch (currentTab) {
        case "dashboard":
          document.title = `${t("dashboard")} | Linkly SaaS`;
          break;
        case "links-list":
          document.title = `${t("linksList")} | Linkly SaaS`;
          break;
        case "link-tree":
          document.title = `${t("linkTree")} | Linkly SaaS`;
          break;
        case "collections":
          document.title = `Collections & Folders | Linkly SaaS`;
          break;
        case "link-detail": {
          const activeL = links.find((l) => l.id === selectedDetailLinkId);
          const detailTitle = activeL ? (activeL.title || activeL.shortSlug) : "Analytics";
          document.title = `${detailTitle} - Analytics | Linkly SaaS`;
          break;
        }
        default:
          document.title = "Linkly SaaS";
      }
    }
  }, [
    isLinkTreePath,
    publicLoading,
    publicError,
    publicTreeSettings?.treeTitle,
    user,
    currentTab,
    selectedDetailLinkId,
    links,
    lang,
  ]);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        await AuthService.syncUserProfileAndTree(currentUser);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Invalidate and refetch all queries when opening a new page/tab
  useEffect(() => {
    if (user) {
      queryClient.invalidateQueries();
    }
  }, [currentTab, user, queryClient]);

  // Sync landing field toggle on editing change
  useEffect(() => {
    if (editingLink) {
      setLandingEnabled(!!editingLink.landingEnabled);
      setSlugValue(editingLink.shortSlug);
      setFormTitle(editingLink.title || "");
      setFormLandingDescription(editingLink.landingDescription || "");
      setFormLinkEnabled(editingLink.isEnabled !== false);
      setModalPassword(editingLink.password || "");
      setFormCategory(editingLink.category || "general");
      setFormCollectionId(editingLink.collectionId || "");
    } else {
      setLandingEnabled(false);
      setSlugValue("");
      setFormTitle("");
      setFormLandingDescription("");
      setFormLinkEnabled(true);
      setModalPassword("");
      setFormCategory("general");
      setFormCollectionId("");
    }
    setAiError(null);
  }, [editingLink, isModalOpen]);

  // Automatically select the first link in deep detail tab when empty
  useEffect(() => {
    if (!selectedDetailLinkId && links.length > 0) {
      setSelectedDetailLinkId(links[0].id);
    }
  }, [links, selectedDetailLinkId]);

  // Lock body scroll when create/edit link modal or QR customizer is open
  useEffect(() => {
    if (isModalOpen || qrLink) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen, qrLink]);

  // Synchronize deep editing fields for specific LinkDetailPage
  useEffect(() => {
    const activeL = links.find(l => l.id === selectedDetailLinkId);
    if (!activeL) {
      setLastLoadedLinkData(null);
      return;
    }

    const isDifferentLink = selectedDetailLinkId !== lastLoadedLinkData?.id;
    const isDatabaseDataUpdated = lastLoadedLinkData && (
      activeL.title !== lastLoadedLinkData.title ||
      activeL.originalUrl !== lastLoadedLinkData.originalUrl ||
      activeL.shortSlug !== lastLoadedLinkData.shortSlug ||
      activeL.expiresAt !== lastLoadedLinkData.expiresAt ||
      activeL.activatedAt !== lastLoadedLinkData.activatedAt ||
      activeL.password !== lastLoadedLinkData.password ||
      activeL.landingEnabled !== lastLoadedLinkData.landingEnabled ||
      activeL.landingDescription !== lastLoadedLinkData.landingDescription ||
      activeL.landingAvatar !== lastLoadedLinkData.landingAvatar ||
      activeL.isEnabled !== lastLoadedLinkData.isEnabled ||
      activeL.category !== lastLoadedLinkData.category
    );

    if (isDifferentLink || isDatabaseDataUpdated) {
      setDetailEditTitle(activeL.title || "");
      setDetailEditUrl(activeL.originalUrl || "");
      setDetailEditSlug(activeL.shortSlug || "");
      setDetailEditExpiry(activeL.expiresAt ? activeL.expiresAt.slice(0, 16) : "");
      setDetailEditActivation(activeL.activatedAt ? activeL.activatedAt.slice(0, 16) : "");
      setDetailEditPassword(activeL.password || "");
      setDetailEditPortalEnabled(!!activeL.landingEnabled);
      setDetailEditPortalDescription(activeL.landingDescription || "");
      setDetailEditPortalAvatar(activeL.landingAvatar || "");
      setDetailEditEnabled(activeL.isEnabled !== false);
      setDetailCategory(activeL.category || "general");
      setLastLoadedLinkData(activeL);
    }
    setDetailFormSaved(false);
  }, [selectedDetailLinkId, links, lastLoadedLinkData]);

  const handleLogin = async () => {
    try {
      await AuthService.login();
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
  };

  const handleCopy = (slug: string, id: string) => {
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus tautan ini?")) {
      try {
        await LinkService.deleteLink(id);
        await queryClient.invalidateQueries({ queryKey: ["links_registry"] });
        await queryClient.invalidateQueries({ queryKey: ["dashboard_stats"] });
        await queryClient.invalidateQueries({ queryKey: ["links", user?.uid] });
        setSelectedLinkIds(prev => prev.filter(item => item !== id));
        showToast(lang === "id" ? "Tautan berhasil dihapus!" : "Link deleted successfully!");
      } catch (err) {
        console.error(err);
        showToast(lang === "id" ? "Gagal menghapus tautan." : "Failed to delete link.", "error");
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLinkIds.length === 0) return;
    if (window.confirm(`Apakah Anda yakin ingin menghapus ${selectedLinkIds.length} tautan secara massal?`)) {
      try {
        await LinkService.bulkDeleteLinks(selectedLinkIds);
        await queryClient.invalidateQueries({ queryKey: ["links_registry"] });
        await queryClient.invalidateQueries({ queryKey: ["dashboard_stats"] });
        await queryClient.invalidateQueries({ queryKey: ["links", user?.uid] });
        setSelectedLinkIds([]);
        showToast(lang === "id" ? `${selectedLinkIds.length} tautan berhasil dihapus secara massal!` : `${selectedLinkIds.length} links deleted successfully!`);
      } catch (err) {
        console.error(err);
        showToast(lang === "id" ? "Gagal menghapus tautan secara massal." : "Failed to bulk delete links.", "error");
      }
    }
  };

  const toggleSelectLink = (id: string) => {
    setSelectedLinkIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleGenerateAiMetadata = async () => {
    const originalUrlInput = document.querySelector('input[name="originalUrl"]') as HTMLInputElement;
    const url = originalUrlInput?.value;

    if (!url) {
      setAiError("Silakan masukkan Tautan Tujuan Utama terlebih dahulu.");
      return;
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      setAiError("Mohon masukkan URL lengkap yang valid (dimulai dengan http:// atau https://).");
      return;
    }

    setIsGeneratingAi(true);
    setAiError(null);

    try {
      const data = await LinkService.generateAiMetadata(url, formTitle);

      if (data.title) {
        setFormTitle(data.title);
      }
      if (data.description) {
        setFormLandingDescription(data.description);
        setLandingEnabled(true);
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Gagal mengambil data otomatis dari AI.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSaveLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const originalUrl = formData.get("originalUrl") as string;
    const shortSlug = formData.get("shortSlug") as string || nanoid(6);
    const expiresAt = formData.get("expiresAt") as string;
    const activatedAt = formData.get("activatedAt") as string;
    const password = formData.get("password") as string;
    const landingAvatar = formData.get("landingAvatar") as string;

    if (password && password.length < 6) {
      showToast(
        lang === "id" ? "Kata sandi terlalu pendek (minimal 6 karakter)" : "Password is too weak (minimum 6 characters)",
        "error"
      );
      return;
    }

    const linkData = {
      userId: user?.uid,
      originalUrl,
      shortSlug,
      title: formTitle || originalUrl,
      clickCount: editingLink ? editingLink.clickCount : 0,
      qrScanCount: editingLink ? (editingLink.qrScanCount || 0) : 0,
      collectionId: formCollectionId || "",
      createdAt: editingLink ? editingLink.createdAt : new Date().toISOString(),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      activatedAt: activatedAt ? new Date(activatedAt).toISOString() : null,
      password: password || "",
      landingEnabled: landingEnabled,
      landingDescription: formLandingDescription || "",
      landingAvatar: landingAvatar || "",
      isEnabled: formLinkEnabled,
      category: formCategory
    };

    setIsSavingLink(true);
    try {
      if (editingLink) {
        await LinkService.saveLink(editingLink.id, linkData);
        showToast(lang === "id" ? "Tautan berhasil diperbarui!" : "Link updated successfully!");
      } else {
        await LinkService.saveLink(null, linkData);
        try {
          const shortUrl = `${window.location.origin}/${shortSlug}`;
          await navigator.clipboard.writeText(shortUrl);
          showToast(lang === "id" 
            ? `Tautan pendek berhasil disimpan & disalin ke papan klip!` 
            : `Short URL saved & copied to clipboard!`
          );
        } catch (clipErr) {
          console.error("Auto copy failed", clipErr);
          showToast(lang === "id" ? "Tautan pendek berhasil disimpan!" : "Short URL saved successfully!");
        }
      }
      await queryClient.invalidateQueries({ queryKey: ["links_registry"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard_stats"] });
      await queryClient.invalidateQueries({ queryKey: ["links", user?.uid] });
      setIsModalOpen(false);
      setEditingLink(null);
    } catch (err) {
      console.error(err);
      showToast(lang === "id" ? "Gagal menyimpan tautan." : "Failed to save link.", "error");
    } finally {
      setIsSavingLink(false);
    }
  };

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colName.trim()) return;

    const colId = colEditing ? colEditing.id : nanoid();
    const colData = {
      id: colId,
      userId: user?.uid,
      name: colName,
      description: colDesc,
      createdAt: colEditing ? colEditing.createdAt : new Date().toISOString(),
      linkIds: colSelectedLinkIds
    };

    setIsSavingCollection(true);
    try {
      const prevLinkIds = colEditing?.linkIds || [];
      const added = colSelectedLinkIds.filter(id => !prevLinkIds.includes(id));
      const removed = prevLinkIds.filter(id => !colSelectedLinkIds.includes(id));

      await CollectionService.saveCollection(colId, colData, added, removed);

      await queryClient.invalidateQueries({ queryKey: ["collections", user?.uid] });
      await queryClient.invalidateQueries({ queryKey: ["links_registry"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard_stats"] });
      await queryClient.invalidateQueries({ queryKey: ["links", user?.uid] });

      setIsColModalOpen(false);
      setColEditing(null);
      setColName("");
      setColDesc("");
      setColSelectedLinkIds([]);
      showToast(lang === "id" ? "Koleksi berhasil disimpan!" : "Collection saved successfully!");
    } catch (err) {
      console.error(err);
      showToast(lang === "id" ? "Gagal menyimpan koleksi." : "Failed to save collection.", "error");
    } finally {
      setIsSavingCollection(false);
    }
  };

  const handleDeleteCollection = async (colId: string) => {
    if (!confirm(lang === "id" ? "Apakah Anda yakin ingin menghapus koleksi ini?" : "Are you sure you want to delete this collection?")) return;

    try {
      const col = collections.find(c => c.id === colId);
      const linkIds = col ? col.linkIds : [];
      await CollectionService.deleteCollection(colId, linkIds);

      if (activeCollectionId === colId) {
        setActiveCollectionId(null);
      }
      await queryClient.invalidateQueries({ queryKey: ["collections", user?.uid] });
      await queryClient.invalidateQueries({ queryKey: ["links_registry"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard_stats"] });
      await queryClient.invalidateQueries({ queryKey: ["links", user?.uid] });
      showToast(lang === "id" ? "Koleksi berhasil dihapus!" : "Collection deleted successfully!");
    } catch (err) {
      console.error(err);
      showToast(lang === "id" ? "Gagal menghapus koleksi." : "Failed to delete collection.", "error");
    }
  };

  const onQuickAddLink = async (linkId: string, colId: string) => {
    try {
      await updateDoc(doc(db, "links", linkId), { collectionId: colId });
      const activeCol = collections.find(c => c.id === colId);
      if (activeCol) {
        const updatedIds = [...(activeCol.linkIds || []), linkId];
        await updateDoc(doc(db, "collections", colId), { linkIds: updatedIds });
      }
      await queryClient.invalidateQueries({ queryKey: ["links", user?.uid] });
      await queryClient.invalidateQueries({ queryKey: ["collections", user?.uid] });
      showToast(lang === "id" ? "Tautan berhasil ditautkan!" : "Link associated!");
    } catch (err) {
      console.error(err);
      showToast(lang === "id" ? "Gagal menautkan." : "Association failed.", "error");
    }
  };

  const onRemoveLinkFromCollection = async (linkId: string, colId: string) => {
    try {
      await updateDoc(doc(db, "links", linkId), { collectionId: "" });
      const activeCol = collections.find(c => c.id === colId);
      if (activeCol) {
        const filteredArr = (activeCol.linkIds || []).filter(id => id !== linkId);
        await updateDoc(doc(db, "collections", colId), { linkIds: filteredArr });
      }
      await queryClient.invalidateQueries({ queryKey: ["links", user?.uid] });
      await queryClient.invalidateQueries({ queryKey: ["collections", user?.uid] });
      showToast(lang === "id" ? "Tautan dikeluarkan dari folder!" : "Removed from collection!");
    } catch (err) {
      console.error(err);
      showToast(lang === "id" ? "Gagal mengeluarkan." : "Removal failed.", "error");
    }
  };

  const handleSaveDetailLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDetailLinkId) return;
    const activeL = links.find(l => l.id === selectedDetailLinkId);
    if (!activeL) return;

    if (detailEditPassword && detailEditPassword.length < 6) {
      showToast(
        lang === "id" ? "Kata sandi terlalu pendek (minimal 6 karakter)" : "Password is too weak (minimum 6 characters)",
        "error"
      );
      return;
    }

    setIsSavingDetailLink(true);
    try {
      const linkData = {
        title: detailEditTitle || activeL.originalUrl,
        originalUrl: detailEditUrl,
        shortSlug: detailEditSlug || activeL.shortSlug,
        expiresAt: detailEditExpiry ? new Date(detailEditExpiry).toISOString() : null,
        activatedAt: detailEditActivation ? new Date(detailEditActivation).toISOString() : null,
        password: detailEditPassword || "",
        landingEnabled: detailEditPortalEnabled,
        landingDescription: detailEditPortalDescription || "",
        landingAvatar: detailEditPortalAvatar || "",
        isEnabled: detailEditEnabled,
        category: detailCategory
      };

      await LinkService.saveLink(selectedDetailLinkId, linkData);
      await queryClient.invalidateQueries({ queryKey: ["links_registry"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard_stats"] });
      await queryClient.invalidateQueries({ queryKey: ["links", user?.uid] });
      setDetailFormSaved(true);
      showToast(lang === "id" ? "Detail tautan berhasil disimpan!" : "Detail link saved successfully!");
      setTimeout(() => setDetailFormSaved(false), 3000);
    } catch (err) {
      console.error(err);
      showToast(lang === "id" ? "Gagal menyimpan detail tautan." : "Failed to save detail link.", "error");
    } finally {
      setIsSavingDetailLink(false);
    }
  };

  const listFilteredLinks = links;
  const listSortedLinks = links;
  const listTotalPages = totalPages;
  const listPaginatedLinks = links;

  const filteredLinks = links
    .filter(link => {
      const matchesSearch = link.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           link.shortSlug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           link.originalUrl.toLowerCase().includes(searchTerm.toLowerCase());
      
      const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
      const matchesFilter = filterStatus === 'all' ? true : 
                           filterStatus === 'active' ? !isExpired : isExpired;
      
      return matchesSearch && matchesFilter;
    });

  const sortedLinks = [...filteredLinks].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    if (a[key]! < b[key]!) return direction === 'asc' ? -1 : 1;
    if (a[key]! > b[key]!) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSelectAll = () => {
    const currentFilteredIds = sortedLinks.map(l => l.id);
    const allSelected = currentFilteredIds.length > 0 && currentFilteredIds.every(id => selectedLinkIds.includes(id));
    
    if (allSelected) {
      setSelectedLinkIds(prev => prev.filter(id => !currentFilteredIds.includes(id)));
    } else {
      setSelectedLinkIds(prev => Array.from(new Set([...prev, ...currentFilteredIds])));
    }
  };

  const requestSort = (key: keyof LinkData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getChartData = () => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = format(d, "yyyy-MM-dd");
      const label = format(d, "dd MMM");
      
      const count = allClicks.filter(click => {
        if (!click.timestamp) return false;
        try {
          const clickDate = new Date(click.timestamp);
          return format(clickDate, "yyyy-MM-dd") === dateStr;
        } catch (e) {
          return false;
        }
      }).length;
      
      data.push({
        name: label,
        Clicks: count
      });
    }
    return data;
  };

  const getSpecificLinkChartData = (slug: string) => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = format(d, "yyyy-MM-dd");
      const label = format(d, "dd MMM");
      
      const count = allClicks.filter(click => {
        if (click.shortSlug !== slug) return false;
        if (!click.timestamp) return false;
        try {
          const clickDate = new Date(click.timestamp);
          return format(clickDate, "yyyy-MM-dd") === dateStr;
        } catch (e) {
          return false;
        }
      }).length;
      
      data.push({
        name: label,
        Clicks: count
      });
    }
    return data;
  };

  const getCollectionChartData = (linkIds: string[]) => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = format(d, "yyyy-MM-dd");
      const label = format(d, "dd MMM");
      
      const count = allClicks.filter(click => {
        if (!linkIds.includes(click.linkId)) return false;
        if (!click.timestamp) return false;
        try {
          const clickDate = new Date(click.timestamp);
          return format(clickDate, "yyyy-MM-dd") === dateStr;
        } catch (e) {
          return false;
        }
      }).length;
      
      data.push({
        name: label,
        Clicks: count
      });
    }
    return data;
  };

  const getSpecificAnalytics = (slug: string) => {
    const specificClicks = allClicks.filter(c => c.shortSlug === slug);
    const devices: Record<string, number> = {};
    const oss: Record<string, number> = {};
    const browsers: Record<string, number> = {};
    const referrers: Record<string, number> = {};
    const regions: Record<string, number> = {};
    const countries: Record<string, number> = {};
    const ips: Record<string, { count: number; country?: string; lastSeen?: string }> = {};

    specificClicks.forEach(click => {
      const device = click.device || "Desktop";
      devices[device] = (devices[device] || 0) + 1;

      const os = click.os || "Lainnya";
      oss[os] = (oss[os] || 0) + 1;

      const browser = click.browser || "Lainnya";
      browsers[browser] = (browsers[browser] || 0) + 1;

      let ref = click.referrer || "Direct";
      if (ref.includes("android-app://")) {
        ref = "Mobile Application";
      } else {
        try {
          if (ref !== "Direct") {
            const url = new URL(ref);
            ref = url.hostname;
          }
        } catch (_) {}
      }
      referrers[ref] = (referrers[ref] || 0) + 1;

      const rc = click.city && click.region ? `${click.city}, ${click.region}` : (click.city || click.region || "Indonesia");
      regions[rc] = (regions[rc] || 0) + 1;

      const countryName = click.country || "Indonesia";
      countries[countryName] = (countries[countryName] || 0) + 1;

      if (click.ip) {
        if (!ips[click.ip]) {
          ips[click.ip] = { count: 0, country: click.country || "Indonesia", lastSeen: click.timestamp };
        }
        ips[click.ip].count += 1;
        if (new Date(click.timestamp) > new Date(ips[click.ip].lastSeen || 0)) {
          ips[click.ip].lastSeen = click.timestamp;
        }
      }
    });

    const sortMapToSortedArray = (map: Record<string, number>) => {
      return Object.entries(map)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    };

    const sortedIps = Object.entries(ips)
      .map(([ip, info]) => ({ ip, count: info.count, country: info.country, lastSeen: info.lastSeen }))
      .sort((a, b) => b.count - a.count);

    return {
      clicksCount: specificClicks.length,
      devices: sortMapToSortedArray(devices),
      oss: sortMapToSortedArray(oss),
      browsers: sortMapToSortedArray(browsers),
      referrers: sortMapToSortedArray(referrers),
      regions: sortMapToSortedArray(regions),
      countries: sortMapToSortedArray(countries),
      ips: sortedIps
    };
  };

  const getAnalyticsData = () => {
    const devices: Record<string, number> = {};
    const oss: Record<string, number> = {};
    const browsers: Record<string, number> = {};
    const referrers: Record<string, number> = {};
    const regions: Record<string, number> = {};
    const countries: Record<string, number> = {};
    const ips: Record<string, { count: number; country?: string; lastSeen?: string }> = {};

    allClicks.forEach(click => {
      const device = click.device || "Desktop";
      devices[device] = (devices[device] || 0) + 1;

      const os = click.os || "Lainnya";
      oss[os] = (oss[os] || 0) + 1;

      const browser = click.browser || "Lainnya";
      browsers[browser] = (browsers[browser] || 0) + 1;

      let ref = click.referrer || "Direct";
      if (ref.includes("android-app://")) {
        ref = "Mobile Application";
      } else {
        try {
          if (ref !== "Direct") {
            const url = new URL(ref);
            ref = url.hostname;
          }
        } catch (_) {}
      }
      referrers[ref] = (referrers[ref] || 0) + 1;

      const rc = click.city && click.region ? `${click.city}, ${click.region}` : (click.city || click.region || "Indonesia");
      regions[rc] = (regions[rc] || 0) + 1;

      const countryName = click.country || "Indonesia";
      countries[countryName] = (countries[countryName] || 0) + 1;

      if (click.ip) {
        if (!ips[click.ip]) {
          ips[click.ip] = { count: 0, country: click.country || "Indonesia", lastSeen: click.timestamp };
        }
        ips[click.ip].count += 1;
        if (new Date(click.timestamp) > new Date(ips[click.ip].lastSeen || 0)) {
          ips[click.ip].lastSeen = click.timestamp;
        }
      }
    });

    const sortMapToSortedArray = (map: Record<string, number>) => {
      return Object.entries(map)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    };

    const sortedIps = Object.entries(ips)
      .map(([ip, info]) => ({ ip, count: info.count, country: info.country, lastSeen: info.lastSeen }))
      .sort((a, b) => b.count - a.count);

    return {
      devices: sortMapToSortedArray(devices),
      oss: sortMapToSortedArray(oss),
      browsers: sortMapToSortedArray(browsers),
      referrers: sortMapToSortedArray(referrers),
      regions: sortMapToSortedArray(regions),
      countries: sortMapToSortedArray(countries),
      ips: sortedIps
    };
  };

  if (isLinkTreePath) {
    if (publicLoading) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white font-sans">
          <div className="w-10 h-10 rounded-full border-4 border-brand-500 border-t-transparent animate-spin mb-4" />
          <p className="text-zinc-500 text-xs font-mono tracking-widest uppercase animate-pulse">{t("loadingLinktree")}</p>
        </div>
      );
    }

    if (publicError || !publicTreeSettings) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white font-sans p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center border border-red-500/20">
            <Layers className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t("pageNotFound")}</h1>
          <p className="text-zinc-400 text-sm max-w-sm leading-relaxed">
            {t("linktreeNotFoundDesc")}
          </p>
          <a href="/" className="inline-block px-5 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-855 text-zinc-300 rounded-xl transition-all font-bold text-xs uppercase tracking-wider">
            {t("openLinklyDashboard")}
          </a>
        </div>
      );
    }

    return (
      <PublicLinkTree
        publicTreeSettings={publicTreeSettings}
        publicTreeLinks={publicTreeLinks}
        publicTreeCollections={publicTreeCollections}
        lang={lang}
      />
    );
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">Loading...</div>;

  if (!user) {
    return (
      <AuthPage
        isLightMode={isLightMode}
        toggleLightMode={toggleLightMode}
        lang={lang}
        toggleLang={toggleLang}
        handleLogin={handleLogin}
        settings={settings}
        themeInlineVars={themeInlineVars}
      />
    );
  }

  const allFilteredSelected = sortedLinks.length > 0 && sortedLinks.every(l => selectedLinkIds.includes(l.id));

  return (
    <div className="theme-customizer-active w-full" style={themeInlineVars}>
      <div className={cn("min-h-screen font-sans transition-colors duration-200", dashboardBg)}>
      {/* Sidebar */}
      <aside className={cn("fixed left-0 top-0 h-full w-64 hidden md:flex flex-col p-6 space-y-6 transition-colors duration-200", sidebarBg)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
            <Link2 className="w-6 h-6 text-black" />
          </div>
          <span className="text-xl font-bold tracking-tight">Linkly</span>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setCurrentTab("dashboard")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-left cursor-pointer",
              currentTab === "dashboard"
                ? tabActiveBg
                : cn(isLightMode ? "text-zinc-500 hover:text-zinc-955 hover:text-zinc-950" : "text-zinc-400 hover:text-zinc-200", hoverBg)
            )}
          >
            <LayoutDashboard className="w-5 h-5" />
            {t("dashboard")}
          </button>
          <button 
            onClick={() => {
              setListCurrentPage(1);
              setCurrentTab("links-list");
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-left cursor-pointer",
              currentTab === "links-list"
                ? tabActiveBg
                : cn(isLightMode ? "text-zinc-500 hover:text-zinc-955 hover:text-zinc-950" : "text-zinc-400 hover:text-zinc-200", hoverBg)
            )}
          >
            <List className="w-5 h-5" />
            {t("linksList")}
          </button>
          <button 
            onClick={() => setCurrentTab("link-tree")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-left cursor-pointer",
              currentTab === "link-tree"
                ? tabActiveBg
                : cn(isLightMode ? "text-zinc-500 hover:text-zinc-955 hover:text-zinc-950" : "text-zinc-400 hover:text-zinc-200", hoverBg)
            )}
          >
            <Layers className="w-5 h-5" />
            {t("linkTree")}
          </button>
          <button 
            onClick={() => setCurrentTab("collections")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-left cursor-pointer",
              currentTab === "collections"
                ? tabActiveBg
                : cn(isLightMode ? "text-zinc-500 hover:text-zinc-955 hover:text-zinc-950" : "text-zinc-400 hover:text-zinc-200", hoverBg)
            )}
          >
            <FolderOpen className="w-5 h-5" />
            {lang === "id" ? "Grup & Koleksi" : "Groups & Folders"}
          </button>
          {currentTab === "link-detail" && (
            <button 
              onClick={() => setCurrentTab("link-detail")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-brand-400 bg-brand-500/5 border border-brand-500/10 text-left cursor-default pointer-events-none"
            >
              <Activity className="w-5 h-5 text-brand-500 animate-pulse" />
              {t("viewDetails")}
            </button>
          )}
        </nav>

        {/* Dynamic Controls */}
        <div className={cn("pt-4 space-y-3 border-t", borderClassic)}>
          <div className="flex items-center justify-between">
            <span className={cn("text-[11px] font-bold uppercase tracking-wider", textMuted)}>{t("lightMode")}</span>
            <button
              onClick={toggleLightMode}
              className={cn(
                "p-1.5 rounded-lg border transition-all cursor-pointer",
                isLightMode 
                  ? (appTheme === "orange" ? "bg-brand-500/10 border-brand-200 text-brand-600" :
                     appTheme === "emerald" ? "bg-emerald-500/10 border-emerald-200 text-emerald-600" :
                     appTheme === "violet" ? "bg-violet-500/10 border-violet-200 text-violet-600" :
                     appTheme === "sky" ? "bg-sky-500/10 border-sky-200 text-sky-600" :
                     "bg-rose-500/10 border-rose-200 text-rose-600")
                  : (appTheme === "orange" ? "bg-zinc-805 border-zinc-700 text-brand-400" :
                     appTheme === "emerald" ? "bg-zinc-805 border-zinc-700 text-emerald-400" :
                     appTheme === "violet" ? "bg-zinc-805 border-zinc-700 text-violet-400" :
                     appTheme === "sky" ? "bg-zinc-805 border-zinc-700 text-sky-400" :
                     "bg-zinc-805 border-zinc-700 text-rose-400")
              )}
            >
              {isLightMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className={cn("text-[11px] font-bold uppercase tracking-wider", textMuted)}>{t("language")}</span>
            <button
              onClick={toggleLang}
              className={cn(
                "px-2.5 py-1 rounded-lg border text-[10px] font-black tracking-widest uppercase transition-all cursor-pointer font-sans",
                isLightMode 
                  ? "bg-zinc-50 border-zinc-250 text-zinc-800 hover:bg-zinc-100" 
                  : "bg-zinc-850 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              )}
            >
              {lang}
            </button>
          </div>
          {/* Theme customizer color options */}
          <div className="flex flex-col gap-1.5 pt-1">
            <span className={cn("text-[11px] font-bold uppercase tracking-wider", textMuted)}>{lang === "id" ? "Warna Tema" : "Theme Color"}</span>
            <div className="flex items-center gap-2">
              {Object.keys(APP_THEME_CONFIGS).map((colorKey) => {
                const conf = APP_THEME_CONFIGS[colorKey as keyof typeof APP_THEME_CONFIGS];
                const isActive = appTheme === colorKey;
                const previewBgs: Record<string, string> = {
                  orange: "bg-orange-500",
                  emerald: "bg-emerald-500",
                  violet: "bg-violet-500",
                  sky: "bg-sky-500",
                  rose: "bg-rose-500",
                  monochrome: "bg-zinc-800 dark:bg-zinc-200 border border-zinc-300 dark:border-zinc-700",
                };
                return (
                  <button
                    key={colorKey}
                    onClick={() => {
                      setAppTheme(colorKey as keyof typeof APP_THEME_CONFIGS);
                      localStorage.setItem("linkly-app-theme", colorKey);
                      setQrFgColor(conf.qrFg);
                    }}
                    title={conf.name}
                    className={cn(
                      "w-5 h-5 rounded-full cursor-pointer transition-all border-2",
                      isActive 
                        ? (isLightMode ? "border-zinc-805 border-zinc-800 scale-110 shadow-sm" : "border-white scale-110 shadow-sm")
                        : "border-transparent hover:scale-105"
                    )}
                  >
                    <span className={cn("block w-full h-full rounded-full", previewBgs[colorKey])} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className={cn("pt-4 border-t", borderClassic)}>
          <div className="flex items-center gap-3 mb-4">
            <img src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`} className="w-8 h-8 rounded-full border border-zinc-700" alt={user.displayName || ""} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{user.displayName}</p>
              <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            {t("logout")}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 p-4 md:p-8 lg:p-12 max-w-7xl mx-auto space-y-12">
        {/* Mobile Header with App Logo & Account Dropdown / Logout */}
        <div className={cn("flex justify-between items-center md:hidden p-4 rounded-3xl backdrop-blur-md border", isLightMode ? "bg-white/80 border-zinc-250 text-zinc-900 shadow-sm" : "bg-zinc-900/60 border-zinc-800 text-white")}>
          <div className="flex items-center gap-2.5 col-span-1">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", curT.bg)}>
              <Link2 className="w-5 h-5 text-black" />
            </div>
            <span className={cn("text-sm font-black tracking-wider uppercase font-sans", isLightMode ? "text-zinc-955" : "text-white")}>Linkly</span>
          </div>

          <div className="flex items-center gap-3">
            <div className={cn("flex items-center gap-2 p-1.5 pr-3 rounded-2xl border", isLightMode ? "bg-zinc-150 border-zinc-250" : "bg-zinc-955 border border-zinc-850")}>
              <img src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`} className={cn("w-6 h-6 rounded-full border", isLightMode ? "border-zinc-350" : "border-zinc-700")} alt={user.displayName || ""} />
              <div className="text-left leading-none max-w-[80px]">
                <p className={cn("text-[10px] font-black truncate font-sans", isLightMode ? "text-zinc-805" : "text-zinc-300")}>{user.displayName?.split(" ")[0] || "User"}</p>
              </div>
            </div>
            <button 
              type="button"
              onClick={handleLogout}
              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors border border-red-500/10"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Mobile Tabs */}
        <div className={cn("flex flex-wrap md:hidden border p-1 rounded-xl gap-1", isLightMode ? "bg-white border-zinc-250 shadow-sm" : "bg-zinc-900 border border-zinc-800")}>
          <button
            onClick={() => setCurrentTab("dashboard")}
            className={cn(
              "flex-1 py-2 text-[10px] font-bold rounded-lg transition-all text-center",
              currentTab === "dashboard" ? `${curT.bg} text-black shadow-md font-extrabold` : (isLightMode ? "text-zinc-500 hover:text-zinc-955 hover:text-zinc-900" : "text-zinc-400 hover:text-zinc-200")
            )}
          >
            Dashboard
          </button>
          <button
            onClick={() => {
              setListCurrentPage(1);
              setCurrentTab("links-list");
            }}
            className={cn(
              "flex-1 py-2 text-[10px] font-bold rounded-lg transition-all text-center",
              currentTab === "links-list" ? `${curT.bg} text-black shadow-md font-extrabold` : (isLightMode ? "text-zinc-500 hover:text-zinc-955 hover:text-zinc-900" : "text-zinc-400 hover:text-zinc-200")
            )}
          >
            {t("linksList")}
          </button>
          <button
            onClick={() => setCurrentTab("link-tree")}
            className={cn(
              "flex-1 py-2 text-[10px] font-bold rounded-lg transition-all text-center",
              currentTab === "link-tree" ? `${curT.bg} text-black shadow-md font-extrabold` : (isLightMode ? "text-zinc-500 hover:text-zinc-955 hover:text-zinc-900" : "text-zinc-400 hover:text-zinc-200")
            )}
          >
            {t("linkTree")}
          </button>
          <button
            onClick={() => setCurrentTab("collections")}
            className={cn(
              "flex-1 py-2 text-[10px] font-bold rounded-lg transition-all text-center",
              currentTab === "collections" ? `${curT.bg} text-black shadow-md font-extrabold` : (isLightMode ? "text-zinc-500 hover:text-zinc-955 hover:text-zinc-900" : "text-zinc-400 hover:text-zinc-200")
            )}
          >
            {lang === "id" ? "Grup Tautan" : "Folders"}
          </button>
          {currentTab === "link-detail" && (
            <button
              onClick={() => setCurrentTab("link-detail")}
              className={cn("flex-1 py-2 text-[10px] font-bold rounded-lg text-black shadow-md font-extrabold text-center", curT.bg)}
            >
              {t("viewDetails") || "Detail & Analisis"}
            </button>
          )}
        </div>

        {/* Mobile Quick Config Toolbar */}
        <div className={cn("flex md:hidden items-center justify-between p-3 border rounded-2xl gap-4 transition-all -mt-8", isLightMode ? "bg-white border-zinc-200/85" : "bg-zinc-900/40 border-zinc-850")}>
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 shrink-0">{lang === "id" ? "Tema:" : "Theme:"}</span>
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {Object.keys(APP_THEME_CONFIGS).map((colorKey) => {
                const conf = APP_THEME_CONFIGS[colorKey as keyof typeof APP_THEME_CONFIGS];
                const isActive = appTheme === colorKey;
                const previewBgs: Record<string, string> = {
                  orange: "bg-brand-500",
                  emerald: "bg-emerald-500",
                  violet: "bg-violet-500",
                  sky: "bg-sky-500",
                  rose: "bg-rose-500",
                  monochrome: "bg-zinc-800 dark:bg-zinc-200 border border-zinc-300 dark:border-zinc-700",
                };
                return (
                  <button
                    key={colorKey}
                    onClick={() => {
                      setAppTheme(colorKey as keyof typeof APP_THEME_CONFIGS);
                      localStorage.setItem("linkly-app-theme", colorKey);
                      setQrFgColor(conf.qrFg);
                    }}
                    title={conf.name}
                    className={cn(
                      "w-4 h-4 rounded-full cursor-pointer transition-all border shrink-0",
                      isActive 
                        ? (isLightMode ? "border-zinc-800 scale-110 shadow" : "border-white scale-110 shadow")
                        : "border-transparent"
                    )}
                  >
                    <span className={cn("block w-full h-full rounded-full", previewBgs[colorKey])} />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={toggleLightMode}
              className={cn(
                "p-1 rounded-lg border transition-all cursor-pointer text-xs flex items-center justify-center",
                isLightMode ? "bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200" : "bg-zinc-800 border-zinc-700 text-zinc-350 hover:bg-zinc-750"
              )}
            >
              {isLightMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={toggleLang}
              className={cn(
                "px-2 py-0.5 rounded-lg border text-[9px] font-bold tracking-wider uppercase transition-all cursor-pointer font-sans",
                isLightMode ? "bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200" : "bg-zinc-800 border-zinc-700 text-zinc-350 hover:bg-zinc-750"
              )}
            >
              {lang}
            </button>
          </div>
        </div>

        {currentTab === "link-tree" ? (
          <LinkTreePage
            lang={lang}
            user={user}
            links={links}
            copiedTreeUrl={copiedTreeUrl}
            setCopiedTreeUrl={setCopiedTreeUrl}
            treeTitle={treeTitle}
            setTreeTitle={setTreeTitle}
            treeBio={treeBio}
            setTreeBio={setTreeBio}
            treeAvatar={treeAvatar}
            setTreeAvatar={setTreeAvatar}
            treeTheme={treeTheme}
            setTreeTheme={setTreeTheme}
            treeLinks={treeLinks}
            setTreeLinks={setTreeLinks}
            treeBgImage={treeBgImage}
            setTreeBgImage={setTreeBgImage}
            treeButtonStyle={treeButtonStyle}
            setTreeButtonStyle={setTreeButtonStyle}
            treeShowFolders={treeShowFolders}
            setTreeShowFolders={setTreeShowFolders}
            treeInstagram={treeInstagram}
            setTreeInstagram={setTreeInstagram}
            treeTwitter={treeTwitter}
            setTreeTwitter={setTreeTwitter}
            treeLinkedIn={treeLinkedIn}
            setTreeLinkedIn={setTreeLinkedIn}
            treeYoutube={treeYoutube}
            setTreeYoutube={setTreeYoutube}
            treeGithub={treeGithub}
            setTreeGithub={setTreeGithub}
            treeVideoUrl={treeVideoUrl}
            setTreeVideoUrl={setTreeVideoUrl}
            treeButtonBgImage={treeButtonBgImage}
            setTreeButtonBgImage={setTreeButtonBgImage}
            treeSavedSuccess={treeSavedSuccess}
            handleSaveTree={handleSaveTree}
            getYouTubeEmbedUrl={getYouTubeEmbedUrl}
            isLightMode={isLightMode}
            appTheme={appTheme}
            collections={collections}
            expandedFolders={expandedFolders}
            setExpandedFolders={setExpandedFolders}
            isSavingTree={isSavingTree}
          />
        ) : currentTab === "links-list" ? (
          <LinksListPage
            lang={lang}
            links={links}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            showAdvancedFilters={showAdvancedFilters}
            setShowAdvancedFilters={setShowAdvancedFilters}
            listFilterCategory={listFilterCategory}
            setListFilterCategory={setListFilterCategory}
            listFilterPassword={listFilterPassword}
            setListFilterPassword={setListFilterPassword}
            listFilterPortal={listFilterPortal}
            setListFilterPortal={setListFilterPortal}
            listCurrentPage={listCurrentPage}
            setListCurrentPage={setListCurrentPage}
            listItemsPerPage={listItemsPerPage}
            setListItemsPerPage={setListItemsPerPage}
            selectedLinkIds={selectedLinkIds}
            toggleSelectLink={toggleSelectLink}
            toggleSelectAll={toggleSelectAll}
            allFilteredSelected={allFilteredSelected}
            requestSort={requestSort}
            handleCopy={handleCopy}
            copiedId={copiedId}
            setQrFgColor={setQrFgColor}
            setQrBgColor={setQrBgColor}
            setQrLink={setQrLink}
            setEditingLink={setEditingLink}
            setIsModalOpen={setIsModalOpen}
            handleDelete={handleDelete}
            handleBulkDelete={handleBulkDelete}
            listFilteredLinks={listFilteredLinks}
            listTotalPages={listTotalPages}
            paginatedLinks={listPaginatedLinks}
            setSelectedDetailLinkId={setSelectedDetailLinkId}
            setCurrentTab={(tab: any) => setCurrentTab(tab)}
            isLightMode={isLightMode}
            appTheme={appTheme}
            setIsBulkImportOpen={setIsBulkImportOpen}
          />
        ) : currentTab === "link-detail" ? (
          <LinkDetailPage
            lang={lang}
            links={links}
            selectedDetailLinkId={selectedDetailLinkId}
            setSelectedDetailLinkId={setSelectedDetailLinkId}
            setCurrentTab={(tab: any) => setCurrentTab(tab)}
            handleSaveDetailLink={handleSaveDetailLink}
            detailEditTitle={detailEditTitle}
            setDetailEditTitle={setDetailEditTitle}
            detailEditUrl={detailEditUrl}
            setDetailEditUrl={setDetailEditUrl}
            detailEditSlug={detailEditSlug}
            setDetailEditSlug={setDetailEditSlug}
            detailEditExpiry={detailEditExpiry}
            setDetailEditExpiry={setDetailEditExpiry}
            detailEditActivation={detailEditActivation}
            setDetailEditActivation={setDetailEditActivation}
            detailEditPassword={detailEditPassword}
            setDetailEditPassword={setDetailEditPassword}
            detailCategory={detailCategory}
            setDetailCategory={setDetailCategory}
            detailEditEnabled={detailEditEnabled}
            setDetailEditEnabled={setDetailEditEnabled}
            detailEditPortalEnabled={detailEditPortalEnabled}
            setDetailEditPortalEnabled={setDetailEditPortalEnabled}
            detailEditPortalDescription={detailEditPortalDescription}
            setDetailEditPortalDescription={setDetailEditPortalDescription}
            detailEditPortalAvatar={detailEditPortalAvatar}
            setDetailEditPortalAvatar={setDetailEditPortalAvatar}
            detailFormSaved={detailFormSaved}
            setQrFgColor={setQrFgColor}
            setQrBgColor={setQrBgColor}
            setQrLink={setQrLink}
            detailAnalyticsTab={detailAnalyticsTab}
            setDetailAnalyticsTab={setDetailAnalyticsTab}
            detailIpSearch={detailIpSearch}
            setDetailIpSearch={setDetailIpSearch}
            getSpecificAnalytics={getSpecificAnalytics}
            getSpecificLinkChartData={getSpecificLinkChartData}
            isLightMode={isLightMode}
            appTheme={appTheme}
          />
        ) : currentTab === "collections" ? (
          <CollectionsPage
            lang={lang}
            links={links}
            collections={collections}
            activeCollectionId={activeCollectionId}
            setActiveCollectionId={setActiveCollectionId}
            setColEditing={setColEditing}
            setColName={setColName}
            setColDesc={setColDesc}
            setColSelectedLinkIds={setColSelectedLinkIds}
            setIsColModalOpen={setIsColModalOpen}
            handleDeleteCollection={handleDeleteCollection}
            getCollectionChartData={getCollectionChartData}
            setEditingLink={setEditingLink}
            setIsModalOpen={setIsModalOpen}
            onQuickAddLink={onQuickAddLink}
            onRemoveLinkFromCollection={onRemoveLinkFromCollection}
            isLightMode={isLightMode}
            appTheme={appTheme}
          />
        ) : (
          <DashboardPage
            lang={lang}
            links={links}
            sortedLinks={sortedLinks}
            recentClicks={recentClicks}
            analyticsTab={analyticsTab}
            setAnalyticsTab={(tab: any) => setAnalyticsTab(tab)}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            selectedLinkIds={selectedLinkIds}
            toggleSelectAll={toggleSelectAll}
            allFilteredSelected={allFilteredSelected}
            requestSort={requestSort}
            toggleSelectLink={toggleSelectLink}
            handleCopy={handleCopy}
            copiedId={copiedId}
            setQrFgColor={setQrFgColor}
            setQrBgColor={setQrBgColor}
            setQrLink={setQrLink}
            setEditingLink={setEditingLink}
            setIsModalOpen={setIsModalOpen}
            handleDelete={handleDelete}
            handleBulkDelete={handleBulkDelete}
            getChartData={getChartData}
            getAnalyticsData={getAnalyticsData}
            allClicks={allClicks}
            isLightMode={isLightMode}
            appTheme={appTheme}
            setIsBulkImportOpen={setIsBulkImportOpen}
          />
        )}
      </main>

  {/* Modals */}
  <CreateLinkModal
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    lang={lang}
    editingLink={editingLink}
    formTitle={formTitle}
    setFormTitle={setFormTitle}
    slugValue={slugValue}
    setSlugValue={setSlugValue}
    formCategory={formCategory}
    setFormCategory={setFormCategory}
    formCollectionId={formCollectionId}
    setFormCollectionId={setFormCollectionId}
    modalPassword={modalPassword}
    setModalPassword={setModalPassword}
    formLinkEnabled={formLinkEnabled}
    setFormLinkEnabled={setFormLinkEnabled}
    landingEnabled={landingEnabled}
    setLandingEnabled={setLandingEnabled}
    formLandingDescription={formLandingDescription}
    setFormLandingDescription={setFormLandingDescription}
    collections={collections}
    isGeneratingAi={isGeneratingAi}
    handleGenerateAiMetadata={handleGenerateAiMetadata}
    aiError={aiError}
    handleSaveLink={handleSaveLink}
    isLightMode={isLightMode}
    appTheme={appTheme}
    isSavingLink={isSavingLink}
  />

  <AnimatePresence>
    {/* QR Code custom coloring modal */}
        {qrLink && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQrLink(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-6 overflow-y-auto max-h-[85vh] sm:max-h-[90vh] overscroll-contain"
            >
              <div>
                <h2 className="text-2xl font-bold mb-1 truncate">{qrLink.title}</h2>
                <p className="text-xs text-brand-500 font-mono font-bold">/{qrLink.shortSlug}</p>
              </div>
              
              {/* QR Image Frame */}
              <div className="p-6 rounded-2xl inline-block max-w-[240px] max-h-[240px]" style={{ backgroundColor: qrBgColor }}>
                <QRCodeSVG 
                  id="linkly-qr-graphic"
                  value={`${window.location.origin}/${qrLink.shortSlug}`}
                  size={192}
                  level="H"
                  includeMargin={false}
                  fgColor={qrFgColor}
                  bgColor={qrBgColor}
                  imageSettings={showQrLogo ? {
                    src: qrLogoUrl,
                    x: undefined,
                    y: undefined,
                    height: 38,
                    width: 38,
                    excavate: true,
                  } : undefined}
                />
              </div>

              {/* Advanced Branding Color & Logo Customizer */}
              <div className="space-y-4 bg-zinc-955 p-4 rounded-2xl border border-zinc-800 text-left">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest text-center mb-1">Pemberian Merek QR</p>
                
                {/* Preset Themes Group */}
                <div className="space-y-1.5 border-b border-zinc-900/60 pb-3">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Preset Tema Cepat</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: "Modern Blue", fg: "#0284c7", bg: "#ffffff" },
                      { name: "Dark Orange", fg: "#fb923c", bg: "#09090b" },
                      { name: "Nature Green", fg: "#059669", bg: "#ffffff" },
                      { name: "Grape", fg: "#7c3aed", bg: "#ffffff" },
                      { name: "Black & White", fg: "#000000", bg: "#ffffff" }
                    ].map((ps) => (
                      <button
                        key={ps.name}
                        type="button"
                        onClick={() => {
                          setQrFgColor(ps.fg);
                          setQrBgColor(ps.bg);
                        }}
                        className="text-[10px] font-bold px-2 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all text-zinc-300 cursor-pointer"
                      >
                        {ps.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400">Warna QR</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={qrFgColor}
                        onChange={(e) => setQrFgColor(e.target.value)}
                        className="w-10 h-10 border-0 bg-transparent rounded cursor-pointer"
                      />
                      <span className="text-xs font-mono font-medium text-zinc-400">{qrFgColor.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400">Latar Belakang</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={qrBgColor}
                        onChange={(e) => setQrBgColor(e.target.value)}
                        className="w-10 h-10 border-0 bg-transparent rounded cursor-pointer"
                      />
                      <span className="text-xs font-mono font-medium text-zinc-400">{qrBgColor.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                {/* Logo Center Toggle */}
                <div className="flex items-center justify-between border-t border-zinc-800 pt-3 mt-1">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold text-zinc-400">Logo Tengah QR</label>
                    <p className="text-[10px] text-zinc-500">Tampilkan logo di bagian tengah QR Code.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQrLogo(!showQrLogo)}
                    className={cn(
                      "w-10 h-5 rounded-full p-0.5 transition-colors relative duration-300",
                      showQrLogo ? "bg-brand-500" : "bg-zinc-800"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full bg-black transition-transform duration-300 transform",
                      showQrLogo ? "translate-x-5" : "translate-x-0"
                    )} />
                  </button>
                </div>

                {showQrLogo && (
                  <div className="space-y-1.5 mt-2 pt-2 border-t border-zinc-800/60">
                    <label className="text-xs font-bold text-zinc-400">Tautan Gambar Logo</label>
                    <input 
                      type="text"
                      value={qrLogoUrl}
                      onChange={(e) => setQrLogoUrl(e.target.value)}
                      placeholder="Masukkan URL Gambar..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-brand-500/50 text-xs font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => {
                      const svgElement = document.getElementById('linkly-qr-graphic');
                      if (svgElement) {
                        const svgData = new XMLSerializer().serializeToString(svgElement);
                        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                        const url = URL.createObjectURL(svgBlob);
                        const downloadLink = document.createElement('a');
                        downloadLink.href = url;
                        downloadLink.download = `qr-${qrLink.shortSlug}.svg`;
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);
                      }
                    }}
                    className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors text-[11px] flex flex-col items-center justify-center gap-1 cursor-pointer"
                    title="Unduh format SVG"
                  >
                    <Download className="w-3.5 h-3.5 text-zinc-400" />
                    SVG
                  </button>
                  <button 
                    onClick={() => {
                      const svgElement = document.getElementById('linkly-qr-graphic');
                      if (svgElement) {
                        const svgString = new XMLSerializer().serializeToString(svgElement);
                        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                        const blobURL = window.URL.createObjectURL(svgBlob);
                        
                        const image = new window.Image();
                        image.crossOrigin = "anonymous";
                        image.onload = () => {
                          const canvas = document.createElement('canvas');
                          canvas.width = 1024;
                          canvas.height = 1024;
                          const context = canvas.getContext('2d');
                          if (context) {
                            context.fillStyle = qrBgColor;
                            context.fillRect(0, 0, canvas.width, canvas.height);
                            context.drawImage(image, 0, 0, canvas.width, canvas.height);
                            
                            const pngUrl = canvas.toDataURL('image/png');
                            const downloadLink = document.createElement('a');
                            downloadLink.href = pngUrl;
                            downloadLink.download = `qr-${qrLink.shortSlug}.png`;
                            document.body.appendChild(downloadLink);
                            downloadLink.click();
                            document.body.removeChild(downloadLink);
                          }
                          window.URL.revokeObjectURL(blobURL);
                        };
                        image.src = blobURL;
                      }
                    }}
                    className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors text-[11px] flex flex-col items-center justify-center gap-1 cursor-pointer"
                    title="Unduh format PNG"
                  >
                    <Download className="w-3.5 h-3.5 text-zinc-400" />
                    PNG
                  </button>
                  <button 
                    onClick={() => {
                      const svgElement = document.getElementById('linkly-qr-graphic');
                      if (svgElement) {
                        const svgString = new XMLSerializer().serializeToString(svgElement);
                        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                        const blobURL = window.URL.createObjectURL(svgBlob);
                        
                        const image = new window.Image();
                        image.crossOrigin = "anonymous";
                        image.onload = () => {
                          const canvas = document.createElement('canvas');
                          canvas.width = 1500;
                          canvas.height = 1500;
                          const context = canvas.getContext('2d');
                          if (context) {
                            context.fillStyle = qrBgColor;
                            context.fillRect(0, 0, canvas.width, canvas.height);
                            context.drawImage(image, 0, 0, canvas.width, canvas.height);
                            
                            const pngUrl = canvas.toDataURL('image/png');
                            
                            const pdf = new jsPDF({
                              orientation: "portrait",
                              unit: "mm",
                              format: "a4"
                            });
                            
                            pdf.setFillColor(15, 15, 15);
                            pdf.rect(0, 0, 210, 297, "F");
                            
                            pdf.setFillColor(251, 146, 60);
                            pdf.rect(0, 0, 210, 15, "F");
                            
                            pdf.setTextColor(251, 146, 60);
                            pdf.setFont("helvetica", "bold");
                            pdf.setFontSize(22);
                            pdf.text("Linkly QR Code Portal", 105, 45, { align: "center" });
                            
                            pdf.setTextColor(244, 244, 245);
                            pdf.setFont("helvetica", "normal");
                            pdf.setFontSize(14);
                            pdf.text(`${qrLink.title}`, 105, 55, { align: "center" });
                            
                            pdf.setTextColor(161, 161, 170);
                            pdf.setFont("courier", "bold");
                            pdf.setFontSize(12);
                            const slugUrl = `${window.location.origin}/${qrLink.shortSlug}`;
                            pdf.text(slugUrl, 105, 65, { align: "center" });
                            
                            pdf.addImage(pngUrl, 'PNG', 45, 80, 120, 120);
                            
                            pdf.setTextColor(113, 113, 122);
                            pdf.setFont("helvetica", "italic");
                            pdf.setFontSize(10);
                            pdf.text("Terbangkan Tautan Anda Bersama Linkly SaaS URL Shortener", 105, 240, { align: "center" });
                            
                            pdf.save(`qr-${qrLink.shortSlug}.pdf`);
                          }
                          window.URL.revokeObjectURL(blobURL);
                        };
                        image.src = blobURL;
                      }
                    }}
                    className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors text-[11px] flex flex-col items-center justify-center gap-1 cursor-pointer"
                    title="Unduh format PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-zinc-400" />
                    PDF
                  </button>
                </div>

                <button 
                  onClick={() => {
                    const svgElement = document.getElementById('linkly-qr-graphic');
                    if (svgElement) {
                      const svgString = new XMLSerializer().serializeToString(svgElement);
                      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                      const blobURL = window.URL.createObjectURL(svgBlob);
                      
                      const image = new window.Image();
                      image.crossOrigin = "anonymous";
                      image.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = 1024;
                        canvas.height = 1024;
                        const context = canvas.getContext('2d');
                        if (context) {
                          context.fillStyle = qrBgColor;
                          context.fillRect(0, 0, canvas.width, canvas.height);
                          context.drawImage(image, 0, 0, canvas.width, canvas.height);
                          
                          canvas.toBlob(async (blob) => {
                            if (blob) {
                              try {
                                await navigator.clipboard.write([
                                  new ClipboardItem({ 'image/png': blob })
                                ]);
                                setCopiedQr(true);
                                setTimeout(() => setCopiedQr(false), 2000);
                              } catch (err) {
                                console.error("Failed to copy QR to clipboard:", err);
                              }
                            }
                          }, 'image/png');
                        }
                        window.URL.revokeObjectURL(blobURL);
                      };
                      image.src = blobURL;
                    }
                  }}
                  className={cn(
                    "w-full py-2.5 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-2 cursor-pointer",
                    copiedQr 
                      ? "bg-green-500/10 border border-green-500 text-green-500" 
                      : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/50"
                  )}
                >
                  {copiedQr ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      {t("qrCopied")}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      {t("copyQrBtn")}
                    </>
                  )}
                </button>

                <button 
                  onClick={() => setQrLink(null)}
                  className="py-3 bg-brand-550 hover:bg-brand-400 text-black font-extrabold rounded-xl transition-colors text-sm cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {isColModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsColModalOpen(false);
              setColEditing(null);
              setColName("");
              setColDesc("");
              setColSelectedLinkIds([]);
            }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn("relative w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[85vh] sm:max-h-[90vh] overscroll-contain space-y-6", cardBg)}
          >
            <h2 className={cn("text-2xl font-extrabold", textTitle)}>
              {colEditing 
                ? (lang === "id" ? "Ubah Grup Koleksi" : "Edit Link Collection") 
                : (lang === "id" ? "Buat Grup / Koleksi Baru" : "Create New Link Collection")}
            </h2>
            
            <form onSubmit={handleSaveCollection} className="space-y-6">
              <div className="space-y-2">
                <label className={cn("text-xs font-bold", textMuted)}>{lang === "id" ? "Nama Grup / Koleksi" : "Collection Name"}</label>
                <input 
                  type="text" 
                  required
                  value={colName}
                  onChange={(e) => setColName(e.target.value)}
                  placeholder={lang === 'id' ? "Contoh: Kampanye Sosial" : "e.g., Marketing Campaign"}
                  className={cn("w-full rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-medium text-sm shadow-inner transition-all", inputBg)}
                />
              </div>

              <div className="space-y-2">
                <label className={cn("text-xs font-bold", textMuted)}>{lang === "id" ? "Deskripsi Penjelasan" : "Detailed Description"}</label>
                <textarea 
                  value={colDesc}
                  onChange={(e) => setColDesc(e.target.value)}
                  placeholder={lang === 'id' ? "Menjelaskan isi kelompok tautan ini..." : "Explain collection purposes..."}
                  className={cn("w-full rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-medium text-sm shadow-inner transition-all h-24 resize-none", inputBg)}
                />
              </div>

              <div className="space-y-3">
                <label className={cn("text-xs font-bold block", textMuted)}>
                  {lang === "id" ? "Pilih Tautan Untuk Dimasukkan" : "Select Links to Group (Bulk Assign)"}
                </label>
                <div className={cn("max-h-40 overflow-y-auto border rounded-xl p-3 space-y-2 divider-zinc shadow-inner", isLightMode ? "bg-zinc-50 border-zinc-200" : "bg-zinc-950 border-zinc-800")}>
                  {links.map((link) => {
                    const isChecked = colSelectedLinkIds.includes(link.id);
                    return (
                      <div 
                        key={link.id} 
                        onClick={() => {
                          if (isChecked) {
                            setColSelectedLinkIds(colSelectedLinkIds.filter(id => id !== link.id));
                          } else {
                            setColSelectedLinkIds([...colSelectedLinkIds, link.id]);
                          }
                        }}
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors text-xs font-bold",
                          isChecked 
                            ? (isLightMode ? "bg-brand-50/75 text-brand-650" : "bg-brand-500/10 text-brand-400")
                            : (isLightMode ? "hover:bg-zinc-100 text-zinc-970" : "hover:bg-zinc-900 text-zinc-400")
                        )}
                      >
                        <div className="shrink-0">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-brand-500" />
                          ) : (
                            <Square className="w-4 h-4 text-zinc-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn("truncate font-bold text-xs", textTitle)}>{link.title || link.shortSlug}</p>
                          <p className="font-mono text-[10px] text-zinc-500 truncate">/{link.shortSlug}</p>
                        </div>
                      </div>
                    );
                  })}
                  {links.length === 0 && (
                    <p className="text-xs text-zinc-500 italic text-center py-4">{lang === "id" ? "Tidak ada tautan terdaftar." : "No links registered yet."}</p>
                  )}
                </div>
              </div>

               <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  disabled={isSavingCollection}
                  onClick={() => {
                    setIsColModalOpen(false);
                    setColEditing(null);
                    setColName("");
                    setColDesc("");
                    setColSelectedLinkIds([]);
                  }}
                  className={cn(
                    "flex-1 py-3 font-bold rounded-xl border transition-all text-sm disabled:opacity-50",
                    isLightMode 
                      ? "bg-zinc-50 hover:bg-zinc-100 text-zinc-650 border-zinc-250" 
                      : "bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border-zinc-800"
                  )}
                >
                  {lang === "id" ? "Batalkan" : "Cancel"}
                </button>
                <button 
                  type="submit"
                  disabled={isSavingCollection}
                  className="flex-1 py-3 bg-brand-500 hover:bg-brand-400 text-black font-extrabold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer"
                >
                  {isSavingCollection && <RefreshCw className="w-4 h-4 animate-spin text-black" />}
                  {isSavingCollection ? (lang === "id" ? "Menyimpan..." : "Saving...") : (lang === "id" ? "Simpan Koleksi" : "Save Collection")}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Bulk Import Modal */}
      <AnimatePresence>
        {isBulkImportOpen && (
          <BulkImportModal
            isOpen={isBulkImportOpen}
            onClose={() => setIsBulkImportOpen(false)}
            lang={lang}
            collections={collections}
            onBulkImport={handleBulkImport}
            isLightMode={isLightMode}
            appTheme={appTheme}
            isImporting={isImporting}
          />
        )}
      </AnimatePresence>

      {/* Duplicate Slug Conflict Reporting Modal */}
      <AnimatePresence>
        {isDuplicateAlertOpen && (
          <DuplicateSlugAlertModal
            isOpen={isDuplicateAlertOpen}
            onClose={() => setIsDuplicateAlertOpen(false)}
            skippedItems={skippedItems}
            importedCount={importedCount}
            lang={lang}
            isLightMode={isLightMode}
            appTheme={appTheme}
          />
        )}
      </AnimatePresence>

      {/* Floating Custom Toast notifications */}
      <AnimatePresence>
        {customToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className={cn(
              "fixed bottom-6 right-6 z-[9999] max-w-sm bg-zinc-950/95 backdrop-blur-md border text-white shadow-2xl rounded-2xl p-4 flex items-center gap-3",
              customToastType === "error" ? "border-red-500/30" : "border-brand-500/30"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              customToastType === "error" ? "bg-red-500/10 text-red-400" : "bg-brand-500/10 text-brand-500"
            )}>
              {customToastType === "error" ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className={cn(
                "text-[11px] font-extrabold tracking-wider uppercase",
                customToastType === "error" ? "text-red-400" : "text-brand-500"
              )}>
                {customToastType === "error" 
                  ? (lang === "id" ? "Gagal" : "Error") 
                  : (lang === "id" ? "Berhasil" : "Success")}
              </p>
              <p className="text-xs text-zinc-300 font-bold truncate">{customToast}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
