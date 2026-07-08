import React from "react";
import { 
  List, Plus, Search, SlidersHorizontal, ArrowUpDown, CheckSquare, Square, 
  Eye, EyeOff, Lock, Layers, QrCode, Edit2, ExternalLink, Trash2, 
  ChevronLeft, ChevronRight, Check, Copy
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { APP_THEME_CONFIGS, CATEGORY_OPTIONS, TRANSLATIONS } from "../constants";
import { LinkData } from "../types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LinksListPageProps {
  lang: "id" | "en";
  links: LinkData[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterStatus: "all" | "active" | "expired";
  setFilterStatus: (status: "all" | "active" | "expired") => void;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (show: boolean) => void;
  listFilterCategory: string;
  setListFilterCategory: (cat: string) => void;
  listFilterPassword: "all" | "protected" | "none";
  setListFilterPassword: (v: "all" | "protected" | "none") => void;
  listFilterPortal: "all" | "enabled" | "disabled";
  setListFilterPortal: (v: "all" | "enabled" | "disabled") => void;
  listCurrentPage: number;
  setListCurrentPage: (p: number) => void;
  listItemsPerPage: number;
  setListItemsPerPage: (num: number) => void;
  
  selectedLinkIds: string[];
  toggleSelectLink: (id: string) => void;
  toggleSelectAll: () => void;
  allFilteredSelected: boolean;
  requestSort: (key: string) => void;
  handleCopy: (shortSlug: string, id: string) => void;
  copiedId: string | null;
  
  setQrFgColor: (color: string) => void;
  setQrBgColor: (color: string) => void;
  setQrLink: (link: LinkData) => void;
  setEditingLink: (link: LinkData | null) => void;
  setIsModalOpen: (open: boolean) => void;
  handleDelete: (id: string) => void;
  handleBulkDelete: () => void;
  
  listFilteredLinks: LinkData[];
  listTotalPages: number;
  paginatedLinks: LinkData[];
  
  setSelectedDetailLinkId: (id: string | null) => void;
  setCurrentTab: (tab: string) => void;
  isLightMode: boolean;
  appTheme: keyof typeof APP_THEME_CONFIGS;
}

export default function LinksListPage({
  lang,
  links,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  showAdvancedFilters,
  setShowAdvancedFilters,
  listFilterCategory,
  setListFilterCategory,
  listFilterPassword,
  setListFilterPassword,
  listFilterPortal,
  setListFilterPortal,
  listCurrentPage,
  setListCurrentPage,
  listItemsPerPage,
  setListItemsPerPage,
  selectedLinkIds,
  toggleSelectLink,
  toggleSelectAll,
  allFilteredSelected,
  requestSort,
  handleCopy,
  copiedId,
  setQrFgColor,
  setQrBgColor,
  setQrLink,
  setEditingLink,
  setIsModalOpen,
  handleDelete,
  handleBulkDelete,
  listFilteredLinks,
  listTotalPages,
  paginatedLinks,
  setSelectedDetailLinkId,
  setCurrentTab,
  isLightMode,
  appTheme,
}: LinksListPageProps) {
  const curT = APP_THEME_CONFIGS[appTheme];
  const t = (key: keyof typeof TRANSLATIONS.id) => {
    return TRANSLATIONS[lang]?.[key] || key;
  };

  const cardBg = isLightMode ? "bg-white border border-zinc-250 text-zinc-900 shadow-sm" : "bg-zinc-900/40 border border-zinc-800 text-white";
  const textTitle = isLightMode ? "text-zinc-950 font-black" : "text-white font-extrabold";
  const textMuted = isLightMode ? "text-zinc-500 font-medium" : "text-zinc-400";
  const inputBg = isLightMode ? "bg-zinc-100 border border-zinc-200 text-zinc-900 focus:bg-white" : "bg-zinc-950 border border-zinc-855 text-white focus:bg-black";
  const borderClassic = isLightMode ? `${curT.borderClassicLight}` : "border-zinc-800";
  const trHoverBg = isLightMode ? "hover:bg-zinc-50" : "hover:bg-zinc-800/20";
  const tableHeaderBg = isLightMode ? "bg-zinc-100/50" : "bg-zinc-950/20";
  const tableBorder = isLightMode ? "border-zinc-200" : "border-zinc-800/50";

  return (
    <div className="space-y-8 text-left animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1 flex items-center gap-2">
            {t("linksListHeader")} <List className="w-5 h-5 text-brand-500" />
          </h1>
          <p className="text-zinc-500 text-sm">{t("linksListSubtitle")}</p>
        </div>
        <div>
          <button
            onClick={() => { setSelectedDetailLinkId(null); setEditingLink(null); setIsModalOpen(true); }}
            className={cn("text-black font-extrabold px-5 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2 text-sm cursor-pointer", curT.bg, curT.hoverBg, curT.shadowAccent)}
          >
            <Plus className="w-4 h-4" /> {t("shortenNewLink")}
          </button>
        </div>
      </div>

      {/* Simple Table container with filters & pagination */}
      <div className={cn("rounded-3xl overflow-hidden border transition-all", isLightMode ? "bg-white border-zinc-205 border-zinc-200 shadow-sm" : "bg-zinc-900/50 border-zinc-800")}>
        {/* Filter controls inside table box */}
        <div className={cn("p-6 border-b space-y-4 transition-colors", borderClassic, isLightMode ? "bg-zinc-50/50" : "bg-zinc-950/20")}>
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
            
            {/* Text Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input 
                type="text" 
                placeholder={t("searchHint")} 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setListCurrentPage(1); }}
                className={cn("w-full rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all font-medium text-sm", inputBg)}
              />
            </div>

            {/* Right side filter triggers */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status filter switcher */}
              <div className={cn("flex rounded-xl p-1 gap-1 border transition-all", isLightMode ? "bg-zinc-200 border-zinc-300" : "bg-zinc-950 border-zinc-805")}>
                 {(['all', 'active', 'expired'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => { setFilterStatus(status); setListCurrentPage(1); }}
                    className={cn(
                      "px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all select-none cursor-pointer",
                      filterStatus === status 
                        ? (isLightMode ? "bg-white text-zinc-900 shadow font-extrabold" : "bg-zinc-800 text-white shadow font-extrabold") 
                        : "text-zinc-505 text-zinc-500 hover:text-brand-550 hover:text-brand-500"
                    )}
                  >
                    {status === 'all' ? t("all") : status === 'active' ? t("active") : t("expired")}
                  </button>
                ))}
              </div>

              {/* Advanced filter toggle */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={cn(
                  "px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all select-none cursor-pointer",
                  showAdvancedFilters 
                    ? "bg-brand-500/10 border-brand-500/30 text-brand-400"
                    : (isLightMode ? "bg-white border-zinc-200 text-zinc-650 hover:border-zinc-300 hover:text-zinc-850" : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700")
                )}
              >
                <SlidersHorizontal className="w-4 h-4 text-brand-505 text-brand-500" />
                {t("advancedFilter")}
              </button>
            </div>
          </div>

          {/* Advanced filter drawer */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={cn("overflow-hidden border-t pt-4 grid grid-cols-1 md:grid-cols-4 gap-4", isLightMode ? "border-zinc-200" : "border-zinc-805")}
              >
                {/* Category filter */}
                <div className="space-y-1.5 text-left">
                  <label className={cn("text-xs font-bold", textMuted)}>{t("filterCategory")}</label>
                  <select
                    value={listFilterCategory}
                    onChange={(e) => { setListFilterCategory(e.target.value); setListCurrentPage(1); }}
                    className={cn(
                      "w-full border rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-brand-500/50 text-xs transition-all font-semibold cursor-pointer",
                      isLightMode 
                        ? "bg-white border-zinc-200 text-zinc-800" 
                        : "bg-zinc-950 border-zinc-800 text-zinc-300"
                    )}
                  >
                    <option value="all">{t("allCategories")}</option>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {lang === 'id' ? cat.labelIdText : cat.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Password protect filter */}
                <div className="space-y-1.5 text-left">
                  <label className={cn("text-xs font-bold", textMuted)}>{t("passwordSecurity")}</label>
                  <select
                    value={listFilterPassword}
                    onChange={(e) => { setListFilterPassword(e.target.value as any); setListCurrentPage(1); }}
                    className={cn(
                      "w-full border rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-brand-500/50 text-xs transition-all font-semibold cursor-pointer",
                      isLightMode 
                        ? "bg-white border-zinc-200 text-zinc-800" 
                        : "bg-zinc-950 border-zinc-800 text-zinc-300"
                    )}
                  >
                    <option value="all">{t("allLinks")}</option>
                    <option value="protected">{t("passwordProtectedOnly")}</option>
                    <option value="none">{t("openLinksOnly")}</option>
                  </select>
                </div>

                {/* Portal landing filter */}
                <div className="space-y-1.5 text-left">
                  <label className={cn("text-xs font-bold", textMuted)}>{t("infoPortalStatus")}</label>
                  <select
                    value={listFilterPortal}
                    onChange={(e) => { setListFilterPortal(e.target.value as any); setListCurrentPage(1); }}
                    className={cn(
                      "w-full border rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-brand-500/50 text-xs transition-all font-semibold cursor-pointer",
                      isLightMode 
                        ? "bg-white border-zinc-200 text-zinc-800" 
                        : "bg-zinc-950 border-zinc-800 text-zinc-300"
                    )}
                  >
                    <option value="all">{t("allPortalStatus")}</option>
                    <option value="enabled">{t("landingPortalActive")}</option>
                    <option value="disabled">{t("noLandingPortal")}</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Table view of links */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={cn("text-xs font-semibold uppercase tracking-wider select-none border-b", tableHeaderBg, tableBorder)}>
                <th className="px-6 py-4 w-12 text-center">
                  <button 
                    onClick={toggleSelectAll}
                    className={cn("transition-colors cursor-pointer", isLightMode ? "text-zinc-500" : "text-zinc-400 hover:text-white")}
                    title={allFilteredSelected ? "Deselect All" : "Select All"}
                  >
                    {allFilteredSelected ? <CheckSquare className="w-5 h-5 text-brand-500" /> : <Square className="w-5 h-5" />}
                  </button>
                </th>
                <th className={cn("px-6 py-4 cursor-pointer transition-colors text-left", isLightMode ? "hover:text-zinc-900" : "hover:text-zinc-300")} onClick={() => requestSort('title')}>
                  <div className="flex items-center gap-2">Judul Tautan <ArrowUpDown className="w-3" /></div>
                </th>
                <th className="px-6 py-4 text-left">Short Slug</th>
                <th className={cn("px-6 py-4 cursor-pointer transition-colors text-left", isLightMode ? "hover:text-zinc-900" : "hover:text-zinc-300")} onClick={() => requestSort('clickCount')}>
                  <div className="flex items-center gap-2">Klik <ArrowUpDown className="w-3" /></div>
                </th>
                <th className="px-6 py-4 text-center">{lang === "id" ? "Status & Fitur" : "Status & Features"}</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className={cn("divide-y", tableBorder)}>
              {paginatedLinks.map((link) => {
                const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
                const shortUrl = `${window.location.origin}/${link.shortSlug}`;
                const isSelected = selectedLinkIds.includes(link.id);
                
                return (
                  <tr key={link.id} className={cn("transition-colors group text-sm font-semibold", trHoverBg, isSelected && "bg-brand-500/[0.02]")}>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => toggleSelectLink(link.id)}
                        className={cn("transition-colors cursor-pointer", isLightMode ? "text-zinc-500 hover:text-zinc-800" : "text-zinc-400 hover:text-white")}
                      >
                        {isSelected ? <CheckSquare className="w-5 h-5 text-brand-500" /> : <Square className="w-5 h-5" />}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <div className="max-w-xs">
                        <div className="flex items-center gap-2">
                          <p className={cn("font-bold truncate", textTitle)}>{link.title || link.shortSlug}</p>
                          {link.category && link.category !== "general" && (
                            <span className={cn(
                              "text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider leading-none shrink-0",
                              link.category === "social" ? "bg-sky-500/10 text-sky-500" :
                              link.category === "promo" ? "bg-amber-500/10 text-amber-500" :
                              link.category === "work" ? "bg-violet-500/10 text-violet-500" :
                              link.category === "personal" ? "bg-pink-500/10 text-pink-500" :
                              "bg-zinc-500/10 text-zinc-400"
                            )}>
                              {lang === 'id' 
                                ? CATEGORY_OPTIONS.find(c => c.value === link.category)?.labelIdText 
                                : CATEGORY_OPTIONS.find(c => c.value === link.category)?.labelEn}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 truncate font-mono font-medium">{link.originalUrl}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <div className="flex items-center gap-2">
                        <code className="text-brand-505 text-brand-500 bg-brand-500/10 px-2 py-1 rounded text-xs font-bold font-mono">/{link.shortSlug}</code>
                        <button 
                          onClick={() => handleCopy(link.shortSlug, link.id)}
                          className={cn("transition-colors cursor-pointer", isLightMode ? "text-zinc-450 hover:text-zinc-800" : "text-zinc-400 hover:text-white")}
                          title={t("copy")}
                        >
                          {copiedId === link.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <span className="font-mono text-sm font-semibold">{link.clickCount || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2 flex-wrap select-none">
                        {isExpired ? (
                          <span className="p-1.5 rounded-xl bg-rose-500/10 text-rose-500 transition-all font-semibold" title={t("expired")}>
                            <Lock className="w-4 h-4" />
                          </span>
                        ) : link.isEnabled === false ? (
                          <span className={cn("p-1.5 rounded-xl transition-all font-semibold border", isLightMode ? "bg-zinc-100 text-zinc-500 border-zinc-200" : "bg-zinc-700/20 text-zinc-400 border-zinc-700/30")} title={t("disabled")}>
                            <EyeOff className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 transition-all font-semibold" title={t("active")}>
                            <Eye className="w-4 h-4 animate-pulse" />
                          </span>
                        )}

                        {link.password ? (
                          <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-500 transition-all font-semibold" title={t("passwordProtected")}>
                            <Lock className="w-4 h-4" />
                          </span>
                        ) : null}

                        {link.landingEnabled ? (
                          <span className="p-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-500 transition-all font-semibold" title={t("landingPortalActive")}>
                            <Layers className="w-4 h-4" />
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => { setQrFgColor(curT.qrFg); setQrBgColor("#ffffff"); setQrLink(link); }}
                          className={cn("p-2 rounded-xl transition-all cursor-pointer", isLightMode ? "text-zinc-660 hover:text-brand-500 hover:bg-brand-50" : "text-zinc-400 hover:text-white hover:bg-zinc-800")}
                          title={t("customQr") || "Custom QR Code"}
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { setSelectedDetailLinkId(link.id); setCurrentTab("link-detail"); }}
                          className={cn("p-2 rounded-xl transition-all font-bold cursor-pointer", isLightMode ? "text-brand-600 hover:bg-brand-50" : "text-brand-400 hover:bg-brand-500/10")}
                          title={t("detailLinkManage")}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => window.open(shortUrl, '_blank')}
                          className={cn("p-2 rounded-xl transition-all cursor-pointer", isLightMode ? "text-zinc-650 hover:text-blue-600 hover:bg-blue-50" : "text-zinc-400 hover:text-white hover:bg-zinc-800")}
                          title={t("openLink")}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(link.id)}
                          className={cn("p-2 rounded-xl transition-all cursor-pointer", isLightMode ? "text-zinc-650 hover:text-red-650 hover:bg-red-50" : "text-zinc-400 hover:text-red-450 hover:bg-red-400/10")}
                          title={t("deleteButton")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedLinks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-zinc-500 font-medium font-sans">
                    {t("noFilteredLinks")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile items view blocks represent links list */}
        <div className="block md:hidden divide-y divide-zinc-850">
          {paginatedLinks.map((link) => {
            const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
            const shortUrl = `${window.location.origin}/${link.shortSlug}`;
            const isSelected = selectedLinkIds.includes(link.id);

            return (
              <div key={link.id} className={cn("p-5 space-y-4 transition-colors", isSelected && "bg-brand-500/[0.02]")}>
                <div className="flex items-start justify-between gap-3 select-none">
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => toggleSelectLink(link.id)}
                      className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {isSelected ? <CheckSquare className="w-5 h-5 text-brand-500" /> : <Square className="w-4 h-4" />}
                    </button>
                    <div className="min-w-0 text-left">
                      <p className={cn("font-bold text-sm truncate", textTitle)}>{link.title || link.shortSlug}</p>
                      <p className="text-[11px] text-zinc-500 truncate font-mono">{link.originalUrl}</p>
                    </div>
                  </div>
                  <div>
                    {isExpired ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/10">
                        {t("expired")}
                      </span>
                    ) : link.isEnabled === false ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-700/20 text-zinc-400 border border-zinc-700/30">
                        {t("disabled")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 animate-pulse">
                        {t("active")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-950 p-3 rounded-2xl border border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <code className="text-brand-505 text-brand-500 bg-brand-500/10 px-2.5 py-1 rounded-xl text-xs font-bold font-mono">/{link.shortSlug}</code>
                    <button 
                      type="button"
                      onClick={() => handleCopy(link.shortSlug, link.id)}
                      className="text-zinc-505 hover:text-white transition-colors p-1 cursor-pointer"
                      title={t("copy")}
                    >
                      {copiedId === link.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="text-xs font-semibold text-zinc-404 text-zinc-400 select-none">
                    {lang === "id" ? "Kunjungan" : "Clicks"}: <span className="text-brand-500 font-mono font-black">{link.clickCount || 0}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 select-none">
                  <div className="flex gap-1.5 text-left">
                    {link.password && (
                      <span className="inline-flex items-center gap-1 text-[9px] bg-red-500/10 text-red-500 py-0.5 px-2.5 rounded-full font-bold uppercase tracking-wider">
                        <Lock className="w-2.5 h-2.5" /> {t("passwordProtected")}
                      </span>
                    )}
                    {link.landingEnabled && (
                      <span className="inline-flex items-center gap-1 text-[9px] bg-blue-500/10 text-blue-500 py-0.5 px-2.5 rounded-full font-bold uppercase tracking-wider">
                        <Layers className="w-2.5 h-2.5" /> {t("landingPortalActive")}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button 
                      type="button"
                      onClick={() => { setQrFgColor(curT.qrFg); setQrBgColor("#ffffff"); setQrLink(link); }}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
                      title={t("customQr")}
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setSelectedDetailLinkId(link.id); setCurrentTab("link-detail"); }}
                      className="p-2 text-brand-450 hover:text-white hover:bg-brand-500/10 rounded-xl transition-all font-bold cursor-pointer"
                      title={t("detailLinkManage")}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => window.open(shortUrl, '_blank')}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
                      title={t("openLink")}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleDelete(link.id)}
                      className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all cursor-pointer"
                      title={t("deleteButton")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {paginatedLinks.length === 0 && (
            <div className="px-6 py-16 text-center text-zinc-500 text-xs font-semibold">
              {t("noFilteredLinks")}
            </div>
          )}
        </div>

        {/* Pagination controls footer */}
        <div className={cn("p-6 border-t flex flex-col sm:flex-row gap-4 justify-between items-center text-xs font-semibold select-none transition-colors", isLightMode ? "border-zinc-200 bg-zinc-50/40 text-zinc-600" : "border-zinc-850 bg-zinc-950/20 text-zinc-400")}>
          <div className="flex items-center gap-3">
            <span>{t("rowsPerPage")}</span>
            <select
              value={listItemsPerPage}
              onChange={(e) => { setListItemsPerPage(Number(e.target.value)); setListCurrentPage(1); }}
              className={cn("border rounded-lg py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-brand-500/50 text-xs font-bold transition-all cursor-pointer", isLightMode ? "bg-white border-zinc-200 text-zinc-800" : "bg-zinc-950 border-zinc-800 text-zinc-350")}
            >
              {[5, 10, 20, 50].map((num) => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
            <span className="text-zinc-500">|</span>
            <span className={cn(isLightMode ? "text-zinc-600" : "text-zinc-400")}>{t("showing")} {Math.min(listFilteredLinks.length, (listCurrentPage - 1) * listItemsPerPage + 1)}-{Math.min(listFilteredLinks.length, listCurrentPage * listItemsPerPage)} {t("of")} {listFilteredLinks.length} {t("links")}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setListCurrentPage(Math.max(1, listCurrentPage - 1))}
              disabled={listCurrentPage === 1}
              className={cn("p-2 rounded-lg border transition-colors cursor-pointer", isLightMode ? "bg-white border-zinc-200 text-zinc-605 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-40" : "bg-zinc-950 border-zinc-855 text-zinc-400 hover:text-white disabled:opacity-40")}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {Array.from({ length: listTotalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              const isCurrent = pageNum === listCurrentPage;
              return (
                <button
                  key={pageNum}
                  onClick={() => setListCurrentPage(pageNum)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    isCurrent 
                      ? `${curT.bg} text-black font-black shadow-md`
                      : (isLightMode 
                          ? "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900" 
                          : "bg-zinc-950/60 border border-zinc-855 hover:border-zinc-750 text-zinc-400 hover:text-zinc-205")
                  )}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setListCurrentPage(Math.min(listTotalPages, listCurrentPage + 1))}
              disabled={listCurrentPage === listTotalPages}
              className={cn("p-2 rounded-lg border transition-colors cursor-pointer", isLightMode ? "bg-white border-zinc-205 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-40" : "bg-zinc-950 border-zinc-855 text-zinc-400 hover:text-white disabled:opacity-40")}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mass actions option */}
      {selectedLinkIds.length > 0 && (
        <div className="bg-brand-500/[0.04] border border-brand-500/20 p-5 rounded-2xl flex items-center justify-between">
          <span className="text-sm font-bold text-zinc-300">Terpilih <span className="text-brand-400 font-mono font-black">{selectedLinkIds.length}</span> tautan untuk tindakan massal</span>
          <button
            onClick={handleBulkDelete}
            className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-xs font-bold cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Hapus Sekaligus
          </button>
        </div>
      )}
    </div>
  );
}
