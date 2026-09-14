import React, { useState } from "react";
import { 
  Link2, ExternalLink, Instagram, Twitter, Linkedin, Youtube, Github, 
  Layers, Sparkles, Folder, FolderOpen, ChevronUp, ChevronDown 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { THEME_STYLES, getYouTubeEmbedUrl, TRANSLATIONS } from "../constants";
import { LinkData, LinkCollection } from "../types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PublicLinkTreeProps {
  publicTreeSettings: any;
  publicTreeLinks: LinkData[];
  publicTreeCollections: LinkCollection[];
  lang: "id" | "en";
}

export default function PublicLinkTree({ 
  publicTreeSettings, 
  publicTreeLinks, 
  publicTreeCollections,
  lang 
}: PublicLinkTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const t = (key: keyof typeof TRANSLATIONS.id) => {
    return TRANSLATIONS[lang]?.[key] || key;
  };

  const themeName = (publicTreeSettings.treeTheme || "slate") as keyof typeof THEME_STYLES;
  const theme = THEME_STYLES[themeName] || THEME_STYLES.slate;

  // Filter public links list based on owner settings and preserve custom order
  let activeTreeLinks: LinkData[] = [];
  if (Array.isArray(publicTreeSettings.treeLinks) && publicTreeSettings.treeLinks.length > 0) {
    const linkMap = new Map(publicTreeLinks.map(l => [l.id, l]));
    activeTreeLinks = publicTreeSettings.treeLinks
      .map((id: string) => linkMap.get(id))
      .filter((l): l is LinkData => Boolean(l) && (!l.expiresAt || new Date(l.expiresAt) > new Date()));
  } else {
    activeTreeLinks = [];
  }

  return (
    <div 
      className={cn("min-h-screen py-16 px-4 flex flex-col items-center justify-start", theme.bg)}
      style={publicTreeSettings.treeBgImage ? { backgroundImage: `url(${publicTreeSettings.treeBgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' } : {}}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md flex flex-col items-center text-center space-y-8"
      >
        {/* Avatar frame */}
        <div className="w-24 h-24 rounded-full border border-brand-500/25 p-1 bg-zinc-900/60 shadow-xl overflow-hidden shadow-brand-550/10 flex items-center justify-center">
          {publicTreeSettings.treeAvatar ? (
            <img src={publicTreeSettings.treeAvatar} alt={publicTreeSettings.treeTitle} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full bg-zinc-950 rounded-full flex items-center justify-center">
              <Link2 className="w-8 h-8 text-brand-500" />
            </div>
          )}
        </div>

        {/* User Bio */}
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight">{publicTreeSettings.treeTitle}</h1>
          <p className="text-xs opacity-70 font-mono tracking-wide max-w-xs mx-auto leading-relaxed">{publicTreeSettings.treeBio}</p>
        </div>

        {/* Social Icons row */}
        {(publicTreeSettings.treeInstagram || publicTreeSettings.treeTwitter || publicTreeSettings.treeLinkedIn || publicTreeSettings.treeYoutube || publicTreeSettings.treeGithub) && (
          <div className="flex items-center justify-center gap-3.5 py-1.5 flex-wrap">
            {publicTreeSettings.treeInstagram && (
              <a 
                href={`https://instagram.com/${publicTreeSettings.treeInstagram.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="text-zinc-400 hover:text-pink-500 hover:scale-110 active:scale-95 transition-all p-2 bg-zinc-900/45 border border-zinc-800 rounded-full w-10 h-10 flex items-center justify-center shadow-lg shadow-pink-500/5 hover:border-pink-500/20"
                title="Instagram"
              >
                <Instagram className="w-5 h-5 text-zinc-300 hover:text-pink-500 transition-colors" />
              </a>
            )}
            {publicTreeSettings.treeTwitter && (
              <a 
                href={`https://twitter.com/${publicTreeSettings.treeTwitter.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="text-zinc-400 hover:text-sky-450 hover:scale-110 active:scale-95 transition-all p-2 bg-zinc-900/45 border border-zinc-800 rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:border-sky-500/20"
                title="Twitter / X"
              >
                <Twitter className="w-4.5 h-4.5 text-zinc-300 hover:text-sky-400 transition-colors" />
              </a>
            )}
            {publicTreeSettings.treeLinkedIn && (
              <a 
                href={publicTreeSettings.treeLinkedIn.startsWith('http') ? publicTreeSettings.treeLinkedIn : `https://linkedin.com/in/${publicTreeSettings.treeLinkedIn}`}
                target="_blank"
                rel="noreferrer"
                className="text-zinc-400 hover:text-blue-500 hover:scale-110 active:scale-95 transition-all p-2 bg-zinc-900/45 border border-zinc-800 rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:border-blue-500/20"
                title="LinkedIn"
              >
                <Linkedin className="w-4.5 h-4.5 text-zinc-300 hover:text-blue-500 transition-colors" />
              </a>
            )}
            {publicTreeSettings.treeYoutube && (
              <a 
                href={publicTreeSettings.treeYoutube.startsWith('http') ? publicTreeSettings.treeYoutube : `https://youtube.com/@${publicTreeSettings.treeYoutube.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="text-zinc-400 hover:text-red-500 hover:scale-110 active:scale-95 transition-all p-2 bg-zinc-900/45 border border-zinc-800 rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:border-red-500/20"
                title="YouTube"
              >
                <Youtube className="w-4.5 h-4.5 text-zinc-300 hover:text-red-500 transition-colors" />
              </a>
            )}
            {publicTreeSettings.treeGithub && (
              <a 
                href={publicTreeSettings.treeGithub.startsWith('http') ? publicTreeSettings.treeGithub : `https://github.com/${publicTreeSettings.treeGithub}`}
                target="_blank"
                rel="noreferrer"
                className="text-zinc-400 hover:text-white hover:scale-110 active:scale-95 transition-all p-2 bg-zinc-900/45 border border-zinc-800 rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:border-white/20"
                title="GitHub"
              >
                <Github className="w-4.5 h-4.5 text-zinc-300 hover:text-white transition-colors" />
              </a>
            )}
          </div>
        )}

        {/* Embedded Video Bio Option */}
        {publicTreeSettings.treeVideoUrl && getYouTubeEmbedUrl(publicTreeSettings.treeVideoUrl) && (
          <div className="w-full my-4 rounded-3xl overflow-hidden border border-zinc-500/10 shadow-lg bg-zinc-950/45 aspect-video hover:border-zinc-500/25 transition-all">
            <iframe
              src={getYouTubeEmbedUrl(publicTreeSettings.treeVideoUrl)!}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Bio Embedded Video"
            />
          </div>
        )}

        {/* Render Link List */}
        <div className="w-full space-y-4">
          {/* 1. Render Folder Groups */}
          {publicTreeSettings.treeShowFolders !== false && publicTreeCollections.filter(col => {
            const linksInFolder = activeTreeLinks.filter(l => col.linkIds && col.linkIds.includes(l.id));
            return linksInFolder.length > 0;
          }).map((col, colIdx) => {
            const linksInFolder = activeTreeLinks.filter(l => col.linkIds && col.linkIds.includes(l.id));
            const isExpanded = !!expandedFolders[col.id];

            // Style class mappings based on treeButtonStyle configuration
            const btnStyleKey = publicTreeSettings.treeButtonStyle || "classic";
            let btnStyleClasses = theme.buttonBg;
            let textStyleClasses = theme.buttonText;
            let borderRoundClass = "rounded-2xl border";

            if (btnStyleKey === "pill") {
              btnStyleClasses = theme.buttonBg;
              textStyleClasses = theme.buttonText;
              borderRoundClass = "rounded-full border";
            } else if (btnStyleKey === "outline") {
              btnStyleClasses = "bg-transparent border border-brand-500 text-brand-500 font-bold hover:bg-brand-500/10";
              textStyleClasses = "text-brand-500";
              borderRoundClass = "rounded-full";
            } else if (btnStyleKey === "brutalist") {
              btnStyleClasses = "bg-brand-500 border border-zinc-950 text-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
              textStyleClasses = "text-zinc-950 font-black tracking-wide";
              borderRoundClass = "rounded-none";
            } else if (btnStyleKey === "glass") {
              btnStyleClasses = "bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20 text-white shadow-lg";
              textStyleClasses = "text-white font-semibold";
              borderRoundClass = "rounded-2xl";
            } else if (btnStyleKey === "soft-hover") {
              btnStyleClasses = "bg-brand-500/10 hover:bg-brand-500 text-brand-500 hover:text-white border-none";
              textStyleClasses = "text-brand-500 group-hover:text-white font-semibold";
              borderRoundClass = "rounded-xl";
            }

            const customBtnStyle = publicTreeSettings.treeButtonBgImage ? {
              backgroundImage: `url(${publicTreeSettings.treeButtonBgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : {};

            const finalBtnClasses = publicTreeSettings.treeButtonBgImage ? "text-white" : btnStyleClasses;
            const finalTextStyle = publicTreeSettings.treeButtonBgImage ? "text-white drop-shadow-[0_1.5px_2.5px_rgba(0,0,0,0.85)] font-black tracking-wide" : textStyleClasses;

            return (
              <div key={col.id} className="w-full space-y-2">
                <motion.button
                  onClick={() => setExpandedFolders(prev => ({ ...prev, [col.id]: !prev[col.id] }))}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: colIdx * 0.05 }}
                  style={customBtnStyle}
                  className={cn(
                    "w-full py-4 px-6 transition-all duration-300 flex justify-between items-center group relative overflow-hidden cursor-pointer",
                    borderRoundClass,
                    finalBtnClasses,
                    (btnStyleKey !== "brutalist" && !publicTreeSettings.treeButtonBgImage) && theme.shadow
                  )}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <FolderOpen className="w-5 h-5 text-brand-500 group-hover:scale-110 transition-all shrink-0" />
                    ) : (
                      <Folder className="w-5 h-5 text-brand-500 group-hover:scale-110 transition-all shrink-0" />
                    )}
                    <span className={cn(finalTextStyle, "text-left")}>{col.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider opacity-60 font-bold shrink-0">
                      {linksInFolder.length} {lang === "id" ? "tautan" : "links"}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 opacity-80 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 opacity-80 shrink-0" />
                    )}
                  </div>
                </motion.button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="w-full pl-4 pr-1 space-y-2 border-l-2 border-dashed border-zinc-500/30 overflow-hidden"
                    >
                      {linksInFolder.map((link, linkIdx) => {
                        const shortUrl = `/${link.shortSlug}`;
                        return (
                          <motion.a
                            key={link.id}
                            href={shortUrl}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: linkIdx * 0.03 }}
                            style={customBtnStyle}
                            className={cn(
                              "block w-full py-3.5 px-5 text-center transition-all duration-300 transform hover:-translate-y-0.5 flex justify-between items-center group relative overflow-hidden",
                              borderRoundClass,
                              finalBtnClasses,
                              "bg-opacity-80 backdrop-blur-sm"
                            )}
                          >
                            <span className="w-4" />
                            <span className={finalTextStyle}>{link.title || link.shortSlug}</span>
                            <ExternalLink className={cn("w-4 h-4 opacity-0 group-hover:opacity-100 transition-all text-brand-500 hover:scale-110", publicTreeSettings.treeButtonBgImage && "text-white opacity-80 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] group-hover:opacity-100")} />
                          </motion.a>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* 2. Render Independent Flat Links (Links that are NOT in any of the visible collections) */}
          {(() => {
            const folderLinkIds = new Set<string>();
            if (publicTreeSettings.treeShowFolders !== false) {
              publicTreeCollections.forEach(col => {
                if (col.linkIds) {
                  col.linkIds.forEach((id: string) => folderLinkIds.add(id));
                }
              });
            }

            const flatLinks = activeTreeLinks.filter(l => !folderLinkIds.has(l.id));

            return flatLinks.map((link, idx) => {
              const shortUrl = `/${link.shortSlug}`;
              
              // Style class mappings based on treeButtonStyle configuration
              const btnStyleKey = publicTreeSettings.treeButtonStyle || "classic";
              let btnStyleClasses = theme.buttonBg;
              let textStyleClasses = theme.buttonText;
              let borderRoundClass = "rounded-2xl border";

              if (btnStyleKey === "pill") {
                btnStyleClasses = theme.buttonBg;
                textStyleClasses = theme.buttonText;
                borderRoundClass = "rounded-full border";
              } else if (btnStyleKey === "outline") {
                btnStyleClasses = "bg-transparent border border-brand-500 text-brand-500 font-bold hover:bg-brand-500/10";
                textStyleClasses = "text-brand-500";
                borderRoundClass = "rounded-full";
              } else if (btnStyleKey === "brutalist") {
                btnStyleClasses = "bg-brand-500 border border-zinc-950 text-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
                textStyleClasses = "text-zinc-950 font-black tracking-wide";
                borderRoundClass = "rounded-none";
              } else if (btnStyleKey === "glass") {
                btnStyleClasses = "bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20 text-white shadow-lg";
                textStyleClasses = "text-white font-semibold";
                borderRoundClass = "rounded-2xl";
              } else if (btnStyleKey === "soft-hover") {
                btnStyleClasses = "bg-brand-500/10 hover:bg-brand-500 text-brand-500 hover:text-white border-none";
                textStyleClasses = "text-brand-500 group-hover:text-white font-semibold";
                borderRoundClass = "rounded-xl";
              }

              const customBtnStyle = publicTreeSettings.treeButtonBgImage ? {
                backgroundImage: `url(${publicTreeSettings.treeButtonBgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              } : {};

              const finalBtnClasses = publicTreeSettings.treeButtonBgImage ? "text-white" : btnStyleClasses;
              const finalTextStyle = publicTreeSettings.treeButtonBgImage ? "text-white drop-shadow-[0_1.5px_2.5px_rgba(0,0,0,0.85)] font-black tracking-wide" : textStyleClasses;

              return (
                <motion.a
                  key={link.id}
                  href={shortUrl}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  style={customBtnStyle}
                  className={cn(
                    "block w-full py-4 px-6 text-center transition-all duration-300 transform hover:-translate-y-1 flex justify-between items-center group relative overflow-hidden",
                    borderRoundClass,
                    finalBtnClasses,
                    (btnStyleKey !== "brutalist" && !publicTreeSettings.treeButtonBgImage) && theme.shadow
                  )}
                >
                  <span className="w-4" />
                  <span className={finalTextStyle}>{link.title || link.shortSlug}</span>
                  <ExternalLink className={cn("w-4 h-4 opacity-0 group-hover:opacity-100 transition-all text-brand-500 hover:scale-110", publicTreeSettings.treeButtonBgImage && "text-white opacity-80 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] group-hover:opacity-100")} />
                </motion.a>
              );
            });
          })()}

          {activeTreeLinks.length === 0 && (
            <div className="py-12 bg-zinc-950/40 border border-zinc-850 rounded-3xl text-zinc-500 text-xs font-mono italic">
              Belum ada tautan aktif yang disematkan.
            </div>
          )}
        </div>

        <div className="pt-8 opacity-40 hover:opacity-100 transition-opacity">
          <a href="/" className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase font-extrabold text-brand-500">
            <Sparkles className="w-3 h-3 animate-pulse" />
            Powered by Linkly
          </a>
        </div>
      </motion.div>
    </div>
  );
}
