import React from "react";
import { 
  Folder, FolderPlus, FolderOpen, Edit2, Trash2, Layers, MousePointer2, 
  QrCode, Activity, Plus, ExternalLink, Lock
} from "lucide-react";
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area } from "recharts";
import { APP_THEME_CONFIGS, TRANSLATIONS } from "../constants";
import { CollectionData, LinkData } from "../types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CollectionsPageProps {
  lang: "id" | "en";
  links: LinkData[];
  collections: CollectionData[];
  activeCollectionId: string | null;
  setActiveCollectionId: (id: string | null) => void;
  setColEditing: (col: CollectionData | null) => void;
  setColName: (v: string) => void;
  setColDesc: (v: string) => void;
  setColSelectedLinkIds: (ids: string[]) => void;
  setIsColModalOpen: (open: boolean) => void;
  handleDeleteCollection: (id: string) => void;
  getCollectionChartData: (linkIds: string[]) => any[];
  setEditingLink: (link: LinkData | null) => void;
  setIsModalOpen: (open: boolean) => void;
  onQuickAddLink: (linkId: string, colId: string) => Promise<void>;
  onRemoveLinkFromCollection: (linkId: string, colId: string) => Promise<void>;
  isLightMode: boolean;
  appTheme: keyof typeof APP_THEME_CONFIGS;
}

export default function CollectionsPage({
  lang,
  links,
  collections,
  activeCollectionId,
  setActiveCollectionId,
  setColEditing,
  setColName,
  setColDesc,
  setColSelectedLinkIds,
  setIsColModalOpen,
  handleDeleteCollection,
  getCollectionChartData,
  setEditingLink,
  setIsModalOpen,
  onQuickAddLink,
  onRemoveLinkFromCollection,
  isLightMode,
  appTheme,
}: CollectionsPageProps) {
  const curT = APP_THEME_CONFIGS[appTheme];
  const t = (key: keyof typeof TRANSLATIONS.id) => {
    return TRANSLATIONS[lang]?.[key] || key;
  };

  const cardBg = isLightMode ? "bg-white border border-zinc-250 text-zinc-900 shadow-sm" : "bg-zinc-900/40 border border-zinc-800 text-white";
  const textTitle = isLightMode ? "text-zinc-950 font-black" : "text-white font-extrabold";
  const textMuted = isLightMode ? "text-zinc-500 font-medium" : "text-zinc-400";
  const inputBg = isLightMode ? "bg-zinc-100 border border-zinc-200 text-zinc-900 focus:bg-white animate-fade-in" : "bg-zinc-950 border border-zinc-855 text-white focus:bg-black";
  const borderClassic = isLightMode ? `${curT.borderClassicLight}` : "border-zinc-800";
  const sectionBg = isLightMode ? "bg-zinc-50 border border-zinc-200" : "bg-zinc-950/40 border border-zinc-805";

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header section with Create collection trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={cn("text-3xl font-extrabold tracking-tight mb-1 flex items-center gap-2", textTitle)}>
            {lang === "id" ? "Folder & Grup Koleksi" : "Folders & Collections"} <Folder className="w-6 h-6 text-brand-500" />
          </h1>
          <p className="text-zinc-500 text-sm">
            {lang === "id" ? "Grupkan link, kelola secara massal, dan lacak performa analitik serta scan rate QR Code gabungan." : "Group links in folders, bulk-manage them, and check unified analytics and QR code scan rates."}
          </p>
        </div>
        <button
          onClick={() => {
            setColEditing(null);
            setColName("");
            setColDesc("");
            setColSelectedLinkIds([]);
            setIsColModalOpen(true);
          }}
          className={cn("text-black font-extrabold px-5 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2 text-sm self-start cursor-pointer", curT.bg, curT.hoverBg, curT.shadowAccent)}
        >
          <FolderPlus className="w-4 h-4" />
          {lang === "id" ? "Buat Koleksi Baru" : "New Folder"}
        </button>
      </div>

      {collections.length === 0 ? (
        <div className={cn("text-center py-20 rounded-3xl p-8 max-w-xl mx-auto space-y-6", cardBg)}>
          <div className="w-16 h-16 bg-brand-500/10 text-brand-400 rounded-full flex items-center justify-center mx-auto text-2xl font-black animate-pulse">
            <FolderOpen className="w-8 h-8 text-brand-500" />
          </div>
          <div>
            <h2 className={cn("text-xl font-bold", textTitle)}>{lang === "id" ? "Belum Ada Folder / Koleksi" : "No folders yet"}</h2>
            <p className={cn("text-sm mt-1", textMuted)}>
              {lang === "id" ? "Grupkan beberapa tautan pendek Anda ke dalam kategori untuk pelacakan performa massal." : "Group multiple shortened campaigns under customized folders for combined statistics."}
            </p>
          </div>
          <button
            onClick={() => {
              setColEditing(null);
              setColName("");
              setColDesc("");
              setColSelectedLinkIds([]);
              setIsColModalOpen(true);
            }}
            className={cn("text-black font-extrabold px-5 py-3 rounded-xl transition-all shadow-lg text-xs cursor-pointer", curT.bg, curT.hoverBg)}
          >
            {lang === "id" ? "Mulai Buat Folder Baru" : "Create My First Folder"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Folders select cards (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <p className={cn("text-xs font-bold uppercase tracking-wider", textMuted)}>{lang === "id" ? "Daftar Folder Anda" : "Your Folders List"}</p>
            <div className="space-y-3">
              {collections.map((col) => {
                const isSelected = activeCollectionId === col.id || (!activeCollectionId && collections[0].id === col.id);
                if (isSelected && !activeCollectionId) {
                  setTimeout(() => setActiveCollectionId(col.id), 0);
                }
                
                const folderLinks = links.filter(l => l.collectionId === col.id || col.linkIds?.includes(l.id));
                const totalClicks = folderLinks.reduce((sum, l) => sum + (l.clickCount || 0), 0);
                const totalQrScans = folderLinks.reduce((sum, l) => sum + (l.qrScanCount || 0), 0);

                return (
                  <div
                    key={col.id}
                    onClick={() => setActiveCollectionId(col.id)}
                    className={cn(
                      "p-5 rounded-2xl cursor-pointer border transition-all text-left space-y-3 hover:scale-[1.01] duration-150 relative overflow-hidden group",
                      isSelected 
                        ? (isLightMode ? "border-brand-500 bg-brand-500/[0.02]" : "border-brand-500 bg-brand-500/[0.01]")
                        : cn("border-zinc-800", cardBg)
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-500" />
                    )}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className={cn("text-base font-bold flex items-center gap-2", textTitle)}>
                          <Folder className={cn("w-4 h-4 shrink-0", isSelected ? "text-brand-500" : "text-zinc-400")} />
                          {col.name}
                        </h3>
                        <p className={cn("text-xs mt-1 line-clamp-2", textMuted)}>{col.description || (lang === "id" ? "Tanpa deskripsi." : "No description.")}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setColEditing(col);
                            setColName(col.name);
                            setColDesc(col.description || "");
                            setColSelectedLinkIds(col.linkIds || []);
                            setIsColModalOpen(true);
                          }}
                          className="p-1.5 bg-zinc-805 hover:bg-zinc-700/60 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCollection(col.id);
                          }}
                          className="p-1.5 bg-zinc-850 hover:bg-red-900 rounded-lg text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className={cn("flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-zinc-505 text-zinc-500 border-t pt-3", borderClassic)}>
                      <span className="flex items-center gap-1.5 font-mono"><Layers className="w-3.5 h-3.5 text-zinc-400" /> {folderLinks.length} Links</span>
                      <span className="flex items-center gap-1.5 font-mono"><MousePointer2 className="w-3.5 h-3.5 text-zinc-400" /> {totalClicks} Clicks</span>
                      <span className="flex items-center gap-1.5 font-mono text-brand-500"><QrCode className="w-3.5 h-3.5 text-brand-550 text-brand-500" /> {totalQrScans} Scans</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active folder insights & links bulk manager (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {(() => {
              const activeCol = collections.find(c => c.id === activeCollectionId) || collections[0];
              if (!activeCol) return null;

              const folderLinks = links.filter(l => l.collectionId === activeCol.id || activeCol.linkIds?.includes(l.id));
              const totalClicks = folderLinks.reduce((sum, l) => sum + (l.clickCount || 0), 0);
              const totalQrScans = folderLinks.reduce((sum, l) => sum + (l.qrScanCount || 0), 0);
              const scanRate = totalClicks > 0 ? ((totalQrScans / totalClicks) * 100).toFixed(1) : "0.0";
              const chartData = getCollectionChartData(folderLinks.map(l => l.id));

              // Find links not already in this folder
              const availableToAdd = links.filter(l => l.collectionId !== activeCol.id && !(activeCol.linkIds || []).includes(l.id));

              return (
                <div className="space-y-6">
                  {/* Folder Header Metadata */}
                  <div className={cn("p-6 rounded-3xl border text-left space-y-2", cardBg)}>
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-505 text-brand-500">{lang === "id" ? "Folder Aktif" : "Active Directory"}</span>
                        <h2 className="text-2xl font-extrabold mt-0.5">{activeCol.name}</h2>
                      </div>
                      <button
                        onClick={() => {
                          setColEditing(activeCol);
                          setColName(activeCol.name);
                          setColDesc(activeCol.description || "");
                          setColSelectedLinkIds(activeCol.linkIds || []);
                          setIsColModalOpen(true);
                        }}
                        className="text-xs text-brand-500 font-extrabold hover:text-brand-400 flex items-center gap-1 bg-brand-500/5 hover:bg-brand-500/10 px-3.5 py-1.5 rounded-xl border border-brand-500/10 transition-all cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> {lang === "id" ? "Ubah Struktur" : "Edit Details"}
                      </button>
                    </div>
                    <p className={cn("text-xs leading-relaxed", textMuted)}>{activeCol.description || (lang === "id" ? "Belum ada deskripsi tertulis untuk kelompok koleksi tautan ini." : "This directory doesn't have an explanatory summary yet.")}</p>
                  </div>

                  {/* Folder Analytics stats grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className={cn("p-4 rounded-3xl border text-left flex gap-3.5 items-center", cardBg)}>
                      <div className="w-10 h-10 bg-brand-500/10 text-brand-505 text-brand-500 rounded-2xl flex items-center justify-center shrink-0">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={cn("text-[10px] font-bold uppercase tracking-wider", textMuted)}>{lang === "id" ? "Jumlah Link" : "Links Contained"}</p>
                        <p className="text-xl font-mono font-black mt-0.5">{folderLinks.length}</p>
                      </div>
                    </div>

                    <div className={cn("p-4 rounded-3xl border text-left flex gap-3.5 items-center", cardBg)}>
                      <div className="w-10 h-10 bg-emerald-500/10 text-emerald-555 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
                        <MousePointer2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={cn("text-[10px] font-bold uppercase tracking-wider", textMuted)}>{lang === "id" ? "Kunjungan Folder" : "Unified Clickings"}</p>
                        <p className="text-xl font-mono font-black mt-0.5">{totalClicks}</p>
                      </div>
                    </div>

                    <div className={cn("p-4 rounded-3xl border text-left flex gap-3.5 items-center", cardBg)}>
                      <div className="w-10 h-10 bg-brand-500/10 text-brand-505 text-brand-500 rounded-2xl flex items-center justify-center shrink-0">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={cn("text-[10px] font-bold uppercase tracking-wider", textMuted)}>{lang === "id" ? "Scan QR Rate" : "QR Scan Rate"}</p>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <p className="text-xl font-mono font-black text-brand-500">{totalQrScans}</p>
                          <span className="text-[10px] font-bold font-mono text-zinc-505 text-zinc-500">({scanRate}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Combined Shared trends Chart */}
                  <div className={cn("p-6 rounded-3xl border text-left", cardBg)}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5"><Activity className="w-4 h-4 text-brand-505 text-brand-500" /> {lang === "id" ? "Grafik Kunjungan Koleksi (7 Hari)" : "Unified Performance (7 Days Trend)"}</p>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorFolderClicks" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={curT.qrFg} stopOpacity={0.25}/>
                              <stop offset="95%" stopColor={curT.qrFg} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? "#eaeaea" : "#1e1e1e"} />
                          <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
                          <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isLightMode ? "#ffffff" : "#0c0c0e", 
                              border: isLightMode ? "1px solid #e4e4e7" : "1px solid #27272a",
                              borderRadius: "12px",
                              color: isLightMode ? "#09090b" : "#f4f4f5"
                            }} 
                          />
                          <Area type="monotone" dataKey="Clicks" stroke={curT.qrFg} strokeWidth={2.5} fillOpacity={1} fill="url(#colorFolderClicks)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Quick links additions control bar */}
                  {availableToAdd.length > 0 && (
                    <div className={cn("p-5 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left", sectionBg)}>
                      <div className="space-y-0.5">
                        <p className="text-sm font-extrabold text-brand-505 text-brand-500">{lang === "id" ? "Tambahkan Tautan ke Folder" : "Add Link to Folder"}</p>
                        <p className="text-xs text-zinc-500">{lang === "id" ? "Tautkan link lain ke kelompok analytics folder ini." : "Include standard links into this tracking sequence."}</p>
                      </div>
                      <div className="flex gap-2">
                        <select 
                          id="quickAddLinkSelect"
                          className={cn("text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-brand-500 border rounded-xl font-bold font-mono max-w-[200px] cursor-pointer", inputBg)}
                        >
                          {availableToAdd.map(l => (
                            <option key={l.id} value={l.id}>/{l.shortSlug} - {l.title || "Untitled"}</option>
                          ))}
                        </select>
                        <button 
                          onClick={async () => {
                            const selectEl = document.getElementById("quickAddLinkSelect") as HTMLSelectElement;
                            if (selectEl && selectEl.value) {
                              await onQuickAddLink(selectEl.value, activeCol.id);
                            }
                          }}
                          className={cn("text-black px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1 shrink-0 cursor-pointer", curT.bg, curT.hoverBg)}
                        >
                          <Plus className="w-3.5 h-3.5" /> {lang === "id" ? "Gabungkan" : "Join"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Sub links lists view */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <p className={cn("text-xs font-bold uppercase tracking-wider", textMuted)}>{lang === "id" ? "Daftar Tautan di Folder Ini" : "Links Grouped Here"}</p>
                      <span className="text-[10px] font-mono font-bold bg-zinc-800 text-brand-400 px-2.5 py-0.5 rounded-full">{folderLinks.length} Links</span>
                    </div>

                    <div className="space-y-2">
                      {folderLinks.map((link) => {
                        return (
                          <div 
                            key={link.id}
                            className={cn("p-4 rounded-2xl border flex items-center justify-between gap-4 text-left transition-all hover:border-brand-500/30", cardBg)}
                          >
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm truncate">{link.title || link.shortSlug}</p>
                                {link.password && <Lock className="w-3.5 h-3.5 text-brand-500 animate-pulse" />}
                              </div>
                              <p className="text-xs font-mono text-brand-550 text-brand-500 hover:underline truncate">
                                <a href={`${window.location.origin}/${link.shortSlug}`} target="_blank" rel="noreferrer">
                                  /{link.shortSlug}
                                </a>
                              </p>
                              <p className="text-[10px] font-mono text-zinc-500 truncate max-w-sm">{link.originalUrl}</p>
                            </div>

                            <div className="flex items-center gap-4 shrink-0">
                              <div className="text-right shrink-0">
                                <p className="text-xs font-extrabold font-mono text-zinc-300">{link.clickCount || 0} clicks</p>
                                <p className="text-[10px] font-mono text-zinc-500">{link.qrScanCount || 0} qr-scans</p>
                              </div>
                              
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingLink(link);
                                    setIsModalOpen(true);
                                  }}
                                  title={lang === "id" ? "Edit Parameter" : "Edit Details"}
                                  className="p-1.5 bg-zinc-805 hover:bg-zinc-700/60 bg-zinc-800 hover:bg-zinc-700/60 rounded-xl text-zinc-400 cursor-pointer"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => onRemoveLinkFromCollection(link.id, activeCol.id)}
                                  title={lang === "id" ? "Keluarkan dari Grup" : "Remove from folder"}
                                  className="p-1.5 bg-zinc-805 hover:bg-red-500/10 hover:text-red-400 bg-zinc-800 hover:bg-red-500/10 hover:text-red-400 rounded-xl text-zinc-500 cursor-pointer"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {folderLinks.length === 0 && (
                        <div className="text-center py-10 bg-zinc-950/20 rounded-2xl border border-dashed border-zinc-800 text-zinc-500 text-xs italic">
                          {lang === "id" ? "Folder ini kosong. Tambahkan tautan di atas atau ubah struktur dari tombol kelola." : "This folder is empty. Use standalone adder above or structures button."}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })()}
          </div>

        </div>
      )}
    </div>
  );
}
