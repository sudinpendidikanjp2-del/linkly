import { Router } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../db";
import { env } from "../env";
import { asyncHandler, HttpError, parse, queryString } from "../lib/http";
import { hashPassword, randomId, readToken, signToken, verifyPassword } from "../lib/crypto";
import { endSession, startSession } from "../lib/session";
import { toUserDTO } from "../lib/dto";
import { loginSchema, registerSchema } from "../../src/shared/schemas";
import type { AppConfigDTO } from "../../src/shared/types";

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, _res, next) => next(new HttpError(429, "rate_limited", "Too many attempts. Try again later.")),
});

export async function registrationEnabled(): Promise<boolean> {
  const settings = await prisma.appSettings.findUnique({ where: { id: "default" } });
  return settings?.registrationEnabled ?? true;
}

function roleFor(email: string, isFirstUser: boolean) {
  return isFirstUser || env.adminEmails.includes(email) ? ("ADMIN" as const) : ("USER" as const);
}

authRouter.get(
  "/config",
  asyncHandler(async (_req, res) => {
    const config: AppConfigDTO = {
      registrationEnabled: await registrationEnabled(),
      googleEnabled: Boolean(env.googleClientId && env.googleClientSecret),
    };
    res.json(config);
  }),
);

authRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    if (!req.user) return res.json({ user: null });
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    res.json({ user: user ? toUserDTO(user) : null });
  }),
);

authRouter.post(
  "/register",
  authLimiter,
  asyncHandler(async (req, res) => {
    const input = parse(registerSchema, req.body);
    if (!(await registrationEnabled())) {
      throw new HttpError(403, "registration_disabled", "New registrations are turned off.");
    }
    if (await prisma.user.findUnique({ where: { email: input.email } })) {
      throw new HttpError(409, "email_taken", "This email is already registered.", { email: "email_taken" });
    }
    const isFirstUser = (await prisma.user.count()) === 0;
    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash: await hashPassword(input.password),
        role: roleFor(input.email, isFirstUser),
      },
    });
    startSession(res, user.id);
    res.status(201).json({ user: toUserDTO(user) });
  }),
);

authRouter.post(
  "/login",
  authLimiter,
  asyncHandler(async (req, res) => {
    const input = parse(loginSchema, req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    // Always run a hash comparison so response time does not reveal which emails exist.
    const ok = user?.passwordHash
      ? await verifyPassword(input.password, user.passwordHash)
      : (await hashPassword(input.password), false);
    if (!user || !ok) throw new HttpError(401, "invalid_credentials", "Email or password is incorrect.");
    startSession(res, user.id);
    res.json({ user: toUserDTO(user) });
  }),
);

authRouter.post("/logout", (_req, res) => {
  endSession(res);
  res.json({ ok: true });
});

function redirectUri(req: import("express").Request): string {
  const base = env.appUrl ?? `${req.protocol}://${req.get("host")}`;
  return `${base}/auth/callback`;
}

authRouter.get("/google/url", (req, res, next) => {
  if (!env.googleClientId || !env.googleClientSecret) {
    return next(new HttpError(404, "google_disabled", "Google sign-in is not configured."));
  }
  const state = signToken({ n: randomId(), exp: Date.now() + 10 * 60 * 1000 });
  const params = new URLSearchParams({
    client_id: env.googleClientId,
    redirect_uri: redirectUri(req),
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
    state,
  });
  res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
});

/** Mounted at /auth/callback (not under /api) so the redirect URI stays stable. */
export const googleCallback = asyncHandler(async (req, res) => {
  const code = queryString(req.query.code);
  if (!code || !readToken(queryString(req.query.state))) {
    return res.redirect("/login?error=oauth");
  }
  if (!env.googleClientId || !env.googleClientSecret) return res.redirect("/login?error=oauth");

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      redirect_uri: redirectUri(req),
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return res.redirect("/login?error=oauth");
  const { access_token } = (await tokenRes.json()) as { access_token: string };

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { authorization: `Bearer ${access_token}` },
  });
  if (!profileRes.ok) return res.redirect("/login?error=oauth");
  const profile = (await profileRes.json()) as {
    sub: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };
  if (!profile.email || !profile.email_verified) return res.redirect("/login?error=oauth");
  const email = profile.email.toLowerCase();

  let user = await prisma.user.findFirst({ where: { OR: [{ googleId: profile.sub }, { email }] } });
  if (!user) {
    if (!(await registrationEnabled())) return res.redirect("/login?error=registration_disabled");
    const isFirstUser = (await prisma.user.count()) === 0;
    user = await prisma.user.create({
      data: { email, name: profile.name, avatarUrl: profile.picture, googleId: profile.sub, role: roleFor(email, isFirstUser) },
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({ where: { id: user.id }, data: { googleId: profile.sub, avatarUrl: user.avatarUrl ?? profile.picture } });
  }
  startSession(res, user.id);
  res.redirect("/");
});
