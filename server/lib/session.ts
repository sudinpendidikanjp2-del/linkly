import type { NextFunction, Request, Response } from "express";
import { env } from "../env";
import { prisma } from "../db";
import { parseCookies, HttpError } from "./http";
import { readToken, signToken } from "./crypto";

const COOKIE = "linkly_session";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

interface SessionPayload {
  uid: string;
  exp: number;
}

export function startSession(res: Response, userId: string) {
  const token = signToken({ uid: userId, exp: Date.now() + MAX_AGE_MS } satisfies SessionPayload);
  const flags = ["Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${MAX_AGE_MS / 1000}`];
  if (env.isProd) flags.push("Secure");
  res.append("Set-Cookie", `${COOKIE}=${encodeURIComponent(token)}; ${flags.join("; ")}`);
}

export function endSession(res: Response) {
  res.append("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

export async function loadUser(req: Request, _res: Response, next: NextFunction) {
  try {
    const payload = readToken<SessionPayload>(parseCookies(req.headers.cookie)[COOKIE]);
    if (payload) {
      const user = await prisma.user.findUnique({ where: { id: payload.uid }, select: { id: true, role: true } });
      if (user) req.user = user;
    }
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new HttpError(401, "unauthorized", "Sign in to continue."));
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") return next(new HttpError(403, "forbidden", "Admin access required."));
  next();
}

/** Blocks cross-site writes. Browsers always send Origin on non-GET fetches. */
export function sameOriginWrites(req: Request, _res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.headers.origin;
  if (origin) {
    let host: string | undefined;
    try {
      host = new URL(origin).host;
    } catch {
      /* fall through */
    }
    const allowed = [req.headers["x-forwarded-host"], req.headers.host, env.appUrl && new URL(env.appUrl).host];
    if (!host || !allowed.includes(host)) return next(new HttpError(403, "bad_origin", "Cross-site request blocked."));
  }
  next();
}
