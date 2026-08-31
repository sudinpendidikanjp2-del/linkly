import React, { useState, useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  Layers,
  Folder,
  Tag,
  HelpCircle,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { APP_THEME_CONFIGS, CATEGORY_OPTIONS, TRANSLATIONS } from "../constants";
import { BulkImportItem, LinkCollection } from "../types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: "id" | "en";
  collections: LinkCollection[];
  onBulkImport: (items: BulkImportItem[]) => Promise<void>;
  isLightMode: boolean;
  appTheme: keyof typeof APP_THEME_CONFIGS;
  isImporting: boolean;
}

export default function BulkImportModal({
  isOpen,
  onClose,
  lang,
  collections,
  onBulkImport,
  isLightMode,
  appTheme,
  isImporting,
}: BulkImportModalProps) {
  const [activeTab, setActiveTab] = useState<"file" | "paste">("file");
  const [rawText, setRawText] = useState("");
  const [defaultCategory, setDefaultCategory] = useState("general");
  const [defaultCollectionId, setDefaultCollectionId] = useState("");
  const [parsedItems, setParsedItems] = useState<BulkImportItem[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const curT = APP_THEME_CONFIGS[appTheme];

  const t = (key: keyof typeof TRANSLATIONS.id) => {
    return TRANSLATIONS[lang]?.[key] || key;
  };

  const parseCsvContent = (text: string) => {
    try {
      const lines = text.split(/\r?\n/);
      const items: BulkImportItem[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV splitting (url,slug,title,category)
        const parts = line.split(",").map((p) => p.trim());
        const originalUrl = parts[0];

        if (!originalUrl) continue;

        // Skip CSV header line if present
        if (i === 0 && (originalUrl.toLowerCase() === "url" || originalUrl.toLowerCase() === "original_url")) {
          continue;
        }

        const shortSlug = parts[1] || undefined;
        const title = parts[2] || undefined;
        const category = parts[3] || defaultCategory || undefined;
        const collectionId = defaultCollectionId || undefined;

        items.push({
          originalUrl,
          shortSlug,
          title,
          category,
          collectionId,
        });
      }

      if (items.length === 0) {
        throw new Error(lang === "id" ? "Tidak ada baris data valid yang ditemukan." : "No valid data rows found.");
      }

      setParsedItems(items);
      setParseError(null);
    } catch (err: any) {
      setParseError(err.message || "Gagal mengurai file / Fail to parse file.");
      setParsedItems([]);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setRawText(text);
    if (text.trim()) {
      parseCsvContent(text);
    } else {
      setParsedItems([]);
      setParseError(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setRawText(text);
      parseCsvContent(text);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        setRawText(text);
        parseCsvContent(text);
      };
      reader.readAsText(file);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,original_url,short_slug,title,category\nhttps://google.com,google,Google Search,social\nhttps://github.com,github,GitHub Development,work\nhttps://youtube.com,yt,YouTube Video,personal";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "linkly_bulk_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportSubmit = async () => {
    if (parsedItems.length === 0) return;
    await onBulkImport(parsedItems);
  };

  const handleReset = () => {
    setRawText("");
    setParsedItems([]);
    setParseError(null);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  const bgModal = isLightMode ? "bg-white border-zinc-200" : "bg-zinc-900 border-zinc-800";
  const bgOverlay = "bg-black/60 backdrop-blur-xs";
  const textTitle = isLightMode ? "text-zinc-900" : "text-white";
  const textMuted = isLightMode ? "text-zinc-500" : "text-zinc-400";
  const inputBg = isLightMode ? "bg-zinc-100 border-zinc-200 text-zinc-900 focus:bg-white" : "bg-zinc-950 border-zinc-800 text-zinc-100 focus:bg-black";
  const dropzoneBg = dragOver 
    ? (isLightMode ? "bg-brand-50 border-brand-500" : "bg-brand-950/20 border-brand-500") 
    : (isLightMode ? "bg-zinc-50 border-zinc-200 hover:bg-zinc-100/50" : "bg-zinc-950/50 border-zinc-800 hover:bg-zinc-950");

  return (
    <div className={cn("fixed inset-0 z-50 flex items-center justify-center p-4", bgOverlay)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn("relative w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]", bgModal)}
      >
        {/* Header */}
        <div className="p-6 border-b border-inherit flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-brand-500/10 text-brand-500")}>
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h2 className={cn("text-xl font-black", textTitle)}>
                {lang === "id" ? "Impor Tautan Massal" : "Bulk Link Import"}
              </h2>
              <p className="text-xs text-zinc-400 font-medium">
                {lang === "id" ? "Unggah banyak tautan & slug kustom sekaligus" : "Upload multiple links and custom slugs at once"}
              </p>
            </div>
          </div>
          <button
            id="btn-close-bulk-import"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-500/10 transition-colors cursor-pointer text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Grid Layout */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          {/* Left Column: Form / Import Input */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {/* Tabs */}
            <div className="flex bg-zinc-500/5 p-1 rounded-xl">
              <button
                id="btn-tab-file-upload"
                onClick={() => { setActiveTab("file"); handleReset(); }}
                className={cn(
                  "flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer",
                  activeTab === "file"
                    ? (isLightMode ? "bg-white text-zinc-900 shadow-sm" : "bg-zinc-800 text-white shadow-xs")
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                <Upload className="w-3.5 h-3.5" />
                {lang === "id" ? "Unggah File" : "Upload File"}
              </button>
              <button
                id="btn-tab-text-paste"
                onClick={() => { setActiveTab("paste"); handleReset(); }}
                className={cn(
                  "flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer",
                  activeTab === "paste"
                    ? (isLightMode ? "bg-white text-zinc-900 shadow-sm" : "bg-zinc-800 text-white shadow-xs")
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                {lang === "id" ? "Tempel Teks" : "Paste Text"}
              </button>
            </div>

            {/* Main Area based on Active Tab */}
            {activeTab === "file" ? (
              <div
                id="dropzone-bulk-import"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[220px]",
                  dropzoneBg
                )}
              >
                <input
                  id="input-file-bulk-import"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,.txt"
                  className="hidden"
                />
                <div className="w-12 h-12 bg-brand-500/10 text-brand-500 rounded-2xl flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 animate-bounce" />
                </div>
                {fileName ? (
                  <div className="space-y-1">
                    <p className={cn("text-sm font-bold", textTitle)}>{fileName}</p>
                    <p className="text-xs text-brand-500 font-bold flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {lang === "id" ? "File siap diimpor" : "File ready for import"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-w-sm">
                    <p className={cn("text-sm font-bold", textTitle)}>
                      {lang === "id" ? "Tarik & Lepas File ke Sini" : "Drag & Drop File Here"}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {lang === "id"
                        ? "Mendukung file .csv atau .txt berisi format URL,Slug,Judul"
                        : "Supports .csv or .txt with URL,Slug,Title format"}
                    </p>
                    <p className="text-[10px] text-zinc-500 pt-2 font-mono">
                      {lang === "id" ? "Klik untuk mencari file" : "Click to browse files"}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 flex-1 flex flex-col min-h-[220px]">
                <textarea
                  id="textarea-raw-paste"
                  value={rawText}
                  onChange={handleTextChange}
                  placeholder="https://example.com, example-slug, My Title, general&#10;https://another.com, another-slug, Another Title"
                  className={cn(
                    "w-full flex-1 min-h-[200px] p-4 rounded-2xl border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none",
                    inputBg
                  )}
                />
                <p className="text-[10px] text-zinc-500 text-left">
                  {lang === "id" 
                    ? "Format baris: URL, Slug, Judul, Kategori (opsional)" 
                    : "Line format: URL, Slug, Title, Category (optional)"}
                </p>
              </div>
            )}

            {/* Options Panel */}
            <div className="p-4 rounded-2xl bg-zinc-500/5 border border-zinc-500/10 space-y-3 text-left">
              <h4 className={cn("text-xs font-black tracking-wide uppercase", textTitle)}>
                {lang === "id" ? "Aturan & Konfigurasi Default" : "Rules & Default Configuration"}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={cn("text-xs font-bold flex items-center gap-1.5", textMuted)}>
                    <Tag className="w-3.5 h-3.5" />
                    {lang === "id" ? "Kategori Default" : "Default Category"}
                  </label>
                  <select
                    id="select-default-category"
                    value={defaultCategory}
                    onChange={(e) => {
                      setDefaultCategory(e.target.value);
                      if (parsedItems.length > 0) {
                        setParsedItems((prev) =>
                          prev.map((it) => ({ ...it, category: it.category || e.target.value }))
                        );
                      }
                    }}
                    className={cn("w-full rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/50 cursor-pointer border", inputBg)}
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {lang === "id" ? cat.labelIdText : cat.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className={cn("text-xs font-bold flex items-center gap-1.5", textMuted)}>
                    <Folder className="w-3.5 h-3.5" />
                    {lang === "id" ? "Folder / Koleksi Default" : "Default Folder / Collection"}
                  </label>
                  <select
                    id="select-default-collection"
                    value={defaultCollectionId}
                    onChange={(e) => {
                      setDefaultCollectionId(e.target.value);
                      if (parsedItems.length > 0) {
                        setParsedItems((prev) =>
                          prev.map((it) => ({ ...it, collectionId: e.target.value || undefined }))
                        );
                      }
                    }}
                    className={cn("w-full rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/50 cursor-pointer border", inputBg)}
                  >
                    <option value="">{lang === "id" ? "-- Tanpa Folder --" : "-- No Folder --"}</option>
                    {collections.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Real-time Live Preview */}
          <div className="lg:col-span-5 flex flex-col border-t lg:border-t-0 lg:border-l border-inherit lg:pl-6 pt-6 lg:pt-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className={cn("text-xs font-black tracking-wide uppercase", textTitle)}>
                {lang === "id" ? "Pratinjau Impor" : "Import Preview"} ({parsedItems.length})
              </h3>
              <button
                id="btn-download-template"
                onClick={downloadSampleTemplate}
                className="text-[10px] text-brand-500 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                {lang === "id" ? "Unduh Templat" : "Download Template"}
              </button>
            </div>

            {parseError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-start gap-2 text-left mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{parseError}</span>
              </div>
            )}

            {parsedItems.length === 0 ? (
              <div className="flex-1 rounded-2xl bg-zinc-500/5 border border-zinc-500/10 p-6 flex flex-col items-center justify-center text-center">
                <FileText className="w-8 h-8 text-zinc-500 mb-2" />
                <p className="text-xs text-zinc-500 font-medium">
                  {lang === "id"
                    ? "Isi teks atau pilih file di sebelah kiri untuk melihat pratinjau tautan"
                    : "Fill text or choose a file on the left to preview links"}
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[350px]">
                {parsedItems.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-xl bg-zinc-500/5 border border-zinc-500/10 text-left relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className={cn("text-xs font-bold truncate flex-1", textTitle)}>
                        {item.title || item.originalUrl}
                      </p>
                      <span className="text-[9px] bg-brand-500/10 text-brand-500 px-1.5 py-0.5 rounded-md font-mono font-bold shrink-0">
                        /{item.shortSlug || "random"}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 truncate mb-1.5">{item.originalUrl}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[9px] bg-zinc-500/10 text-zinc-400 px-1.5 py-0.5 rounded-full font-bold">
                        {item.category || defaultCategory}
                      </span>
                      {item.collectionId && (
                        <span className="text-[9px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded-full font-bold">
                          {collections.find((c) => c.id === item.collectionId)?.name || "Folder"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-inherit flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-left">
            {parsedItems.length > 0 && (
              <p className="text-xs text-brand-500 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {lang === "id"
                  ? `${parsedItems.length} tautan akan diimpor dan duplikat slug akan otomatis dilewati.`
                  : `${parsedItems.length} links ready to import. Duplicate slugs will be automatically skipped.`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 justify-end">
            <button
              id="btn-bulk-import-reset"
              onClick={handleReset}
              disabled={parsedItems.length === 0}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                parsedItems.length === 0
                  ? "opacity-40 cursor-not-allowed text-zinc-500"
                  : "text-red-500 hover:bg-red-500/10"
              )}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {lang === "id" ? "Reset" : "Reset"}
            </button>
            <button
              id="btn-bulk-import-submit"
              onClick={handleImportSubmit}
              disabled={parsedItems.length === 0 || isImporting}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md",
                parsedItems.length === 0 || isImporting
                  ? "bg-zinc-500/20 text-zinc-500 cursor-not-allowed shadow-none"
                  : (isLightMode 
                      ? "bg-zinc-900 hover:bg-zinc-800 text-white" 
                      : cn(curT.bg, curT.hoverBg, "text-black"))
              )}
            >
              {isImporting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-current" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {lang === "id" ? "Memproses..." : "Processing..."}
                </>
              ) : (
                <>
                  {lang === "id" ? "Mulai Impor" : "Start Import"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}