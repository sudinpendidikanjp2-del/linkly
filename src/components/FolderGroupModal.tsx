import React from "react";
import { Check, CheckSquare, Square, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { APP_THEME_CONFIGS } from "../constants";
import { LinkData, CollectionData } from "../types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FolderGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: "id" | "en";
  colName: string;
  setColName: (v: string) => void;
  colDesc: string;
  setColDesc: (v: string) => void;
  colEditing: CollectionData | null;
  colSelectedLinkIds: string[];
  setColSelectedLinkIds: (ids: string[]) => void;
  links: LinkData[];
  handleSaveCollection: (e: React.FormEvent<HTMLFormElement>) => void;
  isLightMode: boolean;
  appTheme: keyof typeof APP_THEME_CONFIGS;
}

export default function FolderGroupModal({
  isOpen,
  onClose,
  lang,
  colName,
  setColName,
  colDesc,
  setColDesc,
  colEditing,
  colSelectedLinkIds,
  setColSelectedLinkIds,
  links,
  handleSaveCollection,
  isLightMode,
  appTheme,
}: FolderGroupModalProps) {
  const curT = APP_THEME_CONFIGS[appTheme];

  const cardBg = isLightMode ? "bg-white border border-zinc-250 text-zinc-900" : "bg-zinc-900 border border-zinc-800 text-white";
  const inputBg = isLightMode ? "bg-zinc-100 border border-zinc-200 text-zinc-900 focus:bg-white" : "bg-zinc-950 border border-zinc-850 text-white focus:bg-black";
  const textMuted = isLightMode ? "text-zinc-500" : "text-zinc-400";
  const textTitle = isLightMode ? "text-zinc-950" : "text-white";

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
              <h2 className={cn("text-2xl font-extrabold", textTitle)}>
                {colEditing 
                  ? (lang === "id" ? "Ubah Grup Koleksi" : "Edit Link Collection") 
                  : (lang === "id" ? "Buat Grup / Koleksi Baru" : "Create New Link Collection")}
              </h2>
              <button 
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-zinc-500/10 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400 hover:text-rose-500" />
              </button>
            </div>
            
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
                <div className={cn("max-h-40 overflow-y-auto border rounded-xl p-3 space-y-2 divider-zinc shadow-inner", isLightMode ? "bg-zinc-50 border-zinc-200" : "bg-zinc-950 border-zinc-805")}>
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
                            ? (isLightMode ? "bg-brand-50/75 text-brand-655 text-brand-600 font-extrabold" : "bg-brand-500/10 text-brand-400")
                            : (isLightMode ? "hover:bg-zinc-100 text-zinc-900" : "hover:bg-zinc-900 text-zinc-400")
                        )}
                      >
                        <div className="shrink-0">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-brand-500" />
                          ) : (
                            <Square className="w-4 h-4 text-zinc-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 text-left">
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
                  onClick={onClose}
                  className={cn(
                    "flex-1 py-3 font-bold rounded-xl border transition-all text-sm cursor-pointer",
                    isLightMode 
                      ? "bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border-zinc-250" 
                      : "bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border-zinc-800"
                  )}
                >
                  {lang === "id" ? "Batalkan" : "Cancel"}
                </button>
                <button 
                  type="submit"
                  className={cn("flex-1 py-3 text-black font-extrabold rounded-xl transition-colors text-sm cursor-pointer", curT.bg, curT.hoverBg)}
                >
                  {lang === "id" ? "Simpan Koleksi" : "Save Collection"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
