import React from "react";
import { Link2, LogOut } from "lucide-react";
import { APP_THEME_CONFIGS, TRANSLATIONS } from "../constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MobileNavProps {
  currentTab: "dashboard" | "links-list" | "link-detail" | "link-tree" | "collections";
  setCurrentTab: (tab: "dashboard" | "links-list" | "link-detail" | "link-tree" | "collections") => void;
  isLightMode: boolean;
  lang: "id" | "en";
  appTheme: keyof typeof APP_THEME_CONFIGS;
  setAppTheme: (theme: keyof typeof APP_THEME_CONFIGS) => void;
  setQrFgColor: (color: string) => void;
  user: any;
  handleLogout: () => void;
  setListCurrentPage: (page: number) => void;
}

export default function MobileNav({
  currentTab,
  setCurrentTab,
  isLightMode,
  lang,
  appTheme,
  setAppTheme,
  setQrFgColor,
  user,
  handleLogout,
  setListCurrentPage,
}: MobileNavProps) {
  const curT = APP_THEME_CONFIGS[appTheme];
  const t = (key: keyof typeof TRANSLATIONS.id) => {
    return TRANSLATIONS[lang]?.[key] || key;
  };

  return (
    <>
      {/* Mobile Header with App Logo & Account Dropdown / Logout */}
      <div className={cn("flex justify-between items-center md:hidden p-4 rounded-3xl backdrop-blur-md border", isLightMode ? "bg-white/80 border-zinc-250 text-zinc-900 shadow-sm" : "bg-zinc-900/60 border-zinc-800 text-white")}>
        <div className="flex items-center gap-2.5">
          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", curT.bg)}>
            <Link2 className="w-5 h-5 text-black" />
          </div>
          <span className={cn("text-sm font-black tracking-wider uppercase font-sans", isLightMode ? "text-zinc-950" : "text-white")}>Linkly</span>
        </div>

        <div className="flex items-center gap-3">
          <div className={cn("flex items-center gap-2 p-1.5 pr-3 rounded-2xl border", isLightMode ? "bg-zinc-150 border-zinc-250" : "bg-zinc-950 border border-zinc-850")}>
            <img src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`} className={cn("w-6 h-6 rounded-full border", isLightMode ? "border-zinc-350" : "border-zinc-700")} alt={user.displayName || ""} />
            <div className="text-left leading-none max-w-[80px]">
              <p className={cn("text-[10px] font-black truncate font-sans", isLightMode ? "text-zinc-[805]" : "text-zinc-300")}>{user.displayName?.split(" ")[0] || "User"}</p>
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
            currentTab === "dashboard" ? `${curT.bg} text-black shadow-md font-extrabold` : (isLightMode ? "text-zinc-500 hover:text-zinc-900" : "text-zinc-400 hover:text-zinc-200")
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
            currentTab === "links-list" ? `${curT.bg} text-black shadow-md font-extrabold` : (isLightMode ? "text-zinc-500 hover:text-zinc-900" : "text-zinc-400 hover:text-zinc-200")
          )}
        >
          {t("linksList")}
        </button>
        <button
          onClick={() => setCurrentTab("link-tree")}
          className={cn(
            "flex-1 py-2 text-[10px] font-bold rounded-lg transition-all text-center",
            currentTab === "link-tree" ? `${curT.bg} text-black shadow-md font-extrabold` : (isLightMode ? "text-zinc-500 hover:text-zinc-900" : "text-zinc-400 hover:text-zinc-200")
          )}
        >
          {t("linkTree")}
        </button>
        <button
          onClick={() => setCurrentTab("collections")}
          className={cn(
            "flex-1 py-2 text-[10px] font-bold rounded-lg transition-all text-center",
            currentTab === "collections" ? `${curT.bg} text-black shadow-md font-extrabold` : (isLightMode ? "text-zinc-500 hover:text-zinc-900" : "text-zinc-400 hover:text-zinc-200")
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
      <div className={cn("flex md:hidden items-center justify-between p-3 border rounded-2xl gap-4 transition-all -mt-8", isLightMode ? "bg-white border-zinc-200" : "bg-zinc-900/40 border-zinc-850")}>
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
      </div>
    </>
  );
}
