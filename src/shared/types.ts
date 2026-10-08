import type { SocialKey } from "./schemas";

export type LinkStatus = "active" | "disabled" | "scheduled" | "expired";

export interface UserDTO {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: "USER" | "ADMIN";
  hasPassword: boolean;
}

export interface AppConfigDTO {
  registrationEnabled: boolean;
  googleEnabled: boolean;
}

export interface LinkDTO {
  id: string;
  title: string;
  originalUrl: string;
  slug: string;
  collectionId: string | null;
  collectionName: string | null;
  isEnabled: boolean;
  isProtected: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  landingEnabled: boolean;
  landingDescription: string | null;
  landingImageUrl: string | null;
  clickCount: number;
  qrScanCount: number;
  createdAt: string;
  status: LinkStatus;
}

export interface LinkListDTO {
  items: LinkDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CollectionDTO {
  id: string;
  name: string;
  description: string | null;
  linkCount: number;
  clickCount: number;
  createdAt: string;
  linkIds: string[];
}

export interface CountItem {
  name: string;
  count: number;
}

export interface ClickDTO {
  id: string;
  timestamp: string;
  linkId: string;
  linkTitle: string;
  slug: string;
  country: string | null;
  city: string | null;
  device: string | null;
  os: string | null;
  browser: string | null;
  referrer: string | null;
  isQrScan: boolean;
}

export interface AnalyticsDTO {
  range: number;
  totals: { clicks: number; visitors: number; qrScans: number; links: number; activeLinks: number };
  series: { date: string; clicks: number; visitors: number }[];
  devices: CountItem[];
  browsers: CountItem[];
  systems: CountItem[];
  countries: CountItem[];
  referrers: CountItem[];
  topLinks: { id: string; title: string; slug: string; clicks: number }[];
  recent: ClickDTO[];
}

export interface BioDTO {
  handle: string;
  title: string;
  bio: string | null;
  avatarUrl: string | null;
  bgImageUrl: string | null;
  theme: string;
  buttonStyle: string;
  videoUrl: string | null;
  showFolders: boolean;
  socials: Partial<Record<SocialKey, string>>;
  linkIds: string[];
  /** Selected links in display order. */
  links: LinkDTO[];
  published: boolean;
}

export interface BulkImportResultDTO {
  imported: number;
  skipped: { originalUrl: string; slug: string; reason: string }[];
}

export interface ApiErrorBody {
  error: { code: string; message: string; fields?: Record<string, string> };
}

export function deriveLinkStatus(link: {
  isEnabled: boolean;
  startsAt: Date | string | null;
  expiresAt: Date | string | null;
}, now = new Date()): LinkStatus {
  if (!link.isEnabled) return "disabled";
  if (link.expiresAt && new Date(link.expiresAt) <= now) return "expired";
  if (link.startsAt && new Date(link.startsAt) > now) return "scheduled";
  return "active";
}
