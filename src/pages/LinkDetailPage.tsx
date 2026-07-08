import React from "react";
import { 
  ArrowLeft, Globe, Lock, Unlock, Eye, EyeOff, Layers, CheckSquare, 
  QrCode, MousePointer2, Clock, User as UserIcon, Compass, Shield, Laptop
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from "recharts";
import { APP_THEME_CONFIGS, CATEGORY_OPTIONS, TRANSLATIONS } from "../constants";
import { LinkData } from "../types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LinkDetailPageProps {
  lang: "id" | "en";
  links: LinkData[];
  selectedDetailLinkId: string | null;
  setSelectedDetailLinkId: (id: string | null) => void;
  setCurrentTab: (tab: string) => void;
  handleSaveDetailLink: (e: React.FormEvent<HTMLFormElement>) => void;
  detailEditTitle: string;
  setDetailEditTitle: (v: string) => void;
  detailEditUrl: string;
  setDetailEditUrl: (v: string) => void;
  detailEditSlug: string;
  setDetailEditSlug: (v: string) => void;
  detailEditExpiry: string;
  setDetailEditExpiry: (v: string) => void;
  detailEditPassword: string;
  setDetailEditPassword: (v: string) => void;
  detailCategory: string;
  setDetailCategory: (v: string) => void;
  detailEditEnabled: boolean;
  setDetailEditEnabled: (v: boolean) => void;
  detailEditPortalEnabled: boolean;
  setDetailEditPortalEnabled: (v: boolean) => void;
  detailEditPortalDescription: string;
  setDetailEditPortalDescription: (v: string) => void;
  detailEditPortalAvatar: string;
  setDetailEditPortalAvatar: (v: string) => void;
  detailFormSaved: boolean;
  
  setQrFgColor: (color: string) => void;
  setQrBgColor: (color: string) => void;
  setQrLink: (link: LinkData) => void;
  
  detailAnalyticsTab: "trends" | "geo" | "devices" | "ips";
  setDetailAnalyticsTab: (tab: "trends" | "geo" | "devices" | "ips") => void;
  detailIpSearch: string;
  setDetailIpSearch: (v: string) => void;
  
  getSpecificAnalytics: (shortSlug: string) => {
    clicksCount: number;
    countries: { name: string; count: number }[];
    regions: { name: string; count: number }[];
    ips: { ip: string; country: string; count: number; lastSeen?: string }[];
    devices: { name: string; count: number }[];
    oss: { name: string; count: number }[];
    browsers: { name: string; count: number }[];
    referrers: { name: string; count: number }[];
  };
  getSpecificLinkChartData: (shortSlug: string) => any[];
  isLightMode: boolean;
  appTheme: keyof typeof APP_THEME_CONFIGS;
}

export default function LinkDetailPage({
  lang,
  links,
  selectedDetailLinkId,
  setSelectedDetailLinkId,
  setCurrentTab,
  handleSaveDetailLink,
  detailEditTitle,
  setDetailEditTitle,
  detailEditUrl,
  setDetailEditUrl,
  detailEditSlug,
  setDetailEditSlug,
  detailEditExpiry,
  setDetailEditExpiry,
  detailEditPassword,
  setDetailEditPassword,
  detailCategory,
  setDetailCategory,
  detailEditEnabled,
  setDetailEditEnabled,
  detailEditPortalEnabled,
  setDetailEditPortalEnabled,
  detailEditPortalDescription,
  setDetailEditPortalDescription,
  detailEditPortalAvatar,
  setDetailEditPortalAvatar,
  detailFormSaved,
  setQrFgColor,
  setQrBgColor,
  setQrLink,
  detailAnalyticsTab,
  setDetailAnalyticsTab,
  detailIpSearch,
  setDetailIpSearch,
  getSpecificAnalytics,
  getSpecificLinkChartData,
  isLightMode,
  appTheme,
}: LinkDetailPageProps) {
  const curT = APP_THEME_CONFIGS[appTheme];
  const t = (key: keyof typeof TRANSLATIONS.id) => {
    return TRANSLATIONS[lang]?.[key] || key;
  };

  const activeL = links.find(l => l.id === selectedDetailLinkId);

  const cardBg = isLightMode ? "bg-white border border-zinc-250 text-zinc-900 shadow-sm" : "bg-zinc-900/40 border border-zinc-800 text-white";
  const textTitle = isLightMode ? "text-zinc-950 font-black" : "text-white font-extrabold";
  const textMuted = isLightMode ? "text-zinc-500 font-medium" : "text-zinc-400";
  const inputBg = isLightMode ? "bg-zinc-100 border border-zinc-200 text-zinc-900 focus:bg-white" : "bg-zinc-950 border border-zinc-855 text-white focus:bg-black";
  const borderClassic = isLightMode ? `${curT.borderClassicLight}` : "border-zinc-800";
  const sectionBg = isLightMode ? "bg-zinc-50 border border-zinc-200" : "bg-zinc-950/40 border border-zinc-805";

  if (!activeL) {
    return (
      <div className="space-y-6 text-center py-20 bg-zinc-900/55 border border-zinc-800 rounded-3xl p-8 max-w-xl mx-auto">
        <div className="w-16 h-16 bg-brand-500/10 text-brand-400 rounded-full flex items-center justify-center mx-auto text-2xl font-black">?</div>
        <h2 className="text-xl font-bold text-zinc-200">Tautan Tidak Terspesifikasi</h2>
        <p className="text-sm text-zinc-505 text-zinc-500">Pilih salah satu tautan Anda di bawah ini untuk melihat detail editing kustom & statistik audit penjelajah.</p>
        
        <div className="max-w-xs mx-auto space-y-2 text-left">
          <select
            onChange={(e) => setSelectedDetailLinkId(e.target.value)}
            className="w-full bg-zinc-955 border border-zinc-805 bg-zinc-950 border-zinc-800 rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm text-zinc-300 font-bold cursor-pointer"
          >
            <option value="">-- Pilih Tautan Anda --</option>
            {links.map((link) => (
              <option key={link.id} value={link.id}>{link.title || link.shortSlug}</option>
            ))}
          </select>
          <button 
            onClick={() => setCurrentTab("links-list")}
            className="w-full py-2.5 bg-zinc-850 hover:bg-zinc-700 rounded-xl text-xs font-bold transition-all text-zinc-300 cursor-pointer"
          >
            Kembali ke Daftar Utama
          </button>
        </div>
      </div>
    );
  }

  const stats = getSpecificAnalytics(activeL.shortSlug);
  const shortUrl = `${window.location.origin}/${activeL.shortSlug}`;
  const isExpired = activeL.expiresAt && new Date(activeL.expiresAt) < new Date();

  return (
    <div className="space-y-8 text-left animate-fade-in">
      {/* Header detail */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="space-y-1">
          <button 
            onClick={() => { setSelectedDetailLinkId(null); setCurrentTab("links-list"); }}
            className="flex items-center gap-1.5 text-zinc-500 hover:text-brand-500 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Link
          </button>
          <h1 className={cn("text-2xl md:text-3xl font-black flex items-center gap-2.5", isLightMode ? "text-zinc-900" : "text-white")}>
            Kelola Tautan <code className="text-brand-500 text-lg md:text-xl font-mono">/{activeL.shortSlug}</code>
          </h1>
          <p className="text-sm text-zinc-505 text-zinc-500 truncate max-w-lg" title={activeL.originalUrl}>
            Tujuan Utama: <a href={activeL.originalUrl} target="_blank" rel="noreferrer" className="text-brand-505 text-brand-500 hover:underline">{activeL.originalUrl}</a>
          </p>
        </div>

        {/* Dropdown switch link quickly */}
        <div className={cn("flex items-center gap-2 border p-2 rounded-2xl w-full md:w-auto", isLightMode ? "bg-white border-zinc-200" : "bg-zinc-900 border-zinc-800")}>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold pl-2 hidden lg:inline">Pindah Cepat</span>
          <select
            value={selectedDetailLinkId || ""}
            onChange={(e) => setSelectedDetailLinkId(e.target.value)}
            className={cn("border-0 rounded-xl py-2 px-3 focus:outline-none text-xs font-bold cursor-pointer", isLightMode ? "bg-zinc-50 text-zinc-800" : "bg-zinc-950 text-zinc-300")}
          >
            {links.map((l) => (
              <option key={l.id} value={l.id}>{l.title || l.shortSlug} (/{l.shortSlug})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column Builder - Editing Control Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className={cn("rounded-3xl p-6 md:p-8 space-y-6", cardBg)}>
            <div className={cn("border-b pb-3", borderClassic)}>
              <h2 className={cn("text-lg font-black", textTitle)}>{t("parameterDasar")}</h2>
              <p className="text-xs text-zinc-500">{t("parameterSubtitle")}</p>
            </div>

            <form onSubmit={handleSaveDetailLink} className="space-y-5">
              <div className="space-y-1.5 text-left">
                <label className={cn("text-xs font-bold", textMuted)}>{t("judulPenanda")}</label>
                <input 
                  type="text"
                  value={detailEditTitle}
                  onChange={(e) => setDetailEditTitle(e.target.value)}
                  placeholder={t("judulPenandaPlaceholder")}
                  className={cn("w-full rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs transition-colors", inputBg)}
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className={cn("text-xs font-bold", textMuted)}>{t("tautanTujuanUtama")}</label>
                <input 
                  type="url"
                  required
                  value={detailEditUrl}
                  onChange={(e) => setDetailEditUrl(e.target.value)}
                  placeholder="https://example.com/promosi-campaign"
                  className={cn("w-full rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs font-mono transition-colors", inputBg)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className={cn("text-xs font-bold", textMuted)}>{t("customSlug")}</label>
                  <input 
                    type="text"
                    value={detailEditSlug}
                    onChange={(e) => setDetailEditSlug(e.target.value)}
                    placeholder={t("slugPlaceholder")}
                    className={cn("w-full rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs font-mono font-bold text-brand-500 transition-colors", inputBg)}
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className={cn("text-xs font-bold", textMuted)}>{t("expiryDate")}</label>
                  <input 
                    type="datetime-local"
                    value={detailEditExpiry}
                    onChange={(e) => setDetailEditExpiry(e.target.value)}
                    className={cn("w-full rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs transition-colors", inputBg)}
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <label className={cn("text-xs font-bold", textMuted)}>{t("passwordLabel")}</label>
                  {detailEditPassword ? (
                    <span className="text-[10px] text-red-500 font-extrabold uppercase flex items-center gap-1"><Lock className="w-3 h-3" /> {t("passwordProtected")}</span>
                  ) : (
                    <span className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1"><Unlock className="w-3 h-3" /> {t("passwordFree")}</span>
                  )}
                </div>
                <input 
                  type="text"
                  value={detailEditPassword}
                  onChange={(e) => setDetailEditPassword(e.target.value)}
                  placeholder={t("passwordPlaceholder")}
                  className={cn("w-full rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs transition-colors", inputBg)}
                />
                {detailEditPassword.length > 0 && detailEditPassword.length < 6 && (
                  <p className="text-xs text-rose-500 font-bold flex items-center gap-1.5 animate-pulse mt-1 select-none">
                    <span>⚠️</span> {t("passwordTooWeak")}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 text-left">
                <label className={cn("text-xs font-bold", textMuted)}>{t("categoryLabel")}</label>
                <select
                  value={detailCategory}
                  onChange={(e) => setDetailCategory(e.target.value)}
                  className={cn("w-full rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs transition-colors cursor-pointer", inputBg)}
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {lang === 'id' ? cat.labelIdText : cat.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Aktif / Nonaktif Toggle */}
              <div className={cn("p-4 border rounded-2xl", sectionBg)}>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 text-left">
                    <label className={cn("text-xs font-bold flex items-center gap-1.5 leading-none", textMuted)}>
                      {detailEditEnabled ? (
                        <Eye className="w-4 h-4 text-emerald-505 text-emerald-500 animate-pulse" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-zinc-500" />
                      )}
                      {t("statusTautan")}
                    </label>
                    <p className="text-[10px] text-zinc-500">{t("tautanMutedDesc")}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailEditEnabled(!detailEditEnabled)}
                    className={cn(
                      "w-10 h-5 rounded-full p-0.5 transition-colors relative duration-300 hover:opacity-85 cursor-pointer",
                      detailEditEnabled ? "bg-emerald-550 bg-emerald-500" : "bg-zinc-700"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full bg-black transition-transform duration-300 transform",
                      detailEditEnabled ? "translate-x-5" : "translate-x-0"
                    )} />
                  </button>
                </div>
              </div>

              {/* Portal Info Toggle */}
              <div className={cn("p-4 border rounded-2xl space-y-4", sectionBg)}>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 text-left">
                    <label className={cn("text-xs font-bold flex items-center gap-1.5 leading-none", textMuted)}>{t("aktifkanHalamanPortal")}</label>
                    <p className="text-[10px] text-zinc-500">{t("tautanPortalDesc")}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailEditPortalEnabled(!detailEditPortalEnabled)}
                    className={cn(
                      "w-10 h-5 rounded-full p-0.5 transition-colors relative duration-300 cursor-pointer",
                      detailEditPortalEnabled ? "bg-brand-505 bg-brand-500" : "bg-zinc-700"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full bg-black transition-transform duration-300 transform",
                      detailEditPortalEnabled ? "translate-x-5" : "translate-x-0"
                    )} />
                  </button>
                </div>

                {detailEditPortalEnabled && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-3 pt-2 text-left"
                  >
                    <div className="space-y-1.5">
                      <label className={cn("text-[11px] font-bold", textMuted)}>{t("deskripsiAtributLanding")}</label>
                      <textarea
                        value={detailEditPortalDescription}
                        onChange={(e) => setDetailEditPortalDescription(e.target.value)}
                        placeholder="Tulis deskripsi atau sambutan untuk audiens Anda..."
                        rows={3}
                        className={cn("w-full rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs", inputBg)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-zinc-400">URL Gambar/Avatar Pendukung</label>
                        {detailEditPortalAvatar && (
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-950 p-0.5 border border-zinc-800">
                            <img src={detailEditPortalAvatar} className="w-full h-full object-cover rounded-full" alt="Mini Avatar" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>
                      <input 
                        type="text"
                        value={detailEditPortalAvatar}
                        onChange={(e) => setDetailEditPortalAvatar(e.target.value)}
                        placeholder="https://example.com/gambar-profil.png"
                        className={cn("w-full rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs font-mono", inputBg)}
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className={cn("w-full text-black font-extrabold py-3.5 rounded-xl transition-all shadow-md font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer", curT.bg, curT.hoverBg)}
                >
                  <CheckSquare className="w-4 h-4" />
                  {detailFormSaved ? "✓ Berhasil Disimpan!" : "Simpan Perubahan Tautan"}
                </button>
              </div>
            </form>
          </div>

          {/* QR Quick Share code card inside detail */}
          <div className={cn("p-6 rounded-3xl flex flex-col sm:flex-row gap-4 items-center justify-between", cardBg)}>
            <div className="space-y-1.5 text-center sm:text-left">
              <h4 className="text-sm font-bold text-zinc-400 font-extrabold flex items-center gap-2 justify-center sm:justify-start">
                <QrCode className="w-4 h-4 text-brand-500" /> Unduh QR Code Link
              </h4>
              <p className="text-[11px] text-zinc-550 text-zinc-500">Gunakan QR Code kustom premium untuk selebaran fisik.</p>
            </div>
            <button
              onClick={() => { setQrFgColor(curT.qrFg); setQrBgColor("#ffffff"); setQrLink(activeL); }}
              className="py-2.5 px-4 bg-zinc-950 hover:bg-zinc-850 hover:text-white text-zinc-300 border border-zinc-805 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
            >
              Kustomisasi QR
            </button>
          </div>
        </div>

        {/* Right Column Content - Local Analytics Engine specific to this link! */}
        <div className="lg:col-span-7 space-y-6">
          {/* Tiny stats cards specific to link */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={cn("p-5 rounded-2xl flex items-center justify-between", cardBg)}>
              <div className="text-left">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-extrabold mb-1">Aktivitas Klik</p>
                <h3 className="text-2xl font-black text-brand-500 font-mono">{stats.clicksCount}</h3>
              </div>
              <div className="w-10 h-10 bg-brand-510 bg-brand-500/5 text-brand-500 rounded-xl flex items-center justify-center">
                <MousePointer2 className="w-5 h-5" />
              </div>
            </div>

            <div className={cn("p-5 rounded-2xl flex items-center justify-between", cardBg)}>
              <div className="text-left">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-extrabold mb-1 font-sans">Unik IP Pengunjung</p>
                <h3 className={cn("text-2xl font-black font-mono", isLightMode ? "text-zinc-850" : "text-white")}>{stats.ips.length}</h3>
              </div>
              <div className="w-10 h-10 bg-zinc-950/10 text-zinc-400 rounded-xl flex items-center justify-center border border-zinc-800/10">
                <UserIcon className="w-5 h-5" />
              </div>
            </div>

            <div className={cn("p-5 rounded-2xl flex items-center justify-between", cardBg)}>
              <div className="text-left">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-extrabold mb-1">Status Keaktifan</p>
                {isExpired ? (
                  <span className="text-xs font-bold text-rose-500 uppercase tracking-wider block mt-1">Kedaluwarsa</span>
                ) : (
                  <span className="text-xs font-bold text-green-500 uppercase tracking-wider block mt-1 animate-pulse">Aktif & Aman</span>
                )}
              </div>
              <div className="w-10 h-10 bg-zinc-950/10 text-zinc-400 rounded-xl flex items-center justify-center border border-zinc-800/10">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Integrated Local Tab Analytics box */}
          <div className={cn("p-6 md:p-8 space-y-6 rounded-3xl", cardBg)}>
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b border-zinc-800/60 pb-4">
              <div className="space-y-1 text-left">
                <h3 className={cn("font-extrabold", textTitle)}>Panel Audit Trafik Tautan</h3>
                <p className="text-xs text-zinc-500">Grafik kunjungan dan logging alamat IP penjelajah.</p>
              </div>

              {/* Local Analytics select sub-tab */}
              <div className={cn("flex flex-wrap p-1 rounded-xl gap-0.5 border", isLightMode ? "bg-zinc-200 border-zinc-300" : "bg-zinc-950 border-zinc-805")}>
                {(['trends', 'geo', 'devices', 'ips'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setDetailAnalyticsTab(tab); setDetailIpSearch(""); }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer",
                      detailAnalyticsTab === tab
                        ? `${curT.bg} text-black font-extrabold shadow-sm`
                        : "text-zinc-505 text-zinc-500 hover:text-zinc-350"
                    )}
                  >
                    {tab === 'trends' ? 'Tren' : tab === 'geo' ? 'Geo' : tab === 'devices' ? 'Alat' : 'Audit IP'}
                  </button>
                ))}
              </div>
            </div>

            {/* Display Selected Sub Tab Content */}
            <AnimatePresence mode="wait">
              {detailAnalyticsTab === 'trends' && (
                <motion.div
                  key="trends"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider text-left">Aktivitas Klik 7 Hari Terakhir</h4>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getSpecificLinkChartData(activeL.shortSlug)} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isLightMode ? "#e4e4e7" : "#27272a"} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#71717a" 
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#71717a" 
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: isLightMode ? '#ffffff' : '#18181b', 
                            borderColor: isLightMode ? '#e4e4e7' : '#27272a',
                            borderRadius: '12px',
                            color: isLightMode ? '#000000' : '#f4f4f5',
                            fontSize: '11px'
                          }}
                          itemStyle={{ color: curT.qrFg }}
                          labelStyle={{ fontWeight: 'bold', color: isLightMode ? '#71717a' : '#a1a1aa' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="Clicks" 
                          stroke={curT.qrFg} 
                          strokeWidth={3} 
                          activeDot={{ r: 6 }} 
                          dot={{ r: 3, fill: curT.qrFg }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}

              {detailAnalyticsTab === 'geo' && (
                <motion.div
                  key="geo"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left"
                >
                  {/* Negara */}
                  <div className={cn("p-4 rounded-2xl space-y-3", sectionBg)}>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Negara Asal Pengakses</p>
                    <div className="space-y-2">
                      {stats.countries.slice(0, 5).map((country) => (
                        <div key={country.name} className="flex justify-between items-center bg-zinc-950/20 px-3 py-2 border border-zinc-800/10 rounded-xl text-xs font-semibold">
                          <span className={cn("truncate", isLightMode ? "text-zinc-800" : "text-zinc-300")}>{country.name}</span>
                          <span className="font-mono text-brand-500">{country.count} akses</span>
                        </div>
                      ))}
                      {stats.countries.length === 0 && (
                        <p className="text-zinc-500 text-xs italic py-4 text-center">Belum ada statistik negara.</p>
                      )}
                    </div>
                  </div>

                  {/* Wilayah & Kota */}
                  <div className={cn("p-4 rounded-2xl space-y-3", sectionBg)}>
                    <p className="text-[10px] text-zinc-505 text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1.5"><Compass className="w-3.5 h-3.5" /> Region / Wilayah Administratif</p>
                    <div className="space-y-2 font-mono">
                      {stats.regions.slice(0, 5).map((region) => (
                        <div key={region.name} className="flex justify-between items-center bg-zinc-950/20 px-3 py-2 border border-zinc-800/10 rounded-xl text-xs font-semibold">
                          <span className="text-zinc-300 truncate max-w-[130px]">{region.name}</span>
                          <span className="text-brand-550 text-brand-500">{region.count} klik</span>
                        </div>
                      ))}
                      {stats.regions.length === 0 && (
                        <p className="text-zinc-500 text-xs italic py-4 text-center font-sans">Belum ada statistik wilayah.</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {detailAnalyticsTab === 'devices' && (
                <motion.div
                  key="devices"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left"
                >
                  {/* Perangkat */}
                  <div className={cn("p-4 rounded-2xl space-y-2", sectionBg)}>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1.5"><Laptop className="w-3.5 h-3.5 text-zinc-450" /> Perangkat</p>
                    <div className="space-y-1.5 text-xs text-zinc-400 font-bold">
                      {stats.devices.map((device) => (
                        <div key={device.name} className="flex justify-between p-1.5 border-b border-zinc-800/20 last:border-0">
                          <span className={cn(isLightMode ? "text-zinc-800" : "text-zinc-300")}>{device.name}</span>
                          <span className="font-mono text-brand-500">{device.count}</span>
                        </div>
                      ))}
                      {stats.devices.length === 0 && <p className="text-zinc-505 text-zinc-500 text-[10px] italic py-4">Kosong</p>}
                    </div>
                  </div>

                  {/* Browser */}
                  <div className={cn("p-4 rounded-2xl space-y-2", sectionBg)}>
                    <p className="text-[10px] text-zinc-505 text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1.5"><Compass className="w-3.5 h-3.5 text-zinc-450" /> Browser</p>
                    <div className="space-y-1.5 text-xs text-zinc-400 font-bold">
                      {stats.browsers.map((b) => (
                        <div key={b.name} className="flex justify-between p-1.5 border-b border-zinc-800/20 last:border-0">
                          <span className={cn("truncate max-w-[80px]", isLightMode ? "text-zinc-800" : "text-zinc-350")}>{b.name}</span>
                          <span className="font-mono text-brand-500">{b.count}</span>
                        </div>
                      ))}
                      {stats.browsers.length === 0 && <p className="text-zinc-500 text-[10px] italic py-4 font-sans">Kosong</p>}
                    </div>
                  </div>

                  {/* Sistem Operasi */}
                  <div className={cn("p-4 rounded-2xl space-y-2", sectionBg)}>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-zinc-450" /> SIstem Operasi</p>
                    <div className="space-y-1.5 text-xs text-zinc-400 font-bold">
                      {stats.oss.map((os) => (
                        <div key={os.name} className="flex justify-between p-1.5 border-b border-zinc-800/20 last:border-0">
                          <span className={cn(isLightMode ? "text-zinc-800" : "text-zinc-300")}>{os.name}</span>
                          <span className="font-mono text-brand-555 text-brand-500">{os.count}</span>
                        </div>
                      ))}
                      {stats.oss.length === 0 && <p className="text-zinc-500 text-[10px] italic py-4">Kosong</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {detailAnalyticsTab === 'ips' && (
                <motion.div
                  key="ips"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3 text-left"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><Shield className="w-4 h-4 text-brand-500" /> Audit Alamat IP Pengunjung</h4>
                    <input 
                      type="text"
                      placeholder="Cari IP..."
                      value={detailIpSearch}
                      onChange={(e) => setDetailIpSearch(e.target.value)}
                      className="bg-zinc-955 border border-zinc-805 bg-zinc-950 border-zinc-850 rounded-lg py-1 px-3 text-[11px] focus:outline-none focus:ring-1 focus:ring-brand-500 text-zinc-300 font-mono w-32 md:w-44 placeholder:text-zinc-650"
                    />
                  </div>

                  <div className="border border-zinc-805 rounded-xl overflow-hidden bg-zinc-950/20">
                    <div className="overflow-y-auto max-h-56">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-zinc-950 text-zinc-505 text-zinc-500 border-b border-zinc-800 font-bold sticky top-0">
                          <tr>
                            <th className="px-4 py-2.5 font-mono text-left">Alamat IP</th>
                            <th className="px-4 py-2.5 text-left">Negara</th>
                            <th className="px-4 py-2.5 font-mono text-left">Hit</th>
                            <th className="px-4 py-2.5 text-right">Terakhir Terlihat</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900 font-medium">
                          {stats.ips
                            .filter(info => info.ip.includes(detailIpSearch))
                            .map((info) => (
                              <tr key={info.ip} className="hover:bg-zinc-900/10">
                                <td className={cn("px-4 py-2 font-mono text-left", isLightMode ? "text-zinc-800" : "text-zinc-300")}>{info.ip}</td>
                                <td className="px-4 py-2 text-[11px] text-zinc-500 text-left">{info.country}</td>
                                <td className="px-4 py-2 text-brand-505 text-brand-500 font-mono font-bold text-left">{info.count}x</td>
                                <td className="px-4 py-2 text-right text-[10px] text-zinc-500">
                                  {info.lastSeen ? format(new Date(info.lastSeen), "d MMM, HH:mm") : "—"}
                                </td>
                              </tr>
                            ))}
                          {stats.ips.filter(info => info.ip.includes(detailIpSearch)).length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-zinc-600 italic font-sans">
                                Belum ada log/IP yang cocok.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Referrer traffic list */}
          <div className={cn("p-6 rounded-3xl text-left", cardBg)}>
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5"><Compass className="w-4 h-4 text-brand-500" /> Sumber Situs Rujukan Utama</h4>
            <div className="space-y-2 font-semibold text-xs">
              {stats.referrers.slice(0, 4).map((ref) => (
                <div key={ref.name} className="flex justify-between items-center bg-zinc-950/20 px-4 py-3 border border-zinc-800/10 rounded-xl text-xs font-semibold">
                  <span className={cn("font-mono truncate max-w-xs", isLightMode ? "text-zinc-850" : "text-zinc-300")}>{ref.name}</span>
                  <span className="text-brand-505 text-brand-505 text-brand-500 shrink-0">{ref.count} kunjungan</span>
                </div>
              ))}
              {stats.referrers.length === 0 && (
                <p className="text-zinc-500 text-xs italic py-2 font-medium font-sans">Belum ada rujukan domain luar.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
