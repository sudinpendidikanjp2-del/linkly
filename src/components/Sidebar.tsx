import React from "react";
import { Link2, LayoutDashboard, List, Layers, Folder, LogOut, Sun, Moon } from "lucide-react";
import { APP_THEME_CONFIGS, TRANSLATIONS } from "../constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  currentTab: "dashboard" | "links-list" | "link-detail" | "link-tree" | "collections";
  setCurrentTab: (tab: "dashboard" | "links-list" | "link-detail" | "link-tree" | "collections") => void;
  isLightMode: boolean;
  toggleLightMode: () => void;
  lang: "id" | "en";
  toggleLang: () => void;
  appTheme: keyof typeof APP_THEME_CONFIGS;
  setAppTheme: (theme: keyof typeof APP_THEME_CONFIGS) => void;
  setQrFgColor: (color: string) => void;
  user: any;
  handleLogout: () => void;
  setListCurrentPage: (page: number) => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  isLightMode,
  toggleLightMode,
  lang,
  toggleLang,
  appTheme,
  setAppTheme,
  setQrFgColor,
  user,
  handleLogout,
  setListCurrentPage,
}: SidebarProps) {
  const curT = APP_THEME_CONFIGS[appTheme];
  const t = (key: keyof typeof TRANSLATIONS.id) => {
    return TRANSLATIONS[lang]?.[key] || key;
  };

  const sidebarBg = isLightMode
    ? `bg-white border-r ${curT.sidebarBorder} text-zinc-800`
    : "bg-zinc-900/50 border-r border-zinc-800 text-zinc-100";
  const hoverBg = isLightMode ? `${curT.hoverBgClassLight}` : "hover:bg-zinc-800/40";
  const tabActiveBg = isLightMode
    ? `${curT.bg} text-white font-extrabold shadow ${curT.shadowAccent}`
    : `${curT.bgLight} ${curT.text}`;
  const borderClassic = isLightMode ? `${curT.borderClassicLight}` : "border-zinc-800";
  const textMuted = isLightMode ? "text-zinc-500" : "text-zinc-400";

  return (
    <aside className={cn("fixed left-0 top-0 h-full w-64 hidden md:flex flex-col p-6 space-y-6 transition-colors duration-200 z-35", sidebarBg)}>
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", curT.bg)}>
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
              : cn(isLightMode ? "text-zinc-500 hover:text-zinc-950" : "text-zinc-400 hover:text-zinc-200", hoverBg)
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
              : cn(isLightMode ? "text-zinc-500 hover:text-zinc-955" : "text-zinc-400 hover:text-zinc-200", hoverBg)
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
              : cn(isLightMode ? "text-zinc-500 hover:text-zinc-955" : "text-zinc-400 hover:text-zinc-200", hoverBg)
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
              : cn(isLightMode ? "text-zinc-500 hover:text-zinc-955" : "text-zinc-400 hover:text-zinc-200", hoverBg)
          )}
        >
          <Folder className="w-5 h-5" />
          {lang === "id" ? "Grup Tautan" : "Folders"}
        </button>
      </nav>

      {/* Control Theme Row and Language Toggle */}
      <div className={cn("pt-4 border-t space-y-4", borderClassic)}>
        <div className="flex items-center justify-between">
          <button
            onClick={toggleLightMode}
            className={cn(
              "p-2 rounded-xl border transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95",
              isLightMode 
                ? "bg-white border-zinc-200 text-brand-600 shadow-brand-550/5 hover:bg-zinc-50" 
                : "bg-zinc-900 border-zinc-805 border-zinc-800 text-brand-400 hover:bg-zinc-850"
            )}
            style={isLightMode ? {} : { backgroundColor: "#17171c" }}
          >
            {isLightMode ? <Sun className="w-4 h-4 animate-pulse" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleLang}
            className={cn(
              "px-3 py-1.5 rounded-xl border text-[10px] font-black tracking-widest uppercase transition-all cursor-pointer hover:scale-105 shadow-sm",
              isLightMode 
                ? "bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-50" 
                : "bg-zinc-900 border-zinc-805 border-zinc-800 text-zinc-300 hover:bg-zinc-850"
            )}
            style={isLightMode ? {} : { backgroundColor: "#17171c" }}
          >
            {lang}
          </button>
        </div>
        {/* Theme customizer color options */}
        <div className="flex flex-col gap-1.5 pt-1">
          <span className={cn("text-[11px] font-bold uppercase tracking-wider", textMuted)}>
            {lang === "id" ? "Warna Tema" : "Theme Color"}
          </span>
          <div className="flex items-center gap-2">
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
                    "w-5 h-5 rounded-full cursor-pointer transition-all border-2",
                    isActive 
                      ? (isLightMode ? "border-zinc-[805] border-zinc-800 scale-110 shadow-sm" : "border-white scale-110 shadow-sm")
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
  );
}
