import React from "react";
import { 
  Sparkles, Plus, Trash2, Link2, MousePointer2, Clock, QrCode, 
  Activity, Globe, Laptop, Smartphone, Tablet, Shield, Compass, 
  Search, ArrowUpDown, CheckSquare, Square, Eye, EyeOff, Edit2, 
  ExternalLink, Check, Copy, User as UserIcon, Layers, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from "recharts";
import { format } from "date-fns";
import { APP_THEME_CONFIGS, THEME_STYLES, CATEGORY_OPTIONS, TRANSLATIONS } from "../constants";
import { LinkData, ClickEvent } from "../types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DashboardPageProps {
  lang: "id" | "en";
  links: LinkData[];
  sortedLinks: LinkData[];
  recentClicks: any[];
  analyticsTab: string;
  setAnalyticsTab: (tab: string) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterStatus: "all" | "active" | "expired";
  setFilterStatus: (status: "all" | "active" | "expired") => void;
  selectedLinkIds: string[];
  toggleSelectAll: () => void;
  allFilteredSelected: boolean;
  requestSort: (key: string) => void;
  toggleSelectLink: (id: string) => void;
  handleCopy: (shortSlug: string, id: string) => void;
  copiedId: string | null;
  setQrFgColor: (color: string) => void;
  setQrBgColor: (color: string) => void;
  setQrLink: (link: LinkData) => void;
  setEditingLink: (link: LinkData | null) => void;
  setIsModalOpen: (open: boolean) => void;
  handleDelete: (id: string) => void;
  handleBulkDelete: () => void;
  getChartData: () => any[];
  getAnalyticsData: () => {
    countries: { name: string; count: number }[];
    regions: { name: string; count: number }[];
    ips: { ip: string; country: string; count: number }[];
    devices: { name: string; count: number }[];
    oss: { name: string; count: number }[];
    browsers: { name: string; count: number }[];
    referrers: { name: string; count: number }[];
  };
  allClicks: ClickEvent[];
  isLightMode: boolean;
  appTheme: keyof typeof APP_THEME_CONFIGS;
}

export default function DashboardPage({
  lang,
  links,
  sortedLinks,
  recentClicks,
  analyticsTab,
  setAnalyticsTab,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  selectedLinkIds,
  toggleSelectAll,
  allFilteredSelected,
  requestSort,
  toggleSelectLink,
  handleCopy,
  copiedId,
  setQrFgColor,
  setQrBgColor,
  setQrLink,
  setEditingLink,
  setIsModalOpen,
  handleDelete,
  handleBulkDelete,
  getChartData,
  getAnalyticsData,
  allClicks,
  isLightMode,
  appTheme,
}: DashboardPageProps) {
  const curT = APP_THEME_CONFIGS[appTheme];
  const t = (key: keyof typeof TRANSLATIONS.id) => {
    return TRANSLATIONS[lang]?.[key] || key;
  };

  const cardBg = isLightMode ? "bg-white border border-zinc-250 text-zinc-900 shadow-sm" : "bg-zinc-900/40 border border-zinc-800 text-white";
  const textTitle = isLightMode ? "text-zinc-950 font-black" : "text-white font-extrabold";
  const textMuted = isLightMode ? "text-zinc-500 font-medium" : "text-zinc-400";
  const inputBg = isLightMode ? "bg-zinc-100 border border-zinc-200 text-zinc-900 focus:bg-white" : "bg-zinc-950 border border-zinc-850 text-white focus:bg-black";
  const borderClassic = isLightMode ? `${curT.borderClassicLight}` : "border-zinc-800";
  const trHoverBg = isLightMode ? "hover:bg-zinc-50" : "hover:bg-zinc-800/20";
  const tableHeaderBg = isLightMode ? "bg-zinc-100/50" : "bg-zinc-950/20";
  const tableBorder = isLightMode ? "border-zinc-200" : "border-zinc-800/50";
  const sectionBg = isLightMode ? "bg-zinc-50 border-zinc-200" : "bg-zinc-950/40 border-zinc-800/40";

  return (
    <div className="space-y-8 text-left">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1 flex items-center gap-2">
            Dashboard <Sparkles className="w-5 h-5 text-brand-500" />
          </h1>
          <p className="text-zinc-505 text-zinc-500">{lang === 'id' ? 'Kelola dan lacak link pendek Anda.' : 'Manage and track your shortened links.'}</p>
        </div>
        <div className="flex gap-4">
          {selectedLinkIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 px-6 py-3 rounded-xl transition-all flex items-center gap-2 font-bold cursor-pointer"
            >
              <Trash2 className="w-5 h-5" />
              {t("bulkDelete")} ({selectedLinkIds.length})
            </button>
          )}
          <button 
            onClick={() => { setEditingLink(null); setIsModalOpen(true); }}
            className={cn("text-black font-extrabold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer", curT.bg, curT.hoverBg, curT.shadowAccent)}
          >
            <Plus className="w-5 h-5" />
            {t("createLink")}
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={cn("p-6 rounded-3xl relative overflow-hidden", cardBg)}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center animate-pulse">
              <Link2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t("totalLinks")}</span>
          </div>
          <p className="text-3xl font-extrabold">{links.length}</p>
        </div>
        <div className={cn("p-6 rounded-3xl", cardBg)}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center">
              <MousePointer2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t("totalClicks")}</span>
          </div>
          <p className="text-3xl font-extrabold">{links.reduce((acc, curr) => acc + (curr.clickCount || 0), 0)}</p>
        </div>
        <div className={cn("p-6 rounded-3xl", cardBg)}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t("activeLinks")}</span>
          </div>
          <p className="text-3xl font-extrabold">{links.filter(l => !l.expiresAt || new Date(l.expiresAt) > new Date()).length}</p>
        </div>
        <div className={cn("p-6 rounded-3xl", cardBg)}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-brand-500/10 text-brand-500 rounded-xl flex items-center justify-center">
              <QrCode className="w-5 h-5 text-brand-500" />
            </div>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{lang === "id" ? "Scan Rate QR" : "QR Scan Rate"}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-extrabold text-brand-500">{links.reduce((acc, curr) => acc + (curr.qrScanCount || 0), 0)}</p>
            <span className="text-sm font-semibold text-zinc-500 font-mono">
              ({links.reduce((acc, curr) => acc + (curr.clickCount || 0), 0) > 0 
                ? ((links.reduce((acc, curr) => acc + (curr.qrScanCount || 0), 0) / links.reduce((acc, curr) => acc + (curr.clickCount || 0), 0)) * 100).toFixed(1) 
                : "0.0"}%)
            </span>
          </div>
        </div>
      </div>

      {/* Click Trends & Analytical Diagnostics Dashboard */}
      <div className={cn("p-6 rounded-3xl space-y-6", cardBg)}>
        <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5", borderClassic)}>
          <div>
            <h3 className={cn("text-lg font-bold flex items-center gap-2", textTitle)}>
              <Activity className="w-5 h-5 text-brand-500 animate-pulse" />
              {t("panelAuditTrafik")}
            </h3>
            <p className="text-xs text-zinc-505 text-zinc-500">{t("auditSubtitle")}</p>
          </div>
          
          {/* Multi-Tab Selector */}
          <div className={cn("flex p-1 rounded-xl self-start md:self-auto", isLightMode ? "bg-zinc-200/80 border border-zinc-300" : "bg-zinc-950 border border-zinc-805")}>
            <button
              onClick={() => setAnalyticsTab('trends')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                analyticsTab === 'trends' 
                  ? `${curT.bg} text-black shadow-lg shadow-brand-500/10` 
                  : isLightMode 
                    ? "text-zinc-600 hover:text-zinc-900" 
                    : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Activity className="w-3.5 h-3.5" />
              {t("subTabTrends")}
            </button>
            <button
              onClick={() => setAnalyticsTab('geo')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                analyticsTab === 'geo' 
                  ? `${curT.bg} text-black shadow-lg shadow-brand-500/10` 
                  : isLightMode 
                    ? "text-zinc-650 hover:text-zinc-900" 
                    : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Globe className="w-3.5 h-3.5" />
              {t("subTabGeo")}
            </button>
            <button
              onClick={() => setAnalyticsTab('devices')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                analyticsTab === 'devices' 
                  ? `${curT.bg} text-black shadow-lg shadow-brand-500/10` 
                  : isLightMode 
                    ? "text-zinc-650 hover:text-zinc-900" 
                    : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Laptop className="w-3.5 h-3.5" />
              {t("subTabDevices")}
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {analyticsTab === 'trends' && (
            <motion.div
              key="trends"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="h-72 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getChartData()} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isLightMode ? "#e4e4e7" : "#27272a"} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#71717a" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#71717a" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isLightMode ? '#ffffff' : '#18181b', 
                      borderColor: isLightMode ? '#e4e4e7' : '#27272a',
                      borderRadius: '12px',
                      color: isLightMode ? '#09090b' : '#f4f4f5',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    itemStyle={{ color: curT.qrFg }}
                    labelStyle={{ fontWeight: 'bold', color: isLightMode ? '#71717a' : '#a1a1aa' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Clicks" 
                    stroke={curT.qrFg} 
                    strokeWidth={3} 
                    dot={{ r: 4, stroke: curT.qrFg, strokeWidth: 2, fill: isLightMode ? '#ffffff' : '#0a0a0a' }}
                    activeDot={{ r: 6, stroke: curT.qrFg, strokeWidth: 2, fill: curT.qrFg }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {analyticsTab === 'geo' && (
            <motion.div
              key="geo"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm"
            >
              {/* Geolocation Region Stats */}
              <div className="space-y-4">
                <div className={cn("flex items-center gap-2 border-b pb-2", borderClassic)}>
                  <Globe className="w-4 h-4 text-brand-500" />
                  <h4 className={cn("font-bold", textTitle)}>{t("clicksByCountry")}</h4>
                </div>
                <div className="space-y-3 font-medium">
                  {/* Top Regions */}
                  <div>
                    <h5 className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-2">{t("topRegions")}</h5>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {(() => {
                         const data = getAnalyticsData();
                         const total = allClicks.length || 1;
                         if (data.regions.length === 0) {
                           return <p className="text-xs text-zinc-500 italic">Belum ada data regional.</p>;
                         }
                         return data.regions.slice(0, 5).map((reg) => {
                           const percent = Math.round((reg.count / total) * 100);
                           return (
                             <div key={reg.name} className="space-y-1">
                               <div className="flex justify-between text-xs font-semibold">
                                 <span className={cn("truncate", isLightMode ? "text-zinc-800" : "text-zinc-300")}>{reg.name}</span>
                                 <span className={cn(textMuted)}>{reg.count} {t("clicks")} ({percent}%)</span>
                               </div>
                               <div className={cn("w-full h-1.5 rounded-full overflow-hidden", isLightMode ? "bg-zinc-200" : "bg-zinc-950")}>
                                 <div className="bg-brand-500 h-full rounded-full" style={{ width: `${percent}%` }}></div>
                               </div>
                             </div>
                           );
                         });
                      })()}
                    </div>
                  </div>

                  {/* Top Countries */}
                  <div className="pt-2">
                    <h5 className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-2">{t("topCountries")}</h5>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                         const data = getAnalyticsData();
                         if (data.countries.length === 0) {
                           return <span className="text-xs text-zinc-500 italic">Belum ada data negara.</span>;
                         }
                         return data.countries.slice(0, 6).map((country) => (
                           <span key={country.name} className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border", isLightMode ? "bg-zinc-100 border-zinc-250 text-zinc-800" : "bg-zinc-950 border border-zinc-805 text-zinc-300")}>
                             <span className="w-2 h-2 rounded-full bg-brand-500" />
                             {country.name} ({country.count})
                           </span>
                         ));
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Visitor IP Addresses list */}
              <div className="space-y-4">
                <div className={cn("flex items-center gap-2 border-b pb-2", borderClassic)}>
                  <UserIcon className="w-4 h-4 text-brand-500" />
                  <h4 className={cn("font-bold", textTitle)}>{t("visitorIpAudit")}</h4>
                </div>
                <div className={cn("rounded-2xl border overflow-hidden", sectionBg)}>
                  <div className="max-h-64 overflow-y-auto pr-1">
                    <table className="w-full text-left text-xs text-zinc-400 border-collapse">
                      <thead>
                        <tr className={cn("text-[10px] font-bold uppercase tracking-wider border-b", tableHeaderBg, tableBorder)}>
                          <th className="px-4 py-2.5">{t("ipAddress")}</th>
                          <th className="px-4 py-2.5">{t("country")}</th>
                          <th className="px-4 py-2.5 text-right">{t("interaction")}</th>
                        </tr>
                      </thead>
                      <tbody className={cn("divide-y", tableBorder)}>
                        {(() => {
                          const data = getAnalyticsData();
                          if (data.ips.length === 0) {
                             return (
                               <tr>
                                 <td colSpan={3} className="px-4 py-6 text-center text-zinc-500 italic">{t("noIpLogs")}</td>
                               </tr>
                             );
                          }
                          return data.ips.slice(0, 5).map((item) => (
                            <tr key={item.ip} className={cn(trHoverBg)}>
                              <td className={cn("px-4 py-3 font-mono", isLightMode ? "text-zinc-855" : "text-zinc-300")}>{item.ip}</td>
                              <td className={cn("px-4 py-3 font-medium", textMuted)}>{item.country}</td>
                              <td className="px-4 py-3 text-right font-bold text-brand-500">{item.count} {t("clicks")}</td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {analyticsTab === 'devices' && (
            <motion.div
              key="devices"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm"
            >
              {/* Left side: Device types */}
              <div className={cn("p-4 rounded-2xl space-y-4", sectionBg)}>
                <div className={cn("flex items-center gap-2 border-b pb-2", borderClassic)}>
                  <Smartphone className="w-4 h-4 text-brand-500" />
                  <h4 className={cn("font-bold", textTitle)}>{t("subTabDevices")}</h4>
                </div>
                <div className="space-y-3 font-medium">
                  {(() => {
                    const data = getAnalyticsData();
                    const total = allClicks.length || 1;
                    if (data.devices.length === 0) {
                      return <p className="text-xs text-zinc-500 italic font-medium">Belum ada data perangkat.</p>;
                    }
                    return data.devices.map((item) => {
                      const percent = Math.round((item.count / total) * 100);
                      const isMobile = item.name === "Mobile";
                      const isTablet = item.name === "Tablet";
                      
                      return (
                        <div key={item.name} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center border", isLightMode ? "bg-zinc-100 border-zinc-250 text-zinc-650" : "bg-zinc-950 border-zinc-855 text-zinc-400")}>
                              {isMobile ? <Smartphone className="w-3.5 h-3.5" /> : isTablet ? <Tablet className="w-3.5 h-3.5" /> : <Laptop className="w-3.5 h-3.5" />}
                            </div>
                            <div className="text-left">
                              <p className={cn("text-xs font-semibold", isLightMode ? "text-zinc-800" : "text-zinc-300")}>{item.name}</p>
                              <p className="text-[10px] text-zinc-500">{percent}% {t("ofTotalClicks")}</p>
                            </div>
                          </div>
                          <span className={cn("font-mono text-xs font-bold", isLightMode ? "text-zinc-800" : "text-zinc-200")}>{item.count} {t("clicks")}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Middle side: Operating Systems */}
              <div className={cn("p-4 rounded-2xl space-y-4", sectionBg)}>
                <div className={cn("flex items-center gap-2 border-b pb-2", borderClassic)}>
                  <Shield className="w-4 h-4 text-brand-500" />
                  <h4 className={cn("font-bold", textTitle)}>{t("operatingSystems")}</h4>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(() => {
                    const data = getAnalyticsData();
                    const total = allClicks.length || 1;
                    if (data.oss.length === 0) {
                      return <p className="text-xs text-zinc-500 italic">Belum ada data OS.</p>;
                    }
                    return data.oss.map((os) => {
                      const percent = Math.round((os.count / total) * 100);
                      return (
                        <div key={os.name} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className={cn("font-medium", textMuted)}>{os.name}</span>
                            <span className={cn(isLightMode ? "text-zinc-800" : "text-zinc-350")}>{os.count} ({percent}%)</span>
                          </div>
                          <div className={cn("w-full h-1 rounded-full overflow-hidden", isLightMode ? "bg-zinc-200" : "bg-zinc-950")}>
                            <div className="bg-brand-505 bg-brand-500 h-full" style={{ width: `${percent}%` }}></div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Right side: Referrers & Browsers */}
              <div className={cn("p-4 rounded-2xl space-y-4", sectionBg)}>
                <div className={cn("flex items-center gap-2 border-b pb-2", borderClassic)}>
                  <Compass className="w-4 h-4 text-brand-500" />
                  <h4 className={cn("font-bold", textTitle)}>{t("browsersAndReferrers")}</h4>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Browsers</p>
                    <div className="flex flex-wrap gap-1">
                      {(() => {
                        const data = getAnalyticsData();
                        if (data.browsers.length === 0) {
                          return <span className="text-zinc-650 italic text-[11px]">Tidak ada browser terdeteksi.</span>;
                        }
                        return data.browsers.map((b) => (
                          <span key={b.name} className={cn("px-2 py-0.5 rounded text-[11px] font-bold border", isLightMode ? "bg-zinc-100 border-zinc-200 text-zinc-850" : "bg-zinc-950 border border-zinc-855 text-zinc-300")}>
                            {b.name}: {b.count}
                          </span>
                        ));
                      })()}
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-zinc-800/40">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1.5">{t("topReferrers")}</p>
                    <div className="space-y-1">
                      {(() => {
                        const data = getAnalyticsData();
                        if (data.referrers.length === 0) {
                          return <p className="text-zinc-500 italic">{t("noReferrals")}</p>;
                        }
                        return data.referrers.slice(0, 3).map((ref) => (
                          <div key={ref.name} className={cn("flex justify-between items-center font-semibold text-xs", isLightMode ? "text-zinc-800" : "text-zinc-300")}>
                            <span className="truncate max-w-[120px] text-left" title={ref.name}>{ref.name}</span>
                            <span className="font-extrabold text-brand-500 font-mono text-xs shrink-0">{ref.count} {t("clicks")}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Layout Grid (Main Table Left, Sidebar Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Main Table Panel */}
        <div className={cn("lg:col-span-3 rounded-3xl overflow-hidden self-start", cardBg)}>
          <div className={cn("p-6 border-b flex flex-col sm:flex-row gap-4 justify-between items-center", borderClassic, isLightMode ? "bg-zinc-100/50" : "bg-zinc-950/20")}>
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input 
                type="text" 
                placeholder={t("searchHint")} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn("w-full rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all font-medium text-sm shadow-inner", inputBg)}
              />
            </div>
            <div className={cn("flex rounded-xl p-1 gap-1 border", isLightMode ? "bg-zinc-200 border-zinc-300" : "bg-zinc-950 border border-zinc-805")}>
              {(['all', 'active', 'expired'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all select-none cursor-pointer",
                    filterStatus === status 
                      ? (isLightMode ? "bg-white text-zinc-900 shadow font-extrabold" : "bg-zinc-800 text-white shadow font-extrabold") 
                      : (isLightMode ? "text-zinc-600 hover:text-zinc-900" : "text-zinc-500 hover:text-zinc-300")
                  )}
                >
                  {status === 'all' ? t("all") : status === 'active' ? t("active") : t("expired")}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={cn("text-xs font-semibold uppercase tracking-wider select-none border-b", tableHeaderBg, tableBorder)}>
                  <th className="px-6 py-4 w-12 text-center">
                    <button 
                      onClick={toggleSelectAll}
                      className={cn("transition-colors cursor-pointer", isLightMode ? "text-zinc-505 text-zinc-500" : "text-zinc-400 hover:text-white")}
                      title={allFilteredSelected ? "Deselect All" : "Select All"}
                    >
                      {allFilteredSelected ? <CheckSquare className="w-5 h-5 text-brand-505 text-brand-500" /> : <Square className="w-5 h-5" />}
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
                {sortedLinks.map((link) => {
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
                          <p className="text-xs text-zinc-400 truncate font-mono font-medium">{link.originalUrl}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <div className="flex items-center gap-2">
                          <code className="text-brand-500 bg-brand-500/10 px-2 py-1 rounded text-xs font-bold font-mono">/{link.shortSlug}</code>
                          <button 
                            onClick={() => handleCopy(link.shortSlug, link.id)}
                            className={cn("transition-colors cursor-pointer", isLightMode ? "text-zinc-450 hover:text-zinc-800" : "text-zinc-400 hover:text-white")}
                            title="Salin Link"
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
                          {/* Status Icon Indicator */}
                          {isExpired ? (
                            <span className="p-1.5 rounded-xl bg-rose-500/10 text-rose-500 transition-all font-semibold" title={lang === "id" ? "Expired / Kedaluwarsa" : "Expired"}>
                              <Clock className="w-4 h-4" />
                            </span>
                          ) : link.isEnabled === false ? (
                            <span className={cn("p-1.5 rounded-xl transition-all font-semibold border", isLightMode ? "bg-zinc-100 text-zinc-500 border-zinc-200" : "bg-zinc-700/20 text-zinc-400 border-zinc-700/30")} title={lang === "id" ? "Nonaktif / Disabled" : "Inactive"}>
                              <EyeOff className="w-4 h-4" />
                            </span>
                          ) : (
                            <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 transition-all font-semibold" title={lang === "id" ? "Aktif / Active" : "Active"}>
                              <Eye className="w-4 h-4 animate-pulse" />
                            </span>
                          )}

                          {/* Password Protective Icon Indicator */}
                          {link.password ? (
                            <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-500 transition-all font-semibold" title={lang === "id" ? "Terproteksi Kata Sandi" : "Password Protected"}>
                              <Lock className="w-4 h-4" />
                            </span>
                          ) : null}

                          {/* Landing Information Portal Icon Indicator */}
                          {link.landingEnabled ? (
                            <span className="p-1.5 rounded-xl bg-blue-500/10 text-blue-650 text-blue-555 transition-all font-semibold" title={lang === "id" ? "Landing Portal Portal" : "Landing Portal Active"}>
                              <Layers className="w-4 h-4" />
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => { setQrFgColor(curT.qrFg); setQrBgColor("#ffffff"); setQrLink(link); }}
                            className={cn("p-2 rounded-xl transition-all cursor-pointer", isLightMode ? "text-zinc-650 hover:text-brand-500 hover:bg-brand-50" : "text-zinc-400 hover:text-white hover:bg-zinc-800")}
                            title="Custom QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => { setEditingLink(link); setIsModalOpen(true); }}
                            className={cn("p-2 rounded-xl transition-all cursor-pointer", isLightMode ? "text-zinc-650 hover:text-brand-500 hover:bg-brand-50" : "text-zinc-400 hover:text-white hover:bg-zinc-800")}
                            title="Ubah"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => window.open(shortUrl, '_blank')}
                            className={cn("p-2 rounded-xl transition-all cursor-pointer", isLightMode ? "text-zinc-650 hover:text-blue-605 hover:bg-blue-50" : "text-zinc-400 hover:text-white hover:bg-zinc-800")}
                            title="Buka Link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(link.id)}
                            className={cn("p-2 rounded-xl transition-all cursor-pointer", isLightMode ? "text-zinc-650 hover:text-red-650 hover:bg-red-50" : "text-zinc-400 hover:text-red-400 hover:bg-red-400/10")}
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {sortedLinks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-zinc-500 font-medium font-sans">
                      {lang === "id" ? "Tidak ada tautan terdaftar pada kriteria ini." : "No links registered on these criteria."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Grid View representing the list of links (Dashboard) */}
          <div className="block md:hidden divide-y divide-zinc-850">
            {sortedLinks.map((link) => {
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
                        {isSelected ? <CheckSquare className="w-5 h-5 text-brand-500" /> : <Square className="w-5 h-5" />}
                      </button>
                      <div className="min-w-0 text-left">
                        <p className={cn("font-bold text-sm truncate", textTitle)}>{link.title || link.shortSlug}</p>
                        <p className="text-[11px] text-zinc-500 truncate font-mono">{link.originalUrl}</p>
                      </div>
                    </div>
                    <div>
                      {isExpired ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/10">
                          Expired
                        </span>
                      ) : link.isEnabled === false ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-700/20 text-zinc-400 border border-zinc-700/30">
                          Off
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 animate-pulse">
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-950 p-3 rounded-2xl border border-zinc-800/80">
                    <div className="flex items-center gap-2">
                      <code className="text-brand-500 bg-brand-500/10 px-2.5 py-1 rounded-xl text-xs font-bold font-mono">/{link.shortSlug}</code>
                      <button 
                        type="button"
                        onClick={() => handleCopy(link.shortSlug, link.id)}
                        className="text-zinc-500 hover:text-white transition-colors p-1 cursor-pointer"
                        title="Salin Link"
                      >
                        {copiedId === link.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="text-xs font-semibold text-zinc-405 text-zinc-400 select-none">
                      Kunjungan: <span className="text-brand-500 font-mono font-black">{link.clickCount || 0}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 select-none">
                    <div className="flex gap-1.5">
                      {link.password && (
                        <span className="inline-flex items-center gap-1 text-[9px] bg-red-500/10 text-red-500 py-0.5 px-2.5 rounded-full font-bold uppercase tracking-wider">
                          <Lock className="w-2.5 h-2.5" /> Sandi
                        </span>
                      )}
                      {link.landingEnabled && (
                        <span className="inline-flex items-center gap-1 text-[9px] bg-blue-500/10 text-blue-500 py-0.5 px-2.5 rounded-full font-bold uppercase tracking-wider">
                          <Layers className="w-2.5 h-2.5" /> Portal
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button 
                        type="button"
                        onClick={() => { setQrFgColor(curT.qrFg); setQrBgColor("#ffffff"); setQrLink(link); }}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
                        title="Custom QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setEditingLink(link); setIsModalOpen(true); }}
                        className="p-2 text-brand-400 hover:text-white hover:bg-brand-500/10 rounded-xl transition-all font-bold cursor-pointer"
                        title="Ubah & Analisis"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        type="button"
                        onClick={() => window.open(shortUrl, '_blank')}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
                        title="Buka Link asli"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDelete(link.id)}
                        className="p-2 text-zinc-450 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {sortedLinks.length === 0 && (
              <div className="px-6 py-16 text-center text-zinc-500 text-xs font-semibold">
                Tidak ada tautan terdaftar pada kriteria ini.
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className={cn("p-6 rounded-3xl", cardBg)}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-brand-500/10 text-brand-500 rounded-lg flex items-center justify-center animate-pulse">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className={cn("font-bold", textTitle)}>{lang === "id" ? "Aktivitas Terkini" : "Recent Activity"}</h3>
            </div>
            
            <div className="space-y-4 text-left">
              {recentClicks.map((click) => {
                const clickTime = new Date(click.timestamp);
                return (
                  <div key={click.id} className="flex gap-3 text-sm py-1 border-b border-zinc-800/40 last:border-b-0 pb-3 last:pb-0">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-bold truncate text-sm", isLightMode ? "text-zinc-800" : "text-zinc-300")}>{click.title}</p>
                      <p className="text-xs text-brand-500 font-mono font-bold">/{click.shortSlug}</p>
                      <span className="text-[10px] text-zinc-500 font-medium">{format(clickTime, "HH:mm:ss - d MMM")}</span>
                    </div>
                  </div>
                );
              })}
              {recentClicks.length === 0 && (
                <p className="text-xs text-zinc-500 text-center py-6 italic">Belum ada aktivitas klik.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
