import express from "express";
import path from "node:path";
import { env } from "./env";
import { errorMiddleware, HttpError } from "./lib/http";
import { loadUser, requireAdmin, requireAuth, sameOriginWrites } from "./lib/session";
import { accountRouter } from "./routes/account";
import { adminRouter } from "./routes/admin";
import { analyticsRouter } from "./routes/analytics";
import { authRouter, googleCallback } from "./routes/auth";
import { bioRouter } from "./routes/bio";
import { collectionsRouter } from "./routes/collections";
import { linksRouter } from "./routes/links";
import { publicRouter } from "./routes/public";

export async function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", env.isProd ? 1 : false);

  app.use((_req, res, next) => {
    res.set({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Frame-Options": "SAMEORIGIN",
    });
    next();
  });

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.get("/auth/callback", googleCallback);

  const api = express.Router();
  api.use(express.json({ limit: "1mb" }));
  api.use(sameOriginWrites);
  api.use(loadUser);
  api.use("/auth", authRouter);
  api.use("/links", requireAuth, linksRouter);
  api.use("/collections", requireAuth, collectionsRouter);
  api.use("/analytics", requireAuth, analyticsRouter);
  api.use("/bio", requireAuth, bioRouter);
  api.use("/account", requireAuth, accountRouter);
  api.use("/admin", requireAuth, requireAdmin, adminRouter);
  api.use((_req, _res, next) => next(new HttpError(404, "not_found", "Not found.")));
  api.use(errorMiddleware);
  app.use("/api", api);

  app.use(publicRouter);

  if (env.isProd) {
    const dist = path.join(process.cwd(), "dist");
    app.use(
      express.static(dist, {
        index: false,
        maxAge: "1h",
        setHeaders: (res, file) => {
          const name = path.basename(file);
          // The worker and manifest must always be revalidated so updates reach installed apps promptly.
          if (name === "sw.js" || name === "manifest.webmanifest" || name === "offline.html") {
            res.setHeader("Cache-Control", "no-cache");
            if (name === "sw.js") res.setHeader("Service-Worker-Allowed", "/");
          } else if (file.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          }
        },
      }),
    );
    app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
  } else {
    const { createServer } = await import("vite");
    const vite = await createServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  }

  return app;
}
