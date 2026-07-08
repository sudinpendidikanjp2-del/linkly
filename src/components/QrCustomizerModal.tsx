import React, { useState } from "react";
import { Download, Copy, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { jsPDF } from "jspdf";
import { APP_THEME_CONFIGS, TRANSLATIONS } from "../constants";
import { LinkData } from "../types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface QrCustomizerModalProps {
  qrLink: LinkData | null;
  onClose: () => void;
  lang: "id" | "en";
  qrBgColor: string;
  setQrBgColor: (color: string) => void;
  qrFgColor: string;
  setQrFgColor: (color: string) => void;
  showQrLogo: boolean;
  setShowQrLogo: (show: boolean) => void;
  qrLogoUrl: string;
  setQrLogoUrl: (url: string) => void;
  appTheme: keyof typeof APP_THEME_CONFIGS;
}

export default function QrCustomizerModal({
  qrLink,
  onClose,
  lang,
  qrBgColor,
  setQrBgColor,
  qrFgColor,
  setQrFgColor,
  showQrLogo,
  setShowQrLogo,
  qrLogoUrl,
  setQrLogoUrl,
  appTheme,
}: QrCustomizerModalProps) {
  const [copiedQr, setCopiedQr] = useState(false);
  const curT = APP_THEME_CONFIGS[appTheme];

  const t = (key: keyof typeof TRANSLATIONS.id) => {
    return TRANSLATIONS[lang]?.[key] || key;
  };

  if (!qrLink) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-6 overflow-y-auto max-h-[85vh] sm:max-h-[90vh] overscroll-contain"
        >
          <div className="flex justify-between items-start">
            <div className="text-left">
              <h2 className="text-xl font-bold truncate pr-6">{qrLink.title || qrLink.shortSlug}</h2>
              <p className="text-xs text-brand-500 font-mono font-bold">/{qrLink.shortSlug}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400 hover:text-rose-500" />
            </button>
          </div>
          
          {/* QR Image Frame */}
          <div className="p-6 rounded-2xl inline-block max-w-[240px] max-h-[240px] mx-auto" style={{ backgroundColor: qrBgColor }}>
            <QRCodeSVG 
              id="linkly-qr-graphic"
              value={`${window.location.origin}/${qrLink.shortSlug}`}
              size={192}
              level="H"
              includeMargin={false}
              fgColor={qrFgColor}
              bgColor={qrBgColor}
              imageSettings={showQrLogo ? {
                src: qrLogoUrl,
                x: undefined,
                y: undefined,
                height: 38,
                width: 38,
                excavate: true,
              } : undefined}
            />
          </div>

          {/* Advanced Branding Color & Logo Customizer */}
          <div className="space-y-4 bg-zinc-950/40 p-4 rounded-2xl border border-zinc-800 text-left">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest text-center mb-1">{t("qrBranding")}</p>
            
            {/* Preset Themes Group */}
            <div className="space-y-1.5 border-b border-zinc-900/60 pb-3">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t("presetQuickThemes")}</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: "Modern Blue", fg: "#0284c7", bg: "#ffffff" },
                  { name: "Dark Orange", fg: "#fb923c", bg: "#09090b" },
                  { name: "Nature Green", fg: "#059669", bg: "#ffffff" },
                  { name: "Grape", fg: "#7c3aed", bg: "#ffffff" },
                  { name: "Black & White", fg: "#000000", bg: "#ffffff" }
                ].map((ps) => (
                  <button
                    key={ps.name}
                    type="button"
                    onClick={() => {
                      setQrFgColor(ps.fg);
                      setQrBgColor(ps.bg);
                    }}
                    className="text-[10px] font-bold px-2 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all text-zinc-300 cursor-pointer"
                  >
                    {ps.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">{t("qrColor")}</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={qrFgColor}
                    onChange={(e) => setQrFgColor(e.target.value)}
                    className="w-10 h-10 border-0 bg-transparent rounded cursor-pointer"
                  />
                  <span className="text-xs font-mono font-medium text-zinc-400">{qrFgColor.toUpperCase()}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">{t("backgroundColor")}</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={qrBgColor}
                    onChange={(e) => setQrBgColor(e.target.value)}
                    className="w-10 h-10 border-0 bg-transparent rounded cursor-pointer"
                  />
                  <span className="text-xs font-mono font-medium text-zinc-400">{qrBgColor.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Logo Center Toggle */}
            <div className="flex items-center justify-between border-t border-zinc-800 pt-3 mt-1">
              <div className="space-y-0.5">
                <label className="text-xs font-bold text-zinc-400">{t("qrCenterLogo")}</label>
                <p className="text-[10px] text-zinc-500">{t("showLogoInsideCenter")}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowQrLogo(!showQrLogo)}
                className={cn(
                  "w-10 h-5 rounded-full p-0.5 transition-colors relative duration-300",
                  showQrLogo ? "bg-brand-500" : "bg-zinc-800"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full bg-black transition-transform duration-300 transform",
                  showQrLogo ? "translate-x-5" : "translate-x-0"
                )} />
              </button>
            </div>

            {showQrLogo && (
              <div className="space-y-1.5 mt-2 pt-2 border-t border-zinc-800/60">
                <label className="text-xs font-bold text-zinc-400">{t("logoImageUrl")}</label>
                <input 
                  type="text"
                  value={qrLogoUrl}
                  onChange={(e) => setQrLogoUrl(e.target.value)}
                  placeholder="Masukkan URL Gambar..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-brand-500/50 text-xs font-mono text-white"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => {
                  const svgElement = document.getElementById('linkly-qr-graphic');
                  if (svgElement) {
                    const svgData = new XMLSerializer().serializeToString(svgElement);
                    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                    const url = URL.createObjectURL(svgBlob);
                    const downloadLink = document.createElement('a');
                    downloadLink.href = url;
                    downloadLink.download = `qr-${qrLink.shortSlug}.svg`;
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                  }
                }}
                className="py-2.5 bg-zinc-800 hover:bg-zinc-705 bg-zinc-800/80 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors text-[11px] flex flex-col items-center justify-center gap-1"
                title="Unduh format SVG"
              >
                <Download className="w-3.5 h-3.5 text-zinc-400" />
                SVG
              </button>
              <button 
                onClick={() => {
                  const svgElement = document.getElementById('linkly-qr-graphic');
                  if (svgElement) {
                    const svgString = new XMLSerializer().serializeToString(svgElement);
                    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                    const blobURL = window.URL.createObjectURL(svgBlob);
                    
                    const image = new Image();
                    image.crossOrigin = "anonymous";
                    image.onload = () => {
                      const canvas = document.createElement('canvas');
                      canvas.width = 1024;
                      canvas.height = 1024;
                      const context = canvas.getContext('2d');
                      if (context) {
                        context.fillStyle = qrBgColor;
                        context.fillRect(0, 0, canvas.width, canvas.height);
                        context.drawImage(image, 0, 0, canvas.width, canvas.height);
                        
                        const pngUrl = canvas.toDataURL('image/png');
                        const downloadLink = document.createElement('a');
                        downloadLink.href = pngUrl;
                        downloadLink.download = `qr-${qrLink.shortSlug}.png`;
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);
                      }
                      window.URL.revokeObjectURL(blobURL);
                    };
                    image.src = blobURL;
                  }
                }}
                className="py-2.5 bg-zinc-805 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors text-[11px] flex flex-col items-center justify-center gap-1"
                title="Unduh format PNG"
              >
                <Download className="w-3.5 h-3.5 text-zinc-400" />
                PNG
              </button>
              <button 
                onClick={() => {
                  const svgElement = document.getElementById('linkly-qr-graphic');
                  if (svgElement) {
                    const svgString = new XMLSerializer().serializeToString(svgElement);
                    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                    const blobURL = window.URL.createObjectURL(svgBlob);
                    
                    const image = new Image();
                    image.crossOrigin = "anonymous";
                    image.onload = () => {
                      const canvas = document.createElement('canvas');
                      canvas.width = 1500;
                      canvas.height = 1500;
                      const context = canvas.getContext('2d');
                      if (context) {
                        context.fillStyle = qrBgColor;
                        context.fillRect(0, 0, canvas.width, canvas.height);
                        context.drawImage(image, 0, 0, canvas.width, canvas.height);
                        
                        const pngUrl = canvas.toDataURL('image/png');
                        
                        const pdf = new jsPDF({
                          orientation: "portrait",
                          unit: "mm",
                          format: "a4"
                        });
                        
                        // High Resolution page markup with brand colors
                        pdf.setFillColor(15, 15, 15);
                        pdf.rect(0, 0, 210, 297, "F");
                        
                        // Header banner
                        pdf.setFillColor(251, 146, 60);
                        pdf.rect(0, 0, 210, 15, "F");
                        
                        // Title
                        pdf.setTextColor(251, 146, 60);
                        pdf.setFont("helvetica", "bold");
                        pdf.setFontSize(22);
                        pdf.text("Linkly QR Code Portal", 105, 45, { align: "center" });
                        
                        // Subtitle
                        pdf.setTextColor(244, 244, 245);
                        pdf.setFont("helvetica", "normal");
                        pdf.setFontSize(14);
                        pdf.text(`${qrLink.title || qrLink.shortSlug}`, 105, 55, { align: "center" });
                        
                        // Destination / Short link URL reference
                        pdf.setTextColor(161, 161, 170);
                        pdf.setFont("courier", "bold");
                        pdf.setFontSize(12);
                        const slugUrl = `${window.location.origin}/${qrLink.shortSlug}`;
                        pdf.text(slugUrl, 105, 65, { align: "center" });
                        
                        // QR image
                        pdf.addImage(pngUrl, 'PNG', 45, 80, 120, 120);
                        
                        // Footer note
                        pdf.setTextColor(113, 113, 122);
                        pdf.setFont("helvetica", "italic");
                        pdf.setFontSize(10);
                        pdf.text("Terbangkan Tautan Anda Bersama Linkly SaaS URL Shortener", 105, 240, { align: "center" });
                        
                        pdf.save(`qr-${qrLink.shortSlug}.pdf`);
                      }
                      window.URL.revokeObjectURL(blobURL);
                    };
                    image.src = blobURL;
                  }
                }}
                className="py-2.5 bg-zinc-805 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors text-[11px] flex flex-col items-center justify-center gap-1"
                title="Unduh format PDF"
              >
                <Download className="w-3.5 h-3.5 text-zinc-400" />
                PDF
              </button>
            </div>

            <button 
              onClick={() => {
                const svgElement = document.getElementById('linkly-qr-graphic');
                if (svgElement) {
                  const svgString = new XMLSerializer().serializeToString(svgElement);
                  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                  const blobURL = window.URL.createObjectURL(svgBlob);
                  
                  const image = new Image();
                  image.crossOrigin = "anonymous";
                  image.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 1024;
                    canvas.height = 1024;
                    const context = canvas.getContext('2d');
                    if (context) {
                      context.fillStyle = qrBgColor;
                      context.fillRect(0, 0, canvas.width, canvas.height);
                      context.drawImage(image, 0, 0, canvas.width, canvas.height);
                      
                      canvas.toBlob(async (blob) => {
                        if (blob) {
                          try {
                            await navigator.clipboard.write([
                              new ClipboardItem({ 'image/png': blob })
                            ]);
                            setCopiedQr(true);
                            setTimeout(() => setCopiedQr(false), 2000);
                          } catch (err) {
                            console.error("Failed to copy QR to clipboard:", err);
                          }
                        }
                      }, 'image/png');
                    }
                    window.URL.revokeObjectURL(blobURL);
                  };
                  image.src = blobURL;
                }
              }}
              className={cn(
                "w-full py-2.5 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-2",
                copiedQr 
                  ? "bg-green-500/10 border border-green-500 text-green-500" 
                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-350 border border-zinc-700"
              )}
            >
              {copiedQr ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  {t("qrCopied")}
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-zinc-400" />
                  {t("copyQrBtn")}
                </>
              )}
            </button>

            <button 
              onClick={onClose}
              className={cn("w-full py-3 text-black font-extrabold rounded-xl transition-colors font-semibold text-sm", curT.bg, curT.hoverBg)}
            >
              {t("done") || "Selesai"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
