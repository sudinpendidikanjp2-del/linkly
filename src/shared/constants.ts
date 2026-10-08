/** Single-segment paths owned by the app. A short link can never use one of these as its slug. */
export const RESERVED_SLUGS = new Set([
  "api",
  "app",
  "admin",
  "assets",
  "auth",
  "b",
  "bio",
  "collections",
  "dashboard",
  "favicon",
  "health",
  "index",
  "lt",
  "login",
  "logout",
  "links",
  "null",
  "undefined",
  "public",
  "qr",
  "r",
  "register",
  "robots",
  "settings",
  "signup",
  "sitemap",
  "static",
  "t",
  "tree",
  "u",
  "unlock",
  "www",
]);

export const SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]{2,63}$/;
export const HANDLE_PATTERN = /^[a-z0-9][a-z0-9_-]{2,29}$/;

export const PAGE_SIZES = [10, 25, 50] as const;
export const ANALYTICS_RANGES = [7, 30, 90] as const;
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

export const MAX_BULK_IMPORT = 500;
