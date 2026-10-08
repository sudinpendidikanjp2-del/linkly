import { Router, urlencoded } from "express";
import type { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../db";
import { asyncHandler, parseCookies, param } from "../lib/http";
import { readToken, signToken, verifyPassword } from "../lib/crypto";
import { clientGeo, parseUserAgent, referrerHost, visitorHash } from "../lib/client-info";
import { env } from "../env";
import { RESERVED_SLUGS } from "../../src/shared/constants";
import { deriveLinkStatus } from "../../src/shared/types";
import { disabledPage, expiredPage, landingPage, notFoundPage, passwordPage, scheduledPage } from "../pages/gates";
import { bioPageHtml } from "../pages/bio";
import { loadLinks, readBioData, toRefs } from "../lib/bio-data";
import { referencedLinkIds } from "../../src/shared/bio-resolve";
import { pickLocale } from "../pages/render";

export const publicRouter = Router();

const SLUG_ROUTE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const UNLOCK_TTL_MS = 12 * 60 * 60 * 1000;

const unlockLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}|${req.params.slug}`,
  validate: { keyGeneratorIpFallback: false },
  handler: (req, res) => {
    const slug = String(req.params.slug);
    res.status(429).type("html").send(passwordPage(pickLocale(req.headers["accept-language"]), slug, "limited"));
  },
});

const cookieName = (slug: string) => `lk_${slug}`;

function isUnlocked(req: Request, slug: string, passwordHash: string): boolean {
  const payload = readToken<{ s: string; h: string; exp: number }>(parseCookies(req.headers.cookie)[cookieName(slug)]);
  return Boolean(payload && payload.s === slug && payload.h === passwordHash.slice(-16));
}

function setUnlocked(res: Response, slug: string, passwordHash: string) {
  const token = signToken({ s: slug, h: passwordHash.slice(-16), exp: Date.now() + UNLOCK_TTL_MS });
  const flags = [`Path=/${slug}`, "HttpOnly", "SameSite=Lax", `Max-Age=${UNLOCK_TTL_MS / 1000}`];
  if (env.isProd) flags.push("Secure");
  res.append("Set-Cookie", `${cookieName(slug)}=${encodeURIComponent(token)}; ${flags.join("; ")}`);
}

function sendHtml(res: Response, status: number, html: string) {
  res.status(status).set({ "Cache-Control": "no-store", "X-Robots-Tag": "noindex" }).type("html").send(html);
}

async function recordClick(req: Request, link: { id: string }, isQrScan: boolean) {
  const ua = parseUserAgent(req.headers["user-agent"]);
  if (ua.device === "Bot" || req.method === "HEAD") return;
  const geo = clientGeo(req);
  try {
    await prisma.$transaction([
      prisma.click.create({
        data: {
          linkId: link.id,
          country: geo.country,
          city: geo.city,
          device: ua.device,
          os: ua.os,
          browser: ua.browser,
          referrer: referrerHost(req),
          visitorHash: visitorHash(req, link.id),
          isQrScan,
        },
      }),
      prisma.link.update({
        where: { id: link.id },
        data: { clickCount: { increment: 1 }, ...(isQrScan ? { qrScanCount: { increment: 1 } } : {}) },
      }),
    ]);
  } catch (error) {
    console.error("Failed to record click", error);
  }
}

async function bioByHandleOrUser(key: string) {
  return prisma.bioPage.findFirst({ where: { OR: [{ handle: key.toLowerCase() }, { userId: key }] } });
}

async function serveBio(req: Request, res: Response) {
  const lang = pickLocale(req.headers["accept-language"]);
  const page = await bioByHandleOrUser(param(req, "handle"));
  if (!page) return sendHtml(res, 404, notFoundPage(lang));

  const data = readBioData(page);
  const refs = toRefs(await loadLinks(page.userId, referencedLinkIds(data.blocks, data.floaters)));
  const origin = env.appUrl ?? `${req.protocol}://${req.get("host")}`;
  res.set("Cache-Control", "public, max-age=60").type("html").send(bioPageHtml(lang, page, data, refs, origin));
}

publicRouter.get(["/b/:handle", "/tree/:handle", "/lt/:handle", "/t/:handle"], asyncHandler(async (req, res) => serveBio(req, res)));

publicRouter.post(
  "/:slug/unlock",
  unlockLimiter,
  urlencoded({ extended: false, limit: "4kb" }),
  asyncHandler(async (req, res, next) => {
    const slug = param(req, "slug").toLowerCase();
    const lang = pickLocale(req.headers["accept-language"]);
    if (!SLUG_ROUTE.test(slug) || RESERVED_SLUGS.has(slug)) return next();
    const link = await prisma.link.findUnique({ where: { slug } });
    if (!link?.passwordHash) return res.redirect(303, `/${slug}`);

    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!(await verifyPassword(password, link.passwordHash))) {
      return sendHtml(res, 401, passwordPage(lang, slug, "wrong"));
    }
    setUnlocked(res, slug, link.passwordHash);
    res.redirect(303, `/${slug}`);
  }),
);

/** Resolves a short link. Anything that is not a plausible slug falls through to the SPA / static files. */
publicRouter.get(
  ["/:slug", "/r/:slug"],
  asyncHandler(async (req, res, next) => {
    const slug = param(req, "slug").toLowerCase();
    if (!SLUG_ROUTE.test(slug) || RESERVED_SLUGS.has(slug)) return next();
    const lang = pickLocale(req.headers["accept-language"]);

    const link = await prisma.link.findUnique({ where: { slug } });
    if (!link) return sendHtml(res, 404, notFoundPage(lang, slug));

    const status = deriveLinkStatus(link);
    if (status === "disabled") return sendHtml(res, 403, disabledPage(lang, slug));
    if (status === "scheduled") return sendHtml(res, 403, scheduledPage(lang, slug, link.startsAt!));
    if (status === "expired") return sendHtml(res, 410, expiredPage(lang, slug));

    if (link.passwordHash && !isUnlocked(req, slug, link.passwordHash)) {
      return sendHtml(res, 401, passwordPage(lang, slug, "idle"));
    }

    const isQrScan = req.query.qr === "1";
    await recordClick(req, link, isQrScan);

    res.set("Cache-Control", "no-store");
    if (link.landingEnabled) return sendHtml(res, 200, landingPage(lang, link));
    res.redirect(302, link.originalUrl);
  }),
);
