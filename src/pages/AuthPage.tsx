import React from "react";
import { Link2, Sun, Moon } from "lucide-react";
import { motion } from "motion/react";
import { TRANSLATIONS } from "../constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AuthPageProps {
  isLightMode: boolean;
  toggleLightMode: () => void;
  lang: "id" | "en";
  toggleLang: () => void;
  handleLogin: () => void;
  settings: { registrationEnabled: boolean };
  themeInlineVars: React.CSSProperties;
}

export default function AuthPage({
  isLightMode,
  toggleLightMode,
  lang,
  toggleLang,
  handleLogin,
  settings,
  themeInlineVars,
}: AuthPageProps) {
  const t = (key: keyof typeof TRANSLATIONS.id) => {
    return TRANSLATIONS[lang]?.[key] || key;
  };

  return (
    <div className="theme-customizer-active w-full" style={themeInlineVars}>
      <div className={cn("min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-200 relative overflow-hidden", isLightMode ? "bg-zinc-50 text-zinc-900" : "bg-[#0a0a0a] text-white")}>
        {/* Subtle glowing mesh backgrounds for extra depth */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Top bar with quick buttons for Lang and Theme in Login Page */}
        <div className="absolute top-6 right-6 flex items-center gap-3">
          <button
            onClick={toggleLightMode}
            className={cn(
              "p-2 rounded-xl border transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95",
              isLightMode 
                ? "bg-white border-zinc-200 text-brand-600 shadow-brand-550/5 hover:bg-zinc-50" 
                : "bg-zinc-900 border-zinc-800 text-brand-400 hover:bg-zinc-850"
            )}
            style={isLightMode ? {} : { backgroundColor: "#17171c" }}
          >
            {isLightMode ? <Sun className="w-5 h-5 animate-pulse" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={toggleLang}
            className={cn(
              "px-3 py-1.5 rounded-xl border text-xs font-black tracking-widest uppercase transition-all cursor-pointer hover:scale-105 shadow-sm",
              isLightMode 
                ? "bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-50" 
                : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-850"
            )}
            style={isLightMode ? {} : { backgroundColor: "#17171c" }}
          >
            {lang}
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8 relative z-10"
        >
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-brand-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-brand-500/30 hover:rotate-6 transition-transform duration-300">
              <Link2 className="w-10 h-10 text-zinc-955 stroke-[2.5]" />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold tracking-tight font-sans">
              Linkly <span className="text-brand-500 font-black">SaaS</span>
            </h1>
            <p className={cn("text-sm", isLightMode ? "text-zinc-650" : "text-zinc-350")}>
              {t("loginDesc")}
            </p>
          </div>
          
          <div className={cn("border p-8 rounded-[32px] space-y-6 shadow-2xl transition-all duration-300", isLightMode ? "bg-white border-zinc-250" : "bg-zinc-905 border-zinc-805")}>
            <div>
              <h2 className="text-xl font-bold">{t("welcome")}</h2>
              <p className={cn("text-xs mt-1", isLightMode ? "text-zinc-500" : "text-zinc-400")}>
                {t("loginSubtitle")}
              </p>
            </div>

            <button 
              onClick={handleLogin}
              className={cn(
                "w-full font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 transition-colors cursor-pointer hover:scale-[1.02] active:scale-[0.98] transform duration-150 shadow-md",
                isLightMode 
                  ? "bg-zinc-955 text-white hover:bg-zinc-750" 
                  : "bg-white text-zinc-955 hover:bg-zinc-150"
              )}
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5 bg-white rounded-full p-0.5" alt="Google" />
              {t("login")}
            </button>
            {!settings.registrationEnabled && (
              <p className={cn("text-xs italic", isLightMode ? "text-zinc-500" : "text-zinc-400")}>
                {t("registrationDisabled")}
              </p>
            )}
          </div>
          
          <div className={cn("text-[11px] font-mono tracking-wider transition-colors", isLightMode ? "text-zinc-350" : "text-zinc-650")}>
            {t("poweredBy")} <span className="text-brand-500 font-bold">Linkly Core</span> &bull; v2.2.0
          </div>
        </motion.div>
      </div>
    </div>
  );
}
