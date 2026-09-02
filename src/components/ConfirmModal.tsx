import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { motion } from "motion/react";
import { APP_THEME_CONFIGS } from "../constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
  isLightMode: boolean;
  appTheme: keyof typeof APP_THEME_CONFIGS;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = "danger",
  isLoading = false,
  isLightMode,
  appTheme,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const bgModal = isLightMode ? "bg-white border-zinc-200" : "bg-zinc-900 border-zinc-800";
  const bgOverlay = "bg-black/60 backdrop-blur-xs";
  const textTitle = isLightMode ? "text-zinc-900" : "text-white";
  const textBody = isLightMode ? "text-zinc-600" : "text-zinc-400";
  
  const iconBg = variant === "danger" 
    ? "bg-red-500/10 text-red-500" 
    : variant === "warning" 
    ? "bg-amber-500/10 text-amber-500" 
    : "bg-blue-500/10 text-blue-500";

  const confirmBtnBg = variant === "danger"
    ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"
    : variant === "warning"
    ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
    : "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20";

  return (
    <div className={cn("fixed inset-0 z-50 flex items-center justify-center p-4", bgOverlay)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={cn(
          "relative w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden p-6 text-left space-y-5",
          bgModal
        )}
      >
        <button
          id="btn-close-confirm-modal"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-xl flex items-center justify-center hover:bg-zinc-500/10 transition-colors cursor-pointer text-zinc-400 hover:text-zinc-200"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", iconBg)}>
            {variant === "danger" ? (
              <Trash2 className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          <div className="space-y-1 pr-6">
            <h3 className={cn("text-lg font-black tracking-tight", textTitle)}>
              {title}
            </h3>
            <p className={cn("text-xs leading-relaxed font-medium", textBody)}>
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            id="btn-cancel-confirm-modal"
            onClick={onClose}
            disabled={isLoading}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border",
              isLightMode
                ? "border-zinc-200 bg-zinc-100 hover:bg-zinc-200 text-zinc-800"
                : "border-zinc-800 bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
            )}
          >
            {cancelText || "Batal"}
          </button>
          <button
            id="btn-action-confirm-modal"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg flex items-center gap-2",
              confirmBtnBg,
              isLoading && "opacity-60 cursor-not-allowed"
            )}
          >
            {isLoading && (
              <svg className="animate-spin h-3.5 w-3.5 text-current" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {confirmText || "Hapus"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
