import React from "react";
import { 
  Layers, Check, Copy, ExternalLink, Link2, Upload, Instagram, Twitter, 
  Linkedin, Youtube, Github, Image, CheckSquare, Folder, FolderOpen,
  ChevronUp, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { APP_THEME_CONFIGS, THEME_STYLES, TRANSLATIONS } from "../constants";
import { LinkData, UserData, LinkCollection } from "../types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LinkTreePageProps {
  lang: "id" | "en";
  user: UserData | null;
  links: LinkData[];
  copiedTreeUrl: boolean;
  setCopiedTreeUrl: (v: boolean) => void;
  treeTitle: string;
  setTreeTitle: (v: string) => void;
  treeBio: string;
  setTreeBio: (v: string) => void;
  treeAvatar: string;
  setTreeAvatar: (v: string) => void;
  treeTheme: string;
  setTreeTheme: (v: string) => void;
  treeLinks: string[];
  setTreeLinks: React.Dispatch<React.SetStateAction<string[]>>;
  treeBgImage: string;
  setTreeBgImage: (v: string) => void;
  treeButtonStyle: string;
  setTreeButtonStyle: (v: string) => void;
  treeShowFolders: boolean;
  setTreeShowFolders: (v: boolean) => void;
  treeInstagram: string;
  setTreeInstagram: (v: string) => void;
  treeTwitter: string;
  setTreeTwitter: (v: string) => void;
  treeLinkedIn: string;
  setTreeLinkedIn: (v: string) => void;
  treeYoutube: string;
  setTreeYoutube: (v: string) => void;
  treeGithub: string;
  setTreeGithub: (v: string) => void;
  treeVideoUrl: string;
  setTreeVideoUrl: (v: string) => void;
  treeButtonBgImage: string;
  setTreeButtonBgImage: (v: string) => void;
  treeSavedSuccess: boolean;
  handleSaveTree: () => Promise<void>;
  getYouTubeEmbedUrl: (url: string) => string | null;
  isLightMode: boolean;
  appTheme: keyof typeof APP_THEME_CONFIGS;
  collections: LinkCollection[];
  expandedFolders: Record<string, boolean>;
  setExpandedFolders: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  isSavingTree: boolean;
}

export default function LinkTreePage({
  lang,
  user,
  links,
  copiedTreeUrl,
  setCopiedTreeUrl,
  treeTitle,
  setTreeTitle,
  treeBio,
  setTreeBio,
  treeAvatar,
  setTreeAvatar,
  treeTheme,
  setTreeTheme,
  treeLinks,
  setTreeLinks,
  treeBgImage,
  setTreeBgImage,
  treeButtonStyle,
  setTreeButtonStyle,
  treeShowFolders,
  setTreeShowFolders,
  treeInstagram,
  setTreeInstagram,
  treeTwitter,
  setTreeTwitter,
  treeLinkedIn,
  setTreeLinkedIn,
  treeYoutube,
  setTreeYoutube,
  treeGithub,
  setTreeGithub,
  treeVideoUrl,
  setTreeVideoUrl,
  treeButtonBgImage,
  setTreeButtonBgImage,
  treeSavedSuccess,
  handleSaveTree,
  getYouTubeEmbedUrl,
  isLightMode,
  appTheme,
  collections,
  expandedFolders,
  setExpandedFolders,
  isSavingTree,
}: LinkTreePageProps) {
  const curT = APP_THEME_CONFIGS[appTheme];
  const t = (key: keyof typeof TRANSLATIONS.id) => {
    return TRANSLATIONS[lang]?.[key] || key;
  };

  const textTitle = isLightMode ? "text-zinc-950 font-black" : "text-white font-extrabold";
  const textMuted = isLightMode ? "text-zinc-505 text-zinc-500 font-medium" : "text-zinc-400";
  const inputBg = isLightMode ? "bg-white border border-zinc-200 text-zinc-900 focus:bg-white placeholder-zinc-400" : "bg-zinc-950 border border-zinc-800 text-white focus:bg-black placeholder-zinc-650";
  const cardBg = isLightMode ? "bg-white border border-zinc-200/80 shadow-sm" : "bg-zinc-900/50 border-zinc-800";
  const borderClassic = isLightMode ? "border-zinc-150" : "border-zinc-800/60";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start text-left animate-fade-in pb-12">
      {/* Left Side Builder Controls (7 cols on large screens) */}
      <div className="lg:col-span-7 space-y-8">
        <div>
          <h2 className={cn("text-2xl font-black mb-2 flex items-center gap-2", isLightMode ? "text-zinc-900" : "text-white")}>
            <Layers className="w-6 h-6 text-brand-500" />
            {t("customBioTreeHeader")}
          </h2>
          <p className={cn("text-sm", textMuted)}>{t("customBioTreeSubtitle")}</p>
        </div>

        {/* Public URL Share Card */}
        {user && (
          <div className={cn("p-6 rounded-3xl space-y-4 border transition-all", cardBg)}>
            <h3 className={cn("text-sm font-bold uppercase tracking-wider", isLightMode ? "text-zinc-700" : "text-zinc-300")}>{t("publicBioUrlTitle")}</h3>
            <div className={cn("p-3 rounded-2xl flex items-center justify-between gap-4 border transition-all", isLightMode ? "bg-zinc-50 border-zinc-200/60" : "bg-zinc-950 border-zinc-850")}>
              <span className="text-xs font-mono font-bold text-brand-550 text-brand-500 truncate select-all">
                {window.location.origin}/t/{user.email ? user.email.split("@")[0] : user.uid}
              </span>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => {
                    const slug = user.email ? user.email.split("@")[0] : user.uid;
                    const url = `${window.location.origin}/t/${slug}`;
                    navigator.clipboard.writeText(url);
                    setCopiedTreeUrl(true);
                    setTimeout(() => setCopiedTreeUrl(false), 2000);
                  }}
                  className={cn(
                    "p-2 border transition-all cursor-pointer rounded-xl",
                    isLightMode 
                      ? "bg-white border-zinc-200 hover:border-zinc-300 text-zinc-600 hover:text-zinc-900 shadow-sm" 
                      : "bg-zinc-904 bg-zinc-900 border-zinc-800 hover:border-zinc-705 text-zinc-300 hover:text-white"
                  )}
                  title={t("copy")}
                >
                  {copiedTreeUrl ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    const slug = user.email ? user.email.split("@")[0] : user.uid;
                    window.open(`${window.location.origin}/t/${slug}`, '_blank');
                  }}
                  className="p-2 bg-brand-500 text-black hover:bg-brand-400 rounded-xl transition-all font-bold cursor-pointer"
                  title={t("openLink")}
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Editor Fields */}
        <div className={cn("p-6 rounded-3xl space-y-6 border transition-all", cardBg)}>
          <h3 className={cn("text-sm font-bold uppercase tracking-wider border-b pb-3", isLightMode ? "text-zinc-700 border-zinc-150" : "text-zinc-300 border-zinc-800/60")}>{lang === "id" ? "Profil & Deskripsi" : "Profile & Description"}</h3>
          <div className="space-y-4">
            
            {/* Photo Profile / Avatar URL */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="flex flex-col items-center space-y-2 select-none">
                <div className={cn("w-20 h-20 rounded-full border overflow-hidden flex items-center justify-center p-0.5 transition-all relative group", isLightMode ? "border-zinc-200 bg-zinc-50" : "border-zinc-800 bg-zinc-950")}>
                  {treeAvatar ? (
                    <img src={treeAvatar} className="w-full h-full object-cover rounded-full" alt="Avatar Preview" referrerPolicy="no-referrer" />
                  ) : user?.photoURL ? (
                    <img src={user.photoURL} className="w-full h-full object-cover rounded-full" alt="Avatar Preview" referrerPolicy="no-referrer" />
                  ) : (
                    <Link2 className="w-8 h-8 text-zinc-650" />
                  )}
                  {treeAvatar && (
                    <button
                      type="button"
                      onClick={() => setTreeAvatar("")}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{lang === "id" ? "Preview Foto" : "Photo Preview"}</span>
              </div>
              <div className="md:col-span-2 space-y-3 text-left">
                <div className="space-y-1">
                  <label className={cn("text-xs font-bold flex items-center gap-1.5", isLightMode ? "text-zinc-600" : "text-zinc-400")}>
                    <Upload className="w-3.5 h-3.5 text-brand-500" />
                    {lang === "id" ? "Unggah Foto Profil (Import File)" : "Upload My Profile Image (PNG/JPG)"}
                  </label>
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          if (typeof reader.result === 'string') {
                            setTreeAvatar(reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className={cn(
                      "w-full text-xs font-mono file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-500/10 file:text-brand-500 hover:file:bg-brand-500/20 cursor-pointer file:cursor-pointer pb-1",
                      isLightMode ? "text-zinc-500" : "text-zinc-400"
                    )}
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className={cn("text-[10px] font-bold opacity-60", isLightMode ? "text-zinc-650" : "text-zinc-550")}>{lang === "id" ? "ATAU Masukkan URL Foto" : "OR Enter Photo URL"}</label>
                  <input 
                    type="text"
                    value={treeAvatar.startsWith("data:") ? "" : treeAvatar}
                    onChange={(e) => setTreeAvatar(e.target.value)}
                    placeholder={lang === "id" ? "Masukkan URL foto profil Anda..." : "Enter your profile photo URL..."}
                    className={cn("w-full border rounded-xl py-2 px-4 focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs font-mono transition-all", inputBg)}
                  />
                </div>
              </div>
            </div>

            {/* Title & Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className={cn("text-xs font-bold", isLightMode ? "text-zinc-600" : "text-zinc-400")}>{lang === "id" ? "Judul Bio Halaman" : "Page Bio Title"}</label>
                <input 
                  type="text"
                  value={treeTitle}
                  onChange={(e) => setTreeTitle(e.target.value)}
                  placeholder={lang === "id" ? "Nama atau Judul Anda..." : "Your Name or Title..."}
                  className={cn("w-full border rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs transition-all font-bold", inputBg)}
                />
              </div>
              <div className="space-y-1.5 text-left">
                <label className={cn("text-xs font-bold", isLightMode ? "text-zinc-600" : "text-zinc-400")}>{lang === "id" ? "Deskripsi / Bio Singkat" : "Description / Short Bio"}</label>
                <input 
                  type="text"
                  value={treeBio}
                  onChange={(e) => setTreeBio(e.target.value)}
                  placeholder={lang === "id" ? "Tulis bio singkat atau deskripsi..." : "Write a short bio or description..."}
                  className={cn("w-full border rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs transition-all font-semibold", inputBg)}
                />
              </div>
            </div>

            {/* Social Links (Instagram, Twitter, LinkedIn, Youtube, GitHub) */}
            <div className={cn("border-t pt-4 mt-2 space-y-3", borderClassic)}>
              <h4 className={cn("text-[11px] font-extrabold uppercase tracking-widest", isLightMode ? "text-zinc-500" : "text-zinc-400")}>
                {lang === "id" ? "Tautan Media Sosial" : "Social Media Links"}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Instagram */}
                <div className="space-y-1.5 text-left">
                  <label className={cn("text-[10px] font-bold flex items-center gap-1.5", isLightMode ? "text-zinc-650" : "text-zinc-400")}>
                    <Instagram className="w-3.5 h-3.5 text-pink-550 text-pink-500" />
                    <span>Instagram</span>
                  </label>
                  <input 
                    type="text"
                    value={treeInstagram}
                    onChange={(e) => setTreeInstagram(e.target.value)}
                    placeholder="username"
                    className={cn("w-full border rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs transition-all font-mono", inputBg)}
                  />
                </div>
                {/* Twitter */}
                <div className="space-y-1.5 text-left">
                  <label className={cn("text-[10px] font-bold flex items-center gap-1.5", isLightMode ? "text-zinc-655" : "text-zinc-400")}>
                    <Twitter className="w-3.5 h-3.5 text-sky-400" />
                    <span>Twitter</span>
                  </label>
                  <input 
                    type="text"
                    value={treeTwitter}
                    onChange={(e) => setTreeTwitter(e.target.value)}
                    placeholder="username"
                    className={cn("w-full border rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs transition-all font-mono", inputBg)}
                  />
                </div>
                {/* LinkedIn */}
                <div className="space-y-1.5 text-left">
                  <label className={cn("text-[10px] font-bold flex items-center gap-1.5", isLightMode ? "text-zinc-655" : "text-zinc-400")}>
                    <Linkedin className="w-3.5 h-3.5 text-blue-500" />
                    <span>LinkedIn</span>
                  </label>
                  <input 
                    type="text"
                    value={treeLinkedIn}
                    onChange={(e) => setTreeLinkedIn(e.target.value)}
                    placeholder="username / URL"
                    className={cn("w-full border rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs transition-all font-mono", inputBg)}
                  />
                </div>
                {/* YouTube */}
                <div className="space-y-1.5 text-left">
                  <label className={cn("text-[10px] font-bold flex items-center gap-1.5", isLightMode ? "text-zinc-655" : "text-zinc-400")}>
                    <Youtube className="w-3.5 h-3.5 text-red-500" />
                    <span>YouTube</span>
                  </label>
                  <input 
                    type="text"
                    value={treeYoutube}
                    onChange={(e) => setTreeYoutube(e.target.value)}
                    placeholder="channel / URL"
                    className={cn("w-full border rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs transition-all font-mono", inputBg)}
                  />
                </div>
                {/* GitHub */}
                <div className="space-y-1.5 text-left">
                  <label className={cn("text-[10px] font-bold flex items-center gap-1.5", isLightMode ? "text-zinc-655" : "text-zinc-400")}>
                    <Github className="w-3.5 h-3.5 text-zinc-550 dark:text-zinc-300" />
                    <span>GitHub</span>
                  </label>
                  <input 
                    type="text"
                    value={treeGithub}
                    onChange={(e) => setTreeGithub(e.target.value)}
                    placeholder="username"
                    className={cn("w-full border rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs transition-all font-mono", inputBg)}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Theme Selector for Link Tree */}
        <div className={cn("p-6 rounded-3xl space-y-4 border transition-all", cardBg)}>
          <h3 className={cn("text-sm font-bold uppercase tracking-wider border-b pb-3", isLightMode ? "text-zinc-700 border-zinc-150" : "text-zinc-300 border-zinc-800/60")}>{t("choosePageTheme")}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {Object.entries(THEME_STYLES).map(([key, style]) => {
              const acts = treeTheme === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTreeTheme(key)}
                  className={cn(
                    "p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer select-none",
                    acts
                      ? "bg-brand-500/10 border-brand-500 text-brand-500 shadow-md font-bold"
                      : (isLightMode ? "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:border-zinc-300 hover:text-zinc-900" : "bg-zinc-950 border-zinc-855 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200")
                  )}
                >
                  <div className={cn("w-full h-8 rounded-lg flex items-center justify-center p-1.5 text-[9px] font-black", style.bg)}>
                    Preset
                  </div>
                  <span className="text-[10px] font-bold truncate w-full">{style.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Background File Import */}
        <div className={cn("p-6 rounded-3xl space-y-4 border transition-all", cardBg)}>
          <div className="border-b pb-3 flex justify-between items-center">
            <h3 className={cn("text-sm font-bold uppercase tracking-wider", isLightMode ? "text-zinc-700" : "text-zinc-300")}>
              {lang === "id" ? "Latar Belakang Kustom" : "Custom Background Image"}
            </h3>
            {treeBgImage && (
              <button
                type="button"
                onClick={() => setTreeBgImage("")}
                className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-505 text-red-500 border border-red-500/20 font-bold px-2.5 py-1 rounded transition-colors cursor-pointer"
              >
                {lang === "id" ? "Hapus Gambar" : "Remove Image"}
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="flex flex-col items-center space-y-2 select-none">
              <div 
                className={cn("w-full h-24 rounded-2xl border overflow-hidden flex items-center justify-center p-0.5 transition-all bg-zinc-950 relative", isLightMode ? "border-zinc-200" : "border-zinc-800")}
                style={treeBgImage ? { backgroundImage: `url(${treeBgImage})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
              >
                {!treeBgImage && (
                  <span className="text-zinc-500 text-xs font-mono italic">{lang === "id" ? "Tema Bawaan" : "Theme Default"}</span>
                )}
              </div>
              <span className="text-[10px] text-zinc-505 text-zinc-500 font-bold uppercase tracking-widest">{lang === "id" ? "Preview Latar Belakang" : "Background Preview"}</span>
            </div>
            
            <div className="md:col-span-2 space-y-3 text-left">
              <div className="space-y-1">
                <label className={cn("text-xs font-bold flex items-center gap-1.5", isLightMode ? "text-zinc-600" : "text-zinc-400")}>
                  <Upload className="w-3.5 h-3.5 text-brand-500" />
                  {lang === "id" ? "Unggah Gambar Latar (Import File)" : "Upload Custom Background (JPG/PNG)"}
                </label>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (typeof reader.result === 'string') {
                          setTreeBgImage(reader.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className={cn(
                    "w-full text-xs font-mono file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-500/10 file:text-brand-500 hover:file:bg-brand-500/20 cursor-pointer file:cursor-pointer pb-1",
                    isLightMode ? "text-zinc-500" : "text-zinc-400"
                  )}
                />
                <p className="text-[10px] text-zinc-500 leading-normal font-mono">
                  {lang === "id" ? "Format yang didukung: JPG, PNG, WEBP, GIF. Gambar akan menggantikan background preset tema." : "Supported formats: JPG, PNG, WEBP, GIF. Image replaces the theme preset selection."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sematkan Video Bio (Embed Bio Video Option) */}
        <div className={cn("p-6 rounded-3xl space-y-4 border transition-all", cardBg)}>
          <div className="border-b pb-3 flex justify-between items-center">
            <h3 className={cn("text-sm font-bold uppercase tracking-wider", isLightMode ? "text-zinc-700" : "text-zinc-300")}>
              {lang === "id" ? "Sematkan Video Bio" : "Embed Bio Video"}
            </h3>
            {treeVideoUrl && (
              <button
                type="button"
                onClick={() => setTreeVideoUrl("")}
                className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold px-2 py-1 rounded transition-colors cursor-pointer"
              >
                {lang === "id" ? "Hapus Video" : "Remove Video"}
              </button>
            )}
          </div>

          <div className="space-y-3 text-left">
            <div className="space-y-1">
              <label className={cn("text-xs font-bold flex items-center gap-1.5", isLightMode ? "text-zinc-650" : "text-zinc-400")}>
                <Youtube className="w-3.5 h-3.5 text-red-500" />
                {lang === "id" ? "Tautan Video YouTube / Shorts" : "YouTube Video / Shorts Link"}
              </label>
              <input 
                type="text"
                value={treeVideoUrl}
                onChange={(e) => setTreeVideoUrl(e.target.value)}
                placeholder={lang === "id" ? "Tempel URL video YouTube (contoh: https://www.youtube.com/watch?v=dQw4w9WgXcQ atau shorts)" : "Paste YouTube video URL (e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or shorts)"}
                className={cn("w-full border rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-brand-500/50 text-xs transition-all", inputBg)}
              />
              <p className="text-[10px] text-zinc-500 font-mono leading-normal mt-1 leading-relaxed">
                {lang === "id" 
                  ? "Mendukung semua format tautan video YouTube biasa, Shorts, atau bagikan. Pemutar video responsif akan disisipkan ke profil Bio Linktree Anda." 
                  : "Supports all YouTube video formats, Shorts, or share links. A responsive video player will be inserted into your Bio Linktree profile page."}
              </p>
            </div>

            {treeVideoUrl && getYouTubeEmbedUrl(treeVideoUrl) && (
              <div className="mt-3 aspect-video rounded-3xl overflow-hidden border border-zinc-700/30 shadow-md">
                <iframe
                  src={getYouTubeEmbedUrl(treeVideoUrl)!}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Embed Video Preview"
                />
              </div>
            )}
          </div>
        </div>

        {/* Button Link Style Option */}
        <div className={cn("p-6 rounded-3xl space-y-4 border transition-all", cardBg)}>
          <h3 className={cn("text-sm font-bold uppercase tracking-wider border-b pb-3", isLightMode ? "text-zinc-700 border-zinc-150" : "text-zinc-300 border-zinc-800/60 pb-3")}>
            {lang === "id" ? "Gaya Tombol Tautan (Button Link Style)" : "Button Link Style"}
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { id: "classic", name: "Classic Soft", desc: lang === "id" ? "Sudut melengkung halus" : "Smooth rounded corners" },
              { id: "pill", name: "Pill Oval", desc: lang === "id" ? "Kapsul lonjong penuh" : "Fully rounded oval" },
              { id: "outline", name: "Outline Glow", desc: lang === "id" ? "Transparan bingkai warna" : "Transparent with accent borders" },
              { id: "brutalist", name: "Retro Brutalist", desc: lang === "id" ? "Gaya retro kotak bold" : "Retro bold flat shadow" },
              { id: "glass", name: "Frosted Glass", desc: lang === "id" ? "Sinar kaca transparan" : "Frosted glass look" },
              { id: "soft-hover", name: "Minimal Soft Accent", desc: lang === "id" ? "Bersih minimalis modern" : "Clean minimalistic modern" }
            ].map((styleOption) => {
              const actStyle = treeButtonStyle === styleOption.id;
              return (
                <button
                  key={styleOption.id}
                  type="button"
                  onClick={() => setTreeButtonStyle(styleOption.id)}
                  className={cn(
                    "p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer selection-none",
                    actStyle
                      ? "bg-brand-500/10 border-brand-500 text-brand-550 text-brand-500 shadow-md font-bold"
                      : (isLightMode ? "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-105 hover:border-zinc-300 hover:text-zinc-900" : "bg-zinc-950 border-zinc-855 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200")
                  )}
                >
                  <span className="text-xs font-extrabold block">{styleOption.name}</span>
                  <span className="text-[9px] opacity-70 leading-snug block">{styleOption.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Button Custom Background Image Uploader */}
          <div className={cn("border-t pt-4 mt-2 space-y-4", borderClassic)}>
            <div className="flex justify-between items-center">
              <label className={cn("text-xs font-bold flex items-center gap-1.5", isLightMode ? "text-zinc-650" : "text-zinc-400")}>
                <Image className="w-3.5 h-3.5 text-brand-500" />
                {lang === "id" ? "Latar Belakang Tombol Kustom (Import File)" : "Custom Button Background (PNG/JPG)"}
              </label>
              {treeButtonBgImage && (
                <button
                  type="button"
                  onClick={() => setTreeButtonBgImage("")}
                  className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold px-2.5 py-1 rounded transition-colors cursor-pointer"
                >
                  {lang === "id" ? "Hapus" : "Remove"}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="flex flex-col items-center select-none">
                <div 
                  className={cn("w-full h-11 rounded-xl border overflow-hidden flex items-center justify-center p-0.5 transition-all bg-zinc-950 relative", isLightMode ? "border-zinc-200" : "border-zinc-805")}
                  style={treeButtonBgImage ? { backgroundImage: `url(${treeButtonBgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                >
                  {!treeButtonBgImage ? (
                    <span className="text-zinc-600 text-[10px] font-mono italic">{lang === "id" ? "Preset Tema" : "Theme Default"}</span>
                  ) : (
                    <span className="text-white text-[10px] mix-blend-difference font-bold uppercase tracking-wider">{lang === "id" ? "Kustom" : "Custom BG"}</span>
                  )}
                </div>
              </div>

              <div className="md:col-span-2 space-y-1 text-left">
                <input 
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (typeof reader.result === 'string') {
                          setTreeButtonBgImage(reader.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className={cn(
                    "w-full text-xs font-mono file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-500/10 file:text-brand-500 hover:file:bg-brand-500/20 cursor-pointer file:cursor-pointer pb-1",
                    isLightMode ? "text-zinc-500" : "text-zinc-400"
                  )}
                />
                <p className="text-[10px] text-zinc-500 leading-normal font-mono">
                  {lang === "id" ? "Unggah gambar untuk dijadikan latar belakang semua tombol tautan." : "Upload an image to set as the background for all button links."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Folder Toggle Configuration */}
        <div className={cn("p-6 rounded-3xl border transition-all space-y-4", cardBg)}>
          <div className="flex items-center justify-between">
            <div className="space-y-1.5 text-left">
              <h3 className={cn("text-xs font-bold uppercase tracking-wider flex items-center gap-1.5", isLightMode ? "text-zinc-700" : "text-zinc-300")}>
                <Folder className="w-4 h-4 text-brand-500" />
                {lang === "id" ? "Grupkan Berdasarkan Folder / Koleksi" : "Group by Folder / Collection"}
              </h3>
              <p className={cn("text-[10px] leading-relaxed", isLightMode ? "text-zinc-500" : "text-zinc-400")}>
                {lang === "id" 
                  ? "Aktifkan untuk mengelompokkan tautan ke dalam folder/koleksi di halaman Link Tree Anda." 
                  : "Enable to group links inside their respective folders/collections on your Link Tree page."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTreeShowFolders(!treeShowFolders)}
              className={cn(
                "w-10 h-5 rounded-full p-0.5 transition-colors relative duration-300 cursor-pointer shrink-0",
                treeShowFolders ? "bg-brand-500" : "bg-zinc-700"
              )}
            >
              <div className={cn(
                "w-4 h-4 rounded-full transition-transform duration-300 transform",
                isLightMode ? "bg-white" : "bg-black",
                treeShowFolders ? "translate-x-5" : "translate-x-0"
              )} />
            </button>
          </div>
        </div>

        {/* Toggle links list on tree */}
        <div className={cn("p-6 rounded-3xl space-y-4 border transition-all", cardBg)}>
          <div className={cn("flex items-center justify-between border-b pb-3", borderClassic)}>
            <h3 className={cn("text-sm font-bold uppercase tracking-wider", isLightMode ? "text-zinc-700" : "text-zinc-300")}>{t("choosePageTheme")}</h3>
            <p className={cn("text-[10px]", isLightMode ? "text-zinc-500" : "text-zinc-450")}>{t("useToggleToPin")}</p>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {links.map((link) => {
              const isChecked = treeLinks.includes(link.id);
              return (
                <div 
                  key={link.id}
                  onClick={() => {
                    setTreeLinks(prev => 
                      prev.includes(link.id)
                        ? prev.filter(id => id !== link.id)
                        : [...prev, link.id]
                    );
                  }}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none",
                    isChecked 
                      ? (isLightMode ? "bg-brand-500/[0.04] border-brand-500" : "bg-zinc-950 border-brand-500/25")
                      : (isLightMode ? "bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-700" : "bg-zinc-950/40 border-zinc-850 hover:border-zinc-800 text-zinc-400")
                  )}
                >
                  <div className="flex-1 min-w-0 pr-4 text-left">
                    <p className={cn("text-xs font-bold truncate", isLightMode ? (isChecked ? "text-brand-600" : "text-zinc-800") : "text-zinc-200")}>{link.title || link.shortSlug}</p>
                    <p className="text-[10px] font-mono text-zinc-550 text-zinc-500 truncate">/{link.shortSlug}</p>
                  </div>
                  <button
                    type="button"
                    className={cn(
                      "w-8 h-4 rounded-full p-0.5 transition-colors relative duration-300 pointer-events-none",
                      isChecked ? "bg-brand-500" : (isLightMode ? "bg-zinc-200" : "bg-zinc-805")
                    )}
                  >
                    <div className={cn(
                      "w-3 h-3 rounded-full transition-transform duration-300 transform",
                      isLightMode ? "bg-white" : "bg-black",
                      isChecked ? "translate-x-4" : "translate-x-0"
                    )} />
                  </button>
                </div>
              );
            })}
            {links.length === 0 && (
              <div className={cn("py-8 border rounded-2xl text-center text-zinc-505 text-zinc-500 text-xs italic font-mono", isLightMode ? "bg-zinc-50 border-zinc-200" : "bg-zinc-950/50 border-zinc-850")}>
                {t("noLinksCreatedYet")}
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={handleSaveTree}
            className={cn("text-black font-extrabold px-8 py-3.5 rounded-xl transition-all shadow-lg flex items-center gap-2 text-xs uppercase tracking-wider cursor-pointer", curT.bg, curT.hoverBg)}
          >
            <CheckSquare className="w-4 h-4" />
            {t("saveConfiguration")}
          </button>
        </div>

        {treeSavedSuccess && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold py-3 px-4 rounded-xl text-center">
            {t("bioConfigSavedSuccessfully")}
          </div>
        )}
      </div>

      {/* Right Side Device Simulated Live Preview Mockup (5 cols) */}
      <div className="lg:col-span-5 flex justify-center sticky top-8 text-left select-none">
        <div className={cn(
          "relative w-[280px] h-[560px] rounded-[40px] shadow-2xl flex flex-col overflow-hidden leading-snug select-none border-[10px] transition-all",
          isLightMode 
            ? "bg-white border-brand-500 shadow-lg shadow-brand-500/10 text-zinc-900" 
            : "bg-zinc-950 border-zinc-900 text-white"
        )}>
          <div className={cn(
            "absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 rounded-b-xl z-50 flex items-center justify-center",
            isLightMode ? "bg-brand-500" : "bg-zinc-900"
          )}>
            <div className={cn("w-8 h-1 rounded-full", isLightMode ? "bg-white/80" : "bg-zinc-800")} />
          </div>
          {(() => {
            const s = THEME_STYLES[treeTheme as keyof typeof THEME_STYLES] || THEME_STYLES.slate;
            const chosenLinks = links.filter(l => {
              if (treeLinks.length > 0) {
                return treeLinks.includes(l.id);
              }
              return true;
            });
            return (
              <div 
                className={cn("flex-1 pt-12 pb-6 px-4 overflow-y-auto space-y-5 flex flex-col items-center justify-start text-center", s.bg)}
                style={treeBgImage ? { backgroundImage: `url(${treeBgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' } : {}}
              >
                <div className="w-14 h-14 rounded-full border border-brand-500/20 p-0.5 overflow-hidden bg-zinc-900 flex items-center justify-center shrink-0">
                  {treeAvatar ? (
                    <img src={treeAvatar} className="w-full h-full object-cover rounded-full" alt="Avatar" referrerPolicy="no-referrer" />
                  ) : user?.photoURL ? (
                    <img src={user.photoURL} className="w-full h-full object-cover rounded-full" alt="Avatar" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-zinc-900 rounded-full flex items-center justify-center">
                      <Link2 className="w-5 h-5 text-brand-500" />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black tracking-tight truncate w-36">{treeTitle || user?.displayName || t("defaultLivePreviewTitle")}</p>
                  <p className="text-[9px] opacity-70 tracking-wide font-mono truncate w-40">{treeBio || "Selamat datang di Link Tree kustom saya!"}</p>
                </div>

                {/* Social Icons row */}
                {(treeInstagram || treeTwitter || treeLinkedIn || treeYoutube || treeGithub) && (
                  <div className="flex items-center justify-center gap-2.5 py-1 flex-wrap">
                    {treeInstagram && (
                      <a 
                        href={`https://instagram.com/${treeInstagram.replace('@', '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-455 hover:text-pink-500 hover:scale-110 active:scale-95 transition-all p-0.5"
                        title="Instagram"
                      >
                        <Instagram className="w-4 h-4 text-pink-500" />
                      </a>
                    )}
                    {treeTwitter && (
                      <a 
                        href={`https://twitter.com/${treeTwitter.replace('@', '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-455 hover:text-sky-400 hover:scale-110 active:scale-95 transition-all p-0.5"
                        title="Twitter / X"
                      >
                        <Twitter className="w-4 h-4 text-sky-400" />
                      </a>
                    )}
                    {treeLinkedIn && (
                      <a 
                        href={treeLinkedIn.startsWith('http') ? treeLinkedIn : `https://linkedin.com/in/${treeLinkedIn}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-455 hover:text-blue-500 hover:scale-110 active:scale-95 transition-all p-0.5"
                        title="LinkedIn"
                      >
                        <Linkedin className="w-4 h-4 text-blue-500" />
                      </a>
                    )}
                    {treeYoutube && (
                      <a 
                        href={treeYoutube.startsWith('http') ? treeYoutube : `https://youtube.com/@${treeYoutube.replace('@', '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-455 hover:text-red-500 hover:scale-110 active:scale-95 transition-all p-0.5"
                        title="YouTube"
                      >
                        <Youtube className="w-4 h-4 text-red-500" />
                      </a>
                    )}
                    {treeGithub && (
                      <a 
                        href={treeGithub.startsWith('http') ? treeGithub : `https://github.com/${treeGithub}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-455 hover:text-white hover:scale-110 active:scale-95 transition-all p-0.5"
                        title="GitHub"
                      >
                        <Github className="w-4 h-4 text-zinc-100" />
                      </a>
                    )}
                  </div>
                )}

                {/* Live Preview Embedded Video Option */}
                {treeVideoUrl && getYouTubeEmbedUrl(treeVideoUrl) && (
                  <div className="w-full rounded-2xl overflow-hidden border border-zinc-700/30 shadow aspect-video my-3 shrink-0">
                    <iframe
                      src={getYouTubeEmbedUrl(treeVideoUrl)!}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Live Embedded Video Preview"
                    />
                  </div>
                )}

                <div className="w-full space-y-2 pt-1">
                  {/* 1. Render Folder Groups in Live Preview */}
                  {treeShowFolders && collections.filter(col => {
                    const linksInFolder = chosenLinks.filter(l => col.linkIds && col.linkIds.includes(l.id));
                    return linksInFolder.length > 0;
                  }).map((col) => {
                    const linksInFolder = chosenLinks.filter(l => col.linkIds && col.linkIds.includes(l.id));
                    const isExpanded = !!expandedFolders[col.id];

                    let btnStyleClasses = s.buttonBg;
                    let textStyleClasses = s.buttonText;
                    let borderRoundClass = "rounded-xl border";

                    if (treeButtonStyle === "pill") {
                      btnStyleClasses = s.buttonBg;
                      textStyleClasses = s.buttonText;
                      borderRoundClass = "rounded-full border";
                    } else if (treeButtonStyle === "outline") {
                      btnStyleClasses = "bg-transparent border border-brand-500 text-brand-500 font-bold";
                      textStyleClasses = "text-brand-500";
                      borderRoundClass = "rounded-full";
                    } else if (treeButtonStyle === "brutalist") {
                      btnStyleClasses = "bg-brand-500 border border-zinc-950 text-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
                      textStyleClasses = "text-zinc-950 font-black";
                      borderRoundClass = "rounded-none";
                    } else if (treeButtonStyle === "glass") {
                      btnStyleClasses = "bg-white/15 border border-white/20 backdrop-blur-sm text-white";
                      textStyleClasses = "text-white font-semibold";
                      borderRoundClass = "rounded-xl";
                    } else if (treeButtonStyle === "soft-hover") {
                      btnStyleClasses = "bg-brand-500/10 border-none text-brand-500";
                      textStyleClasses = "text-brand-500 font-semibold";
                      borderRoundClass = "rounded-xl";
                    }

                    const customBtnStyle = treeButtonBgImage ? {
                      backgroundImage: `url(${treeButtonBgImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    } : {};

                    const finalBtnClasses = treeButtonBgImage ? "text-white" : btnStyleClasses;
                    const finalTextStyle = treeButtonBgImage ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-black" : textStyleClasses;

                    return (
                      <div key={col.id} className="w-full space-y-1">
                        <button
                          type="button"
                          onClick={() => setExpandedFolders(prev => ({ ...prev, [col.id]: !prev[col.id] }))}
                          style={customBtnStyle}
                          className={cn(
                            "w-full py-2 px-3 text-[10px] font-bold flex justify-between items-center transition-all shadow-sm cursor-pointer",
                            borderRoundClass,
                            finalBtnClasses
                          )}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isExpanded ? (
                              <FolderOpen className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                            ) : (
                              <Folder className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                            )}
                            <span className={cn(finalTextStyle, "truncate text-left")}>{col.name}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[8px] opacity-60 font-bold">
                              {linksInFolder.length}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3 opacity-80" />
                            ) : (
                              <ChevronDown className="w-3 h-3 opacity-80" />
                            )}
                          </div>
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="w-full pl-3 pr-0.5 space-y-1 border-l-2 border-dashed border-zinc-500/30 overflow-hidden"
                            >
                              {linksInFolder.map((link) => {
                                return (
                                  <div
                                    key={link.id}
                                    style={customBtnStyle}
                                    className={cn(
                                      "w-full py-1.5 px-3.5 text-[9px] font-bold flex justify-between items-center transition-all shadow-xs",
                                      borderRoundClass,
                                      finalBtnClasses,
                                      "bg-opacity-80 backdrop-blur-xs"
                                    )}
                                  >
                                    <span className="w-2" />
                                    <span className={finalTextStyle}>{link.title || link.shortSlug}</span>
                                    <ExternalLink className={cn("w-3 h-3 opacity-30", treeButtonBgImage && "text-white opacity-80 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]")} />
                                  </div>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}

                  {/* 2. Render Independent Flat Links in Live Preview */}
                  {(() => {
                    const folderLinkIds = new Set<string>();
                    if (treeShowFolders) {
                      collections.forEach(col => {
                        if (col.linkIds) {
                          col.linkIds.forEach((id: string) => folderLinkIds.add(id));
                        }
                      });
                    }

                    const flatLinks = chosenLinks.filter(l => !folderLinkIds.has(l.id));

                    return flatLinks.map((l) => {
                      let btnStyleClasses = s.buttonBg;
                      let textStyleClasses = s.buttonText;
                      let borderRoundClass = "rounded-xl border";

                      if (treeButtonStyle === "pill") {
                        btnStyleClasses = s.buttonBg;
                        textStyleClasses = s.buttonText;
                        borderRoundClass = "rounded-full border";
                      } else if (treeButtonStyle === "outline") {
                        btnStyleClasses = "bg-transparent border border-brand-500 text-brand-500 font-bold";
                        textStyleClasses = "text-brand-500";
                        borderRoundClass = "rounded-full";
                      } else if (treeButtonStyle === "brutalist") {
                        btnStyleClasses = "bg-brand-500 border border-zinc-950 text-zinc-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
                        textStyleClasses = "text-zinc-950 font-black";
                        borderRoundClass = "rounded-none";
                      } else if (treeButtonStyle === "glass") {
                        btnStyleClasses = "bg-white/15 border border-white/20 backdrop-blur-sm text-white";
                        textStyleClasses = "text-white font-semibold";
                        borderRoundClass = "rounded-xl";
                      } else if (treeButtonStyle === "soft-hover") {
                        btnStyleClasses = "bg-brand-500/10 border-none text-brand-500";
                        textStyleClasses = "text-brand-500 font-semibold";
                        borderRoundClass = "rounded-xl";
                      }

                      const customBtnStyle = treeButtonBgImage ? {
                        backgroundImage: `url(${treeButtonBgImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      } : {};
                      const finalBtnClasses = treeButtonBgImage ? "text-white" : btnStyleClasses;
                      const finalTextStyle = treeButtonBgImage ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-black" : textStyleClasses;

                      return (
                        <div
                          key={l.id}
                          style={customBtnStyle}
                          className={cn(
                            "w-full py-2 px-3 text-[10px] font-bold flex justify-between items-center transition-all shadow-sm select-auto",
                            borderRoundClass,
                            finalBtnClasses
                          )}
                        >
                          <span className="w-2" />
                          <span className={finalTextStyle}>{l.title || l.shortSlug}</span>
                          <ExternalLink className={cn("w-3 h-3 opacity-30", treeButtonBgImage && "text-white opacity-80 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]")} />
                        </div>
                      );
                    });
                  })()}

                  {chosenLinks.length === 0 && (
                    <div className="py-6 text-zinc-500 text-[9px] italic font-mono">
                      {t("noActiveLinksYet")}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
          <div className={cn(
            "absolute bottom-1 w-24 h-1 rounded-full left-1/2 -translate-x-1/2",
            isLightMode ? "bg-zinc-300" : "bg-zinc-805"
          )} />
        </div>
      </div>
    </div>
  );
}
