import React, { useState } from "react";
import {
  X,
  AlertTriangle,
  CheckCircle,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { APP_THEME_CONFIGS, TRANSLATIONS } from "../constants";
import { BulkImportSkippedItem } from "../types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DuplicateSlugAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  skippedItems: BulkImportSkippedItem[];
  importedCount: number;
  lang: "id" | "en";
  isLightMode: boolean;
  appTheme: keyof typeof APP_THEME_CONFIGS;
}

export default function DuplicateSlugAlertModal({
  isOpen,
  onClose,
  skippedItems,
  importedCount,
  lang,
  isLightMode,
  appTheme,
}: DuplicateSlugAlertModalProps) {
  const [copied, setCopied] = useState(false);
  const curT = APP_THEME_CONFIGS[appTheme];

  const handleCopySkippedList = () => {
    const textToCopy = skippedItems
      .map((it) => `${it.originalUrl}, ${it.shortSlug} -> [${it.reason}]`)
      .join("\n");
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const bgModal = isLightMode ? "bg-white border-zinc-200" : "bg-zinc-900 border-zinc-800";
  const bgOverlay = "bg-black/60 backdrop-blur-xs";
  const textTitle = isLightMode ? "text-zinc-900" : "text-white";
  const textMuted = isLightMode ? "text-zinc-500" : "text-zinc-400";
  const skippedItemBg = isLightMode ? "bg-zinc-50 border-zinc-200" : "bg-zinc-950/40 border-zinc-800";

  return (
    <div className={cn("fixed inset-0 z-50 flex items-center justify-center p-4", bgOverlay)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn("relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]", bgModal)}
      >
        {/* Header */}
        <div className="p-6 border-b border-inherit flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-500 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="text-left">
              <h2 className={cn("text-lg font-black", textTitle)}>
                {lang === "id" ? "Slug Konflik Terdeteksi" : "Slug Conflict Detected"}
              </h2>
              <p className="text-xs text-zinc-400 font-medium">
                {lang === "id"
                  ? "Beberapa tautan dilewati karena slug sudah terpakai"
                  : "Some links were skipped because slugs are already used"}
              </p>
            </div>
          </div>
          <button
            id="btn-close-duplicate-alert"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-500/10 transition-colors cursor-pointer text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Box */}
        <div className="p-6 overflow-y-auto space-y-5 text-left flex-1">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-center">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-4 h-4" />
              </div>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                {lang === "id" ? "Berhasil Diimpor" : "Imported"}
              </p>
              <p className="text-2xl font-black text-emerald-500 mt-0.5">{importedCount}</p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-center">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                {lang === "id" ? "Dilewati (Konflik)" : "Skipped (Conflict)"}
              </p>
              <p className="text-2xl font-black text-amber-500 mt-0.5">{skippedItems.length}</p>
            </div>
          </div>

          {/* Guide Message */}
          <div className="p-4 rounded-2xl bg-zinc-500/5 border border-zinc-500/10 flex items-start gap-3">
            <Info className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1 text-zinc-400 font-medium">
              <p className={cn("font-bold", textTitle)}>
                {lang === "id"
                  ? "Aturan Keunikan Slug Diaktifkan"
                  : "Slug Uniqueness Rule Enforced"}
              </p>
              <p>
                {lang === "id"
                  ? "Sistem melewati tautan di bawah ini karena slug kustomnya sudah digunakan oleh Anda atau pengguna lain. Tautan lain dengan slug unik berhasil dibuat."
                  : "The system automatically skipped the links below because their custom slugs are already registered. Other links with unique slugs have been created."}
              </p>
            </div>
          </div>

          {/* List of Skipped Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className={cn("text-xs font-black tracking-wide uppercase", textTitle)}>
                {lang === "id" ? "Daftar Tautan Yang Dilewati" : "Skipped Links List"}
              </h3>
              <button
                id="btn-copy-skipped-list"
                onClick={handleCopySkippedList}
                className="text-[10px] text-brand-500 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                {copied ? (lang === "id" ? "Disalin!" : "Copied!") : (lang === "id" ? "Salin Daftar" : "Copy List")}
              </button>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {skippedItems.map((item, index) => (
                <div
                  key={index}
                  className={cn("p-3 rounded-xl border flex items-center justify-between gap-4", skippedItemBg)}
                >
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-xs font-bold truncate", textTitle)}>
                      {item.title || item.originalUrl}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{item.originalUrl}</p>
                    <p className="text-[9px] text-amber-500 font-semibold mt-1 flex items-center gap-1">
                      <ChevronRight className="w-2.5 h-2.5" />
                      {item.reason}
                    </p>
                  </div>
                  <span className="text-[9px] bg-amber-500/10 text-amber-500 px-2 py-1 rounded-md font-mono font-black shrink-0">
                    /{item.shortSlug}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-inherit flex items-center justify-end gap-3 bg-zinc-500/[0.02]">
          <button
            id="btn-confirm-duplicate-alert"
            onClick={onClose}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md",
              isLightMode
                ? "bg-zinc-900 hover:bg-zinc-800 text-white"
                : cn(curT.bg, curT.hoverBg, "text-black")
            )}
          >
            {lang === "id" ? "Mengerti, Tutup" : "Understood, Close"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}