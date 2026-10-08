import type { Request } from "express";
import { sha256 } from "./crypto";

export interface UaInfo {
  device: "Desktop" | "Mobile" | "Tablet" | "Bot";
  os: string;
  browser: string;
}

export function parseUserAgent(raw: string | undefined): UaInfo {
  const ua = (raw ?? "").toLowerCase();
  if (!ua) return { device: "Desktop", os: "Other", browser: "Other" };

  let device: UaInfo["device"] = "Desktop";
  if (/bot|crawler|spider|preview|facebookexternalhit|slurp/.test(ua)) device = "Bot";
  else if (/ipad|tablet/.test(ua) || (ua.includes("android") && !ua.includes("mobile"))) device = "Tablet";
  else if (/mobi|iphone|ipod|android/.test(ua)) device = "Mobile";

  let os = "Other";
  if (ua.includes("windows")) os = "Windows";
  else if (/iphone|ipad|ipod/.test(ua)) os = "iOS";
  else if (ua.includes("android")) os = "Android";
  else if (/macintosh|mac os/.test(ua)) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";

  let browser = "Other";
  if (ua.includes("edg/")) browser = "Edge";
  else if (ua.includes("opr/") || ua.includes("opera")) browser = "Opera";
  else if (/chrome|crios/.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/.test(ua)) browser = "Firefox";
  else if (ua.includes("safari")) browser = "Safari";

  return { device, os, browser };
}

export function clientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim();
  return first || req.socket.remoteAddress || "";
}

function header(req: Request, name: string): string | null {
  const value = req.headers[name];
  const single = Array.isArray(value) ? value[0] : value;
  return single && single !== "XX" ? decodeURIComponent(single) : null;
}

/** Location comes from the hosting edge. We never call third-party geo services on the redirect path. */
export function clientGeo(req: Request): { country: string | null; city: string | null } {
  return {
    country: header(req, "cf-ipcountry") ?? header(req, "x-vercel-ip-country") ?? header(req, "x-client-geo-country") ?? header(req, "x-appengine-country"),
    city: header(req, "x-vercel-ip-city") ?? header(req, "x-client-geo-city") ?? header(req, "x-appengine-city"),
  };
}

/** Raw IPs are never stored. A daily-salted hash is enough to count unique visitors. */
export function visitorHash(req: Request, linkId: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return sha256(`${clientIp(req)}|${req.headers["user-agent"] ?? ""}|${linkId}|${day}`).slice(0, 24);
}

export function referrerHost(req: Request): string | null {
  const raw = req.headers.referer ?? req.headers.referrer;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  try {
    return new URL(value).host.replace(/^www\./, "");
  } catch {
    return null;
  }
}
