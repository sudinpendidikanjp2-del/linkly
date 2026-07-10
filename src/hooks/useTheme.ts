import React, { useState } from "react";
import { APP_THEME_CONFIGS, THEME_PALETTES } from "../constants";

export function useTheme() {
  const [isLightMode, setIsLightMode] = useState<boolean>(() => localStorage.getItem("linkly-light-mode") === "true");
  const [appTheme, setAppTheme] = useState<keyof typeof APP_THEME_CONFIGS>(() => {
    const saved = localStorage.getItem("linkly-app-theme");
    return (saved && saved in APP_THEME_CONFIGS) ? (saved as keyof typeof APP_THEME_CONFIGS) : "orange";
  });

  const curT = APP_THEME_CONFIGS[appTheme];

  const themeInlineVars = {
    "--theme-50": THEME_PALETTES[appTheme]["theme-50"],
    "--theme-100": THEME_PALETTES[appTheme]["theme-100"],
    "--theme-200": THEME_PALETTES[appTheme]["theme-200"],
    "--theme-400": THEME_PALETTES[appTheme]["theme-400"],
    "--theme-500": THEME_PALETTES[appTheme]["theme-500"],
    "--theme-600": THEME_PALETTES[appTheme]["theme-600"],
    "--theme-700": THEME_PALETTES[appTheme]["theme-700"],
  } as React.CSSProperties;

  const toggleLightMode = () => {
    setIsLightMode(prev => {
      const next = !prev;
      localStorage.setItem("linkly-light-mode", String(next));
      return next;
    });
  };

  const changeAppTheme = (theme: keyof typeof APP_THEME_CONFIGS) => {
    setAppTheme(theme);
    localStorage.setItem("linkly-app-theme", theme);
  };

  const dashboardBg = isLightMode ? "bg-white text-zinc-950" : "bg-[#0a0a0a] text-zinc-100";
  const sidebarBg = isLightMode ? `bg-white border-r ${curT.sidebarBorder} text-zinc-800` : "bg-zinc-900/50 border-r border-zinc-800 text-zinc-100";
  const cardBg = isLightMode ? `bg-white border ${curT.cardBgBorderLight} shadow-sm text-zinc-900` : "bg-zinc-900/60 border border-zinc-800 text-zinc-100";
  const inputBg = isLightMode ? `bg-zinc-50 border ${curT.cardBgBorderLight} text-zinc-900 focus:bg-white focus:ring-1 ${curT.inputBgFocusRing}` : `bg-zinc-950 border border-zinc-850 text-zinc-300 focus:bg-zinc-905 focus:text-white focus:ring-1 focus:ring-${appTheme}-500/40`;
  const textMuted = isLightMode ? "text-zinc-500" : "text-zinc-400";
  const textMutedLight = isLightMode ? "text-zinc-400" : "text-zinc-500";
  const textTitle = isLightMode ? "text-zinc-950" : "text-zinc-100";
  const sectionBg = isLightMode ? `${curT.sectionBgBorderLight}` : "bg-zinc-950/40 border border-zinc-850";
  const tableBorder = isLightMode ? `${curT.tableBorderLight}` : "border-zinc-800";
  const tableHeaderBg = isLightMode ? `${curT.tableHeaderBgLight} text-zinc-600` : "bg-zinc-950/50 text-zinc-400";
  const borderClassic = isLightMode ? `${curT.borderClassicLight}` : "border-zinc-800";
  const hoverBg = isLightMode ? `${curT.hoverBgClassLight}` : "hover:bg-zinc-800/40";
  const tabActiveBg = isLightMode ? `${curT.bg} text-white font-extrabold shadow ${curT.shadowAccent}` : `${curT.bgLight} ${curT.text}`;
  const trHoverBg = isLightMode ? `${curT.trHoverBgLight}` : "hover:bg-zinc-800/20";

  return {
    isLightMode,
    setIsLightMode,
    appTheme,
    setAppTheme,
    changeAppTheme,
    curT,
    themeInlineVars,
    toggleLightMode,
    dashboardBg,
    sidebarBg,
    cardBg,
    inputBg,
    textMuted,
    textMutedLight,
    textTitle,
    sectionBg,
    tableBorder,
    tableHeaderBg,
    borderClassic,
    hoverBg,
    tabActiveBg,
    trHoverBg,
  };
}
