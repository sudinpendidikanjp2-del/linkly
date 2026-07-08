import React, { useEffect } from "react";
import { RefreshCw, Sparkles, Folder, Lock, Eye, EyeOff, Layers, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { nanoid } from "nanoid";
import { APP_THEME_CONFIGS, CATEGORY_OPTIONS, TRANSLATIONS } from "../constants";
import { LinkData, CollectionData } from "../types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CreateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: "id" | "en";
  editingLink: LinkData | null;
  formTitle: string;
  setFormTitle: (v: string) => void;
  slugValue: string;
  setSlugValue: (v: string) => void;
  formCategory: string;
  setFormCategory: (v: string) => void;
  formCollectionId: string;
  setFormCollectionId: (v: string) => void;
  modalPassword: string;
  setModalPassword: (v: string) => void;
  formLinkEnabled: boolean;
  setFormLinkEnabled: (v: boolean) => void;
  landingEnabled: boolean;
  setLandingEnabled: (v: boolean) => void;
  formLandingDescription: string;
  setFormLandingDescription: (v: string) => void;
  collections: CollectionData[];
  isGeneratingAi: boolean;
  handleGenerateAiMetadata: () => void;
  aiError: string | null;
  handleSaveLink: (e: React.FormEvent<HTMLFormElement>) => void;
  isLightMode: boolean;
  appTheme: keyof typeof APP_THEME_CONFIGS;
  isSavingLink?: boolean;
}

export default function CreateLinkModal({
  isOpen,
  onClose,
  lang,
  editingLink,
  formTitle,
  setFormTitle,
  slugValue,
  setSlugValue,
  formCategory,
  setFormCategory,
  formCollectionId,
  setFormCollectionId,
  modalPassword,
  setModalPassword,
  formLinkEnabled,
  setFormLinkEnabled,
  landingEnabled,
  setLandingEnabled,
  formLandingDescription,
  setFormLandingDescription,
  collections,
  isGeneratingAi,
  handleGenerateAiMetadata,
  aiError,
  handleSaveLink,
  isLightMode,
  appTheme,
  isSavingLink = false,
}: CreateLinkModalProps) {
  const curT = APP_THEME_CONFIGS[appTheme];
  const t = (key: keyof typeof TRANSLATIONS.id) => {
    return TRANSLATIONS[lang]?.[key] || key;
  };

  const cardBg = isLightMode ? "bg-white border border-zinc-250 text-zinc-900" : "bg-zinc-900 border border-zinc-800 text-white";
  const inputBg = isLightMode ? "bg-zinc-100 border border-zinc-200 text-zinc-900 focus:bg-white" : "bg-zinc-950 border border-zinc-850 text-white focus:bg-black";
  const textMuted = isLightMode ? "text-zinc-500" : "text-zinc-400";
  const borderClassic = isLightMode ? `${curT.borderClassicLight}` : "border-zinc-800";
  const sectionBg = isLightMode ? "bg-zinc-50 border-zinc-200" : "bg-zinc-950/40 border-zinc-800/40";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn("relative w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[85vh] sm:max-h-[90vh] overscroll-contain space-y-6", cardBg)}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-extrabold">{editingLink ? t("editLink") : t("createLink")}</h2>
              <button 
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-zinc-500/10 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400 hover:text-rose-500" />
              </button>
            </div>
            
            <form onSubmit={handleSaveLink} className="space-y-6">
              
              {/* Original Destination link with AI Generation Trigger */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={cn("text-xs font-bold", textMuted)}>{t("originalUrl")}</label>
                  <button
                    type="button"
                    onClick={handleGenerateAiMetadata}
                    disabled={isGeneratingAi}
                    className="text-xs text-brand-500 hover:text-brand-400 font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    title={t("aiMetaDesc")}
                  >
                    {isGeneratingAi ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        {lang === 'id' ? 'Menganalisis...' : 'Analysing...'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-brand-500 fill-brand-500/20" />
                        {t("aiMetaTitle")}
                      </>
                    )}
                  </button>
                </div>
                <input 
                  name="originalUrl"
                  type="url" 
                  required
                  defaultValue={editingLink?.originalUrl}
                  placeholder={t("urlPlaceholder")}
                  className={cn("w-full rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-medium font-mono text-sm shadow-inner transition-all", inputBg)}
                />
                {aiError && (
                  <p className="text-xs text-red-500 font-semibold">{aiError}</p>
                )}
              </div>

              {/* Optional Title and custom slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={cn("text-xs font-bold", textMuted)}>{t("judulPenanda")}</label>
                  <input 
                    name="title"
                    type="text" 
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder={lang === 'id' ? "Contoh: Link Promosi" : "e.g. Promo Link"}
                    className={cn("w-full rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all", inputBg)}
                  />
                </div>
                <div className="space-y-2">
                  <label className={cn("text-xs font-bold", textMuted)}>{t("customSlug")}</label>
                  <div className="flex gap-2">
                    <input 
                      name="shortSlug"
                      type="text" 
                      value={slugValue}
                      onChange={(e) => setSlugValue(e.target.value)}
                      placeholder="custom-slug"
                      className={cn("flex-1 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-mono font-bold transition-all", inputBg)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSlugValue(nanoid(6));
                      }}
                      className={cn(
                        "font-bold px-4 rounded-xl transition-all text-xs flex items-center gap-1.5 shrink-0 border cursor-pointer",
                        isLightMode ? "bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-emerald-650" : "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-emerald-600 text-emerald-555"
                      )}
                      title="Generate Random Slug"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      {lang === 'id' ? 'Acak' : 'Random'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category select control */}
                <div className="space-y-2">
                  <label className={cn("text-xs font-bold", textMuted)}>{t("categoryLabel")}</label>
                  <select
                    name="category"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className={cn("w-full rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-medium transition-all text-sm", inputBg)}
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {lang === 'id' ? cat.labelIdText : cat.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expiry date limiter */}
                <div className="space-y-2">
                  <label className={cn("text-xs font-bold", textMuted)}>{t("expiryDate")}</label>
                  <input 
                    name="expiresAt"
                    type="datetime-local" 
                    defaultValue={editingLink?.expiresAt ? format(new Date(editingLink.expiresAt), "yyyy-MM-dd'T'HH:mm") : ""}
                    className={cn("w-full rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-medium transition-all", inputBg)}
                  />
                </div>
              </div>

              {/* Collection / Folder selector dropdown */}
              <div className="space-y-2">
                <label className={cn("text-xs font-bold flex items-center gap-1.5", textMuted)}>
                  <Folder className="w-4 h-4 text-brand-500" />
                  {lang === "id" ? "Grup Folder / Koleksi" : "Folder / Collection Group"}
                </label>
                <select
                  value={formCollectionId}
                  onChange={(e) => setFormCollectionId(e.target.value)}
                  className={cn("w-full rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-medium transition-all text-sm", inputBg)}
                >
                  <option value="">{lang === "id" ? "-- Tanpa Folder (Tautan Bebas) --" : "-- No Folder (Standalone Link) --"}</option>
                  {collections.map((col) => (
                    <option key={col.id} value={col.id}>{col.name}</option>
                  ))}
                </select>
              </div>

              {/* Password protection wall security */}
              <div className="space-y-2">
                <label className={cn("text-xs font-bold flex items-center gap-1.5", textMuted)}><Lock className="w-4 h-4 text-brand-500" /> {t("passwordTitle")}</label>
                <input 
                  name="password"
                  type="password" 
                  value={modalPassword}
                  onChange={(e) => setModalPassword(e.target.value)}
                  placeholder={t("passwordPlaceholder")}
                  className={cn("w-full rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-mono transition-all", inputBg)}
                />
                {modalPassword.length > 0 && modalPassword.length < 6 && (
                  <p className="text-xs text-rose-500 font-bold flex items-center gap-1.5 animate-pulse mt-1">
                    <span>⚠️</span> {t("passwordTooWeak")}
                  </p>
                )}
              </div>

              {/* Status Aktif Toggle Section */}
              <div className={cn("border-t pt-6 space-y-4", borderClassic)}>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className={cn("text-sm font-bold flex items-center gap-1.5", isLightMode ? "text-zinc-800" : "text-zinc-200")}>
                      {formLinkEnabled ? (
                        <Eye className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-zinc-500" />
                      )}
                      {t("statusTautan")}
                    </p>
                    <p className="text-xs text-zinc-500">{t("tautanMutedDesc")}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormLinkEnabled(!formLinkEnabled)}
                    className={cn(
                      "w-12 h-6 rounded-full p-1 transition-colors relative duration-300 cursor-pointer",
                      formLinkEnabled ? "bg-emerald-500" : "bg-zinc-700"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full bg-black transition-transform duration-300 transform",
                      formLinkEnabled ? "translate-x-6" : "translate-x-0"
                    )} />
                  </button>
                </div>
              </div>

              {/* Link Portal Landing Page Splash Section */}
              <div className={cn("border-t pt-6 space-y-4", borderClassic)}>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className={cn("text-sm font-bold flex items-center gap-1.5", isLightMode ? "text-zinc-800" : "text-zinc-200")}>
                      <Layers className="w-4 h-4 text-blue-500" /> {t("landingPageTitle")}
                    </p>
                    <p className="text-xs text-zinc-500">{t("landingPageDesc")}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLandingEnabled(!landingEnabled)}
                    className={cn(
                      "w-12 h-6 rounded-full p-1 transition-colors relative duration-300 cursor-pointer",
                      landingEnabled ? `${curT.bg}` : "bg-zinc-700"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full bg-black transition-transform duration-300 transform",
                      landingEnabled ? "translate-x-6" : "translate-x-0"
                    )} />
                  </button>
                </div>

                {landingEnabled && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className={cn("space-y-4 p-4 border rounded-2xl", sectionBg)}
                  >
                    <div className="space-y-2">
                      <label className={cn("text-xs font-bold", textMuted)}>{t("deskripsiAtributLanding")}</label>
                      <textarea
                        name="landingDescription"
                        rows={2}
                        value={formLandingDescription}
                        onChange={(e) => setFormLandingDescription(e.target.value)}
                        placeholder={t("deskripsiLandingPlaceholder")}
                        className={cn("w-full rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm font-medium transition-all", inputBg)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={cn("text-xs font-bold", textMuted)}>{t("urlGambarProfil")}</label>
                      <input
                        name="landingAvatar"
                        type="url"
                        defaultValue={editingLink?.landingAvatar}
                        placeholder="https://contoh.com/logo-anda.png"
                        className={cn("w-full rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-xs font-mono transition-all", inputBg)}
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Form Buttons */}
              <div className={cn("flex gap-4 pt-4 border-t", borderClassic)}>
                <button 
                  type="button"
                  onClick={onClose}
                  disabled={isSavingLink}
                  className={cn(
                    "flex-1 px-6 py-3 border rounded-xl font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                    isLightMode ? "border-zinc-200 bg-zinc-50 text-zinc-900 hover:bg-zinc-100" : "border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-850"
                  )}
                >
                  {t("cancelBtn")}
                </button>
                <button 
                  type="submit"
                  disabled={isSavingLink}
                  className={cn(
                    "flex-1 px-6 py-3 text-black font-extrabold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed", 
                    curT.bg, 
                    curT.hoverBg
                  )}
                >
                  {isSavingLink && <RefreshCw className="w-4 h-4 animate-spin text-black" />}
                  {isSavingLink ? (lang === "id" ? "Menyimpan..." : "Saving...") : (editingLink ? t("saveBtn") : t("shortenLinkBtn"))}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
