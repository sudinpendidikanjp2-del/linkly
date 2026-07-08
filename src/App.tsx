import React, { useState, useEffect } from "react";
import { auth, db, onAuthStateChanged, User, signInWithPopup, googleProvider, signOut, collection, doc, getDoc, setDoc, onSnapshot, query, where, deleteDoc, updateDoc, Timestamp, increment, getDocFromServer, getDocs } from "./api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link2, LayoutDashboard, Settings, LogOut, Plus, Search, Filter, ArrowUpDown, QrCode, ExternalLink, Trash2, Edit2, Copy, Check, AlertCircle, Clock, MousePointer2, Lock, Unlock, Layers, Activity, Sparkles, CheckSquare, Square, Download, RefreshCw, Globe, Laptop, Smartphone, Tablet, Shield, Compass, User as UserIcon, ArrowLeft, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Calendar, SlidersHorizontal, List, Eye, EyeOff, Sun, Moon, Upload, Image, Instagram, Twitter, Linkedin, Folder, FolderPlus, FolderOpen, Share2, Youtube, Github } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { jsPDF } from "jspdf";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from "recharts";
import { format } from "date-fns";
import { nanoid } from "nanoid";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { LinkData, ClickEvent, LinkCollection, GlobalSettings, OperationType, FirestoreErrorInfo } from "./types";
import { TRANSLATIONS, APP_THEME_CONFIGS, THEME_PALETTES, THEME_STYLES } from "./constants";

// Import modular pages
import AuthPage from "./pages/AuthPage";
import PublicLinkTree from "./pages/PublicLinkTree";
import DashboardPage from "./pages/DashboardPage";
import LinksListPage from "./pages/LinksListPage";
import LinkDetailPage from "./pages/LinkDetailPage";
import CollectionsPage from "./pages/CollectionsPage";
import LinkTreePage from "./pages/LinkTreePage";

// Import modular components
import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";
import CreateLinkModal from "./components/CreateLinkModal";
import QrCustomizerModal from "./components/QrCustomizerModal";
import FolderGroupModal from "./components/FolderGroupModal";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // Not throwing an error here to prevent unhandled script crashes in asynchronous onSnapshot listeners.
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your database configuration. ");
    }
  }
}
testConnection();



const LOCAL_UNUSED_TRANSLATIONS = {
  id: {
    rowsPerPage: "Baris per halaman:",
    showing: "Menampilkan",
    of: "dari",
    links: "tautan",
    myLinks: "Tautan Saya",
    defaultBioDesc: "Selamat datang di Link Tree kustom saya!",
    noActiveLinks: "Belum ada tautan aktif",
    noFilteredLinks: "Tidak ada tautan terdaftar pada kriteria ini. Buat yang baru untuk memulai!",
    loadingLinktree: "Memuat Link Tree...",
    pageNotFound: "Halaman Tidak Ditemukan",
    linktreeNotFoundDesc: "Link Tree atau portofolio tautan dengan profil ini belum dikonfigurasi atau tidak tersedia.",
    openLinklyDashboard: "Buka Dashboard Linkly",
    noPinnedActiveLinks: "Belum ada tautan aktif yang disematkan.",
    dashboard: "Dashboard",
    linksList: "Daftar Link",
    linkTree: "Bio Linktree",
    settings: "Pengaturan Utama",
    logout: "Keluar Sesi",
    login: "Masuk dengan Google",
    loginDesc: "Persingkat tautan Anda, dapatkan QR Code kustom, dan kelola portofolio mini Bio Anda secara instan.",
    poweredBy: "Didukung oleh",
    welcome: "Selamat Datang Kembali",
    totalLinks: "Total Tautan",
    totalClicks: "Total Klik",
    avgCtr: "Rata-rata Klik",
    securityStatus: "Sistem Pengaman",
    activeLinks: "Tautan Aktif",
    linksWithPassword: "terproteksi sandi",
    activeCount: "aktif penuh",
    createLink: "Buat Tautan Baru",
    editLink: "Ubah Parameter Tautan",
    shortenLinkBtn: "Singkat & Amankan",
    originalUrl: "Tautan Asli (Original URL)",
    customSlug: "Domain / Slug Kustom",
    passwordTitle: "Kata Sandi (Opsional)",
    landingPageTitle: "Aktifkan Landing Portal",
    landingPageDesc: "Tampilkan halaman transisi informasi untuk mengonfirmasi pengalihan web aman.",
    expiryTitle: "Tanggal Kedaluwarsa (Opsional)",
    aiMetaTitle: "Hasilkan Metadata Otomatis (Gemini AI)",
    aiMetaDesc: "Buat deskripsi halaman & judul cerdas secara instan memakai deteksi kecerdasan buatan.",
    saveBtn: "Simpan Tautan",
    savingBtn: "Menyimpan...",
    cancelBtn: "Batal",
    customSlugPlaceholder: "Masukkan slug kustom (contoh: promo-lebaran)",
    urlPlaceholder: "Masukkan URL panjang (contoh: https://google.com/search?q=123)",
    searchPlaceholder: "Cari judul, URL asli, atau slug...",
    filterOptions: "Penyaringan & Filter Lanjutan",
    clicksMin: "Klik Minimal",
    passwordFilter: "Sandi Keamanan",
    portalFilter: "Landing Portal",
    clearFilters: "Bersihkan Filter",
    all: "Semua",
    protectedOnly: "Hanya Terproteksi",
    notProtected: "Tanpa Proteksi",
    enabled: "Aktif",
    disabled: "Tidak Aktif",
    noLinks: "Belum Ada Tautan",
    noLinksDesc: "Silakan persingkat tautan pertama Anda menggunakan tombol di atas.",
    noSearchResults: "Tidak ada tautan yang cocok dengan kriteria pencarian Anda.",
    slugText: "Slug",
    createdText: "Dibuat",
    clicksText: "Klik",
    actionsText: "Operasi",
    manageTree: "Konfigurasi Bio Linktree",
    treeTitleLabel: "Nama Profil / Judul",
    treeBioLabel: "Deskripsi Singkat / Bio",
    treeAvatarLabel: "URL Foto Profil",
    treeThemeLabel: "Pilih Gaya Visual / Tema",
    selectLinksText: "Pilih Tautan yang Ditampilkan di Profil",
    saveTree: "Simpan Konfigurasi Profil",
    treeSavedAlert: "Konfigurasi Bio Linktree berhasil disimpan!",
    copyTreeBtn: "Salin Link Bio",
    visitTreeBtn: "Kunjungi Bio",
    customQr: "Kustomisasi QR Code",
    logoText: "URL Gambar Tengah (Logo URL)",
    fgColorText: "Warna Utama QR (Foreground)",
    bgColorText: "Warna Latar Belakang",
    qrSizeText: "Ukuran QR Code",
    downloadSvg: "Unduh file SVG",
    downloadPng: "Unduh file PNG",
    downloadPdf: "Unduh laporan PDF",
    copyQrBtn: "Salin Gambar QR",
    qrCopied: "Gambar QR disalin ke Clipboard!",
    qrCopyFail: "Gagal menyalin gambar QR.",
    trends: "Tren Kunjungan",
    countries: "Negara",
    devices: "Perangkat",
    ips: "IP Pengunjung",
    geo: "Geolokasi",
    browser: "Peramban",
    visitHistory: "Riwayat Akses Klik",
    detailLinkManage: "Kelola Tautan",
    viewDetails: "Analisis Detail",
    copyUrlSuccess: "Short URL berhasil disalin!",
    lightMode: "Mode Terang",
    darkMode: "Mode Gelap",
    language: "Bahasa",
    linksListHeader: "Daftar Tautan",
    linksListSubtitle: "Kelola semua link yang telah Anda perpendek lengkap dengan filter query dan pagination.",
    shortenNewLink: "Perpendek Link Baru",
    advancedFilter: "Filter Lanjutan",
    passwordSecurity: "Proteksi Kata Sandi",
    allLinks: "Semua Tautan",
    passwordProtectedOnly: "Hanya yang Berkata Sandi",
    openLinksOnly: "Hanya yang Terbuka/Bebas",
    infoPortalStatus: "Status Portal Info",
    allPortalStatus: "Semua Status Portal",
    landingPortalActive: "Portal Landing Aktif",
    noLandingPortal: "Tanpa Halaman Portal",
    minClickCount: "Minimal Jumlah Klik",
    minClickPlaceholder: "Contoh: 10",
    selectAll: "Pilih Semua",
    titleAndDestination: "Judul & Tujuan",
    clickActivity: "Aktivitas Klik",
    status: "Status",
    securityAndFeatures: "Pengaman & Fitur",
    manageAction: "Aksi Kelola",
    quickTransition: "Pindah Cepat",
    mainDestination: "Tujuan Utama",
    parameterDasar: "Parameter Dasar & Pengaman",
    parameterSubtitle: "Ubah atribut parameter, pengaman sandi, dan landing portal info.",
    judulPenanda: "Judul Penanda Tautan",
    judulPenandaPlaceholder: "Contoh: Link Promosi Juli",
    tautanTujuanUtama: "Tautan Tujuan Utama",
    customShortSlug: "Custom Short Slug",
    slugPlaceholder: "slug-kustom",
    expiryDate: "Tanggal Kedaluwarsa",
    passwordLabel: "Kata Sandi Pengaman (Opsional)",
    passwordProtected: "Dilindungi",
    passwordFree: "Bebas Akses",
    passwordPlaceholder: "Biarkan kosong jika tanpa password",
    statusTautan: "Status Tautan (Aktif / Nonaktif)",
    tautanMutedDesc: "Tautan nonaktif akan menampilkan halaman blokir jika diklik.",
    aktifkanHalamanPortal: "Aktifkan Halaman Portal",
    tautanPortalDesc: "Tampilkan halaman splash kustom sebelum menuju link asli.",
    deskripsiAtributLanding: "Deskripsi Atribut Landing Portal",
    deskripsiLandingPlaceholder: "Tulis deskripsi atau sambutan untuk audiens Anda...",
    urlGambarProfil: "URL Gambar/Avatar Pendukung",
    simpanPerubahan: "Simpan Perubahan Tautan",
    berhasilDisimpan: "✓ Berhasil Disimpan!",
    downloadQrCode: "Unduh QR Code Link",
    unduhQrSubtitle: "Gunakan QR Code kustom premium untuk selebaran fisik.",
    kustomisasiQr: "Kustomisasi QR",
    panelAuditTrafik: "Panel Audit Trafik Tautan",
    auditSubtitle: "Grafik kunjungan dan logging alamat IP penjelajah.",
    trenAktivitas7Hari: "Aktivitas Klik 7 Hari Terakhir",
    subTabTrends: "Tren",
    subTabGeo: "Geo",
    subTabDevices: "Alat",
    subTabIps: "Audit IP",
    kembaliKeDaftar: "Kembali ke Daftar Link",
    kelolaTautanHeader: "Kelola Tautan",
    customBioTreeHeader: "Kustomisasi Bio Link Tree Anda",
    customBioTreeSubtitle: "Rancang satu halaman tunggal mewah untuk menampilkan seluruh tautan penting Anda sekaligus.",
    publicBioUrlTitle: "Tautan Publik Halaman Bio Anda",
    profileAndDescription: "Profil & Deskripsi",
    previewPhoto: "Preview Foto",
    photoUrlLabel: "Tautan Foto Profil/Avatar",
    enterPhotoUrlPlaceholder: "Masukkan URL foto profil Anda...",
    bioTitleLabel: "Judul Bio Halaman",
    bioTitlePlaceholder: "Nama atau Judul Anda...",
    bioShortDescLabel: "Deskripsi / Bio Singkat",
    bioShortDescPlaceholder: "Tulis bio singkat atau deskripsi...",
    choosePageTheme: "Pilih Tema Halaman",
    selectDisplayedLinks: "Pilih Tautan yang Ditampilkan",
    displayedLinksHelp: "Gunakan toggle untuk menyematkan ke Bio Anda.",
    noLinksCreated: "Belum ada list tautan yang dibuat.",
    saveConfiguration: "Simpan Konfigurasi",
    configSavedSuccess: "✓ Konfigurasi halaman Bio kustom Anda berhasil disimpan ke Cloud secara permanen!",
    loginSubtitle: "Perpendek URL, rancang halaman bio profil, dan simpan/analisis klik secara dinamis.",
    registrationDisabled: "Pendaftaran saat ini sedang dinonaktifkan oleh administrator.",
    pemberianMerekQr: "Pemberian Merek QR",
    presetTemaCepat: "Preset Tema Cepat",
    warnaQr: "Warna QR",
    latarBelakang: "Latar Belakang",
    logoTengahQr: "Logo Tengah QR",
    tampilkanLogoDesc: "Tampilkan logo di bagian tengah QR Code.",
    tautanGambarLogo: "Tautan Gambar Logo",
    tautanBentukMewah: "Rancang halaman kustom kustomisasi lengkap.",
    bulkDelete: "Hapus Massal",
    created: "Dibuat",
    action: "Aksi",
    clicks: "Klik",
    ofTotalClicks: "dari total klik",
    operatingSystems: "Sistem Operasi",
    browsersAndReferrers: "Peramban & Rujukan",
    topCountries: "Negara Teratas",
    topRegions: "Wilayah / Kota Teratas",
    visitorIpAudit: "Audit Alamat IP Pengunjung",
    ipAddress: "Alamat IP",
    country: "Negara",
    interaction: "Interaksi",
    noIpLogs: "Belum ada log IP yang tercatat.",
    clicksByCountry: "Negara & Regional Klik",
    topReferrers: "Sumber Situs Rujukan Utama",
    noReferrals: "Belum ada rujukan luar.",
    searchHint: "Cari judul, slug, atau tujuan...",
    active: "Aktif",
    expired: "Expired",
    qrBranding: "Pemberian Merek QR",
    presetQuickThemes: "Preset Tema Cepat",
    qrColor: "Warna QR",
    backgroundColor: "Latar Belakang",
    qrCenterLogo: "Logo Tengah QR",
    showLogoInsideCenter: "Tampilkan logo di bagian tengah QR Code.",
    logoImageUrl: "Tautan Gambar Logo",
    done: "Selesai",
    cancel: "Batal",
    save: "Simpan",
    saving: "Menyimpan...",
    copy: "Salin",
    edit: "Ubah",
    deleteButton: "Hapus",
    openLink: "Buka Tautan",
    shortSlug: "Slug Pendek",
    catGeneral: "Umum",
    catSocial: "Media Sosial",
    catPromo: "Promosi",
    catWork: "Pekerjaan",
    catPersonal: "Pribadi",
    catOther: "Lainnya",
    categoryLabel: "Kategori Tautan",
    chooseCategory: "Pilih Kategori",
    filterCategory: "Filter Kategori",
    allCategories: "Semua Kategori",
    passwordTooWeak: "Kata sandi terlalu lemah (minimal 6 karakter)",
    chooseLinksToDisplay: "Pilih Tautan yang Ditampilkan",
    useToggleToPin: "Gunakan toggle untuk menyematkan ke Bio Anda.",
    noLinksCreatedYet: "Belum ada list tautan yang dibuat.",
    bioConfigSavedSuccessfully: "✓ Konfigurasi halaman Bio kustom Anda berhasil disimpan ke Cloud secara permanen!",
    defaultLivePreviewTitle: "Tautan Saya",
    defaultLivePreviewBio: "Deskripsi kustom...",
    noActiveLinksYet: "Belum ada tautan aktif"
  },
  en: {
    rowsPerPage: "Rows per page:",
    showing: "Showing",
    of: "of",
    links: "links",
    myLinks: "My Links",
    defaultBioDesc: "Welcome to my custom Link Tree!",
    noActiveLinks: "No active links",
    noFilteredLinks: "No links registered with these parameters. Create a new one to start!",
    loadingLinktree: "Loading Link Tree...",
    pageNotFound: "Page Not Found",
    linktreeNotFoundDesc: "Link Tree or link portfolio with this profile has not been configured or is not available.",
    openLinklyDashboard: "Open Linkly Dashboard",
    noPinnedActiveLinks: "No pinned active links found.",
    dashboard: "Dashboard",
    linksList: "Links List",
    linkTree: "Bio Linktree",
    settings: "Settings",
    logout: "Log Out",
    login: "Sign In with Google",
    loginDesc: "Shorten your links, get dynamic QR Codes, and manage your custom Bio Linktree portfolio.",
    poweredBy: "Powered by",
    welcome: "Welcome Back",
    totalLinks: "Total Links",
    totalClicks: "Total Clicks",
    avgCtr: "Average Click-Through",
    securityStatus: "Database Security",
    activeLinks: "Active Links",
    linksWithPassword: "password protected",
    activeCount: "fully running",
    createLink: "Create New Link",
    editLink: "Modify Link Settings",
    shortenLinkBtn: "Shorten & Secure",
    originalUrl: "Original Destination URL",
    customSlug: "Custom Domain / Slug",
    passwordTitle: "Password Access (Optional)",
    landingPageTitle: "Enable Landing Portal",
    landingPageDesc: "Display an intermediate info landing page before a secure external redirect.",
    expiryTitle: "Expiration Date (Optional)",
    aiMetaTitle: "Generate Auto Metadata (Gemini AI)",
    aiMetaDesc: "Instantly create smart seo meta titles & descriptions using deep artificial intelligence.",
    saveBtn: "Save Link",
    savingBtn: "Saving...",
    cancelBtn: "Cancel",
    customSlugPlaceholder: "Enter custom slug (e.g., promo-lebaran)",
    urlPlaceholder: "Enter long URL destination (e.g., https://google.com/search?q=123)",
    searchPlaceholder: "Search title, original URL, or slug...",
    filterOptions: "Advanced Filtering Options",
    clicksMin: "Minimum Clicks",
    passwordFilter: "Security/Password",
    portalFilter: "Landing Portal",
    clearFilters: "Clear Filters",
    all: "All",
    protectedOnly: "Protected Only",
    notProtected: "Unprotected",
    enabled: "Enabled",
    disabled: "Disabled",
    noLinks: "No Links Found",
    noLinksDesc: "Shorten your very first URL using the action button above.",
    noSearchResults: "No links match the chosen search parameters.",
    slugText: "Slug",
    createdText: "Created",
    clicksText: "Clicks",
    actionsText: "Operations",
    manageTree: "Configure Bio Linktree",
    treeTitleLabel: "Profile Title",
    treeBioLabel: "Profile Bio / Description",
    treeAvatarLabel: "Profile Photo URL",
    treeThemeLabel: "Choose Theme Style",
    selectLinksText: "Choose Links to Display in Bio",
    saveTree: "Save Profile Configuration",
    treeSavedAlert: "Bio Linktree configuration saved successfully!",
    copyTreeBtn: "Copy Bio URL",
    visitTreeBtn: "Visit Bio",
    customQr: "Smart QR Code Customizer",
    logoText: "Center Image URL (Logo)",
    fgColorText: "QR Pattern Color (Foreground)",
    bgColorText: "Background Color",
    qrSizeText: "QR Grid Resolution",
    downloadSvg: "Download SVG file",
    downloadPng: "Download PNG file",
    downloadPdf: "Download PDF report",
    copyQrBtn: "Copy QR Image",
    qrCopied: "QR pattern image copied to clipboard!",
    qrCopyFail: "Failed to copy QR image.",
    trends: "Traffic Trends",
    countries: "Countries",
    devices: "Devices",
    ips: "Visitor IP Logs",
    geo: "Geolocation",
    browser: "Web Browsers",
    visitHistory: "Recent Operations Log",
    detailLinkManage: "Link Operations Room",
    viewDetails: "In-depth Analytics",
    copyUrlSuccess: "Shortened link copied!",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    language: "Language",
    linksListHeader: "Links Registry",
    linksListSubtitle: "Manage and optimize all your shortened links with query filters and pagination.",
    shortenNewLink: "Shorten New Link",
    advancedFilter: "Advanced Filters",
    passwordSecurity: "Password Security",
    allLinks: "All Links",
    passwordProtectedOnly: "Password Protected Only",
    openLinksOnly: "Open Links Only",
    infoPortalStatus: "Info Portal Status",
    allPortalStatus: "All Status Portal",
    landingPortalActive: "Landing Portal Active",
    noLandingPortal: "No Landing Portal Page",
    minClickCount: "Minimum Click Counts",
    minClickPlaceholder: "e.g. 10",
    selectAll: "Select All",
    titleAndDestination: "Title & Destination",
    clickActivity: "Click Activity",
    status: "Status",
    securityAndFeatures: "Security & Features",
    manageAction: "Manage Action",
    quickTransition: "Quick Jump",
    mainDestination: "Main Destination",
    parameterDasar: "Basic Parameters & Security",
    parameterSubtitle: "Modify parameters, password protection, and info page redirection.",
    judulPenanda: "Link Marker Title",
    judulPenandaPlaceholder: "e.g. July Promo Campaign",
    tautanTujuanUtama: "Main Destination URL",
    customShortSlug: "Custom Short Slug",
    slugPlaceholder: "custom-slug",
    expiryDate: "Expiration Date",
    passwordLabel: "Security Password (Optional)",
    passwordProtected: "Protected",
    passwordFree: "Open Access",
    passwordPlaceholder: "Leave blank for no password protection",
    statusTautan: "Link Status (Active / Disabled)",
    tautanMutedDesc: "Inactive links will show a blocked error page when clicked.",
    aktifkanHalamanPortal: "Enable Landing Portal Page",
    tautanPortalDesc: "Show custom informative splash screen before redirection.",
    deskripsiAtributLanding: "Landing Portal Metadata Details",
    deskripsiLandingPlaceholder: "Write descriptions or warm greetings for your visitors...",
    urlGambarProfil: "Supporting Image / Avatar URL",
    simpanPerubahan: "Save Link Changes",
    berhasilDisimpan: "✓ Successfully Saved!",
    downloadQrCode: "Download QR Code",
    unduhQrSubtitle: "Deploy premium customizable QR codes for print media.",
    kustomisasiQr: "Customize QR",
    panelAuditTrafik: "Traffic Diagnostic Board",
    auditSubtitle: "Geographic maps, browsers, systems, IPs, and click trends registry.",
    trenAktivitas7Hari: "Click Activity - Last 7 Days",
    subTabTrends: "Trends",
    subTabGeo: "Geo",
    subTabDevices: "Devices",
    subTabIps: "IP Audit",
    kembaliKeDaftar: "Back to Links Registry",
    kelolaTautanHeader: "Manage Link",
    customBioTreeHeader: "Customize Your Bio Linktree",
    customBioTreeSubtitle: "Design a single, elegant landing page to showcase all your essential links in one place.",
    publicBioUrlTitle: "Your Public Bio Linktree URL",
    profileAndDescription: "Profile & Description",
    previewPhoto: "Photo Preview",
    photoUrlLabel: "Profile Photo/Avatar URL",
    enterPhotoUrlPlaceholder: "Enter profile photo URL...",
    bioTitleLabel: "Bio Page Title",
    bioTitlePlaceholder: "Your Name or Page Title...",
    bioShortDescLabel: "Short Bio / Description",
    bioShortDescPlaceholder: "Write a short bio or description...",
    choosePageTheme: "Choose Page Theme",
    selectDisplayedLinks: "Choose Links to Display in Bio",
    displayedLinksHelp: "Use toggles to pin links on your public Bio page.",
    noLinksCreated: "No links created yet.",
    saveConfiguration: "Save Configuration",
    configSavedSuccess: "✓ Your custom Bio Linktree configuration has been permanently synced to the cloud!",
    loginSubtitle: "The modern link shortener and linktree builder for professionals.",
    registrationDisabled: "Registration is currently disabled by administrator.",
    pemberianMerekQr: "QR Branding",
    presetTemaCepat: "Preset Quick Themes",
    warnaQr: "QR Color",
    latarBelakang: "Background Color",
    logoTengahQr: "QR Center Logo",
    tampilkanLogoDesc: "Show logo inside the center of QR Code.",
    tautanGambarLogo: "Logo Image URL",
    tautanBentukMewah: "Design full-profile stylish Linktree pages.",
    bulkDelete: "Bulk Delete",
    created: "Created",
    action: "Action",
    clicks: "Clicks",
    ofTotalClicks: "of total clicks",
    operatingSystems: "Operating Systems",
    browsersAndReferrers: "Browsers & Referrers",
    topCountries: "Top Countries",
    topRegions: "Top Regions & Cities",
    visitorIpAudit: "Visitor IP Address Audit",
    ipAddress: "IP Address",
    country: "Country",
    interaction: "Interaction",
    noIpLogs: "No IP logs recorded yet.",
    clicksByCountry: "Clicks by Country & Region",
    topReferrers: "Top Referral Sources",
    noReferrals: "No external referrals found yet.",
    searchHint: "Search title, slug, or destination...",
    active: "Active",
    expired: "Expired",
    qrBranding: "QR Branding",
    presetQuickThemes: "Preset Quick Themes",
    qrColor: "QR Color",
    backgroundColor: "Background Color",
    qrCenterLogo: "QR Center Logo",
    showLogoInsideCenter: "Show logo inside the center of QR Code.",
    logoImageUrl: "Logo Image URL",
    done: "Done",
    cancel: "Cancel",
    save: "Save",
    saving: "Saving...",
    copy: "Copy",
    edit: "Edit",
    deleteButton: "Delete",
    openLink: "Open Link",
    shortSlug: "Short Slug",
    catGeneral: "General",
    catSocial: "Social Media",
    catPromo: "Promotion",
    catWork: "Work",
    catPersonal: "Personal",
    catOther: "Other",
    categoryLabel: "Link Category",
    chooseCategory: "Choose Category",
    filterCategory: "Filter Category",
    allCategories: "All Categories",
    passwordTooWeak: "Password too weak (minimum 6 characters)",
    chooseLinksToDisplay: "Choose Links to Display",
    useToggleToPin: "Use toggle to pin this link to your Bio page.",
    noLinksCreatedYet: "No links created yet.",
    bioConfigSavedSuccessfully: "✓ Your custom Bio page configuration was successfully saved to the cloud permanently!",
    defaultLivePreviewTitle: "My Links",
    defaultLivePreviewBio: "Custom description...",
    noActiveLinksYet: "No active links yet"
  }
};

const CATEGORY_OPTIONS = [
  { value: "general", labelId: "catGeneral", labelEn: "General", labelIdText: "Umum" },
  { value: "social", labelId: "catSocial", labelEn: "Social Media", labelIdText: "Media Sosial" },
  { value: "promo", labelId: "catPromo", labelEn: "Promotion", labelIdText: "Promosi" },
  { value: "work", labelId: "catWork", labelEn: "Work", labelIdText: "Pekerjaan" },
  { value: "personal", labelId: "catPersonal", labelEn: "Personal", labelIdText: "Pribadi" },
  { value: "other", labelId: "catOther", labelEn: "Other", labelIdText: "Lainnya" }
];

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();
  let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  let match = cleanUrl.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  regExp = /\/shorts\/([a-zA-Z0-9_-]{11})/;
  match = cleanUrl.match(regExp);
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  regExp = /\/embed\/([a-zA-Z0-9_-]{11})/;
  match = cleanUrl.match(regExp);
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return null;
}

export default function App() {
  // Light Mode and Language States
  const [isLightMode, setIsLightMode] = useState<boolean>(() => localStorage.getItem("linkly-light-mode") === "true");
  const [lang, setLang] = useState<'id' | 'en'>(() => (localStorage.getItem("linkly-lang") as 'id' | 'en') || 'id');
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

  const toggleLang = () => {
    setLang(prev => {
      const next = prev === 'id' ? 'en' : 'id';
      localStorage.setItem("linkly-lang", next);
      return next;
    });
  };

  const t = (key: keyof typeof TRANSLATIONS.id) => {
    return TRANSLATIONS[lang]?.[key] || key;
  };

  // Dynamic utility style classes based on Light/Dark Mode and App Theme Color
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

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<LinkData[]>([]);
  const [recentClicks, setRecentClicks] = useState<ClickEvent[]>([]);
  const [allClicks, setAllClicks] = useState<ClickEvent[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>({ registrationEnabled: true });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof LinkData; direction: 'asc' | 'desc' } | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedQr, setCopiedQr] = useState(false);
  const [qrLink, setQrLink] = useState<LinkData | null>(null);

  // Advanced QR customization states
  const [qrFgColor, setQrFgColor] = useState(curT.qrFg);
  const [qrBgColor, setQrBgColor] = useState("#ffffff"); // White

  // Bulk operation state
  const [selectedLinkIds, setSelectedLinkIds] = useState<string[]>([]);
  const [analyticsTab, setAnalyticsTab] = useState<'trends' | 'geo' | 'devices'>('trends');

  // Landing page form toggle
  const [landingEnabled, setLandingEnabled] = useState(false);

  // Custom slug and QR logo customization states
  const [slugValue, setSlugValue] = useState("");
  const [showQrLogo, setShowQrLogo] = useState(false);
  const [qrLogoUrl, setQrLogoUrl] = useState("https://cdn-icons-png.flaticon.com/512/10005/10005141.png");

  // Link Tree & Navigation Feature States
  const [currentTab, setCurrentTab] = useState<"dashboard" | "links-list" | "link-detail" | "link-tree" | "collections">("dashboard");
  const [selectedDetailLinkId, setSelectedDetailLinkId] = useState<string | null>(null);

  // Collection / Folder feature states
  const [collections, setCollections] = useState<LinkCollection[]>([]);
  const [isColModalOpen, setIsColModalOpen] = useState(false);
  const [colEditing, setColEditing] = useState<LinkCollection | null>(null);
  const [colName, setColName] = useState("");
  const [colDesc, setColDesc] = useState("");
  const [colSelectedLinkIds, setColSelectedLinkIds] = useState<string[]>([]);
  const [formCollectionId, setFormCollectionId] = useState("");
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);

  // Dedicated Link List Pagination & Advanced Filtering States
  const [listCurrentPage, setListCurrentPage] = useState(1);
  const [listItemsPerPage, setListItemsPerPage] = useState(10);
  const [listFilterPassword, setListFilterPassword] = useState<'all' | 'protected' | 'none'>('all');
  const [listFilterPortal, setListFilterPortal] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [listMinClicks, setListMinClicks] = useState<number | "">("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [listFilterCategory, setListFilterCategory] = useState("all");

  const [modalPassword, setModalPassword] = useState("");
  const [formCategory, setFormCategory] = useState("general");
  const [detailCategory, setDetailCategory] = useState("general");

  // States for LinkDetailPage (each link deep customizing)
  const [detailEditTitle, setDetailEditTitle] = useState("");
  const [detailEditUrl, setDetailEditUrl] = useState("");
  const [detailEditSlug, setDetailEditSlug] = useState("");
  const [detailEditExpiry, setDetailEditExpiry] = useState("");
  const [detailEditPassword, setDetailEditPassword] = useState("");
  const [detailEditPortalEnabled, setDetailEditPortalEnabled] = useState(false);
  const [detailEditPortalDescription, setDetailEditPortalDescription] = useState("");
  const [detailEditPortalAvatar, setDetailEditPortalAvatar] = useState("");
  const [detailFormSaved, setDetailFormSaved] = useState(false);
  const [detailAnalyticsTab, setDetailAnalyticsTab] = useState<'trends' | 'geo' | 'devices' | 'ips'>('trends');
  const [detailIpSearch, setDetailIpSearch] = useState("");
  const [treeTitle, setTreeTitle] = useState("");
  const [treeBio, setTreeBio] = useState("");
  const [treeAvatar, setTreeAvatar] = useState("");
  const [treeTheme, setTreeTheme] = useState("slate");
  const [treeLinks, setTreeLinks] = useState<string[]>([]);
  const [treeBgImage, setTreeBgImage] = useState("");
  const [treeButtonStyle, setTreeButtonStyle] = useState("classic");
  const [treeShowFolders, setTreeShowFolders] = useState(true);
  const [treeInstagram, setTreeInstagram] = useState("");
  const [treeTwitter, setTreeTwitter] = useState("");
  const [treeLinkedIn, setTreeLinkedIn] = useState("");
  const [treeYoutube, setTreeYoutube] = useState("");
  const [treeGithub, setTreeGithub] = useState("");
  const [treeVideoUrl, setTreeVideoUrl] = useState("");
  const [treeButtonBgImage, setTreeButtonBgImage] = useState("");
  const [customToast, setCustomToast] = useState("");
  const [customToastType, setCustomToastType] = useState<"success" | "error">("success");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setCustomToast(message);
    setCustomToastType(type);
    const timeoutId = setTimeout(() => {
      setCustomToast(prev => prev === message ? "" : prev);
    }, 3000);
    return timeoutId;
  };
  const [treeSavedSuccess, setTreeSavedSuccess] = useState(false);
  const [copiedTreeUrl, setCopiedTreeUrl] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [isSavingLink, setIsSavingLink] = useState(false);
  const [isSavingCollection, setIsSavingCollection] = useState(false);
  const [isSavingDetailLink, setIsSavingDetailLink] = useState(false);
  const [isSavingTree, setIsSavingTree] = useState(false);

  // Form state variables for New/Edit Link and Gemini AI integration
  const [formTitle, setFormTitle] = useState("");
  const [formLandingDescription, setFormLandingDescription] = useState("");
  const [formLinkEnabled, setFormLinkEnabled] = useState(true);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [detailEditEnabled, setDetailEditEnabled] = useState(true);

  // Synchronize QR code default foreground color when app theme moves
  useEffect(() => {
    setQrFgColor(curT.qrFg);
  }, [appTheme, curT.qrFg]);

  // Check if current route is a public Link Tree profile
  const path = window.location.pathname;
  const isLinkTreePath = path.startsWith("/tree/") || path.startsWith("/lt/") || path.startsWith("/t/");
  const targetUid = isLinkTreePath ? path.split("/")[2] : null;

  // State variables for public render
  const [publicTreeSettings, setPublicTreeSettings] = useState<any>(null);
  const [publicTreeLinks, setPublicTreeLinks] = useState<LinkData[]>([]);
  const [publicTreeCollections, setPublicTreeCollections] = useState<any[]>([]);
  const [publicLoading, setPublicLoading] = useState(isLinkTreePath);
  const [publicError, setPublicError] = useState(false);

  // Query Client & Queries Setup
  const queryClient = useQueryClient();

  // Settings Query
  const { data: querySettings } = useQuery({
    queryKey: ["settings", "global"],
    queryFn: async () => {
      const docRef = doc(db, "settings", "global");
      const snap = await getDoc(docRef);
      return snap.exists() ? (snap.data() as GlobalSettings) : { registrationEnabled: true };
    },
  });

  useEffect(() => {
    if (querySettings) {
      setSettings(querySettings);
    }
  }, [querySettings]);

  // Private Link Tree Query
  const { data: queryLinkTree } = useQuery({
    queryKey: ["link_tree", user?.uid],
    queryFn: async () => {
      if (!user) return null;
      const docRef = doc(db, "link_trees", user.uid);
      const snap = await getDoc(docRef);
      return snap.exists() ? snap.data() : null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (user) {
      if (queryLinkTree) {
        setTreeTitle(queryLinkTree.treeTitle || user.displayName || "Tautan Saya");
        setTreeBio(queryLinkTree.treeBio || "Selamat datang di Link Tree kustom saya!");
        setTreeAvatar(queryLinkTree.treeAvatar || user.photoURL || "");
        setTreeTheme(queryLinkTree.treeTheme || "slate");
        setTreeLinks(queryLinkTree.treeLinks || []);
        setTreeBgImage(queryLinkTree.treeBgImage || "");
        setTreeButtonStyle(queryLinkTree.treeButtonStyle || "classic");
        setTreeShowFolders(queryLinkTree.treeShowFolders !== false);
        setTreeInstagram(queryLinkTree.treeInstagram || "");
        setTreeTwitter(queryLinkTree.treeTwitter || "");
        setTreeLinkedIn(queryLinkTree.treeLinkedIn || "");
        setTreeYoutube(queryLinkTree.treeYoutube || "");
        setTreeGithub(queryLinkTree.treeGithub || "");
        setTreeVideoUrl(queryLinkTree.treeVideoUrl || "");
        setTreeButtonBgImage(queryLinkTree.treeButtonBgImage || "");
      } else {
        setTreeTitle(user.displayName || "Tautan Saya");
        setTreeBio("Selamat datang di Link Tree kustom saya!");
        setTreeAvatar(user.photoURL || "");
        setTreeTheme("slate");
        setTreeLinks([]);
        setTreeBgImage("");
        setTreeButtonStyle("classic");
        setTreeShowFolders(true);
        setTreeInstagram("");
        setTreeTwitter("");
        setTreeLinkedIn("");
        setTreeYoutube("");
        setTreeGithub("");
        setTreeVideoUrl("");
        setTreeButtonBgImage("");
      }
    }
  }, [queryLinkTree, user]);

  // Public Tree, Links, and Collections Combined Query
  const { data: queryPublicTree } = useQuery({
    queryKey: ["public_tree", targetUid],
    queryFn: async () => {
      if (!targetUid) return null;
      const snapSettings = await getDoc(doc(db, "link_trees", targetUid));
      const treeData = snapSettings.exists() ? snapSettings.data() : null;

      const qLinks = query(collection(db, "links"), where("userId", "==", targetUid));
      const snapLinks = await getDocs(qLinks);
      const linksData = snapLinks.docs.map(d => ({ id: d.id, ...d.data() })) as LinkData[];

      const qCols = query(collection(db, "collections"), where("userId", "==", targetUid));
      const snapCols = await getDocs(qCols);
      const colsData = snapCols.docs.map(d => ({ id: d.id, ...d.data() }));

      return {
        treeData,
        linksData,
        colsData
      };
    },
    enabled: isLinkTreePath && !!targetUid,
  });

  useEffect(() => {
    if (queryPublicTree) {
      const { treeData, linksData, colsData } = queryPublicTree;
      if (treeData) {
        setPublicTreeSettings({
          treeTitle: treeData.treeTitle || "Tautan Saya",
          treeBio: treeData.treeBio || "Selamat datang di Link Tree kustom saya!",
          treeAvatar: treeData.treeAvatar || "",
          treeTheme: treeData.treeTheme || "slate",
          treeLinks: treeData.treeLinks || [],
          treeBgImage: treeData.treeBgImage || "",
          treeButtonStyle: treeData.treeButtonStyle || "classic",
          treeShowFolders: treeData.treeShowFolders !== false,
          treeInstagram: treeData.treeInstagram || "",
          treeTwitter: treeData.treeTwitter || "",
          treeLinkedIn: treeData.treeLinkedIn || "",
          treeYoutube: treeData.treeYoutube || "",
          treeGithub: treeData.treeGithub || "",
          treeVideoUrl: treeData.treeVideoUrl || "",
          treeButtonBgImage: treeData.treeButtonBgImage || ""
        });
      } else {
        setPublicTreeSettings({
          treeTitle: "Tautan Saya",
          treeBio: "Selamat datang di Link Tree kustom saya!",
          treeAvatar: "",
          treeTheme: "slate",
          treeLinks: [],
          treeBgImage: "",
          treeButtonStyle: "classic",
          treeShowFolders: true,
          treeInstagram: "",
          treeTwitter: "",
          treeLinkedIn: "",
          treeYoutube: "",
          treeGithub: "",
          treeVideoUrl: "",
          treeButtonBgImage: ""
        });
      }
      setPublicTreeLinks(linksData);
      setPublicTreeCollections(colsData);
      setPublicLoading(false);
      setPublicError(false);
    }
  }, [queryPublicTree]);

  // Dynamic Document Title Updater
  useEffect(() => {
    if (isLinkTreePath) {
      if (publicLoading) {
        document.title = "Loading... | Linkly Bio";
      } else if (publicError) {
        document.title = "Not Found | Linkly Bio";
      } else {
        const titleStr = publicTreeSettings?.treeTitle || "Bio";
        document.title = `${titleStr} | Linkly Bio`;
      }
    } else if (!user) {
      document.title = `${t("login")} | Linkly SaaS`;
    } else {
      switch (currentTab) {
        case "dashboard":
          document.title = `${t("dashboard")} | Linkly SaaS`;
          break;
        case "links-list":
          document.title = `${t("linksList")} | Linkly SaaS`;
          break;
        case "link-tree":
          document.title = `${t("linkTree")} | Linkly SaaS`;
          break;
        case "collections":
          document.title = `Collections & Folders | Linkly SaaS`;
          break;
        case "link-detail": {
          const activeL = links.find((l) => l.id === selectedDetailLinkId);
          const detailTitle = activeL ? (activeL.title || activeL.shortSlug) : "Analytics";
          document.title = `${detailTitle} - Analytics | Linkly SaaS`;
          break;
        }
        default:
          document.title = "Linkly SaaS";
      }
    }
  }, [
    isLinkTreePath,
    publicLoading,
    publicError,
    publicTreeSettings?.treeTitle,
    user,
    currentTab,
    selectedDetailLinkId,
    links,
    lang,
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        // Sync user profile
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            createdAt: new Date().toISOString(),
            role: "user"
          });
        }

        // Auto-provision default Link Tree configurations using logged-in Gmail details
        const treeRef = doc(db, "link_trees", currentUser.uid);
        const treeSnap = await getDoc(treeRef);
        if (!treeSnap.exists()) {
          await setDoc(treeRef, {
            treeTitle: currentUser.displayName || "Tautan Saya",
            treeBio: "Selamat datang di Link Tree kustom saya!",
            treeAvatar: currentUser.photoURL || "",
            treeTheme: "slate",
            treeLinks: [],
            updatedAt: new Date().toISOString()
          });
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Links Query
  const { data: queryLinks } = useQuery({
    queryKey: ["links", user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(collection(db, "links"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LinkData[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (queryLinks) {
      setLinks(queryLinks);
    }
  }, [queryLinks]);

  // Collections Query
  const { data: queryCollections } = useQuery({
    queryKey: ["collections", user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(collection(db, "collections"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LinkCollection[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (queryCollections) {
      setCollections(queryCollections);
    }
  }, [queryCollections]);

  // Clicks Query
  const { data: queryClicks } = useQuery({
    queryKey: ["clicks", user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(collection(db, "clicks"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ClickEvent[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (queryClicks) {
      const userClicks = [...queryClicks]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);
      setRecentClicks(userClicks);
      setAllClicks(queryClicks);
    }
  }, [queryClicks]);

  // Sync landing field toggle on editing change
  useEffect(() => {
    if (editingLink) {
      setLandingEnabled(!!editingLink.landingEnabled);
      setSlugValue(editingLink.shortSlug);
      setFormTitle(editingLink.title || "");
      setFormLandingDescription(editingLink.landingDescription || "");
      setFormLinkEnabled(editingLink.isEnabled !== false);
      setModalPassword(editingLink.password || "");
      setFormCategory(editingLink.category || "general");
      setFormCollectionId(editingLink.collectionId || "");
    } else {
      setLandingEnabled(false);
      setSlugValue("");
      setFormTitle("");
      setFormLandingDescription("");
      setFormLinkEnabled(true);
      setModalPassword("");
      setFormCategory("general");
      setFormCollectionId("");
    }
    setAiError(null);
  }, [editingLink, isModalOpen]);

  // Automatically select the first link in deep detail tab when empty
  useEffect(() => {
    if (!selectedDetailLinkId && links.length > 0) {
      setSelectedDetailLinkId(links[0].id);
    }
  }, [links, selectedDetailLinkId]);

  // Lock body scroll when create/edit link modal or QR customizer is open
  useEffect(() => {
    if (isModalOpen || qrLink) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen, qrLink]);

  // Keep track of the last loaded database data in LinkDetailPage to avoid resetting user edits while typing, but update when data is refetched
  const [lastLoadedLinkData, setLastLoadedLinkData] = useState<LinkData | null>(null);

  // Synchronize deep editing fields for specific LinkDetailPage
  useEffect(() => {
    const activeL = links.find(l => l.id === selectedDetailLinkId);
    if (!activeL) {
      setLastLoadedLinkData(null);
      return;
    }

    const isDifferentLink = selectedDetailLinkId !== lastLoadedLinkData?.id;
    const isDatabaseDataUpdated = lastLoadedLinkData && (
      activeL.title !== lastLoadedLinkData.title ||
      activeL.originalUrl !== lastLoadedLinkData.originalUrl ||
      activeL.shortSlug !== lastLoadedLinkData.shortSlug ||
      activeL.expiresAt !== lastLoadedLinkData.expiresAt ||
      activeL.password !== lastLoadedLinkData.password ||
      activeL.landingEnabled !== lastLoadedLinkData.landingEnabled ||
      activeL.landingDescription !== lastLoadedLinkData.landingDescription ||
      activeL.landingAvatar !== lastLoadedLinkData.landingAvatar ||
      activeL.isEnabled !== lastLoadedLinkData.isEnabled ||
      activeL.category !== lastLoadedLinkData.category
    );

    if (isDifferentLink || isDatabaseDataUpdated) {
      setDetailEditTitle(activeL.title || "");
      setDetailEditUrl(activeL.originalUrl || "");
      setDetailEditSlug(activeL.shortSlug || "");
      setDetailEditExpiry(activeL.expiresAt ? activeL.expiresAt.slice(0, 16) : "");
      setDetailEditPassword(activeL.password || "");
      setDetailEditPortalEnabled(!!activeL.landingEnabled);
      setDetailEditPortalDescription(activeL.landingDescription || "");
      setDetailEditPortalAvatar(activeL.landingAvatar || "");
      setDetailEditEnabled(activeL.isEnabled !== false);
      setDetailCategory(activeL.category || "general");
      setLastLoadedLinkData(activeL);
    }
    setDetailFormSaved(false);
  }, [selectedDetailLinkId, links, lastLoadedLinkData]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleCopy = (slug: string, id: string) => {
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus tautan ini?")) {
      try {
        await deleteDoc(doc(db, "links", id));
        await queryClient.invalidateQueries({ queryKey: ["links", user?.uid] });
        setSelectedLinkIds(prev => prev.filter(item => item !== id));
        showToast(lang === "id" ? "Tautan berhasil dihapus!" : "Link deleted successfully!");
      } catch (err) {
        console.error(err);
        showToast(lang === "id" ? "Gagal menghapus tautan." : "Failed to delete link.", "error");
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLinkIds.length === 0) return;
    if (window.confirm(`Apakah Anda yakin ingin menghapus ${selectedLinkIds.length} tautan secara massal?`)) {
      try {
        const deletePromises = selectedLinkIds.map(id => deleteDoc(doc(db, "links", id)));
        await Promise.all(deletePromises);
        await queryClient.invalidateQueries({ queryKey: ["links", user?.uid] });
        setSelectedLinkIds([]);
        showToast(lang === "id" ? `${selectedLinkIds.length} tautan berhasil dihapus secara massal!` : `${selectedLinkIds.length} links deleted successfully!`);
      } catch (err) {
        console.error(err);
        showToast(lang === "id" ? "Gagal menghapus tautan secara massal." : "Failed to bulk delete links.", "error");
      }
    }
  };

  const toggleSelectLink = (id: string) => {
    setSelectedLinkIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleGenerateAiMetadata = async () => {
    const originalUrlInput = document.querySelector('input[name="originalUrl"]') as HTMLInputElement;
    const url = originalUrlInput?.value;

    if (!url) {
      setAiError("Silakan masukkan Tautan Tujuan Utama terlebih dahulu.");
      return;
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      setAiError("Mohon masukkan URL lengkap yang valid (dimulai dengan http:// atau https://).");
      return;
    }

    setIsGeneratingAi(true);
    setAiError(null);

    try {
      const response = await fetch("/api/generate-metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ originalUrl: url })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || "Gagal menghasilkan metadata.");
      }

      if (data.title) {
        setFormTitle(data.title);
      }
      if (data.description) {
        setFormLandingDescription(data.description);
        setLandingEnabled(true); // Auto enable preview block
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Gagal mengambil data otomatis dari AI.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSaveLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const originalUrl = formData.get("originalUrl") as string;
    const shortSlug = formData.get("shortSlug") as string || nanoid(6);
    const expiresAt = formData.get("expiresAt") as string;
    const password = formData.get("password") as string;
    const landingAvatar = formData.get("landingAvatar") as string;

    if (password && password.length < 6) {
      showToast(
        lang === "id" ? "Kata sandi terlalu pendek (minimal 6 karakter)" : "Password is too weak (minimum 6 characters)",
        "error"
      );
      return;
    }

    const linkData = {
      userId: user?.uid,
      originalUrl,
      shortSlug,
      title: formTitle || originalUrl,
      clickCount: editingLink ? editingLink.clickCount : 0,
      qrScanCount: editingLink ? (editingLink.qrScanCount || 0) : 0,
      collectionId: formCollectionId || "",
      createdAt: editingLink ? editingLink.createdAt : new Date().toISOString(),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      password: password || "",
      landingEnabled: landingEnabled,
      landingDescription: formLandingDescription || "",
      landingAvatar: landingAvatar || "",
      isEnabled: formLinkEnabled,
      category: formCategory
    };

    setIsSavingLink(true);
    try {
      if (editingLink) {
        await updateDoc(doc(db, "links", editingLink.id), linkData);
        showToast(lang === "id" ? "Tautan berhasil diperbarui!" : "Link updated successfully!");
      } else {
        await setDoc(doc(db, "links", nanoid()), linkData);
        try {
          const shortUrl = `${window.location.origin}/${shortSlug}`;
          await navigator.clipboard.writeText(shortUrl);
          showToast(lang === "id" 
            ? `Tautan pendek berhasil disimpan & disalin ke papan klip!` 
            : `Short URL saved & copied to clipboard!`
          );
        } catch (clipErr) {
          console.error("Auto copy failed", clipErr);
          showToast(lang === "id" ? "Tautan pendek berhasil disimpan!" : "Short URL saved successfully!");
        }
      }
      await queryClient.invalidateQueries({ queryKey: ["links", user?.uid] });
      setIsModalOpen(false);
      setEditingLink(null);
    } catch (err) {
      console.error(err);
      showToast(lang === "id" ? "Gagal menyimpan tautan." : "Failed to save link.", "error");
    } finally {
      setIsSavingLink(false);
    }
  };

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colName.trim()) return;

    const colId = colEditing ? colEditing.id : nanoid();
    const colData = {
      id: colId,
      userId: user?.uid,
      name: colName,
      description: colDesc,
      createdAt: colEditing ? colEditing.createdAt : new Date().toISOString(),
      linkIds: colSelectedLinkIds
    };

    setIsSavingCollection(true);
    try {
      await setDoc(doc(db, "collections", colId), colData);
      
      const prevLinkIds = colEditing?.linkIds || [];
      const added = colSelectedLinkIds.filter(id => !prevLinkIds.includes(id));
      const removed = prevLinkIds.filter(id => !colSelectedLinkIds.includes(id));

      for (const lId of added) {
        await updateDoc(doc(db, "links", lId), { collectionId: colId });
      }
      for (const lId of removed) {
        await updateDoc(doc(db, "links", lId), { collectionId: "" });
      }

      await queryClient.invalidateQueries({ queryKey: ["collections", user?.uid] });
      await queryClient.invalidateQueries({ queryKey: ["links", user?.uid] });

      setIsColModalOpen(false);
      setColEditing(null);
      setColName("");
      setColDesc("");
      setColSelectedLinkIds([]);
      showToast(lang === "id" ? "Koleksi berhasil disimpan!" : "Collection saved successfully!");
    } catch (err) {
      console.error(err);
      showToast(lang === "id" ? "Gagal menyimpan koleksi." : "Failed to save collection.", "error");
    } finally {
      setIsSavingCollection(false);
    }
  };

  const handleDeleteCollection = async (colId: string) => {
    if (!confirm(lang === "id" ? "Apakah Anda yakin ingin menghapus koleksi ini?" : "Are you sure you want to delete this collection?")) return;

    try {
      await deleteDoc(doc(db, "collections", colId));
      
      const col = collections.find(c => c.id === colId);
      if (col) {
        for (const lId of col.linkIds) {
          await updateDoc(doc(db, "links", lId), { collectionId: "" });
        }
      }
      if (activeCollectionId === colId) {
        setActiveCollectionId(null);
      }
      await queryClient.invalidateQueries({ queryKey: ["collections", user?.uid] });
      await queryClient.invalidateQueries({ queryKey: ["links", user?.uid] });
      showToast(lang === "id" ? "Koleksi berhasil dihapus!" : "Collection deleted successfully!");
    } catch (err) {
      console.error(err);
      showToast(lang === "id" ? "Gagal menghapus koleksi." : "Failed to delete collection.", "error");
    }
  };

  const handleSaveDetailLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDetailLinkId) return;
    const activeL = links.find(l => l.id === selectedDetailLinkId);
    if (!activeL) return;

    if (detailEditPassword && detailEditPassword.length < 6) {
      showToast(
        lang === "id" ? "Kata sandi terlalu pendek (minimal 6 karakter)" : "Password is too weak (minimum 6 characters)",
        "error"
      );
      return;
    }

    setIsSavingDetailLink(true);
    try {
      const linkData = {
        title: detailEditTitle || activeL.originalUrl,
        originalUrl: detailEditUrl,
        shortSlug: detailEditSlug || activeL.shortSlug,
        expiresAt: detailEditExpiry ? new Date(detailEditExpiry).toISOString() : null,
        password: detailEditPassword || "",
        landingEnabled: detailEditPortalEnabled,
        landingDescription: detailEditPortalDescription || "",
        landingAvatar: detailEditPortalAvatar || "",
        isEnabled: detailEditEnabled,
        category: detailCategory
      };

      await updateDoc(doc(db, "links", selectedDetailLinkId), linkData);
      await queryClient.invalidateQueries({ queryKey: ["links", user?.uid] });
      setDetailFormSaved(true);
      showToast(lang === "id" ? "Detail tautan berhasil disimpan!" : "Detail link saved successfully!");
      setTimeout(() => setDetailFormSaved(false), 3000);
    } catch (err) {
      console.error(err);
      showToast(lang === "id" ? "Gagal menyimpan detail tautan." : "Failed to save detail link.", "error");
    } finally {
      setIsSavingDetailLink(false);
    }
  };

  const listFilteredLinks = links.filter(link => {
    // 1. Text search
    const matchesSearch = link.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          link.shortSlug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          link.originalUrl.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Status filter
    const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
    const matchesFilter = filterStatus === 'all' ? true : 
                         filterStatus === 'active' ? !isExpired : isExpired;
    
    // 3. Password protection filter
    let matchesPassword = true;
    if (listFilterPassword === 'protected') {
      matchesPassword = !!link.password;
    } else if (listFilterPassword === 'none') {
      matchesPassword = !link.password;
    }

    // 4. Portal landing filter
    let matchesPortal = true;
    if (listFilterPortal === 'enabled') {
      matchesPortal = !!link.landingEnabled;
    } else if (listFilterPortal === 'disabled') {
      matchesPortal = !link.landingEnabled;
    }

    // 5. Min clicks filter
    let matchesClicks = true;
    if (listMinClicks !== "") {
      matchesClicks = link.clickCount >= Number(listMinClicks);
    }

    // 6. Category filter
    let matchesCategory = true;
    if (listFilterCategory && listFilterCategory !== "all") {
      matchesCategory = link.category === listFilterCategory;
    }

    return matchesSearch && matchesFilter && matchesPassword && matchesPortal && matchesClicks && matchesCategory;
  });

  const listSortedLinks = [...listFilteredLinks].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    let valA = a[key];
    let valB = b[key];
    
    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = (valB as string || '').toLowerCase();
    }
    
    if (valA! < valB!) return direction === 'asc' ? -1 : 1;
    if (valA! > valB!) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const listTotalPages = Math.ceil(listSortedLinks.length / listItemsPerPage) || 1;
  const listPaginatedLinks = listSortedLinks.slice(
    (listCurrentPage - 1) * listItemsPerPage,
    listCurrentPage * listItemsPerPage
  );

  const filteredLinks = links
    .filter(link => {
      const matchesSearch = link.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           link.shortSlug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           link.originalUrl.toLowerCase().includes(searchTerm.toLowerCase());
      
      const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
      const matchesFilter = filterStatus === 'all' ? true : 
                           filterStatus === 'active' ? !isExpired : isExpired;
      
      return matchesSearch && matchesFilter;
    });

  const sortedLinks = [...filteredLinks].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    if (a[key]! < b[key]!) return direction === 'asc' ? -1 : 1;
    if (a[key]! > b[key]!) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSelectAll = () => {
    const currentFilteredIds = sortedLinks.map(l => l.id);
    const allSelected = currentFilteredIds.length > 0 && currentFilteredIds.every(id => selectedLinkIds.includes(id));
    
    if (allSelected) {
      setSelectedLinkIds(prev => prev.filter(id => !currentFilteredIds.includes(id)));
    } else {
      setSelectedLinkIds(prev => Array.from(new Set([...prev, ...currentFilteredIds])));
    }
  };

  const requestSort = (key: keyof LinkData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getChartData = () => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = format(d, "yyyy-MM-dd");
      const label = format(d, "dd MMM");
      
      const count = allClicks.filter(click => {
        if (!click.timestamp) return false;
        try {
          const clickDate = new Date(click.timestamp);
          return format(clickDate, "yyyy-MM-dd") === dateStr;
        } catch (e) {
          return false;
        }
      }).length;
      
      data.push({
        name: label,
        Clicks: count
      });
    }
    return data;
  };

  const getSpecificLinkChartData = (slug: string) => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = format(d, "yyyy-MM-dd");
      const label = format(d, "dd MMM");
      
      const count = allClicks.filter(click => {
        if (click.shortSlug !== slug) return false;
        if (!click.timestamp) return false;
        try {
          const clickDate = new Date(click.timestamp);
          return format(clickDate, "yyyy-MM-dd") === dateStr;
        } catch (e) {
          return false;
        }
      }).length;
      
      data.push({
        name: label,
        Clicks: count
      });
    }
    return data;
  };

  const getCollectionChartData = (linkIds: string[]) => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = format(d, "yyyy-MM-dd");
      const label = format(d, "dd MMM");
      
      const count = allClicks.filter(click => {
        if (!linkIds.includes(click.linkId)) return false;
        if (!click.timestamp) return false;
        try {
          const clickDate = new Date(click.timestamp);
          return format(clickDate, "yyyy-MM-dd") === dateStr;
        } catch (e) {
          return false;
        }
      }).length;
      
      data.push({
        name: label,
        Clicks: count
      });
    }
    return data;
  };

  const getSpecificAnalytics = (slug: string) => {
    const specificClicks = allClicks.filter(c => c.shortSlug === slug);
    const devices: Record<string, number> = {};
    const oss: Record<string, number> = {};
    const browsers: Record<string, number> = {};
    const referrers: Record<string, number> = {};
    const regions: Record<string, number> = {};
    const countries: Record<string, number> = {};
    const ips: Record<string, { count: number; country?: string; lastSeen?: string }> = {};

    specificClicks.forEach(click => {
      // 1. Device Type
      const device = click.device || "Desktop";
      devices[device] = (devices[device] || 0) + 1;

      // 2. Operating System
      const os = click.os || "Lainnya";
      oss[os] = (oss[os] || 0) + 1;

      // 3. Browser
      const browser = click.browser || "Lainnya";
      browsers[browser] = (browsers[browser] || 0) + 1;

      // 4. Referrer
      let ref = click.referrer || "Direct";
      if (ref.includes("android-app://")) {
        ref = "Mobile Application";
      } else {
        try {
          if (ref !== "Direct") {
            const url = new URL(ref);
            ref = url.hostname;
          }
        } catch (_) {
          // keep representation
        }
      }
      referrers[ref] = (referrers[ref] || 0) + 1;

      // 5. Region/City combination
      const rc = click.city && click.region ? `${click.city}, ${click.region}` : (click.city || click.region || "Indonesia");
      regions[rc] = (regions[rc] || 0) + 1;

      // 6. Country
      const countryName = click.country || "Indonesia";
      countries[countryName] = (countries[countryName] || 0) + 1;

      // 7. IP list
      if (click.ip) {
        if (!ips[click.ip]) {
          ips[click.ip] = { count: 0, country: click.country || "Indonesia", lastSeen: click.timestamp };
        }
        ips[click.ip].count += 1;
        if (new Date(click.timestamp) > new Date(ips[click.ip].lastSeen || 0)) {
          ips[click.ip].lastSeen = click.timestamp;
        }
      }
    });

    const sortMapToSortedArray = (map: Record<string, number>) => {
      return Object.entries(map)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    };

    const sortedIps = Object.entries(ips)
      .map(([ip, info]) => ({ ip, count: info.count, country: info.country, lastSeen: info.lastSeen }))
      .sort((a, b) => b.count - a.count);

    return {
      clicksCount: specificClicks.length,
      devices: sortMapToSortedArray(devices),
      oss: sortMapToSortedArray(oss),
      browsers: sortMapToSortedArray(browsers),
      referrers: sortMapToSortedArray(referrers),
      regions: sortMapToSortedArray(regions),
      countries: sortMapToSortedArray(countries),
      ips: sortedIps
    };
  };

  const getAnalyticsData = () => {
    const devices: Record<string, number> = {};
    const oss: Record<string, number> = {};
    const browsers: Record<string, number> = {};
    const referrers: Record<string, number> = {};
    const regions: Record<string, number> = {};
    const countries: Record<string, number> = {};
    const ips: Record<string, { count: number; country?: string; lastSeen?: string }> = {};

    allClicks.forEach(click => {
      // 1. Device Type
      const device = click.device || "Desktop";
      devices[device] = (devices[device] || 0) + 1;

      // 2. Operating System
      const os = click.os || "Lainnya";
      oss[os] = (oss[os] || 0) + 1;

      // 3. Browser
      const browser = click.browser || "Lainnya";
      browsers[browser] = (browsers[browser] || 0) + 1;

      // 4. Referrer
      let ref = click.referrer || "Direct";
      if (ref.includes("android-app://")) {
        ref = "Mobile Application";
      } else {
        try {
          if (ref !== "Direct") {
            const url = new URL(ref);
            ref = url.hostname;
          }
        } catch (_) {
          // keep as is
        }
      }
      referrers[ref] = (referrers[ref] || 0) + 1;

      // 5. Region/City combination
      const rc = click.city && click.region ? `${click.city}, ${click.region}` : (click.city || click.region || "Indonesia");
      regions[rc] = (regions[rc] || 0) + 1;

      // 6. Country
      const countryName = click.country || "Indonesia";
      countries[countryName] = (countries[countryName] || 0) + 1;

      // 7. IP list
      if (click.ip) {
        if (!ips[click.ip]) {
          ips[click.ip] = { count: 0, country: click.country || "Indonesia", lastSeen: click.timestamp };
        }
        ips[click.ip].count += 1;
        if (new Date(click.timestamp) > new Date(ips[click.ip].lastSeen || 0)) {
          ips[click.ip].lastSeen = click.timestamp;
        }
      }
    });

    const sortMapToSortedArray = (map: Record<string, number>) => {
      return Object.entries(map)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    };

    const sortedIps = Object.entries(ips)
      .map(([ip, info]) => ({ ip, count: info.count, country: info.country, lastSeen: info.lastSeen }))
      .sort((a, b) => b.count - a.count);

    return {
      devices: sortMapToSortedArray(devices),
      oss: sortMapToSortedArray(oss),
      browsers: sortMapToSortedArray(browsers),
      referrers: sortMapToSortedArray(referrers),
      regions: sortMapToSortedArray(regions),
      countries: sortMapToSortedArray(countries),
      ips: sortedIps
    };
  };

  if (isLinkTreePath) {
    if (publicLoading) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white font-sans">
          <div className="w-10 h-10 rounded-full border-4 border-brand-500 border-t-transparent animate-spin mb-4" />
          <p className="text-zinc-500 text-xs font-mono tracking-widest uppercase animate-pulse">{t("loadingLinktree")}</p>
        </div>
      );
    }

    if (publicError || !publicTreeSettings) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white font-sans p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center border border-red-500/20">
            <Layers className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t("pageNotFound")}</h1>
          <p className="text-zinc-400 text-sm max-w-sm leading-relaxed">
            {t("linktreeNotFoundDesc")}
          </p>
          <a href="/" className="inline-block px-5 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-855 text-zinc-300 rounded-xl transition-all font-bold text-xs uppercase tracking-wider">
            {t("openLinklyDashboard")}
          </a>
        </div>
      );
    }

    return (
      <PublicLinkTree
        publicTreeSettings={publicTreeSettings}
        publicTreeLinks={publicTreeLinks}
        publicTreeCollections={publicTreeCollections}
        lang={lang}
      />
    );

    const themeName = (publicTreeSettings.treeTheme || "slate") as keyof typeof THEME_STYLES;
    const theme = THEME_STYLES[themeName] || THEME_STYLES.slate;

    // Filter public links list based on owner settings
    const activeTreeLinks = publicTreeLinks.filter(l => {
      const isExpired = l.expiresAt && new Date(l.expiresAt) < new Date();
      if (isExpired) return false;

      if (publicTreeSettings.treeLinks && publicTreeSettings.treeLinks.length > 0) {
        return publicTreeSettings.treeLinks.includes(l.id);
      }
      return true; // Default to all if none selected
    });

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
          <div className="w-24 h-24 rounded-full border border-brand-500/25 p-1 bg-zinc-900/60 shadow-xl overflow-hidden shadow-brand-550/10">
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
                  className="text-zinc-400 hover:text-sky-400 hover:scale-110 active:scale-95 transition-all p-2 bg-zinc-900/45 border border-zinc-800 rounded-full w-10 h-10 flex items-center justify-center shadow-lg shadow-sky-400/5 hover:border-sky-450/20"
                  title="Twitter / X"
                >
                  <Twitter className="w-4.5 h-4.5 text-zinc-300 hover:text-sky-480 transition-colors" />
                </a>
              )}
              {publicTreeSettings.treeLinkedIn && (
                <a 
                  href={publicTreeSettings.treeLinkedIn.startsWith('http') ? publicTreeSettings.treeLinkedIn : `https://linkedin.com/in/${publicTreeSettings.treeLinkedIn}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-400 hover:text-blue-500 hover:scale-110 active:scale-95 transition-all p-2 bg-zinc-900/45 border border-zinc-800 rounded-full w-10 h-10 flex items-center justify-center shadow-lg shadow-blue-500/5 hover:border-blue-500/20"
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
                  className="text-zinc-400 hover:text-red-500 hover:scale-110 active:scale-95 transition-all p-2 bg-zinc-900/45 border border-zinc-800 rounded-full w-10 h-10 flex items-center justify-center shadow-lg shadow-red-500/5 hover:border-red-500/20"
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
                  className="text-zinc-400 hover:text-white hover:scale-110 active:scale-95 transition-all p-2 bg-zinc-900/45 border border-zinc-800 rounded-full w-10 h-10 flex items-center justify-center shadow-lg shadow-white/5 hover:border-white/20"
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

          {/* Render Folder and Link List */}
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
                btnStyleClasses = "bg-transparent border-2 border-brand-500 text-brand-500 font-bold hover:bg-brand-500/10";
                textStyleClasses = "text-brand-500";
                borderRoundClass = "rounded-full";
              } else if (btnStyleKey === "brutalist") {
                btnStyleClasses = "bg-brand-500 border-2 border-zinc-950 text-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
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
                let extraClasses = "";

                if (btnStyleKey === "pill") {
                  btnStyleClasses = theme.buttonBg;
                  textStyleClasses = theme.buttonText;
                  borderRoundClass = "rounded-full border";
                } else if (btnStyleKey === "outline") {
                  btnStyleClasses = "bg-transparent border-2 border-brand-500 text-brand-500 font-bold hover:bg-brand-500/10";
                  textStyleClasses = "text-brand-500";
                  borderRoundClass = "rounded-full";
                } else if (btnStyleKey === "brutalist") {
                  btnStyleClasses = "bg-brand-500 border-2 border-zinc-950 text-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
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
                    transition={{ delay: (publicTreeCollections.length + idx) * 0.05 }}
                    style={customBtnStyle}
                    className={cn(
                      "block w-full py-4 px-6 text-center transition-all duration-300 transform hover:-translate-y-1 flex justify-between items-center group relative overflow-hidden",
                      borderRoundClass,
                      finalBtnClasses,
                      (btnStyleKey !== "brutalist" && !publicTreeSettings.treeButtonBgImage) && theme.shadow,
                      extraClasses
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">Loading...</div>;

  if (!user) {
    return (
      <AuthPage
        isLightMode={isLightMode}
        toggleLightMode={toggleLightMode}
        lang={lang}
        toggleLang={toggleLang}
        handleLogin={handleLogin}
        settings={settings}
        themeInlineVars={themeInlineVars}
      />
    );
  }

  const allFilteredSelected = sortedLinks.length > 0 && sortedLinks.every(l => selectedLinkIds.includes(l.id));

  return (
    <div className="theme-customizer-active w-full" style={themeInlineVars}>
      <div className={cn("min-h-screen font-sans transition-colors duration-200", dashboardBg)}>
      {/* Sidebar */}
      <aside className={cn("fixed left-0 top-0 h-full w-64 hidden md:flex flex-col p-6 space-y-6 transition-colors duration-200", sidebarBg)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
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
                : cn(isLightMode ? "text-zinc-500 hover:text-zinc-950" : "text-zinc-400 hover:text-zinc-200", hoverBg)
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
                : cn(isLightMode ? "text-zinc-500 hover:text-zinc-950" : "text-zinc-400 hover:text-zinc-200", hoverBg)
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
                : cn(isLightMode ? "text-zinc-500 hover:text-zinc-950" : "text-zinc-400 hover:text-zinc-200", hoverBg)
            )}
          >
            <FolderOpen className="w-5 h-5" />
            {lang === "id" ? "Grup & Koleksi" : "Groups & Folders"}
          </button>
          {currentTab === "link-detail" && (
            <button 
              onClick={() => setCurrentTab("link-detail")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-brand-400 bg-brand-500/5 border border-brand-500/10 text-left cursor-default pointer-events-none"
            >
              <Activity className="w-5 h-5 text-brand-500 animate-pulse" />
              {t("viewDetails")}
            </button>
          )}
        </nav>

        {/* Dynamic Controls */}
        <div className={cn("pt-4 space-y-3 border-t", borderClassic)}>
          <div className="flex items-center justify-between">
            <span className={cn("text-[11px] font-bold uppercase tracking-wider", textMuted)}>{t("lightMode")}</span>
            <button
              onClick={toggleLightMode}
              className={cn(
                "p-1.5 rounded-lg border transition-all cursor-pointer",
                isLightMode 
                  ? (appTheme === "orange" ? "bg-brand-500/10 border-brand-200 text-brand-600" :
                     appTheme === "emerald" ? "bg-emerald-500/10 border-emerald-200 text-emerald-600" :
                     appTheme === "violet" ? "bg-violet-500/10 border-violet-200 text-violet-600" :
                     appTheme === "sky" ? "bg-sky-500/10 border-sky-200 text-sky-600" :
                     "bg-rose-500/10 border-rose-200 text-rose-600")
                  : (appTheme === "orange" ? "bg-zinc-805 border-zinc-700 text-brand-400" :
                     appTheme === "emerald" ? "bg-zinc-805 border-zinc-700 text-emerald-400" :
                     appTheme === "violet" ? "bg-zinc-805 border-zinc-700 text-violet-400" :
                     appTheme === "sky" ? "bg-zinc-805 border-zinc-700 text-sky-400" :
                     "bg-zinc-805 border-zinc-700 text-rose-400")
              )}
            >
              {isLightMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className={cn("text-[11px] font-bold uppercase tracking-wider", textMuted)}>{t("language")}</span>
            <button
              onClick={toggleLang}
              className={cn(
                "px-2.5 py-1 rounded-lg border text-[10px] font-black tracking-widest uppercase transition-all cursor-pointer font-sans",
                isLightMode 
                  ? "bg-zinc-50 border-zinc-250 text-zinc-800 hover:bg-zinc-100" 
                  : "bg-zinc-850 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              )}
            >
              {lang}
            </button>
          </div>
          {/* Theme customizer color options */}
          <div className="flex flex-col gap-1.5 pt-1">
            <span className={cn("text-[11px] font-bold uppercase tracking-wider", textMuted)}>{lang === "id" ? "Warna Tema" : "Theme Color"}</span>
            <div className="flex items-center gap-2">
              {Object.keys(APP_THEME_CONFIGS).map((colorKey) => {
                const conf = APP_THEME_CONFIGS[colorKey as keyof typeof APP_THEME_CONFIGS];
                const isActive = appTheme === colorKey;
                const previewBgs: Record<string, string> = {
                  orange: "bg-orange-500",
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
                        ? (isLightMode ? "border-zinc-805 border-zinc-800 scale-110 shadow-sm" : "border-white scale-110 shadow-sm")
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

      {/* Main Content */}
      <main className="md:ml-64 p-4 md:p-8 lg:p-12 max-w-7xl mx-auto space-y-12">
        {/* Mobile Header with App Logo & Account Dropdown / Logout */}
        <div className={cn("flex justify-between items-center md:hidden p-4 rounded-3xl backdrop-blur-md border", isLightMode ? "bg-white/80 border-zinc-250 text-zinc-900 shadow-sm" : "bg-zinc-900/60 border-zinc-800 text-white")}>
          <div className="flex items-center gap-2.5 col-span-1">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", curT.bg)}>
              <Link2 className="w-5 h-5 text-black" />
            </div>
            <span className={cn("text-sm font-black tracking-wider uppercase font-sans", isLightMode ? "text-zinc-955" : "text-white")}>Linkly</span>
          </div>

          <div className="flex items-center gap-3">
            <div className={cn("flex items-center gap-2 p-1.5 pr-3 rounded-2xl border", isLightMode ? "bg-zinc-150 border-zinc-250" : "bg-zinc-955 border border-zinc-850")}>
              <img src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`} className={cn("w-6 h-6 rounded-full border", isLightMode ? "border-zinc-350" : "border-zinc-700")} alt={user.displayName || ""} />
              <div className="text-left leading-none max-w-[80px]">
                <p className={cn("text-[10px] font-black truncate font-sans", isLightMode ? "text-zinc-805" : "text-zinc-300")}>{user.displayName?.split(" ")[0] || "User"}</p>
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
              currentTab === "dashboard" ? `${curT.bg} text-black shadow-md font-extrabold` : (isLightMode ? "text-zinc-500 hover:text-zinc-955 hover:text-zinc-900" : "text-zinc-400 hover:text-zinc-200")
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
              currentTab === "links-list" ? `${curT.bg} text-black shadow-md font-extrabold` : (isLightMode ? "text-zinc-500 hover:text-zinc-955 hover:text-zinc-900" : "text-zinc-400 hover:text-zinc-200")
            )}
          >
            {t("linksList")}
          </button>
          <button
            onClick={() => setCurrentTab("link-tree")}
            className={cn(
              "flex-1 py-2 text-[10px] font-bold rounded-lg transition-all text-center",
              currentTab === "link-tree" ? `${curT.bg} text-black shadow-md font-extrabold` : (isLightMode ? "text-zinc-500 hover:text-zinc-955 hover:text-zinc-900" : "text-zinc-400 hover:text-zinc-200")
            )}
          >
            {t("linkTree")}
          </button>
          <button
            onClick={() => setCurrentTab("collections")}
            className={cn(
              "flex-1 py-2 text-[10px] font-bold rounded-lg transition-all text-center",
              currentTab === "collections" ? `${curT.bg} text-black shadow-md font-extrabold` : (isLightMode ? "text-zinc-500 hover:text-zinc-955 hover:text-zinc-900" : "text-zinc-400 hover:text-zinc-200")
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
        <div className={cn("flex md:hidden items-center justify-between p-3 border rounded-2xl gap-4 transition-all -mt-8", isLightMode ? "bg-white border-zinc-200/85" : "bg-zinc-900/40 border-zinc-850")}>
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
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={toggleLightMode}
              className={cn(
                "p-1 rounded-lg border transition-all cursor-pointer text-xs flex items-center justify-center",
                isLightMode ? "bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200" : "bg-zinc-800 border-zinc-700 text-zinc-350 hover:bg-zinc-750"
              )}
            >
              {isLightMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={toggleLang}
              className={cn(
                "px-2 py-0.5 rounded-lg border text-[9px] font-bold tracking-wider uppercase transition-all cursor-pointer font-sans",
                isLightMode ? "bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200" : "bg-zinc-800 border-zinc-700 text-zinc-350 hover:bg-zinc-750"
              )}
            >
              {lang}
            </button>
          </div>
        </div>

        {currentTab === "link-tree" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
            {/* Left Side Builder Controls (7 cols on large screens) */}
            <div className="lg:col-span-7 space-y-8">
              <div>
                <h2 className={cn("text-2xl font-black mb-2 flex items-center gap-2", isLightMode ? "text-zinc-900" : "text-white")}>
                  <Layers className="w-6 h-6 text-brand-500" />
                  {t("customBioTreeHeader")}
                </h2>
                <p className={cn("text-sm", isLightMode ? "text-zinc-620 text-zinc-600" : "text-zinc-500")}>{t("customBioTreeSubtitle")}</p>
              </div>

              {/* Public URL Share Card */}
              <div className={cn("p-6 rounded-3xl space-y-4 border transition-all", isLightMode ? "bg-white border-zinc-200/80 shadow-sm" : "bg-zinc-900/50 border-zinc-800")}>
                <h3 className={cn("text-sm font-bold uppercase tracking-wider", isLightMode ? "text-zinc-700" : "text-zinc-300")}>{t("publicBioUrlTitle")}</h3>
                <div className={cn("p-3 rounded-2xl flex items-center justify-between gap-4 border transition-all", isLightMode ? "bg-zinc-50 border-zinc-150" : "bg-zinc-950 border-zinc-855")}>
                  <span className="text-xs font-mono font-bold text-brand-500 truncate">
                    {window.location.origin}/t/{user?.email ? user.email.split("@")[0] : user?.uid}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const slug = user?.email ? user.email.split("@")[0] : user?.uid;
                        const url = `${window.location.origin}/t/${slug}`;
                        navigator.clipboard.writeText(url);
                        setCopiedTreeUrl(true);
                        setTimeout(() => setCopiedTreeUrl(false), 2000);
                      }}
                      className={cn(
                        "p-2 border transition-all cursor-pointer rounded-xl",
                        isLightMode 
                          ? "bg-white border-zinc-200 hover:border-zinc-300 text-zinc-605 text-zinc-600 hover:text-zinc-900 shadow-sm" 
                          : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white"
                      )}
                      title={t("copy")}
                    >
                      {copiedTreeUrl ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        const slug = user?.email ? user.email.split("@")[0] : user?.uid;
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

              {/* Editor Fields */}
              <div className={cn("p-6 rounded-3xl space-y-6 border transition-all", isLightMode ? "bg-white border-zinc-200/80 shadow-sm" : "bg-zinc-900/50 border-zinc-800")}>
                <h3 className={cn("text-sm font-bold uppercase tracking-wider border-b pb-3", isLightMode ? "text-zinc-700 border-zinc-150" : "text-zinc-300 border-zinc-800/60")}>{lang === "id" ? "Profil & Deskripsi" : "Profile & Description"}</h3>
                <div className="space-y-4">
                  
                  {/* Photo Profile / Avatar URL */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div className="flex flex-col items-center space-y-2">
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
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold"
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
                          {lang === "id" ? "Unggah Foto Profil (Import File)" : "Upload Profile Photo (File Import)"}
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
                          className={cn(
                            "w-full border rounded-xl py-2 px-4 focus:outline-none focus:ring-1 focus:ring-brand-500/50 text-xs font-mono transition-all",
                            isLightMode 
                              ? "bg-white border-zinc-200 text-zinc-800 placeholder-zinc-400" 
                              : "bg-zinc-950 border-zinc-800 text-white"
                          )}
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
                        className={cn(
                          "w-full border rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-brand-500/50 text-xs transition-all",
                          isLightMode 
                            ? "bg-white border-zinc-200 text-zinc-800 placeholder-zinc-400" 
                            : "bg-zinc-950 border-zinc-800 text-white"
                        )}
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className={cn("text-xs font-bold", isLightMode ? "text-zinc-600" : "text-zinc-400")}>{lang === "id" ? "Deskripsi / Bio Singkat" : "Description / Short Bio"}</label>
                      <input 
                        type="text"
                        value={treeBio}
                        onChange={(e) => setTreeBio(e.target.value)}
                        placeholder={lang === "id" ? "Tulis bio singkat atau deskripsi..." : "Write a short bio or description..."}
                        className={cn(
                          "w-full border rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-brand-500/50 text-xs transition-all",
                          isLightMode 
                            ? "bg-white border-zinc-200 text-zinc-800 placeholder-zinc-400" 
                            : "bg-zinc-950 border-zinc-800 text-white"
                        )}
                      />
                    </div>
                  </div>

                  {/* Social Links (Instagram, Twitter, LinkedIn, Youtube, GitHub) */}
                  <div className="border-t border-zinc-200/50 dark:border-zinc-800/85 pt-4 mt-2 space-y-3">
                    <h4 className={cn("text-[11px] font-extrabold uppercase tracking-widest", isLightMode ? "text-zinc-500" : "text-zinc-400")}>
                      {lang === "id" ? "Tautan Media Sosial" : "Social Media Links"}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      {/* Instagram */}
                      <div className="space-y-1.5 text-left">
                        <label className={cn("text-[10px] font-bold flex items-center gap-1.5", isLightMode ? "text-zinc-650" : "text-zinc-400")}>
                          <Instagram className="w-3.5 h-3.5 text-pink-500" />
                          <span>Instagram</span>
                        </label>
                        <input 
                          type="text"
                          value={treeInstagram}
                          onChange={(e) => setTreeInstagram(e.target.value)}
                          placeholder="username"
                          className={cn(
                            "w-full border rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-brand-500/50 text-xs transition-all",
                            isLightMode 
                              ? "bg-white border-zinc-200 text-zinc-800 placeholder-zinc-400" 
                              : "bg-zinc-950 border-zinc-800 text-white"
                          )}
                        />
                      </div>
                      {/* Twitter */}
                      <div className="space-y-1.5 text-left">
                        <label className={cn("text-[10px] font-bold flex items-center gap-1.5", isLightMode ? "text-zinc-650" : "text-zinc-400")}>
                          <Twitter className="w-3.5 h-3.5 text-sky-400" />
                          <span>Twitter</span>
                        </label>
                        <input 
                          type="text"
                          value={treeTwitter}
                          onChange={(e) => setTreeTwitter(e.target.value)}
                          placeholder="username"
                          className={cn(
                            "w-full border rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-brand-500/50 text-xs transition-all",
                            isLightMode 
                              ? "bg-white border-zinc-200 text-zinc-800 placeholder-zinc-400" 
                              : "bg-zinc-950 border-zinc-800 text-white"
                          )}
                        />
                      </div>
                      {/* LinkedIn */}
                      <div className="space-y-1.5 text-left">
                        <label className={cn("text-[10px] font-bold flex items-center gap-1.5", isLightMode ? "text-zinc-650" : "text-zinc-400")}>
                          <Linkedin className="w-3.5 h-3.5 text-blue-500" />
                          <span>LinkedIn</span>
                        </label>
                        <input 
                          type="text"
                          value={treeLinkedIn}
                          onChange={(e) => setTreeLinkedIn(e.target.value)}
                          placeholder="username / URL"
                          className={cn(
                            "w-full border rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-brand-500/50 text-xs transition-all",
                            isLightMode 
                              ? "bg-white border-zinc-200 text-zinc-800 placeholder-zinc-400" 
                              : "bg-zinc-950 border-zinc-800 text-white"
                          )}
                        />
                      </div>
                      {/* YouTube */}
                      <div className="space-y-1.5 text-left">
                        <label className={cn("text-[10px] font-bold flex items-center gap-1.5", isLightMode ? "text-zinc-650" : "text-zinc-400")}>
                          <Youtube className="w-3.5 h-3.5 text-red-500" />
                          <span>YouTube</span>
                        </label>
                        <input 
                          type="text"
                          value={treeYoutube}
                          onChange={(e) => setTreeYoutube(e.target.value)}
                          placeholder="channel / URL"
                          className={cn(
                            "w-full border rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-brand-500/50 text-xs transition-all",
                            isLightMode 
                              ? "bg-white border-zinc-200 text-zinc-800 placeholder-zinc-400" 
                              : "bg-zinc-950 border-zinc-800 text-white"
                          )}
                        />
                      </div>
                      {/* GitHub */}
                      <div className="space-y-1.5 text-left">
                        <label className={cn("text-[10px] font-bold flex items-center gap-1.5", isLightMode ? "text-zinc-650" : "text-zinc-400")}>
                          <Github className="w-3.5 h-3.5 text-zinc-550 dark:text-zinc-300" />
                          <span>GitHub</span>
                        </label>
                        <input 
                          type="text"
                          value={treeGithub}
                          onChange={(e) => setTreeGithub(e.target.value)}
                          placeholder="username"
                          className={cn(
                            "w-full border rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-brand-500/50 text-xs transition-all",
                            isLightMode 
                              ? "bg-white border-zinc-200 text-zinc-800 placeholder-zinc-400" 
                              : "bg-zinc-950 border-zinc-800 text-white"
                          )}
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Theme Selector for Link Tree */}
              <div className={cn("p-6 rounded-3xl space-y-4 border transition-all", isLightMode ? "bg-white border-zinc-200/80 shadow-sm" : "bg-zinc-900/50 border-zinc-800")}>
                <h3 className={cn("text-sm font-bold uppercase tracking-wider border-b pb-3", isLightMode ? "text-zinc-700 border-zinc-150" : "text-zinc-300 border-zinc-800/60 pb-3")}>{t("choosePageTheme")}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {Object.entries(THEME_STYLES).map(([key, style]) => {
                    const isSelected = treeTheme === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setTreeTheme(key)}
                        className={cn(
                          "p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer",
                          isSelected
                            ? (isLightMode ? "bg-brand-50 border-brand-500 text-brand-600 shadow shadow-brand-500/10 font-bold" : "bg-brand-500/10 border-brand-500 text-brand-400 shadow-md")
                            : (isLightMode ? "bg-zinc-50/50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:border-zinc-300 hover:text-zinc-900" : "bg-zinc-950/60 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200")
                        )}
                      >
                        <div className={cn("w-full h-8 rounded-lg flex items-center justify-center p-1.5 text-[9px] font-bold", style.bg)}>
                          Sample
                        </div>
                        <span className="text-[10px] font-bold truncate w-full">{style.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Background File Import */}
              <div className={cn("p-6 rounded-3xl space-y-4 border transition-all", isLightMode ? "bg-white border-zinc-200/80 shadow-sm" : "bg-zinc-900/50 border-zinc-800")}>
                <div className="border-b pb-3 flex justify-between items-center">
                  <h3 className={cn("text-sm font-bold uppercase tracking-wider", isLightMode ? "text-zinc-700" : "text-zinc-300")}>
                    {lang === "id" ? "Latar Belakang Kustom" : "Custom Background Image"}
                  </h3>
                  {treeBgImage && (
                    <button
                      type="button"
                      onClick={() => setTreeBgImage("")}
                      className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold px-2 py-1 rounded transition-colors"
                    >
                      {lang === "id" ? "Hapus Gambar" : "Remove Image"}
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="flex flex-col items-center space-y-2">
                    <div 
                      className={cn("w-full h-24 rounded-2xl border overflow-hidden flex items-center justify-center p-0.5 transition-all bg-zinc-950 relative", isLightMode ? "border-zinc-200" : "border-zinc-800")}
                      style={treeBgImage ? { backgroundImage: `url(${treeBgImage})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
                    >
                      {!treeBgImage && (
                        <span className="text-zinc-500 text-xs font-mono italic">{lang === "id" ? "Tema Bawaan" : "Theme Default"}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{lang === "id" ? "Preview Latar Belakang" : "Background Preview"}</span>
                  </div>
                  
                  <div className="md:col-span-2 space-y-3 text-left">
                    <div className="space-y-1">
                      <label className={cn("text-xs font-bold flex items-center gap-1.5", isLightMode ? "text-zinc-600" : "text-zinc-400")}>
                        <Upload className="w-3.5 h-3.5 text-brand-500" />
                        {lang === "id" ? "Unggah Gambar Latar (Import File)" : "Upload Custom Background (File Import)"}
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
              <div className={cn("p-6 rounded-3xl space-y-4 border transition-all", isLightMode ? "bg-white border-zinc-200/80 shadow-sm" : "bg-zinc-900/50 border-zinc-800")}>
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
                      className={cn(
                        "w-full border rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-brand-500/50 text-xs transition-all",
                        isLightMode 
                          ? "bg-white border-zinc-200 text-zinc-800 placeholder-zinc-400" 
                          : "bg-zinc-950 border-zinc-800 text-white"
                      )}
                    />
                    <p className="text-[10px] text-zinc-500 font-mono leading-normal mt-1">
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
              <div className={cn("p-6 rounded-3xl space-y-4 border transition-all", isLightMode ? "bg-white border-zinc-200/80 shadow-sm" : "bg-zinc-900/50 border-zinc-800")}>
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
                    const isSelected = treeButtonStyle === styleOption.id;
                    return (
                      <button
                        key={styleOption.id}
                        type="button"
                        onClick={() => setTreeButtonStyle(styleOption.id)}
                        className={cn(
                          "p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer",
                          isSelected
                            ? (isLightMode ? "bg-brand-50 border-brand-500 text-brand-600 shadow shadow-brand-500/10 font-bold" : "bg-brand-500/10 border-brand-500 text-brand-400 shadow-md")
                            : (isLightMode ? "bg-zinc-50/50 border-zinc-200 text-zinc-605 hover:bg-zinc-100 hover:border-zinc-300 hover:text-zinc-900" : "bg-zinc-950/60 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200")
                        )}
                      >
                        <span className="text-xs font-extrabold block">{styleOption.name}</span>
                        <span className="text-[9px] opacity-70 leading-snug block">{styleOption.desc}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Button Custom Background Image Uploader */}
                <div className="border-t border-zinc-200/50 dark:border-zinc-800/80 pt-4 mt-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <label className={cn("text-xs font-bold flex items-center gap-1.5", isLightMode ? "text-zinc-650" : "text-zinc-400")}>
                      <Image className="w-3.5 h-3.5 text-brand-500" />
                      {lang === "id" ? "Latar Belakang Tombol Kustom (Import File)" : "Custom Button Background (File Import)"}
                    </label>
                    {treeButtonBgImage && (
                      <button
                        type="button"
                        onClick={() => setTreeButtonBgImage("")}
                        className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold px-2 py-1 rounded transition-colors"
                      >
                        {lang === "id" ? "Hapus" : "Remove"}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="flex flex-col items-center">
                      <div 
                        className={cn("w-full h-11 rounded-xl border overflow-hidden flex items-center justify-center p-0.5 transition-all bg-zinc-950 relative", isLightMode ? "border-zinc-200" : "border-zinc-805")}
                        style={treeButtonBgImage ? { backgroundImage: `url(${treeButtonBgImage})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
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
              <div className={cn("p-6 rounded-3xl border transition-all space-y-4", isLightMode ? "bg-white border-zinc-200/80 shadow-sm" : "bg-zinc-900/50 border-zinc-800")}>
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
              <div className={cn("p-6 rounded-3xl space-y-4 border transition-all", isLightMode ? "bg-white border-zinc-200/80 shadow-sm" : "bg-zinc-900/50 border-zinc-800")}>
                <div className={cn("flex items-center justify-between border-b pb-3", isLightMode ? "border-zinc-150" : "border-zinc-800/60")}>
                  <h3 className={cn("text-sm font-bold uppercase tracking-wider", isLightMode ? "text-zinc-700" : "text-zinc-300")}>{t("chooseLinksToDisplay")}</h3>
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
                          "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                          isChecked 
                            ? (isLightMode ? "bg-brand-500/[0.04] border-brand-500 hover:border-brand-500" : "bg-zinc-950/80 border-brand-500/20 hover:border-brand-500/35")
                            : (isLightMode ? "bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-700" : "bg-zinc-950/40 border-zinc-850 hover:border-zinc-805 text-zinc-405")
                        )}
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <p className={cn("text-xs font-bold truncate", isLightMode ? (isChecked ? "text-brand-650" : "text-zinc-800") : "text-zinc-200")}>{link.title || link.shortSlug}</p>
                          <p className="text-[10px] font-mono text-zinc-500 truncate">/{link.shortSlug}</p>
                        </div>
                        <button
                          type="button"
                          className={cn(
                            "w-8 h-4 rounded-full p-0.5 transition-colors relative duration-300 pointer-events-none",
                            isChecked ? "bg-brand-500" : (isLightMode ? "bg-zinc-200" : "bg-zinc-800")
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
                    <div className={cn("py-8 border rounded-2xl text-center text-zinc-500 text-xs italic font-mono", isLightMode ? "bg-zinc-50 border-zinc-200" : "bg-zinc-950/50 border-zinc-850")}>
                      {t("noLinksCreatedYet")}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  disabled={isSavingTree}
                  onClick={async () => {
                    if (!user) return;
                    setIsSavingTree(true);
                    try {
                      await setDoc(doc(db, "link_trees", user.uid), {
                        treeTitle,
                        treeBio,
                        treeAvatar,
                        treeTheme,
                        treeLinks,
                        treeBgImage,
                        treeButtonStyle,
                        treeShowFolders,
                        treeInstagram,
                        treeTwitter,
                        treeLinkedIn,
                        treeYoutube,
                        treeGithub,
                        treeVideoUrl,
                        treeButtonBgImage,
                        updatedAt: new Date().toISOString()
                      }, { merge: true });
                      await queryClient.invalidateQueries({ queryKey: ["link_tree", user.uid] });
                      setTreeSavedSuccess(true);
                      showToast(lang === "id" ? "Konfigurasi profil berhasil disimpan!" : "Profile configuration saved successfully!");
                      setTimeout(() => setTreeSavedSuccess(false), 3000);
                    } catch (err) {
                      console.error(err);
                      showToast(lang === "id" ? "Gagal menyimpan konfigurasi profil." : "Failed to save profile configuration.", "error");
                    } finally {
                      setIsSavingTree(false);
                    }
                  }}
                  className="bg-brand-500 hover:bg-brand-400 text-black font-extrabold px-8 py-3 rounded-xl transition-all shadow-lg shadow-brand-500/25 flex items-center gap-2 text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingTree ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  ) : (
                    <CheckSquare className="w-4 h-4" />
                  )}
                  {isSavingTree ? (lang === "id" ? "MENYIMPAN..." : "SAVING...") : t("saveConfiguration")}
                </button>
              </div>

              {treeSavedSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold py-3 px-4 rounded-xl text-center"
                >
                  {t("bioConfigSavedSuccessfully")}
                </motion.div>
              )}
            </div>

            {/* Right Side Device Simulated Live Preview Mockup (5 cols) */}
            <div className="lg:col-span-5 flex justify-center sticky top-8">
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
                      <div className="w-14 h-14 rounded-full border border-brand-500/20 p-0.5 overflow-hidden bg-zinc-900 flex items-center justify-center">
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
                        <div className="flex items-center justify-center gap-3 py-1 flex-wrap">
                          {treeInstagram && (
                            <a 
                              href={`https://instagram.com/${treeInstagram.replace('@', '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-zinc-450 hover:text-pink-500 hover:scale-110 active:scale-95 transition-all p-0.5"
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
                              className="text-zinc-450 hover:text-sky-400 hover:scale-110 active:scale-95 transition-all p-0.5"
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
                              className="text-zinc-450 hover:text-blue-500 hover:scale-110 active:scale-95 transition-all p-0.5"
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
                              className="text-zinc-450 hover:text-red-500 hover:scale-110 active:scale-95 transition-all p-0.5"
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
                              className="text-zinc-450 hover:text-white hover:scale-110 active:scale-95 transition-all p-0.5"
                              title="GitHub"
                            >
                              <Github className="w-4 h-4 text-zinc-100" />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Live Preview Embedded Video Option */}
                      {treeVideoUrl && getYouTubeEmbedUrl(treeVideoUrl) && (
                        <div className="w-full rounded-2xl overflow-hidden border border-zinc-700/30 shadow aspect-video my-3">
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
                                  "w-full py-2 px-3 text-[10px] font-bold flex justify-between items-center transition-all shadow-sm",
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
        ) : currentTab === "links-list" ? (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight mb-1 flex items-center gap-2">
                  {t("linksListHeader")} <List className="w-5 h-5 text-brand-500" />
                </h1>
                <p className="text-zinc-500 text-sm">{t("linksListSubtitle")}</p>
              </div>
              <div>
                <button
                  onClick={() => { setSelectedDetailLinkId(null); setEditingLink(null); setIsModalOpen(true); }}
                  className="bg-brand-500 hover:bg-brand-400 text-black font-extrabold px-5 py-3 rounded-xl transition-all shadow-lg shadow-brand-500/10 flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" /> {t("shortenNewLink")}
                </button>
              </div>
            </div>

            {/* Simple Table container with filters & pagination */}
            <div className={cn("rounded-3xl overflow-hidden border transition-all", isLightMode ? "bg-white border-brand-100/60 shadow-sm shadow-brand-500/[0.01]" : "bg-zinc-900/50 border-zinc-800")}>
              {/* Filter controls inside table box */}
              <div className={cn("p-6 border-b space-y-4 transition-colors", isLightMode ? "border-brand-100/35 bg-brand-500/[0.01]" : "border-zinc-805 bg-zinc-950/20")}>
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
                  
                  {/* Text Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input 
                      type="text" 
                      placeholder={t("searchHint")} 
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setListCurrentPage(1); }}
                      className={cn(
                        "w-full rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all font-medium text-sm border",
                        isLightMode 
                          ? "bg-white border-brand-100/70 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-brand-350" 
                          : "bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-650 focus:bg-zinc-905"
                      )}
                    />
                  </div>

                  {/* Right side filter triggers */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status filter switcher */}
                    <div className={cn("flex rounded-xl p-1 gap-1 border transition-all", isLightMode ? "bg-white border-brand-100/60" : "bg-zinc-950 border-zinc-800")}>
                       {(['all', 'active', 'expired'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => { setFilterStatus(status); setListCurrentPage(1); }}
                          className={cn(
                            "px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all select-none cursor-pointer",
                            filterStatus === status 
                              ? (isLightMode ? "bg-brand-500 text-white shadow shadow-brand-500/25 font-extrabold" : "bg-zinc-800 text-white shadow font-extrabold") 
                              : "text-zinc-500 hover:text-brand-500"
                          )}
                        >
                          {status === 'all' ? t("all") : status === 'active' ? t("active") : t("expired")}
                        </button>
                      ))}
                    </div>

                    {/* Advanced filter toggle */}
                    <button
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className={cn(
                        "px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all select-none cursor-pointer",
                        showAdvancedFilters 
                          ? (isLightMode ? "bg-brand-50 border-brand-400 text-brand-600 shadow shadow-brand-500/5" : "bg-brand-500/10 border-brand-500/30 text-brand-400")
                          : (isLightMode ? "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-850" : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700")
                      )}
                    >
                      <SlidersHorizontal className="w-4 h-4 text-brand-500" />
                      {t("advancedFilter")}
                    </button>
                  </div>
                </div>

                {/* Advanced filter drawer */}
                <AnimatePresence>
                  {showAdvancedFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className={cn("overflow-hidden border-t pt-4 grid grid-cols-1 md:grid-cols-4 gap-4", isLightMode ? "border-zinc-150" : "border-zinc-805")}
                    >
                      {/* Category filter */}
                      <div className="space-y-1.5 text-left">
                        <label className={cn("text-xs font-bold", isLightMode ? "text-zinc-600" : "text-zinc-400")}>{t("filterCategory")}</label>
                        <select
                          value={listFilterCategory}
                          onChange={(e) => { setListFilterCategory(e.target.value); setListCurrentPage(1); }}
                          className={cn(
                            "w-full border rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-brand-500/50 text-xs transition-all",
                            isLightMode 
                              ? "bg-white border-zinc-200 text-zinc-800" 
                              : "bg-zinc-950 border-zinc-800 text-zinc-300"
                          )}
                        >
                          <option value="all">{t("allCategories")}</option>
                          {CATEGORY_OPTIONS.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {lang === 'id' ? cat.labelIdText : cat.labelEn}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Password protect filter */}
                      <div className="space-y-1.5 text-left">
                        <label className={cn("text-xs font-bold", isLightMode ? "text-zinc-600" : "text-zinc-400")}>{t("passwordSecurity")}</label>
                        <select
                          value={listFilterPassword}
                          onChange={(e) => { setListFilterPassword(e.target.value as any); setListCurrentPage(1); }}
                          className={cn(
                            "w-full border rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-brand-500/50 text-xs transition-all",
                            isLightMode 
                              ? "bg-white border-zinc-200 text-zinc-800" 
                              : "bg-zinc-950 border-zinc-800 text-zinc-300"
                          )}
                        >
                          <option value="all">{t("allLinks")}</option>
                          <option value="protected">{t("passwordProtectedOnly")}</option>
                          <option value="none">{t("openLinksOnly")}</option>
                        </select>
                      </div>

                      {/* Portal landing filter */}
                      <div className="space-y-1.5 text-left">
                        <label className={cn("text-xs font-bold", isLightMode ? "text-zinc-600" : "text-zinc-400")}>{t("infoPortalStatus")}</label>
                        <select
                          value={listFilterPortal}
                          onChange={(e) => { setListFilterPortal(e.target.value as any); setListCurrentPage(1); }}
                          className={cn(
                            "w-full border rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-brand-500/50 text-xs transition-all",
                            isLightMode 
                              ? "bg-white border-zinc-200 text-zinc-800" 
                              : "bg-zinc-950 border-zinc-800 text-zinc-300"
                          )}
                        >
                          <option value="all">{t("allPortalStatus")}</option>
                          <option value="enabled">{t("landingPortalActive")}</option>
                          <option value="disabled">{t("noLandingPortal")}</option>
                        </select>
                      </div>

                      {/* Minimum clicks filter */}
                      <div className="space-y-1.5 text-left">
                        <label className={cn("text-xs font-bold", isLightMode ? "text-zinc-600" : "text-zinc-400")}>{t("minClickCount")} ({listMinClicks || t("all")})</label>
                        <input
                          type="number"
                          placeholder={t("minClickPlaceholder")}
                          value={listMinClicks}
                          onChange={(e) => { 
                            const val = e.target.value === "" ? "" : Number(e.target.value);
                            setListMinClicks(val);
                            setListCurrentPage(1);
                          }}
                          className={cn(
                            "w-full border rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-brand-500/50 text-xs transition-all",
                            isLightMode 
                              ? "bg-white border-zinc-200 text-zinc-800 placeholder-zinc-400" 
                              : "bg-zinc-950 border-zinc-800 text-white"
                          )}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Table rendering only */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={cn("text-xs font-semibold uppercase tracking-wider select-none border-b transition-colors", isLightMode ? "bg-zinc-50 border-zinc-200 text-zinc-600" : "bg-zinc-950/50 border-zinc-800 text-zinc-500")}>
                      <th className="px-6 py-4 w-12">
                        <button 
                          onClick={toggleSelectAll}
                          className={cn("transition-colors cursor-pointer", isLightMode ? "text-zinc-500 hover:text-zinc-800" : "text-zinc-400 hover:text-white")}
                          title={t("selectAll")}
                        >
                          {links.length > 0 && listFilteredLinks.every(l => selectedLinkIds.includes(l.id)) ? (
                            <CheckSquare className="w-5 h-5 text-brand-500" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </th>
                      <th className={cn("px-6 py-4 cursor-pointer transition-colors", isLightMode ? "hover:text-zinc-800" : "hover:text-zinc-300")} onClick={() => requestSort('title')}>
                        <div className="flex items-center gap-2">{t("titleAndDestination")} <ArrowUpDown className="w-3 text-zinc-500" /></div>
                      </th>
                      <th className="px-6 py-4">{t("shortSlug") || "Short Slug"}</th>
                      <th className={cn("px-6 py-4 cursor-pointer transition-colors", isLightMode ? "hover:text-zinc-800" : "hover:text-zinc-300")} onClick={() => requestSort('clickCount')}>
                        <div className="flex items-center gap-2">{t("clickActivity")} <ArrowUpDown className="w-3 text-zinc-500" /></div>
                      </th>
                      <th className="px-6 py-4 text-center">{lang === "id" ? "Status & Fitur" : "Status & Features"}</th>
                      <th className="px-6 py-4 text-right">{t("manageAction")}</th>
                    </tr>
                  </thead>
                  <tbody className={cn("divide-y divide-dashed transition-colors", isLightMode ? "divide-zinc-200" : "divide-zinc-800/60")}>
                    {listPaginatedLinks.map((link) => {
                      const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
                      const shortUrl = `${window.location.origin}/${link.shortSlug}`;
                      const isSelected = selectedLinkIds.includes(link.id);
 
                      return (
                        <tr key={link.id} className={cn("transition-colors group", isLightMode ? (isSelected ? "bg-brand-500/[0.03] hover:bg-zinc-50/80" : "hover:bg-zinc-50/60") : (isSelected ? "bg-brand-500/[0.02] hover:bg-zinc-800/20" : "hover:bg-zinc-800/20"))}>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => toggleSelectLink(link.id)}
                              className={cn("transition-colors cursor-pointer", isLightMode ? "text-zinc-400 hover:text-zinc-800" : "text-zinc-400 hover:text-white")}
                            >
                              {isSelected ? <CheckSquare className="w-5 h-5 text-brand-500" /> : <Square className="w-5 h-5" />}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-w-xs">
                              <div className="flex items-center gap-2">
                                <p className={cn("font-bold truncate", isLightMode ? "text-zinc-800" : "text-zinc-200")}>{link.title}</p>
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
                              <p className={cn("text-xs truncate font-mono", isLightMode ? "text-zinc-500" : "text-zinc-500")}>{link.originalUrl}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <code className="text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded text-xs font-bold font-mono">/{link.shortSlug}</code>
                              <button 
                                onClick={() => handleCopy(link.shortSlug, link.id)}
                                className={cn("transition-colors cursor-pointer", isLightMode ? "text-zinc-400 hover:text-zinc-700" : "text-zinc-500 hover:text-white")}
                              >
                                {copiedId === link.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono text-sm font-bold text-brand-500">{link.clickCount}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                              {/* Status Icon Indicator */}
                              {isExpired ? (
                                <span className="p-1.5 px-2.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all font-semibold flex items-center gap-1 shrink-0" title={t("expired") || "Expired / Kedaluwarsa"}>
                                  <Clock className="w-4 h-4" />
                                </span>
                              ) : link.isEnabled === false ? (
                                <span className={cn("p-1.5 px-2.5 rounded-xl transition-all font-semibold flex items-center gap-1 shrink-0 border", isLightMode ? "bg-zinc-100 text-zinc-550 border-zinc-200" : "bg-zinc-700/20 text-zinc-400 border-zinc-700/30")} title={t("disabled") || "Nonaktif / Disabled"}>
                                  <EyeOff className="w-4 h-4" />
                                </span>
                              ) : (
                                <span className="p-1.5 px-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all font-semibold flex items-center gap-1 shrink-0" title={t("active") || "Aktif / Active"}>
                                  <Eye className="w-4 h-4 animate-pulse" />
                                </span>
                              )}

                              {/* Password Protective Icon Indicator */}
                              {link.password ? (
                                <span className="p-1.5 px-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-500 hover:bg-amber-500/20 transition-all font-semibold flex items-center gap-1 shrink-0" title={t("passwordProtected") || "Dilindungi Kata Sandi / Password Protected"}>
                                  <Lock className="w-4 h-4" />
                                </span>
                              ) : null}

                              {/* Landing Information Portal Icon Indicator */}
                              {link.landingEnabled ? (
                                <span className="p-1.5 px-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-500 hover:bg-blue-500/20 transition-all font-semibold flex items-center gap-1 shrink-0" title={t("landingPortalActive") || "Landing Portal Aktif / Transition Page Enabled"}>
                                  <Layers className="w-4 h-4" />
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={() => { setQrFgColor("#fb923c"); setQrBgColor("#ffffff"); setQrLink(link); }}
                                className={cn("p-2 rounded-xl transition-all", isLightMode ? "text-zinc-600 hover:text-brand-600 hover:bg-brand-50" : "text-zinc-400 hover:text-white hover:bg-zinc-800")}
                                title={t("customQr") || "Custom QR Code"}
                              >
                                <QrCode className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => { setSelectedDetailLinkId(link.id); setCurrentTab("link-detail"); }}
                                className={cn("p-2 rounded-xl transition-all font-bold", isLightMode ? "text-brand-600 hover:bg-brand-50" : "text-brand-400 hover:text-white hover:bg-brand-500/10")}
                                title={t("detailLinkManage") || "Ubah & Analisis Detail"}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => window.open(shortUrl, '_blank')}
                                className={cn("p-2 rounded-xl transition-all", isLightMode ? "text-zinc-600 hover:text-blue-600 hover:bg-blue-50" : "text-zinc-400 hover:text-white hover:bg-zinc-800")}
                                title={t("openLink") || "Buka Link asli"}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete(link.id)}
                                className={cn("p-2 rounded-xl transition-all", isLightMode ? "text-zinc-600 hover:text-red-600 hover:bg-red-50" : "text-zinc-400 hover:text-red-400 hover:bg-red-400/10")}
                                title={t("deleteButton") || "Hapus"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {listFilteredLinks.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center text-zinc-500 font-medium">
                          {t("noFilteredLinks")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Grid View representing the list of links */}
              <div className={cn("block md:hidden divide-y transition-colors", isLightMode ? "divide-zinc-200 bg-white" : "divide-zinc-800/10 divide-zinc-800/50")}>
                {listPaginatedLinks.map((link) => {
                  const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
                  const shortUrl = `${window.location.origin}/${link.shortSlug}`;
                  const isSelected = selectedLinkIds.includes(link.id);

                  return (
                    <div key={link.id} className={cn("p-5 space-y-4 transition-colors", isLightMode ? (isSelected ? "bg-brand-500/[0.03]" : "bg-white") : (isSelected ? "bg-brand-500/[0.02]" : "bg-zinc-900/10"))}>
                      <div className="flex items-start justify-between gap-3 select-none">
                        <div className="flex items-center gap-3">
                          <button 
                            type="button"
                            onClick={() => toggleSelectLink(link.id)}
                            className={cn("transition-colors cursor-pointer", isLightMode ? "text-zinc-400 hover:text-zinc-800" : "text-zinc-400 hover:text-white")}
                          >
                            {isSelected ? <CheckSquare className="w-5 h-5 text-brand-500" /> : <Square className="w-5 h-5" />}
                          </button>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className={cn("font-bold text-sm truncate", isLightMode ? "text-zinc-800" : "text-zinc-200")}>{link.title}</p>
                              {link.category && link.category !== "general" && (
                                <span className={cn(
                                  "text-[8px] px-1 py-0.5 rounded font-bold uppercase tracking-wider leading-none shrink-0",
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
                            <p className="text-[11px] text-zinc-500 truncate font-mono">{link.originalUrl}</p>
                          </div>
                        </div>
                        <div>
                          {isExpired ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/10">
                              {t("expired")}
                            </span>
                          ) : link.isEnabled === false ? (
                            <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border", isLightMode ? "bg-zinc-100 text-zinc-500 border-zinc-200" : "bg-zinc-700/20 text-zinc-400 border-zinc-700/30")}>
                              {t("disabled")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 animate-pulse">
                              {t("active")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={cn("flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl border transition-colors", isLightMode ? "bg-zinc-50 border-zinc-200 text-zinc-800" : "bg-zinc-950 border-zinc-800/80")}>
                        <div className="flex items-center gap-2">
                          <code className="text-brand-500 bg-brand-500/10 px-2.5 py-1 rounded-xl text-xs font-bold font-mono">/{link.shortSlug}</code>
                          <button 
                            type="button"
                            onClick={() => handleCopy(link.shortSlug, link.id)}
                            className={cn("transition-colors p-1 cursor-pointer", isLightMode ? "text-zinc-450 hover:text-zinc-900" : "text-zinc-500 hover:text-white")}
                            title={t("copy")}
                          >
                            {copiedId === link.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                        <div className={cn("text-xs font-semibold select-none", isLightMode ? "text-zinc-600" : "text-zinc-400")}>
                          {lang === "id" ? "Kunjungan" : "Clicks"}: <span className="text-brand-500 font-mono font-black">{link.clickCount}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 select-none">
                        <div className="flex gap-1.5">
                          {link.password && (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-red-500/10 text-red-500 py-0.5 px-2.5 rounded-full font-bold uppercase tracking-wider">
                              <Lock className="w-2.5 h-2.5" /> {t("passwordProtected") || "Sandi"}
                            </span>
                          )}
                          {link.landingEnabled && (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-blue-500/10 text-blue-500 py-0.5 px-2.5 rounded-full font-bold uppercase tracking-wider">
                              <Layers className="w-2.5 h-2.5" /> {t("landingPortalActive") || "Portal"}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button 
                            type="button"
                            onClick={() => { setQrFgColor("#fb923c"); setQrBgColor("#ffffff"); setQrLink(link); }}
                            className={cn("p-2 rounded-xl transition-all cursor-pointer", isLightMode ? "text-zinc-455 hover:text-zinc-900 hover:bg-zinc-100" : "text-zinc-400 hover:text-white hover:bg-zinc-800")}
                            title={t("customQr") || "Custom QR Code"}
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => { setSelectedDetailLinkId(link.id); setCurrentTab("link-detail"); }}
                            className={cn("p-2 rounded-xl transition-all font-bold cursor-pointer", isLightMode ? "text-brand-500 hover:bg-brand-500/10" : "text-brand-400 hover:text-white hover:bg-brand-500/10")}
                            title={t("detailLinkManage") || "Ubah & Analisis"}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => window.open(shortUrl, '_blank')}
                            className={cn("p-2 rounded-xl transition-all cursor-pointer", isLightMode ? "text-zinc-455 hover:text-zinc-900 hover:bg-zinc-100" : "text-zinc-400 hover:text-white hover:bg-zinc-800")}
                            title={t("openLink") || "Buka Link asli"}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDelete(link.id)}
                            className={cn("p-2 rounded-xl transition-all cursor-pointer", isLightMode ? "text-zinc-450 hover:text-red-500 hover:bg-red-50" : "text-zinc-400 hover:text-red-400 hover:bg-red-400/10")}
                            title={t("deleteButton") || "Hapus"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {listFilteredLinks.length === 0 && (
                  <div className="px-6 py-16 text-center text-zinc-500 text-xs font-semibold">
                    {t("noFilteredLinks")}
                  </div>
                )}
              </div>

              {/* Pagination controls footer */}
              <div className={cn("p-6 border-t flex flex-col sm:flex-row gap-4 justify-between items-center text-xs font-semibold select-none transition-colors", isLightMode ? "border-zinc-200 bg-zinc-50/40 text-zinc-655 text-zinc-600" : "border-zinc-850 bg-zinc-950/20 text-zinc-400")}>
                <div className="flex items-center gap-3">
                  <span>{t("rowsPerPage")}</span>
                  <select
                    value={listItemsPerPage}
                    onChange={(e) => { setListItemsPerPage(Number(e.target.value)); setListCurrentPage(1); }}
                    className={cn("border rounded-lg py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-brand-500/50 text-xs font-bold transition-all cursor-pointer", isLightMode ? "bg-white border-zinc-200 text-zinc-800" : "bg-zinc-950 border-zinc-800 text-zinc-350")}
                  >
                    {[5, 10, 20, 50].map((num) => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                  <span className="text-zinc-500">|</span>
                  <span className={cn(isLightMode ? "text-zinc-600" : "text-zinc-400")}>{t("showing")} {Math.min(listFilteredLinks.length, (listCurrentPage - 1) * listItemsPerPage + 1)}-{Math.min(listFilteredLinks.length, listCurrentPage * listItemsPerPage)} {t("of")} {listFilteredLinks.length} {t("links")}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setListCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={listCurrentPage === 1}
                    className={cn("p-2 rounded-lg border transition-colors cursor-pointer", isLightMode ? "bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-40" : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-white disabled:opacity-40")}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {Array.from({ length: listTotalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    const isCurrent = pageNum === listCurrentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setListCurrentPage(pageNum)}
                        className={cn(
                          "w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer",
                          isCurrent 
                            ? "bg-brand-500 text-black shadow-md font-black"
                            : (isLightMode 
                                ? "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900" 
                                : "bg-zinc-950/60 border border-zinc-850 hover:border-zinc-750 text-zinc-400 hover:text-zinc-200")
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setListCurrentPage(prev => Math.min(listTotalPages, prev + 1))}
                    disabled={listCurrentPage === listTotalPages}
                    className={cn("p-2 rounded-lg border transition-colors cursor-pointer", isLightMode ? "bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-40" : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-white disabled:opacity-40")}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mass actions option */}
            {selectedLinkIds.length > 0 && (
              <div className="bg-brand-500/[0.04] border border-brand-500/20 p-5 rounded-2xl flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-300">Terpilih <span className="text-brand-400 font-mono font-black">{selectedLinkIds.length}</span> tautan untuk tindakan massal</span>
                <button
                  onClick={handleBulkDelete}
                  className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-xs font-bold"
                >
                  <Trash2 className="w-4 h-4" /> Hapus Sekaligus
                </button>
              </div>
            )}
          </div>
        ) : currentTab === "link-detail" ? (
          (() => {
            const activeL = links.find(l => l.id === selectedDetailLinkId);
            
            if (!activeL) {
              return (
                <div className="space-y-6 text-center py-20 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 max-w-xl mx-auto">
                  <div className="w-16 h-16 bg-brand-500/10 text-brand-400 rounded-full flex items-center justify-center mx-auto text-2xl font-black">?</div>
                  <h2 className="text-xl font-bold text-zinc-200">Tautan Tidak Terspesifikasi</h2>
                  <p className="text-sm text-zinc-500">Pilih salah satu tautan Anda di bawah ini untuk melihat detail editing kustom & statistik audit penjelajah.</p>
                  
                  <div className="max-w-xs mx-auto space-y-2">
                    <select
                      onChange={(e) => setSelectedDetailLinkId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm text-zinc-300"
                    >
                      <option value="">-- Pilih Tautan Anda --</option>
                      {links.map((link) => (
                        <option key={link.id} value={link.id}>{link.title || link.shortSlug}</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => setCurrentTab("links-list")}
                      className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold transition-all text-zinc-300"
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
              <div className="space-y-8 animate-fade-in">
                {/* Header detail */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  <div className="space-y-1">
                    <button 
                      onClick={() => setCurrentTab("links-list")}
                      className="flex items-center gap-1.5 text-zinc-500 hover:text-brand-400 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Link
                    </button>
                    <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2.5">
                      Kelola Tautan <code className="text-brand-500 text-lg md:text-xl font-mono">/{activeL.shortSlug}</code>
                    </h1>
                    <p className="text-sm text-zinc-500 truncate max-w-lg" title={activeL.originalUrl}>
                      Tujuan Utama: <a href={activeL.originalUrl} target="_blank" rel="noreferrer" className="text-brand-400/80 hover:underline">{activeL.originalUrl}</a>
                    </p>
                  </div>

                  {/* Dropdown switch link quickly */}
                  <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800/80 p-2 rounded-2xl w-full md:w-auto">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold pl-2 hidden lg:inline">Pindah Cepat</span>
                    <select
                      value={selectedDetailLinkId || ""}
                      onChange={(e) => setSelectedDetailLinkId(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 focus:outline-none text-xs text-zinc-300 font-bold"
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
                            <p className="text-xs text-rose-500 font-bold flex items-center gap-1.5 animate-pulse mt-1">
                              <span>⚠️</span> {t("passwordTooWeak")}
                            </p>
                          )}
                        </div>

                        {/* Category Selector */}
                        <div className="space-y-1.5 text-left">
                          <label className={cn("text-xs font-bold", textMuted)}>{t("categoryLabel")}</label>
                          <select
                            value={detailCategory}
                            onChange={(e) => setDetailCategory(e.target.value)}
                            className={cn("w-full rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs transition-colors", inputBg)}
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
                                  <Eye className="w-4 h-4 text-emerald-500" />
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
                                detailEditEnabled ? "bg-emerald-500" : "bg-zinc-700"
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
                            <div className="space-y-0.5">
                              <label className={cn("text-xs font-bold", textMuted)}>{t("aktifkanHalamanPortal")}</label>
                              <p className="text-[10px] text-zinc-500">{t("tautanPortalDesc")}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setDetailEditPortalEnabled(!detailEditPortalEnabled)}
                              className={cn(
                                "w-10 h-5 rounded-full p-0.5 transition-colors relative duration-300 cursor-pointer",
                                detailEditPortalEnabled ? "bg-brand-500" : "bg-zinc-700"
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
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs text-zinc-300"
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
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs font-mono text-zinc-400"
                                />
                              </div>
                            </motion.div>
                          )}
                        </div>

                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={isSavingDetailLink}
                            className="w-full bg-brand-500 hover:bg-brand-400 text-black font-extrabold py-3.5 rounded-xl transition-all shadow-md font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSavingDetailLink ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-black" />
                            ) : (
                              <CheckSquare className="w-4 h-4" />
                            )}
                            {isSavingDetailLink 
                              ? (lang === "id" ? "MENYIMPAN..." : "SAVING...") 
                              : (detailFormSaved ? (lang === "id" ? "✓ Berhasil Disimpan!" : "✓ Saved Successfully!") : (lang === "id" ? "Simpan Perubahan Tautan" : "Save Link Changes"))}
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* QR Quick Share code card inside detail */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                      <div className="space-y-1.5 text-center sm:text-left">
                        <h4 className="text-sm font-bold text-zinc-350 flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-brand-500" /> Unduh QR Code Link
                        </h4>
                        <p className="text-[11px] text-zinc-500">Gunakan QR Code kustom premium untuk selebaran fisik.</p>
                      </div>
                      <button
                        onClick={() => { setQrFgColor("#fb923c"); setQrBgColor("#ffffff"); setQrLink(activeL); }}
                        className="py-2.5 px-4 bg-zinc-950 hover:bg-zinc-850 hover:text-white text-zinc-300 border border-zinc-800 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
                      >
                        Kustomisasi QR
                      </button>
                    </div>
                  </div>

                  {/* Right Column Content - Local Analytics Engine specific to this link! */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Tiny stats cards specific to link */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-extrabold mb-1">Aktivitas Klik</p>
                          <h3 className="text-2xl font-black text-brand-500 font-mono">{stats.clicksCount}</h3>
                        </div>
                        <div className="w-10 h-10 bg-brand-550/10 bg-brand-500/5 text-brand-500 rounded-xl flex items-center justify-center">
                          <MousePointer2 className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-extrabold mb-1">Unik IP Pengunjung</p>
                          <h3 className="text-2xl font-black text-white font-mono">{stats.ips.length}</h3>
                        </div>
                        <div className="w-10 h-10 bg-zinc-950 text-zinc-400 rounded-xl flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-zinc-400" />
                        </div>
                      </div>

                      <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-extrabold mb-1">Status Keaktifan</p>
                          {isExpired ? (
                            <span className="text-xs font-bold text-rose-500 uppercase tracking-wider block mt-1">Kedaluwarsa</span>
                          ) : (
                            <span className="text-xs font-bold text-green-500 uppercase tracking-wider block mt-1 animate-pulse">Aktif & Aman</span>
                          )}
                        </div>
                        <div className="w-10 h-10 bg-zinc-950 text-zinc-400 rounded-xl flex items-center justify-center">
                          <Clock className="w-5 h-5 text-zinc-450" />
                        </div>
                      </div>
                    </div>

                    {/* Integrated Local Tab Analytics box */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6">
                      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b border-zinc-800/60 pb-4">
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-zinc-200">Panel Audit Trafik Tautan</h3>
                          <p className="text-xs text-zinc-500">Grafik kunjungan dan logging alamat IP penjelajah.</p>
                        </div>

                        {/* Local Analytics select sub-tab */}
                        <div className="flex flex-wrap bg-zinc-950 border border-zinc-800 p-1 rounded-xl gap-0.5">
                          {(['trends', 'geo', 'devices', 'ips'] as const).map((tab) => (
                            <button
                              key={tab}
                              onClick={() => { setDetailAnalyticsTab(tab); setDetailIpSearch(""); }}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer",
                                detailAnalyticsTab === tab
                                  ? "bg-brand-500 text-black font-extrabold shadow-sm"
                                  : "text-zinc-500 hover:text-zinc-300"
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
                            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Aktivitas Klik 7 Hari Terakhir</h4>
                            <div className="h-64 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={getSpecificLinkChartData(activeL.shortSlug)} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
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
                                      backgroundColor: '#18181b', 
                                      borderColor: '#27272a',
                                      borderRadius: '12px',
                                      color: '#f4f4f5',
                                      fontSize: '11px'
                                    }}
                                    itemStyle={{ color: curT.qrFg }}
                                    labelStyle={{ fontWeight: 'bold', color: '#a1a1aa' }}
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
                            <div className="bg-zinc-950/30 border border-zinc-850 p-4 rounded-2xl space-y-3">
                              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Negara Asal Pengakses</p>
                              <div className="space-y-2">
                                {stats.countries.slice(0, 5).map((country) => (
                                  <div key={country.name} className="flex justify-between items-center bg-zinc-950/40 p-2 rounded-xl text-xs font-semibold">
                                    <span className="text-zinc-300">{country.name}</span>
                                    <span className="font-mono text-brand-400">{country.count} akses</span>
                                  </div>
                                ))}
                                {stats.countries.length === 0 && (
                                  <p className="text-zinc-650 text-xs italic py-4 text-center">Belum ada statistik negara.</p>
                                )}
                              </div>
                            </div>

                            {/* Wilayah & Kota */}
                            <div className="bg-zinc-950/30 border border-zinc-850 p-4 rounded-2xl space-y-3">
                              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1.5"><Compass className="w-3.5 h-3.5" /> Region / Wilayah Administratif</p>
                              <div className="space-y-2 font-mono">
                                {stats.regions.slice(0, 5).map((region) => (
                                  <div key={region.name} className="flex justify-between items-center bg-zinc-950/40 p-2 rounded-xl text-xs font-semibold">
                                    <span className="text-zinc-300 truncate max-w-[130px]">{region.name}</span>
                                    <span className="text-brand-400">{region.count} klik</span>
                                  </div>
                                ))}
                                {stats.regions.length === 0 && (
                                  <p className="text-zinc-650 text-xs italic py-4 text-center">Belum ada statistik wilayah.</p>
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
                            <div className="bg-zinc-950/30 border border-zinc-850 p-4 rounded-2xl space-y-2">
                              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1.5"><Laptop className="w-3.5 h-3.5 text-zinc-450" /> Perangkat</p>
                              <div className="space-y-1.5 text-xs text-zinc-300 font-bold">
                                {stats.devices.map((device) => (
                                  <div key={device.name} className="flex justify-between p-1.5 border-b border-zinc-900 last:border-0">
                                    <span>{device.name}</span>
                                    <span className="font-mono text-brand-400">{device.count}</span>
                                  </div>
                                ))}
                                {stats.devices.length === 0 && <p className="text-zinc-650 text-[10px] italic py-4">Kosong</p>}
                              </div>
                            </div>

                            {/* Browser */}
                            <div className="bg-zinc-950/30 border border-[1px] border-zinc-850 p-4 rounded-2xl space-y-2">
                              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1.5"><Compass className="w-3.5 h-3.5 text-zinc-450" /> Browser</p>
                              <div className="space-y-1.5 text-xs text-zinc-300 font-bold">
                                {stats.browsers.map((b) => (
                                  <div key={b.name} className="flex justify-between p-1.5 border-b border-zinc-900 last:border-0">
                                    <span className="truncate max-w-[80px]">{b.name}</span>
                                    <span className="font-mono text-brand-400">{b.count}</span>
                                  </div>
                                ))}
                                {stats.browsers.length === 0 && <p className="text-zinc-655 text-[10px] italic py-4">Kosong</p>}
                              </div>
                            </div>

                            {/* Sistem Operasi */}
                            <div className="bg-zinc-950/30 border border-zinc-850 p-4 rounded-2xl space-y-2">
                              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-zinc-450" /> Sistem Operasi</p>
                              <div className="space-y-1.5 text-xs text-zinc-300 font-bold">
                                {stats.oss.map((os) => (
                                  <div key={os.name} className="flex justify-between p-1.5 border-b border-zinc-900 last:border-0">
                                    <span>{os.name}</span>
                                    <span className="font-mono text-brand-400">{os.count}</span>
                                  </div>
                                ))}
                                {stats.oss.length === 0 && <p className="text-zinc-650 text-[10px] italic py-4">Kosong</p>}
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
                                className="bg-zinc-950 border border-zinc-850 rounded-lg py-1 px-3 text-[11px] focus:outline-none focus:ring-1 focus:ring-brand-500 text-zinc-300 font-mono w-32 md:w-44 placeholder:text-zinc-650"
                              />
                            </div>

                            <div className="border border-zinc-850 rounded-xl overflow-hidden bg-zinc-950/40">
                              <div className="overflow-y-auto max-h-56">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-zinc-950 text-zinc-500 border-b border-zinc-850 font-bold sticky top-0">
                                    <tr>
                                      <th className="px-4 py-2 font-mono">Alamat IP</th>
                                      <th className="px-4 py-2">Negara</th>
                                      <th className="px-4 py-2 font-mono">Hit</th>
                                      <th className="px-4 py-2 text-right">Terakhir Terlihat</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-zinc-900 font-medium">
                                    {stats.ips
                                      .filter(info => info.ip.includes(detailIpSearch))
                                      .map((info) => (
                                        <tr key={info.ip} className="hover:bg-zinc-900/50">
                                          <td className="px-4 py-2 font-mono text-zinc-300">{info.ip}</td>
                                          <td className="px-4 py-2 text-[11px] text-zinc-400">{info.country}</td>
                                          <td className="px-4 py-2 text-brand-400 font-mono font-bold">{info.count}x</td>
                                          <td className="px-4 py-2 text-right text-[10px] text-zinc-500">
                                            {info.lastSeen ? format(new Date(info.lastSeen), "d MMM, HH:mm") : "—"}
                                          </td>
                                        </tr>
                                      ))}
                                    {stats.ips.filter(info => info.ip.includes(detailIpSearch)).length === 0 && (
                                      <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-zinc-600 italic">
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
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 text-left">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5"><Compass className="w-4 h-4 text-brand-500" /> Sumber Situs Rujukan Utama</h4>
                      <div className="space-y-2">
                        {stats.referrers.slice(0, 4).map((ref) => (
                          <div key={ref.name} className="flex justify-between items-center bg-zinc-950/40 p-3 rounded-xl text-xs font-semibold border border-zinc-900">
                            <span className="text-zinc-350 font-mono truncate max-w-xs">{ref.name}</span>
                            <span className="text-brand-400">{ref.count} kunjungan</span>
                          </div>
                        ))}
                        {stats.referrers.length === 0 && (
                          <p className="text-zinc-600 text-xs italic">Belum ada rujukan domain luar.</p>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })()
        ) : currentTab === "collections" ? (
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
                className="bg-brand-500 hover:bg-brand-400 text-black font-extrabold px-5 py-3 rounded-xl transition-all shadow-lg shadow-brand-500/10 flex items-center gap-2 text-sm self-start cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                {lang === "id" ? "Buat Koleksi Baru" : "New Folder"}
              </button>
            </div>

            {collections.length === 0 ? (
              <div className={cn("text-center py-20 rounded-3xl border p-8 max-w-xl mx-auto space-y-6", cardBg)}>
                <div className="w-16 h-16 bg-brand-500/10 text-brand-500 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
                  <FolderOpen className="w-8 h-8 text-brand-500 animate-pulse" />
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
                  className="bg-brand-500 hover:bg-brand-400 text-black font-extrabold px-5 py-3 rounded-xl transition-all shadow-lg text-xs cursor-pointer"
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
                              ? "border-brand-500 bg-brand-500/[0.02]" 
                              : cn("border-zinc-800", cardBg)
                          )}
                        >
                          {isSelected && (
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-500" />
                          )}
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h3 className={cn("text-base font-bold flex items-center gap-2", textTitle)}>
                                <Folder className={cn("w-4 h-4", isSelected ? "text-brand-500 animate-bounce" : "text-zinc-400")} />
                                {col.name}
                              </h3>
                              <p className={cn("text-xs mt-1 line-clamp-2", textMuted)}>{col.description || (lang === "id" ? "Tanpa deksripsi." : "No description.")}</p>
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
                                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 cursor-pointer"
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

                          <div className={cn("flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500 border-t pt-3", borderClassic)}>
                            <span className="flex items-center gap-1.5 font-mono"><Layers className="w-3.5 h-3.5 text-zinc-400" /> {folderLinks.length} Links</span>
                            <span className="flex items-center gap-1.5 font-mono"><MousePointer2 className="w-3.5 h-3.5 text-zinc-400" /> {totalClicks} Clicks</span>
                            <span className="flex items-center gap-1.5 font-mono text-brand-400"><QrCode className="w-3.5 h-3.5 text-brand-500" /> {totalQrScans} Scans</span>
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

                    const availableToAdd = links.filter(l => l.collectionId !== activeCol.id);

                    return (
                      <div className="space-y-6">
                        {/* Folder Header Metadata */}
                        <div className={cn("p-6 rounded-3xl border text-left space-y-2", cardBg)}>
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-brand-500">{lang === "id" ? "Folder Aktif" : "Active Directory"}</span>
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
                          <p className={cn("text-xs leading-relaxed", textMuted)}>{activeCol.description || (lang === "id" ? "Belum ada deksripsi tertulis untuk kelompok koleksi tautan ini." : "This directory doesn't have an explanatory summary yet.")}</p>
                        </div>

                        {/* Folder Analytics stats grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className={cn("p-4 rounded-3xl border text-left flex gap-3.5 items-center", cardBg)}>
                            <div className="w-10 h-10 bg-brand-500/10 text-brand-500 rounded-2xl flex items-center justify-center shrink-0">
                              <Layers className="w-5 h-5" />
                            </div>
                            <div>
                              <p className={cn("text-[10px] font-bold uppercase tracking-wider", textMuted)}>{lang === "id" ? "Jumlah Link" : "Links Contained"}</p>
                              <p className="text-xl font-mono font-black mt-0.5">{folderLinks.length}</p>
                            </div>
                          </div>

                          <div className={cn("p-4 rounded-3xl border text-left flex gap-3.5 items-center", cardBg)}>
                            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
                              <MousePointer2 className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                              <p className={cn("text-[10px] font-bold uppercase tracking-wider", textMuted)}>{lang === "id" ? "Kunjungan Folder" : "Unified Clickings"}</p>
                              <p className="text-xl font-mono font-black mt-0.5">{totalClicks}</p>
                            </div>
                          </div>

                          <div className={cn("p-4 rounded-3xl border text-left flex gap-3.5 items-center", cardBg)}>
                            <div className="w-10 h-10 bg-brand-400/[0.08] text-brand-500 rounded-2xl flex items-center justify-center shrink-0">
                              <QrCode className="w-5 h-5 text-brand-500" />
                            </div>
                            <div>
                              <p className={cn("text-[10px] font-bold uppercase tracking-wider", textMuted)}>{lang === "id" ? "Scan QR Rate" : "QR Scan Rate"}</p>
                              <div className="flex items-baseline gap-1.5 mt-0.5">
                                <p className="text-xl font-mono font-black text-brand-500">{totalQrScans}</p>
                                <span className="text-[10px] font-bold font-mono text-zinc-500">({scanRate}%)</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Combined Shared trends Chart */}
                        <div className={cn("p-6 rounded-3xl border text-left", cardBg)}>
                          <p className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5"><Activity className="w-4 h-4 text-brand-500 animate-pulse" /> {lang === "id" ? "Grafik Kunjungan Koleksi (7 Hari)" : "Unified Performance (7 Days Trend)"}</p>
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
                              <p className="text-sm font-extrabold text-brand-500">{lang === "id" ? "Tambahkan Tautan ke Folder" : "Add Link to Folder"}</p>
                              <p className="text-xs text-zinc-500">{lang === "id" ? "Tautkan link lain ke kelompok analytics folder ini." : "Include standard links into this tracking sequence."}</p>
                            </div>
                            <div className="flex gap-2">
                              <select 
                                id="quickAddLinkSelect"
                                className={cn("text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-brand-500 border rounded-xl font-bold font-mono max-w-[200px]", inputBg)}
                              >
                                {availableToAdd.map(l => (
                                  <option key={l.id} value={l.id}>/{l.shortSlug} - {l.title || "Untitled"}</option>
                                ))}
                              </select>
                              <button 
                                onClick={async () => {
                                  const selectEl = document.getElementById("quickAddLinkSelect") as HTMLSelectElement;
                                  if (selectEl && selectEl.value) {
                                    const targetLinkId = selectEl.value;
                                    await updateDoc(doc(db, "links", targetLinkId), { collectionId: activeCol.id });
                                    
                                    const updatedIds = [...(activeCol.linkIds || []), targetLinkId];
                                    await updateDoc(doc(db, "collections", activeCol.id), { linkIds: updatedIds });
                                    await queryClient.invalidateQueries({ queryKey: ["links", user?.uid] });
                                    await queryClient.invalidateQueries({ queryKey: ["collections", user?.uid] });
                                    setCustomToast(lang === "id" ? "Tautan berhasil ditautkan!" : "Link associated!");
                                    setTimeout(() => setCustomToast(""), 3000);
                                  }
                                }}
                                className="bg-brand-500 hover:bg-brand-400 text-black px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1 shrink-0 cursor-pointer"
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
                            <span className="text-[10px] font-mono font-bold bg-zinc-800 text-brand-450 px-2.5 py-0.5 rounded-full">{folderLinks.length} Links</span>
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
                                    <p className="text-xs font-mono text-brand-500 hover:underline truncate">
                                      <a href={`${window.location.origin}/${link.shortSlug}`} target="_blank" rel="noreferrer">
                                        /{link.shortSlug}
                                      </a>
                                    </p>
                                    <p className="text-[10px] font-mono text-zinc-500 truncate max-w-sm">{link.originalUrl}</p>
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0">
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
                                        className="p-1.5 bg-zinc-800 hover:bg-zinc-700/60 rounded-xl text-zinc-400 cursor-pointer"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={async () => {
                                          if (confirm(lang === "id" ? "Keluarkan link ini dari folder?" : "Remove this link from this folder?")) {
                                            await updateDoc(doc(db, "links", link.id), { collectionId: "" });
                                            const filteredArr = (activeCol.linkIds || []).filter(id => id !== link.id);
                                            await updateDoc(doc(db, "collections", activeCol.id), { linkIds: filteredArr });
                                            await queryClient.invalidateQueries({ queryKey: ["links", user?.uid] });
                                            await queryClient.invalidateQueries({ queryKey: ["collections", user?.uid] });
                                            setCustomToast(lang === "id" ? "Tautan dikeluarkan dari folder!" : "Removed from collection!");
                                            setTimeout(() => setCustomToast(""), 3000);
                                          }
                                        }}
                                        title={lang === "id" ? "Keluarkan dari Grup" : "Remove from folder"}
                                        className="p-1.5 bg-zinc-800 hover:bg-red-500/10 hover:text-red-400 rounded-xl text-zinc-500 cursor-pointer"
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {folderLinks.length === 0 && (
                              <div className="text-center py-10 bg-zinc-950/20 rounded-2xl border border-dashed border-zinc-800 text-zinc-505 text-zinc-550 text-xs italic">
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
        ) : (
          <>
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-1 flex items-center gap-2">
              Dashboard <Sparkles className="w-5 h-5 text-brand-500" />
            </h1>
            <p className="text-zinc-500">{lang === 'id' ? 'Kelola dan lacak link pendek Anda.' : 'Manage and track your shortened links.'}</p>
          </div>
          <div className="flex gap-4">
            {selectedLinkIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 px-6 py-3 rounded-xl transition-all flex items-center gap-2 font-bold"
              >
                <Trash2 className="w-5 h-5" />
                {t("bulkDelete")} ({selectedLinkIds.length})
              </button>
            )}
            <button 
              onClick={() => { setEditingLink(null); setIsModalOpen(true); }}
              className="bg-brand-500 text-black font-extrabold px-6 py-3 rounded-xl hover:bg-brand-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
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
            <p className="text-3xl font-extrabold">{links.reduce((acc, curr) => acc + curr.clickCount, 0)}</p>
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
                ({links.reduce((acc, curr) => acc + curr.clickCount, 0) > 0 
                  ? ((links.reduce((acc, curr) => acc + (curr.qrScanCount || 0), 0) / links.reduce((acc, curr) => acc + curr.clickCount, 0)) * 100).toFixed(1) 
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
              <p className="text-xs text-zinc-500">{t("auditSubtitle")}</p>
            </div>
            
            {/* Multi-Tab Selector */}
            <div className={cn("flex p-1 rounded-xl self-start md:self-auto", isLightMode ? "bg-zinc-200/80 border border-zinc-300" : "bg-zinc-950 border border-zinc-805")}>
              <button
                onClick={() => setAnalyticsTab('trends')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                  analyticsTab === 'trends' 
                    ? "bg-brand-500 text-black shadow-lg shadow-brand-500/10" 
                    : isLightMode 
                      ? "text-zinc-650 hover:text-zinc-900" 
                      : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                <Activity className="w-3.5 h-3.5" />
                {t("subTabTrends")}
              </button>
              <button
                onClick={() => setAnalyticsTab('geo')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                  analyticsTab === 'geo' 
                    ? "bg-brand-500 text-black shadow-lg shadow-brand-500/10" 
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
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                  analyticsTab === 'devices' 
                    ? "bg-brand-500 text-black shadow-lg shadow-brand-500/10" 
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
                    <Globe className="w-4 h-4 text-brand-400" />
                    <h4 className={cn("font-bold", textTitle)}>{t("clicksByCountry")}</h4>
                  </div>
                  <div className="space-y-3">
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
                                   <span className={cn("truncate", isLightMode ? "text-zinc-800 font-bold" : "text-zinc-300")}>{reg.name}</span>
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
                             <span key={country.name} className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold", isLightMode ? "bg-zinc-150 border border-zinc-250 text-zinc-800" : "bg-zinc-950 border border-zinc-850 text-zinc-300")}>
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
                    <UserIcon className="w-4 h-4 text-brand-400" />
                    <h4 className={cn("font-bold", textTitle)}>{t("visitorIpAudit")}</h4>
                  </div>
                  <div className={cn("rounded-2xl border overflow-hidden", sectionBg)}>
                    <div className="max-h-64 overflow-y-auto pr-1">
                      <table className="w-full text-left text-xs text-zinc-400">
                        <thead>
                          <tr className={cn("text-[10px] font-bold uppercase tracking-wider border-b", tableHeaderBg, tableBorder)}>
                            <th className="px-4 py-2">{t("ipAddress")}</th>
                            <th className="px-4 py-2">{t("country")}</th>
                            <th className="px-4 py-2 text-right">{t("interaction")}</th>
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
                                <td className={cn("px-4 py-3 font-mono", isLightMode ? "text-zinc-800" : "text-zinc-300")}>{item.ip}</td>
                                <td className={cn("px-4 py-3 font-medium", textMuted)}>{item.country}</td>
                                <td className="px-4 py-3 text-right font-bold text-brand-400">{item.count} {t("clicks")}</td>
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
                    <Smartphone className="w-4 h-4 text-brand-400" />
                    <h4 className={cn("font-bold", textTitle)}>{t("subTabDevices")}</h4>
                  </div>
                  <div className="space-y-3">
                    {(() => {
                      const data = getAnalyticsData();
                      const total = allClicks.length || 1;
                      if (data.devices.length === 0) {
                        return <p className="text-xs text-zinc-500 italic">Belum ada data perangkat.</p>;
                      }
                      return data.devices.map((item) => {
                        const percent = Math.round((item.count / total) * 100);
                        const isMobile = item.name === "Mobile";
                        const isTablet = item.name === "Tablet";
                        
                        return (
                          <div key={item.name} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center border", isLightMode ? "bg-zinc-150 border-zinc-250 text-zinc-650" : "bg-zinc-950 border-zinc-850 text-zinc-400")}>
                                {isMobile ? <Smartphone className="w-3.5 h-3.5" /> : isTablet ? <Tablet className="w-3.5 h-3.5" /> : <Laptop className="w-3.5 h-3.5" />}
                              </div>
                              <div>
                                <p className={cn("text-xs font-semibold", isLightMode ? "text-zinc-800" : "text-zinc-300")}>{item.name}</p>
                                <p className="text-[10px] text-zinc-505 text-zinc-500">{percent}% {t("ofTotalClicks")}</p>
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
                    <Shield className="w-4 h-4 text-brand-400" />
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
                              <span className={cn(isLightMode ? "text-zinc-800" : "text-zinc-300")}>{os.count} ({percent}%)</span>
                            </div>
                            <div className={cn("w-full h-1 rounded-full overflow-hidden", isLightMode ? "bg-zinc-200" : "bg-zinc-950")}>
                              <div className="bg-brand-500 h-full" style={{ width: `${percent}%` }}></div>
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
                    <Compass className="w-4 h-4 text-brand-400" />
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
                            <span key={b.name} className={cn("px-2 py-0.5 rounded text-[11px] font-medium border animate-fade-in", isLightMode ? "bg-zinc-150 border-zinc-250 text-zinc-850" : "bg-zinc-950 border border-zinc-850/70 text-zinc-300")}>
                              {b.name}: {b.count}
                            </span>
                          ));
                        })()}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">{t("topReferrers")}</p>
                      <div className="space-y-1">
                        {(() => {
                          const data = getAnalyticsData();
                          if (data.referrers.length === 0) {
                            return <p className="text-zinc-500 italic">{t("noReferrals")}</p>;
                          }
                          return data.referrers.slice(0, 3).map((ref) => (
                            <div key={ref.name} className={cn("flex justify-between items-center font-medium", isLightMode ? "text-zinc-800" : "text-zinc-300")}>
                              <span className="truncate max-w-[120px]" title={ref.name}>{ref.name}</span>
                              <span className="font-bold text-brand-400 font-mono text-xs">{ref.count} {t("clicks")}</span>
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
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder={t("searchHint")} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={cn("w-full rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all font-medium text-sm shadow-inner", inputBg)}
                />
              </div>
              <div className={cn("flex rounded-xl p-1 gap-1 border", isLightMode ? "bg-zinc-200 border-zinc-300" : "bg-zinc-950 border-zinc-805")}>
                {(['all', 'active', 'expired'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all select-none",
                      filterStatus === status 
                        ? (isLightMode ? "bg-white text-zinc-900 shadow" : "bg-zinc-800 text-white shadow") 
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
                    <th className="px-6 py-4 w-12">
                      <button 
                        onClick={toggleSelectAll}
                        className={cn("transition-colors", isLightMode ? "text-zinc-500 hover:text-zinc-850" : "text-zinc-400 hover:text-white")}
                        title={allFilteredSelected ? "Deselect All" : "Select All"}
                      >
                        {allFilteredSelected ? <CheckSquare className="w-5 h-5 text-brand-500" /> : <Square className="w-5 h-5" />}
                      </button>
                    </th>
                    <th className={cn("px-6 py-4 cursor-pointer transition-colors", isLightMode ? "hover:text-zinc-900" : "hover:text-zinc-300")} onClick={() => requestSort('title')}>
                      <div className="flex items-center gap-2">Judul Tautan <ArrowUpDown className="w-3" /></div>
                    </th>
                    <th className="px-6 py-4">Short Slug</th>
                    <th className={cn("px-6 py-4 cursor-pointer transition-colors", isLightMode ? "hover:text-zinc-900" : "hover:text-zinc-300")} onClick={() => requestSort('clickCount')}>
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
                      <tr key={link.id} className={cn("transition-colors group", trHoverBg, isSelected && "bg-brand-500/[0.02]")}>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => toggleSelectLink(link.id)}
                            className={cn("transition-colors", isLightMode ? "text-zinc-500 hover:text-zinc-850" : "text-zinc-400 hover:text-white")}
                          >
                            {isSelected ? <CheckSquare className="w-5 h-5 text-brand-500" /> : <Square className="w-5 h-5" />}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <div className="flex items-center gap-2">
                              <p className={cn("font-bold truncate", textTitle)}>{link.title}</p>
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
                            <p className="text-xs text-zinc-500 truncate font-mono">{link.originalUrl}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <code className="text-brand-500 bg-brand-500/10 px-2 py-1 rounded text-xs font-bold font-mono">/{link.shortSlug}</code>
                            <button 
                              onClick={() => handleCopy(link.shortSlug, link.id)}
                              className={cn("transition-colors", isLightMode ? "text-zinc-500 hover:text-zinc-850" : "text-zinc-400 hover:text-white")}
                              title="Salin Link"
                            >
                              {copiedId === link.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-semibold">{link.clickCount}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            {/* Status Icon Indicator */}
                            {isExpired ? (
                              <span className="p-1.5 px-2.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all font-semibold flex items-center gap-1 shrink-0" title={lang === "id" ? "Expired / Kedaluwarsa" : "Expired"}>
                                <Clock className="w-4 h-4" />
                              </span>
                            ) : link.isEnabled === false ? (
                              <span className={cn("p-1.5 px-2.5 rounded-xl transition-all font-semibold flex items-center gap-1 shrink-0 border", isLightMode ? "bg-zinc-100 text-zinc-550 border-zinc-200" : "bg-zinc-700/20 text-zinc-400 border-zinc-700/30")} title={lang === "id" ? "Nonaktif / Disabled" : "Inactive"}>
                                <EyeOff className="w-4 h-4" />
                              </span>
                            ) : (
                              <span className="p-1.5 px-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all font-semibold flex items-center gap-1 shrink-0" title={lang === "id" ? "Aktif / Active" : "Active"}>
                                <Eye className="w-4 h-4 animate-pulse" />
                              </span>
                            )}

                            {/* Password Protective Icon Indicator */}
                            {link.password ? (
                              <span className="p-1.5 px-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-500 hover:bg-amber-500/20 transition-all font-semibold flex items-center gap-1 shrink-0" title={lang === "id" ? "Terproteksi Kata Sandi" : "Password Protected"}>
                                <Lock className="w-4 h-4" />
                              </span>
                            ) : null}

                            {/* Landing Information Portal Icon Indicator */}
                            {link.landingEnabled ? (
                              <span className="p-1.5 px-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-500 hover:bg-blue-500/20 transition-all font-semibold flex items-center gap-1 shrink-0" title={lang === "id" ? "Landing Portal Aktif" : "Landing Portal Active"}>
                                <Layers className="w-4 h-4" />
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={() => { setQrFgColor("#fb923c"); setQrBgColor("#ffffff"); setQrLink(link); }}
                              className={cn("p-2 rounded-xl transition-all", isLightMode ? "text-zinc-600 hover:text-brand-600 hover:bg-brand-50" : "text-zinc-400 hover:text-white hover:bg-zinc-800")}
                              title="Custom QR Code"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => { setEditingLink(link); setIsModalOpen(true); }}
                              className={cn("p-2 rounded-xl transition-all", isLightMode ? "text-zinc-600 hover:text-brand-600 hover:bg-brand-50" : "text-zinc-400 hover:text-white hover:bg-zinc-800")}
                              title="Ubah"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => window.open(shortUrl, '_blank')}
                              className={cn("p-2 rounded-xl transition-all", isLightMode ? "text-zinc-600 hover:text-blue-600 hover:bg-blue-50" : "text-zinc-400 hover:text-white hover:bg-zinc-800")}
                              title="Buka Link"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(link.id)}
                              className={cn("p-2 rounded-xl transition-all", isLightMode ? "text-zinc-600 hover:text-red-600 hover:bg-red-50" : "text-zinc-400 hover:text-red-400 hover:bg-red-400/10")}
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
                      <td colSpan={7} className="px-6 py-16 text-center text-zinc-500 font-medium font-sans">
                        Tidak ada tautan terdaftar pada kriteria ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Grid View representing the list of links (Dashboard) */}
            <div className="block md:hidden divide-y divide-zinc-800/50">
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
                          className="text-zinc-400 hover:text-white transition-colors"
                        >
                          {isSelected ? <CheckSquare className="w-5 h-5 text-brand-500" /> : <Square className="w-5 h-5" />}
                        </button>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-zinc-200 truncate">{link.title}</p>
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
                          className="text-zinc-500 hover:text-white transition-colors p-1"
                          title="Salin Link"
                        >
                          {copiedId === link.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="text-xs font-semibold text-zinc-400 select-none">
                        Kunjungan: <span className="text-brand-400 font-mono font-black">{link.clickCount}</span>
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
                          onClick={() => { setQrFgColor("#fb923c"); setQrBgColor("#ffffff"); setQrLink(link); }}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
                          title="Custom QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button 
                          type="button"
                          onClick={() => { setEditingLink(link); setIsModalOpen(true); }}
                          className="p-2 text-brand-400 hover:text-white hover:bg-brand-500/10 rounded-xl transition-all font-bold"
                          title="Ubah & Analisis"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          type="button"
                          onClick={() => window.open(shortUrl, '_blank')}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
                          title="Buka Link asli"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleDelete(link.id)}
                          className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
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
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-brand-500/10 text-brand-500 rounded-lg flex items-center justify-center animate-pulse">
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-zinc-200">Aktivitas Terkini</h3>
              </div>
              
              <div className="space-y-4">
                {recentClicks.map((click) => {
                  const clickTime = new Date(click.timestamp);
                  return (
                    <div key={click.id} className="flex gap-3 text-sm py-1 border-b border-zinc-800/40 last:border-b-0 pb-3 last:pb-0">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-zinc-300 truncate">{click.title}</p>
                        <p className="text-xs text-brand-400 font-mono">/{click.shortSlug}</p>
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
      </>
    )}
  </main>

  {/* Modals */}
  <CreateLinkModal
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    lang={lang}
    editingLink={editingLink}
    formTitle={formTitle}
    setFormTitle={setFormTitle}
    slugValue={slugValue}
    setSlugValue={setSlugValue}
    formCategory={formCategory}
    setFormCategory={setFormCategory}
    formCollectionId={formCollectionId}
    setFormCollectionId={setFormCollectionId}
    modalPassword={modalPassword}
    setModalPassword={setModalPassword}
    formLinkEnabled={formLinkEnabled}
    setFormLinkEnabled={setFormLinkEnabled}
    landingEnabled={landingEnabled}
    setLandingEnabled={setLandingEnabled}
    formLandingDescription={formLandingDescription}
    setFormLandingDescription={setFormLandingDescription}
    collections={collections}
    isGeneratingAi={isGeneratingAi}
    handleGenerateAiMetadata={handleGenerateAiMetadata}
    aiError={aiError}
    handleSaveLink={handleSaveLink}
    isLightMode={isLightMode}
    appTheme={appTheme}
    isSavingLink={isSavingLink}
  />

  <AnimatePresence>
    {/* QR Code custom coloring modal */}
        {qrLink && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQrLink(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-6 overflow-y-auto max-h-[85vh] sm:max-h-[90vh] overscroll-contain"
            >
              <div>
                <h2 className="text-2xl font-bold mb-1 truncate">{qrLink.title}</h2>
                <p className="text-xs text-brand-500 font-mono font-bold">/{qrLink.shortSlug}</p>
              </div>
              
              {/* QR Image Frame */}
              <div className="p-6 rounded-2xl inline-block max-w-[240px] max-h-[240px]" style={{ backgroundColor: qrBgColor }}>
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
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest text-center mb-1">Pemberian Merek QR</p>
                
                {/* Preset Themes Group */}
                <div className="space-y-1.5 border-b border-zinc-900/60 pb-3">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Preset Tema Cepat</label>
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
                    <label className="text-xs font-bold text-zinc-400">Warna QR</label>
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
                    <label className="text-xs font-bold text-zinc-400">Latar Belakang</label>
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
                    <label className="text-xs font-bold text-zinc-400">Logo Tengah QR</label>
                    <p className="text-[10px] text-zinc-500">Tampilkan logo di bagian tengah QR Code.</p>
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
                    <label className="text-xs font-bold text-zinc-400">Tautan Gambar Logo</label>
                    <input 
                      type="text"
                      value={qrLogoUrl}
                      onChange={(e) => setQrLogoUrl(e.target.value)}
                      placeholder="Masukkan URL Gambar..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-brand-500/50 text-xs font-mono"
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
                    className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors font-medium text-[11px] flex flex-col items-center justify-center gap-1"
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
                        
                        const image = new window.Image();
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
                    className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors font-medium text-[11px] flex flex-col items-center justify-center gap-1"
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
                        
                        const image = new window.Image();
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
                            pdf.text(`${qrLink.title}`, 105, 55, { align: "center" });
                            
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
                    className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors font-medium text-[11px] flex flex-col items-center justify-center gap-1"
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
                      
                      const image = new window.Image();
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
                      : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/50"
                  )}
                >
                  {copiedQr ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      {t("qrCopied")}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      {t("copyQrBtn")}
                    </>
                  )}
                </button>

                <button 
                  onClick={() => setQrLink(null)}
                  className="py-3 bg-brand-550 hover:bg-brand-400 text-black font-extrabold rounded-xl transition-colors font-semibold text-sm"
                >
                  Selesai
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {isColModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsColModalOpen(false);
              setColEditing(null);
              setColName("");
              setColDesc("");
              setColSelectedLinkIds([]);
            }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn("relative w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[85vh] sm:max-h-[90vh] overscroll-contain space-y-6", cardBg)}
          >
            <h2 className={cn("text-2xl font-extrabold", textTitle)}>
              {colEditing 
                ? (lang === "id" ? "Ubah Grup Koleksi" : "Edit Link Collection") 
                : (lang === "id" ? "Buat Grup / Koleksi Baru" : "Create New Link Collection")}
            </h2>
            
            <form onSubmit={handleSaveCollection} className="space-y-6">
              <div className="space-y-2">
                <label className={cn("text-xs font-bold", textMuted)}>{lang === "id" ? "Nama Grup / Koleksi" : "Collection Name"}</label>
                <input 
                  type="text" 
                  required
                  value={colName}
                  onChange={(e) => setColName(e.target.value)}
                  placeholder={lang === 'id' ? "Contoh: Kampanye Sosial" : "e.g., Marketing Campaign"}
                  className={cn("w-full rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-medium text-sm shadow-inner transition-all", inputBg)}
                />
              </div>

              <div className="space-y-2">
                <label className={cn("text-xs font-bold", textMuted)}>{lang === "id" ? "Deskripsi Penjelasan" : "Detailed Description"}</label>
                <textarea 
                  value={colDesc}
                  onChange={(e) => setColDesc(e.target.value)}
                  placeholder={lang === 'id' ? "Menjelaskan isi kelompok tautan ini..." : "Explain collection purposes..."}
                  className={cn("w-full rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-medium text-sm shadow-inner transition-all h-24 resize-none", inputBg)}
                />
              </div>

              <div className="space-y-3">
                <label className={cn("text-xs font-bold block", textMuted)}>
                  {lang === "id" ? "Pilih Tautan Untuk Dimasukkan" : "Select Links to Group (Bulk Assign)"}
                </label>
                <div className={cn("max-h-40 overflow-y-auto border rounded-xl p-3 space-y-2 divider-zinc shadow-inner", isLightMode ? "bg-zinc-50 border-zinc-200" : "bg-zinc-950 border-zinc-800")}>
                  {links.map((link) => {
                    const isChecked = colSelectedLinkIds.includes(link.id);
                    return (
                      <div 
                        key={link.id} 
                        onClick={() => {
                          if (isChecked) {
                            setColSelectedLinkIds(colSelectedLinkIds.filter(id => id !== link.id));
                          } else {
                            setColSelectedLinkIds([...colSelectedLinkIds, link.id]);
                          }
                        }}
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors text-xs font-bold",
                          isChecked 
                            ? (isLightMode ? "bg-brand-50/75 text-brand-650" : "bg-brand-500/10 text-brand-400")
                            : (isLightMode ? "hover:bg-zinc-100 text-zinc-970" : "hover:bg-zinc-900 text-zinc-400")
                        )}
                      >
                        <div className="shrink-0">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-brand-500" />
                          ) : (
                            <Square className="w-4 h-4 text-zinc-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn("truncate font-bold text-xs", textTitle)}>{link.title || link.shortSlug}</p>
                          <p className="font-mono text-[10px] text-zinc-500 truncate">/{link.shortSlug}</p>
                        </div>
                      </div>
                    );
                  })}
                  {links.length === 0 && (
                    <p className="text-xs text-zinc-500 italic text-center py-4">{lang === "id" ? "Tidak ada tautan terdaftar." : "No links registered yet."}</p>
                  )}
                </div>
              </div>

               <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  disabled={isSavingCollection}
                  onClick={() => {
                    setIsColModalOpen(false);
                    setColEditing(null);
                    setColName("");
                    setColDesc("");
                    setColSelectedLinkIds([]);
                  }}
                  className={cn(
                    "flex-1 py-3 font-bold rounded-xl border transition-all text-sm disabled:opacity-50",
                    isLightMode 
                      ? "bg-zinc-50 hover:bg-zinc-100 text-zinc-650 border-zinc-250" 
                      : "bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border-zinc-800"
                  )}
                >
                  {lang === "id" ? "Batalkan" : "Cancel"}
                </button>
                <button 
                  type="submit"
                  disabled={isSavingCollection}
                  className="flex-1 py-3 bg-brand-500 hover:bg-brand-400 text-black font-extrabold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-75"
                >
                  {isSavingCollection && <RefreshCw className="w-4 h-4 animate-spin text-black" />}
                  {isSavingCollection ? (lang === "id" ? "Menyimpan..." : "Saving...") : (lang === "id" ? "Simpan Koleksi" : "Save Collection")}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Floating Custom Toast notifications */}
      <AnimatePresence>
        {customToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className={cn(
              "fixed bottom-6 right-6 z-[9999] max-w-sm bg-zinc-950/95 backdrop-blur-md border text-white shadow-2xl rounded-2xl p-4 flex items-center gap-3",
              customToastType === "error" ? "border-red-500/30" : "border-brand-500/30"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              customToastType === "error" ? "bg-red-500/10 text-red-400" : "bg-brand-500/10 text-brand-500"
            )}>
              {customToastType === "error" ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className={cn(
                "text-[11px] font-extrabold tracking-wider uppercase",
                customToastType === "error" ? "text-red-400" : "text-brand-500"
              )}>
                {customToastType === "error" 
                  ? (lang === "id" ? "Gagal" : "Error") 
                  : (lang === "id" ? "Berhasil" : "Success")}
              </p>
              <p className="text-xs text-zinc-300 font-bold truncate">{customToast}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
