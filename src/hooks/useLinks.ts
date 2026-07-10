import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LinkData } from "../types";
import { LinkService } from "../services/link.service";
import { User } from "../api";

export function useLinks(user: User | null, currentTab: string) {
  const [selectedLinkIds, setSelectedLinkIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof LinkData; direction: 'asc' | 'desc' } | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedQr, setCopiedQr] = useState(false);
  const [qrLink, setQrLink] = useState<LinkData | null>(null);

  // Advanced QR customization states
  const [qrFgColor, setQrFgColor] = useState("#fb923c"); // fallback default
  const [qrBgColor, setQrBgColor] = useState("#ffffff");

  // Landing page form toggle
  const [landingEnabled, setLandingEnabled] = useState(false);

  // Custom slug and QR logo customization states
  const [slugValue, setSlugValue] = useState("");
  const [showQrLogo, setShowQrLogo] = useState(false);
  const [qrLogoUrl, setQrLogoUrl] = useState("https://cdn-icons-png.flaticon.com/512/10005/10005141.png");

  // Navigation Feature States
  const [selectedDetailLinkId, setSelectedDetailLinkId] = useState<string | null>(null);

  // Dedicated Link List Pagination & Advanced Filtering States
  const [listCurrentPage, setListCurrentPage] = useState(1);
  const [listItemsPerPage, setListItemsPerPage] = useState(10);
  const [listFilterPassword, setListFilterPassword] = useState<'all' | 'protected' | 'none'>('all');
  const [listFilterPortal, setListFilterPortal] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [listMinClicks, setListMinClicks] = useState<number | "">("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [listFilterCategory, setListFilterCategory] = useState("all");

  const [modalPassword, setModalPassword] = useState("");
  const [formCategory, setFormCategory] = useState("general");
  const [detailCategory, setDetailCategory] = useState("general");

  // States for LinkDetailPage (each link deep customizing)
  const [detailEditTitle, setDetailEditTitle] = useState("");
  const [detailEditUrl, setDetailEditUrl] = useState("");
  const [detailEditSlug, setDetailEditSlug] = useState("");
  const [detailEditExpiry, setDetailEditExpiry] = useState("");
  const [detailEditActivation, setDetailEditActivation] = useState("");
  const [detailEditPassword, setDetailEditPassword] = useState("");
  const [detailEditPortalEnabled, setDetailEditPortalEnabled] = useState(false);
  const [detailEditPortalDescription, setDetailEditPortalDescription] = useState("");
  const [detailEditPortalAvatar, setDetailEditPortalAvatar] = useState("");
  const [detailFormSaved, setDetailFormSaved] = useState(false);
  const [detailAnalyticsTab, setDetailAnalyticsTab] = useState<'trends' | 'geo' | 'devices' | 'ips'>('trends');
  const [detailIpSearch, setDetailIpSearch] = useState("");
  const [detailEditEnabled, setDetailEditEnabled] = useState(true);

  const [isSavingLink, setIsSavingLink] = useState(false);
  const [isSavingDetailLink, setIsSavingDetailLink] = useState(false);

  // Form state variables for New/Edit Link and Gemini AI integration
  const [formTitle, setFormTitle] = useState("");
  const [formLandingDescription, setFormLandingDescription] = useState("");
  const [formLinkEnabled, setFormLinkEnabled] = useState(true);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // TanStack Query (Links Registry Query) - SINGLE SOURCE OF TRUTH
  const { data: queryLinksRegistry, isLoading: isRegistryLoading } = useQuery({
    queryKey: [
      "links_registry", 
      user?.uid, 
      listCurrentPage, 
      listItemsPerPage, 
      searchTerm, 
      filterStatus, 
      listFilterCategory, 
      listFilterPassword, 
      listFilterPortal, 
      listMinClicks,
      sortConfig?.key,
      sortConfig?.direction
    ],
    queryFn: async () => {
      if (!user) return { links: [], totalCount: 0, totalPages: 1 };
      const isTreeTab = currentTab === "link-tree";
      const params = new URLSearchParams({
        userId: user.uid,
        page: isTreeTab ? "1" : String(listCurrentPage),
        limit: isTreeTab ? "1000" : String(listItemsPerPage),
        search: isTreeTab ? "" : searchTerm,
        status: isTreeTab ? "all" : filterStatus,
        category: isTreeTab ? "all" : listFilterCategory,
        password: isTreeTab ? "all" : listFilterPassword,
        portal: isTreeTab ? "all" : listFilterPortal,
        minClicks: isTreeTab ? "" : String(listMinClicks),
        sortField: sortConfig?.key || "createdAt",
        sortOrder: sortConfig?.direction || "desc"
      });
      return await LinkService.getLinksRegistry(params);
    },
    enabled: !!user && (currentTab === "links-list" || currentTab === "link-detail" || currentTab === "link-tree"),
    staleTime: 1000 * 60 * 2, // 2 minutes stale time
  });

  const links = queryLinksRegistry?.links || [];
  const totalCount = queryLinksRegistry?.totalCount || 0;
  const totalPages = queryLinksRegistry?.totalPages || 1;

  return {
    links,
    isRegistryLoading,
    totalCount,
    totalPages,
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
    listMinClicks,
    setListMinClicks,
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
  };
}
