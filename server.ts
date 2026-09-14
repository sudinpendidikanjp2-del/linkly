import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { exec, execSync } from "child_process";
import fs from "fs";

dotenv.config();

import { prisma, resetPrisma } from "./src/prisma";
import { GoogleGenAI, Type } from "@google/genai";

const activeFilename = typeof import.meta !== "undefined" && import.meta.url
  ? fileURLToPath(import.meta.url)
  : (typeof __filename !== "undefined" ? __filename : "");

const activeDirname = typeof import.meta !== "undefined" && import.meta.url
  ? path.dirname(activeFilename)
  : (typeof __dirname !== "undefined" ? __dirname : "");

// Resilient ID generator for click entries
const generateId = (length = 12) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Parser to extract device type, operating system, and browser from user-agent header
function parseUserAgent(uaString: string | undefined) {
  if (!uaString) {
    return {
      device: "Desktop",
      os: "Lainnya",
      browser: "Lainnya"
    };
  }

  const ua = uaString.toLowerCase();
  
  // 1. Device Type
  let device = "Desktop";
  if (ua.includes("mobi") || ua.includes("iphone") || ua.includes("ipod") || (ua.includes("android") && !ua.includes("tablet"))) {
    device = "Mobile";
  } else if (ua.includes("ipad") || ua.includes("tablet") || (ua.includes("android") && ua.includes("tablet"))) {
    device = "Tablet";
  }

  // 2. Operating System
  let os = "Lainnya";
  if (ua.includes("windows")) {
    os = "Windows";
  } else if (ua.includes("intel mac") || ua.includes("macintosh") || ua.includes("mac os") || ua.includes("mac_powerpc")) {
    os = "macOS";
  } else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) {
    os = "iOS";
  } else if (ua.includes("android")) {
    os = "Android";
  } else if (ua.includes("linux")) {
    os = "Linux";
  }

  // 3. Browser
  let browser = "Lainnya";
  if (ua.includes("edg/")) {
    browser = "Edge";
  } else if (ua.includes("chrome") || ua.includes("crios")) {
    browser = "Chrome";
  } else if (ua.includes("safari") && ua.includes("applewebkit")) {
    browser = "Safari";
  } else if (ua.includes("firefox") || ua.includes("fxios")) {
    browser = "Firefox";
  } else if (ua.includes("opr/") || ua.includes("opera")) {
    browser = "Opera";
  }

  return { device, os, browser };
}

// Safely extract client public IP
function getClientIp(req: any) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = typeof forwarded === 'string' ? forwarded.split(',') : forwarded;
    return ips[0].trim();
  }
  return req.socket.remoteAddress || req.ip || "127.0.0.1";
}

// Resilient GeoIP country and region lookup
async function getGeoLocation(ip: string, headers: any) {
  // 1. Fast path: check Cloud Run / Load Balancer geolocation headers
  const headerCountry = headers["x-client-geo-country"] || headers["cf-ipcountry"] || headers["x-appengine-country"];
  const headerRegion = headers["x-client-geo-region"];
  const headerCity = headers["x-client-geo-city"];

  if (headerCountry) {
    return {
      country: headerCountry,
      region: headerRegion || "DKI Jakarta",
      city: headerCity || "Jakarta"
    };
  }

  // 2. Fallback check for local/private IP ranges (avoid useless API fetches)
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
    return {
      country: "Indonesia",
      region: "DKI Jakarta",
      city: "Jakarta"
    };
  }

  // 3. Fallback: query a free geolocation JSON API with strict timeout
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 800); // 800ms limit to maintain low redirection latency
    const res = await fetch(`http://ip-api.com/json/${ip}`, { signal: controller.signal });
    clearTimeout(id);
    if (res.ok) {
      const data = (await res.json()) as any;
      if (data && data.status === "success") {
        return {
          country: data.country || "Indonesia",
          region: data.regionName || "DKI Jakarta",
          city: data.city || "Jakarta"
        };
      }
    }
  } catch (err) {
    console.warn(`GeoIP lookup failed/aborted for IP ${ip}:`, err);
  }

  return {
    country: "Indonesia",
    region: "DKI Jakarta",
    city: "Jakarta"
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Start listening immediately to satisfy Cloud Run TCP startup probe
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  // Helper to run commands asynchronously
  const runCommandAsync = (command: string, options: any = {}) => {
    return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
      console.log(`Running async command: ${command}`);
      exec(command, options, (error, stdout, stderr) => {
        if (error) {
          console.error(`Command failed: ${command}`, stderr);
          reject(error);
        } else {
          resolve({ stdout: String(stdout), stderr: String(stderr) });
        }
      });
    });
  };

  // Run database sync and Prisma client import in the background
  (async () => {
    // Run prisma db push to ensure database schema is synchronized
    let dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      const user = process.env.SQL_USER;
      const password = process.env.SQL_PASSWORD;
      const dbName = process.env.SQL_DB_NAME;
      const host = process.env.SQL_HOST;

      if (user && dbName) {
        if (host && (host.startsWith("/") || host.includes("/cloudsql"))) {
          const encodedHost = encodeURIComponent(host);
          dbUrl = `postgresql://${user}:${password || ""}@localhost/${dbName}?host=${encodedHost}`;
        } else {
          dbUrl = `postgresql://${user}:${password || ""}@${host || "127.0.0.1"}/${dbName}`;
        }
      }
    }

    const isPostgres = dbUrl && (dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://"));

    const setupSQLite = async () => {
      try {
        const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
        let schemaContent = fs.readFileSync(schemaPath, "utf-8");
        
        schemaContent = schemaContent.replace(
          /datasource db \{[\s\S]*?\}/,
          `datasource db {\n  provider = "sqlite"\n  url      = "file:./dev.db"\n}`
        );
        
        fs.writeFileSync(schemaPath, schemaContent, "utf-8");
        console.log("Modified schema.prisma to use SQLite provider.");
        
        const sqliteUrl = "file:./dev.db";
        process.env.DATABASE_URL = sqliteUrl;
        
        console.log("Re-generating Prisma client for SQLite...");
        await runCommandAsync("npx prisma generate");
        
        console.log("Pushing database schema to SQLite...");
        await runCommandAsync("npx prisma db push --accept-data-loss", {
          env: {
            ...process.env,
            DATABASE_URL: sqliteUrl,
          }
        });
        console.log("Database schema synchronized successfully on SQLite fallback.");
      } catch (fallbackError) {
        console.error("SQLite fallback failed completely:", fallbackError);
      }
    };

    // Run the database schema synchronization synchronously before importing prisma or starting route execution
    try {
      if (process.env.VERCEL) {
        console.log("Running in Vercel environment. Skipping database push and generate at startup...");
        if (dbUrl) {
          process.env.DATABASE_URL = dbUrl;
        }
      } else if (isPostgres) {
        try {
          console.log("PostgreSQL configuration detected. Ensuring schema.prisma is configured for postgresql...");
          const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
          let schemaContent = fs.readFileSync(schemaPath, "utf-8");
          
          schemaContent = schemaContent.replace(
            /datasource db \{[\s\S]*?\}/,
            `datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}`
          );
          fs.writeFileSync(schemaPath, schemaContent, "utf-8");

          console.log(`Attempting to push schema to PostgreSQL: ${dbUrl!.replace(/:[^:@]+@/, ":****@")}...`);
          let pushSuccess = false;
          let lastErr: any = null;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              if (attempt > 1) {
                console.log(`Retry attempt ${attempt}/3 connecting to PostgreSQL...`);
                await new Promise((r) => setTimeout(r, 2000));
              }
              await runCommandAsync("npx prisma db push --accept-data-loss", {
                env: { ...process.env, DATABASE_URL: dbUrl },
              });
              pushSuccess = true;
              break;
            } catch (err) {
              lastErr = err;
            }
          }

          if (!pushSuccess) {
            throw lastErr || new Error("Failed to connect or push schema to PostgreSQL after 3 attempts");
          }
          
          console.log("Database schema synchronized successfully on PostgreSQL.");
          process.env.DATABASE_URL = dbUrl;

          // Ensure default global settings exist in DB
          try {
            await prisma.globalSettings.upsert({
              where: { id: "default" },
              update: {},
              create: { id: "default", registrationEnabled: true },
            });
            console.log("Default global settings verified in database.");
          } catch (seedErr) {
            console.warn("Could not seed default global settings on startup (may exist already):", seedErr);
          }
        } catch (dbError) {
          console.error("Prisma database push failed on PostgreSQL. Falling back to local SQLite as a fallback...", dbError);
          await setupSQLite();
        }
      } else {
        console.log("No PostgreSQL configuration detected at startup. Defaulting to local SQLite...");
        await setupSQLite();
      }
    } catch (err) {
      console.error("Error during database sync execution:", err);
    } finally {
      if (resetPrisma) {
        resetPrisma();
      }
      console.log("Prisma client refreshed after database sync.");
    }
  })();

  app.use(express.json());

  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

  async function fetchPageTitle(url: string): Promise<string | null> {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9",
        },
        signal: AbortSignal.timeout(4000),
      });
      if (!response.ok) return null;
      const html = await response.text();
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        let title = titleMatch[1].trim();
        title = title
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
        return title;
      }
    } catch (err) {
      console.warn("Failed to fetch page title from URL directly:", err);
    }
    return null;
  }

  // API endpoint to generate metadata using Gemini
  app.post("/api/generate-metadata", async (req, res) => {
    const { originalUrl, currentTitle } = req.body;

    if (!originalUrl || typeof originalUrl !== "string") {
      return res.status(400).json({ error: "Original URL is required and must be a string." });
    }

    try {
      const ai = getGeminiClient();
      let prompt = `Analyze this URL and generate an appropriate metadata title and meta description: "${originalUrl}". Your response should be tailored specifically to the nature of this website.`;

      let detectedTitle = null;
      if (!currentTitle || currentTitle.trim() === "") {
        detectedTitle = await fetchPageTitle(originalUrl);
        if (detectedTitle) {
          prompt += `\n\nNote: A server-side fetcher automatically detected the following actual page title from the HTML: "${detectedTitle}". Please refine, clean up, and use this title as the primary reference for your generated metadata.`;
        }
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an assistant that analyzes URLs. Based on the provided URL, generate a logical and clean Title and Meta Description for it. If the URL is typical or looks like a specific brand/website, craft an appropriate title and description. Return a JSON object with keys 'title' and 'description'. Ensure the description is concise (maximum 160 characters). Do not output any Markdown formatting or extra text outside of the JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "A concise, representative, and human-friendly title for the website",
              },
              description: {
                type: Type.STRING,
                description: "A brief, clean meta description summarizing the website's purpose (max 160 characters)",
              }
            },
            required: ["title", "description"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response content generated by Gemini.");
      }

      const result = JSON.parse(responseText.trim());
      return res.json({
        title: result.title || "",
        description: result.description || ""
      });
    } catch (err: any) {
      console.warn("Gemini metadata generation failed, utilizing robust fallback mechanism:", err);

      let fallbackTitle = "";
      if (currentTitle && currentTitle.trim() !== "") {
        fallbackTitle = currentTitle;
      } else {
        let detectedTitle = null;
        try {
          detectedTitle = await fetchPageTitle(originalUrl);
        } catch (fetchErr) {
          console.warn("Could not fetch page title as fallback:", fetchErr);
        }

        if (detectedTitle) {
          fallbackTitle = detectedTitle;
        } else {
          try {
            const parsed = new URL(originalUrl);
            fallbackTitle = parsed.hostname.replace(/^www\./i, "");
            fallbackTitle = fallbackTitle.charAt(0).toUpperCase() + fallbackTitle.slice(1);
          } catch {
            fallbackTitle = originalUrl;
          }
        }
      }

      let fallbackDescription = "";
      try {
        const parsed = new URL(originalUrl);
        const domain = parsed.hostname.replace(/^www\./i, "");
        fallbackDescription = `Tautan ke ${domain}`;
      } catch {
        fallbackDescription = `Tautan ke ${originalUrl}`;
      }

      return res.json({
        title: fallbackTitle,
        description: fallbackDescription,
        isFallback: true
      });
    }
  });

  // Bulk Import Endpoint with Slug Collision skip-logic
  app.post("/api/links/bulk-import", async (req, res) => {
    const { userId: rawUserId, items } = req.body;

    if (!rawUserId) {
      return res.status(400).json({ error: "userId is required." });
    }
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "items array is required." });
    }

    const userId = await resolveUserId(rawUserId);
    await ensureUserExists(userId);

    const imported: any[] = [];
    const skipped: any[] = [];

    for (const item of items) {
      let { originalUrl, shortSlug, title, category, collectionId } = item;

      if (!originalUrl || typeof originalUrl !== "string" || originalUrl.trim() === "") {
        skipped.push({
          originalUrl: originalUrl || "",
          shortSlug: shortSlug || "",
          title: title || "",
          reason: "URL tidak boleh kosong / URL cannot be empty"
        });
        continue;
      }

      // Quick format URL verification
      let formattedUrl = originalUrl.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }

      // Check URL parse validity
      try {
        new URL(formattedUrl);
      } catch {
        skipped.push({
          originalUrl: originalUrl,
          shortSlug: shortSlug || "",
          title: title || "",
          reason: "Format URL tidak valid / Invalid URL format"
        });
        continue;
      }

      // Normalize shortSlug or generate a new one
      let normalizedSlug = "";
      if (shortSlug && typeof shortSlug === "string" && shortSlug.trim() !== "") {
        // Only alphanumeric, hyphens and underscores
        normalizedSlug = shortSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
      }

      if (!normalizedSlug) {
        normalizedSlug = generateId(6);
      }

      // Check duplicate in database
      try {
        const existing = await prisma.link.findUnique({
          where: { shortSlug: normalizedSlug }
        });

        if (existing) {
          skipped.push({
            originalUrl: originalUrl,
            shortSlug: normalizedSlug,
            title: title || originalUrl,
            reason: "Slug sudah digunakan / Slug already in use"
          });
          continue;
        }

        // Determine title: if title is missing, short slug becomes default title
        let finalTitle = title ? title.trim() : "";
        if (!finalTitle) {
          finalTitle = normalizedSlug;
        }

        const id = "link_" + generateId(12);
        const newLink = await prisma.link.create({
          data: {
            id,
            userId,
            originalUrl: formattedUrl,
            shortSlug: normalizedSlug,
            title: finalTitle,
            category: category || "general",
            collectionId: collectionId || null,
            clickCount: 0,
            qrScanCount: 0,
            isEnabled: true
          }
        });

        imported.push(newLink);
      } catch (err: any) {
        skipped.push({
          originalUrl: originalUrl,
          shortSlug: normalizedSlug,
          title: title || originalUrl,
          reason: err.message || "Gagal menyimpan / Failed to save"
        });
      }
    }

    return res.json({
      importedCount: imported.length,
      skippedCount: skipped.length,
      skipped
    });
  });

  // Google OAuth Authorization URLs
  app.get("/api/auth/google/url", (req, res) => {
    const redirectUri = process.env.APP_URL 
      ? `${process.env.APP_URL.replace(/\/$/, "")}/auth/callback` 
      : `${req.protocol}://${req.get("host")}/auth/callback`;

    const clientId = process.env.GOOGLE_CLIENT_ID || "249255139104-u88s748mvffb2urquft67hoioiaffcb9.apps.googleusercontent.com";

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      prompt: "select_account"
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    res.json({ url: authUrl });
  });

  // Google OAuth Callback handler
  app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send("Authorization code missing.");
    }

    const redirectUri = process.env.APP_URL 
      ? `${process.env.APP_URL.replace(/\/$/, "")}/auth/callback` 
      : `${req.protocol}://${req.get("host")}/auth/callback`;

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    let userData: any = null;

    try {
      if (!clientId || !clientSecret) {
        console.warn("GOOGLE_CLIENT_ID/SECRET missing. Bypassing using dynamic sandbox user for preview.");
        userData = {
          id: "sandbox-dev-user-id",
          email: "supri.contact@gmail.com",
          name: "Supri Contact",
          avatar: "https://lh3.googleusercontent.com/a/default-user"
        };
      } else {
        // Exchange authorization code for access tokens
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code: code as string,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: "authorization_code"
          })
        });

        if (!tokenRes.ok) {
          throw new Error(`Token exchange failed: ${await tokenRes.text()}`);
        }

        const tokens = await tokenRes.json();
        const accessToken = tokens.access_token;

        // Fetch user profile info
        const profileRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
        if (!profileRes.ok) {
          throw new Error(`Profile fetch failed: ${await profileRes.text()}`);
        }

        const profile = await profileRes.json();
        userData = {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          avatar: profile.picture
        };
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userData.id }
      });

      if (!existingUser) {
        // New user registration!
        // Check if registration is enabled
        const globalSettings = await prisma.globalSettings.findUnique({
          where: { id: "default" }
        });
        const registrationEnabled = globalSettings ? globalSettings.registrationEnabled : true;
        
        if (!registrationEnabled) {
          return res.send(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Registrasi Dinonaktifkan</title>
                <style>
                  body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #09090b; color: #f4f4f5; text-align: center; }
                  .container { max-width: 400px; padding: 2rem; border-radius: 1rem; border: 1px solid #27272a; background-color: #18181b; }
                  h1 { font-size: 1.5rem; color: #ef4444; margin-bottom: 1rem; }
                  p { color: #a1a1aa; font-size: 0.875rem; line-height: 1.5; }
                  button { margin-top: 1.5rem; background-color: #f4f4f5; color: #09090b; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: bold; cursor: pointer; }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>Registrasi Gagal</h1>
                  <p>Maaf, pendaftaran akun baru telah dinonaktifkan oleh administrator.</p>
                  <button onclick="window.close()">Tutup Jendela</button>
                </div>
              </body>
            </html>
          `);
        }
      }

      // Upsert user in database using Prisma
      const dbUser = await prisma.user.upsert({
        where: { id: userData.id },
        update: {
          email: userData.email,
          name: userData.name,
          avatar: userData.avatar
        },
        create: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          avatar: userData.avatar
        }
      });

      // Send success message to parent window and close popup
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Autentikasi Berhasil</title>
          </head>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_AUTH_SUCCESS',
                  user: {
                    uid: ${JSON.stringify(dbUser.id)},
                    email: ${JSON.stringify(dbUser.email)},
                    displayName: ${JSON.stringify(dbUser.name)},
                    photoURL: ${JSON.stringify(dbUser.avatar)}
                  }
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Autentikasi berhasil. Jendela ini akan ditutup secara otomatis...</p>
          </body>
        </html>
      `);

    } catch (error: any) {
      console.error("OAuth Callback Error:", error);
      res.status(500).send(`Authentication failed: ${error.message || String(error)}`);
    }
  });

  // Document collection CRUD routes mapping standard Client/Firebase queries to Prisma
  async function resolveUserId(id: string): Promise<string> {
    if (!id) return id;
    const lowerId = id.toLowerCase();
    try {
      // 1. Try exact match by ID
      const userById = await prisma.user.findFirst({
        where: {
          OR: [
            { id: id },
            { id: lowerId }
          ]
        }
      });
      if (userById) return userById.id;

      // 2. Try match by email slug
      const userByEmail = await prisma.user.findFirst({
        where: {
          email: {
            startsWith: `${lowerId}@`
          }
        }
      });
      if (userByEmail) return userByEmail.id;
    } catch (e) {
      console.error("Error in resolveUserId:", e);
    }
    return id;
  }

  async function ensureUserExists(userId: string, defaultData?: { email?: string; name?: string; avatar?: string }) {
    if (!userId) return userId;
    try {
      const existing = await prisma.user.findUnique({
        where: { id: userId }
      });
      if (!existing) {
        const fallbackEmail = defaultData?.email || `${userId}@user.app`;
        const existingEmailUser = await prisma.user.findUnique({ where: { email: fallbackEmail } });
        const finalEmail = existingEmailUser ? `${userId}_${Date.now()}@user.app` : fallbackEmail;

        await prisma.user.create({
          data: {
            id: userId,
            email: finalEmail,
            name: defaultData?.name || `User`,
            avatar: defaultData?.avatar || null
          }
        });
      }
    } catch (e) {
      console.error(`ensureUserExists failed for ${userId}:`, e);
    }
    return userId;
  }

  app.get("/api/links/registry", async (req, res) => {
    try {
      const rawUserId = req.query.userId as string;
      const userId = await resolveUserId(rawUserId);
      if (!userId) {
        return res.status(400).json({ error: "Missing or invalid userId" });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string || "").trim().toLowerCase();
      const status = req.query.status as string || "all";
      const category = req.query.category as string || "all";
      const passwordOpt = req.query.password as string || "all";
      const portal = req.query.portal as string || "all";
      const minClicksStr = req.query.minClicks as string;
      const minClicks = (minClicksStr && minClicksStr !== "undefined" && minClicksStr !== "null" && minClicksStr !== "") ? parseInt(minClicksStr) : null;
      const sortField = req.query.sortField as string || "createdAt";
      const sortOrder = (req.query.sortOrder as string || "desc").toLowerCase() as "asc" | "desc";

      const where: any = { userId };

      if (category !== "all") {
        where.category = category;
      }

      if (passwordOpt === "protected") {
        where.password = { not: "" };
      } else if (passwordOpt === "none") {
        where.OR = [
          { password: "" },
          { password: null }
        ];
      }

      if (portal === "enabled") {
        where.landingEnabled = true;
      } else if (portal === "disabled") {
        where.OR = [
          { landingEnabled: false },
          { landingEnabled: null }
        ];
      }

      if (minClicks !== null && !isNaN(minClicks)) {
        where.clickCount = { gte: minClicks };
      }

      if (search) {
        where.AND = [
          {
            OR: [
              { title: { contains: search } },
              { originalUrl: { contains: search } },
              { shortSlug: { contains: search } }
            ]
          }
        ];
      }

      const now = new Date();
      if (status === "active") {
        where.OR = [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ];
      } else if (status === "expired") {
        where.expiresAt = { lte: now };
      }

      const select = {
        id: true,
        title: true,
        originalUrl: true,
        shortSlug: true,
        clickCount: true,
        isEnabled: true,
        password: true,
        landingEnabled: true,
        expiresAt: true,
        createdAt: true,
        category: true,
      };

      let orderBy: any = {};
      if (sortField === "clickCount") {
        orderBy = { clickCount: sortOrder };
      } else if (sortField === "title") {
        orderBy = { title: sortOrder };
      } else if (sortField === "shortSlug") {
        orderBy = { shortSlug: sortOrder };
      } else {
        orderBy = { createdAt: sortOrder };
      }

      const totalCount = await prisma.link.count({ where });
      const links = await prisma.link.findMany({
        where,
        select,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      });

      const mappedLinks = links.map(link => {
        const isExpired = link.expiresAt && new Date(link.expiresAt) < now;
        return {
          id: link.id,
          title: link.title,
          originalUrl: link.originalUrl,
          shortSlug: link.shortSlug,
          clickCount: link.clickCount,
          isEnabled: link.isEnabled !== false,
          isProtected: !!link.password,
          isLandingEnabled: !!link.landingEnabled,
          isExpired: !!isExpired,
          createdAt: link.createdAt.toISOString(),
          category: link.category || "general",
        };
      });

      return res.json({
        links: mappedLinks,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      });
    } catch (err: any) {
      console.error("Failed to fetch links registry:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get(["/api/dashboard/stats", "/api/stats"], async (req, res) => {
    try {
      const rawUserId = req.query.userId as string;
      const userId = await resolveUserId(rawUserId);
      if (!userId) {
        return res.status(400).json({ error: "Missing or invalid userId" });
      }
      await ensureUserExists(userId);

      const now = new Date();

      const totalLinks = await prisma.link.count({
        where: { userId }
      });

      const activeLinks = await prisma.link.count({
        where: {
          userId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } }
          ]
        }
      });

      const aggregateClicks = await prisma.link.aggregate({
        where: { userId },
        _sum: {
          clickCount: true,
          qrScanCount: true,
        }
      });
      const totalClicks = aggregateClicks._sum.clickCount || 0;
      const qrScanCount = aggregateClicks._sum.qrScanCount || 0;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const clicksInLastWeek = await prisma.click.findMany({
        where: {
          userId,
          timestamp: { gte: sevenDaysAgo }
        },
        select: {
          timestamp: true
        }
      });

      const clicksPerDay = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const label = `${dd} ${months[d.getMonth()]}`;

        const count = clicksInLastWeek.filter(click => {
          try {
            const clickDate = new Date(click.timestamp);
            const cY = clickDate.getFullYear();
            const cM = String(clickDate.getMonth() + 1).padStart(2, '0');
            const cD = String(clickDate.getDate()).padStart(2, '0');
            return `${cY}-${cM}-${cD}` === dateStr;
          } catch (e) {
            return false;
          }
        }).length;

        clicksPerDay.push({
          name: label,
          Clicks: count
        });
      }

      const latestActivity = await prisma.click.findMany({
        where: { userId },
        orderBy: { timestamp: "desc" },
        take: 5
      });

      const latestCreatedLinks = await prisma.link.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5
      });

      return res.json({
        totalLinks,
        totalClicks,
        activeLinks,
        qrScanCount,
        clicksPerDay,
        latestActivity: latestActivity.map(c => ({
          id: c.id,
          linkId: c.linkId,
          timestamp: c.timestamp.toISOString(),
          ip: c.ip || "Unknown",
          referrer: c.referrer || "Direct",
          country: c.country || "Unknown",
          city: c.city || "Unknown",
          device: c.device || "Desktop",
          browser: c.browser || "Unknown",
          os: c.os || "Unknown",
        })),
        latestCreatedLinks: latestCreatedLinks.map(l => ({
          id: l.id,
          title: l.title,
          originalUrl: l.originalUrl,
          shortSlug: l.shortSlug,
          clickCount: l.clickCount,
          qrScanCount: l.qrScanCount || 0,
          isEnabled: l.isEnabled !== false,
          isProtected: !!l.password,
          isLandingEnabled: !!l.landingEnabled,
          expiresAt: l.expiresAt ? l.expiresAt.toISOString() : null,
          activatedAt: l.activatedAt ? l.activatedAt.toISOString() : null,
          createdAt: l.createdAt.toISOString()
        }))
      });
    } catch (err: any) {
      console.error("Failed to fetch dashboard stats:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/documents/:collection", async (req, res) => {
    const { collection } = req.params;
    const filters: any = req.query;

    try {
      if (collection === "links") {
        const whereClause: any = {};
        if (filters.userId) {
          whereClause.userId = await resolveUserId(filters.userId);
        }
        if (filters.shortSlug) whereClause.shortSlug = filters.shortSlug;
        
        const list = await prisma.link.findMany({
          where: whereClause,
          orderBy: { createdAt: "desc" }
        });
        return res.json(list);

      } else if (collection === "clicks") {
        const whereClause: any = {};
        if (filters.userId) {
          whereClause.userId = await resolveUserId(filters.userId);
        }
        if (filters.linkId) whereClause.linkId = filters.linkId;

        const list = await prisma.click.findMany({
          where: whereClause,
          orderBy: { timestamp: "desc" }
        });
        return res.json(list);

      } else if (collection === "collections") {
        const whereClause: any = {};
        if (filters.userId) {
          whereClause.userId = await resolveUserId(filters.userId);
        }

        const list = await prisma.collection.findMany({
          where: whereClause,
          orderBy: { createdAt: "desc" },
          include: { links: true }
        });

        const mapped = list.map(c => ({
          id: c.id,
          userId: c.userId,
          name: c.name,
          description: c.description || "",
          createdAt: c.createdAt.toISOString(),
          linkIds: c.links.map(l => l.id)
        }));

        return res.json(mapped);

      } else {
        return res.status(404).json({ error: `Collection ${collection} not found` });
      }
    } catch (err: any) {
      console.error(`GET collection ${collection} failed:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/documents/:collection/:id", async (req, res) => {
    const { collection, id } = req.params;

    try {
      if (collection === "users") {
        const resolvedId = await resolveUserId(id);
        const item = await prisma.user.findUnique({ where: { id: resolvedId } });
        if (!item) return res.status(404).json({ error: "User not found" });
        return res.json({
          uid: item.id,
          email: item.email,
          displayName: item.name,
          photoURL: item.avatar,
          createdAt: item.createdAt.toISOString()
        });

      } else if (collection === "links") {
        const item = await prisma.link.findUnique({ where: { id } });
        if (!item) return res.status(404).json({ error: "Link not found" });
        return res.json(item);

      } else if (collection === "link_trees") {
        const resolvedId = await resolveUserId(id);
        const item = await prisma.linkTree.findUnique({ where: { id: resolvedId } });
        if (!item) return res.status(404).json({ error: "LinkTree not found" });
        let treeLinksParsed = [];
        try {
          treeLinksParsed = typeof item.treeLinks === "string" ? JSON.parse(item.treeLinks) : (item.treeLinks || []);
        } catch (e) {
          treeLinksParsed = [];
        }
        return res.json({
          ...item,
          treeLinks: treeLinksParsed
        });

      } else if (collection === "collections") {
        const item = await prisma.collection.findUnique({
          where: { id },
          include: { links: true }
        });
        if (!item) return res.status(404).json({ error: "Collection not found" });
        return res.json({
          id: item.id,
          userId: item.userId,
          name: item.name,
          description: item.description || "",
          createdAt: item.createdAt.toISOString(),
          linkIds: item.links.map((l: any) => l.id)
        });

      } else if (collection === "settings") {
        if (id === "global") {
          const item = await prisma.globalSettings.findUnique({ where: { id: "default" } });
          if (!item) {
            const defaultSettings = await prisma.globalSettings.create({
              data: { id: "default", registrationEnabled: true }
            });
            return res.json(defaultSettings);
          }
          return res.json(item);
        }
        return res.status(404).json({ error: "Settings not found" });

      } else if (collection === "test") {
        return res.json({ id, status: "connected" });
      } else {
        return res.status(404).json({ error: `Collection ${collection} not found` });
      }
    } catch (err: any) {
      console.error(`GET document ${collection}/${id} failed:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/documents/:collection/:id", async (req, res) => {
    const { collection, id } = req.params;
    const data = req.body;

    try {
      if (collection === "users") {
        const existingUser = await prisma.user.findUnique({
          where: { id }
        });

        if (!existingUser) {
          const globalSettings = await prisma.globalSettings.findUnique({
            where: { id: "default" }
          });
          const registrationEnabled = globalSettings ? globalSettings.registrationEnabled : true;
          if (!registrationEnabled) {
            return res.status(403).json({ error: "REGISTRATION_DISABLED", message: "Pendaftaran akun baru dinonaktifkan." });
          }
        }

        const fallbackEmail = data.email || `${id}@user.app`;
        const existingEmailUser = await prisma.user.findFirst({
          where: {
            email: fallbackEmail,
            NOT: { id }
          }
        });
        const finalEmail = existingEmailUser ? `${id}_${Date.now()}@user.app` : fallbackEmail;

        const item = await prisma.user.upsert({
          where: { id },
          update: {
            email: finalEmail,
            name: data.displayName || data.name,
            avatar: data.photoURL || data.avatar
          },
          create: {
            id,
            email: finalEmail,
            name: data.displayName || data.name || "User",
            avatar: data.photoURL || data.avatar || null
          }
        });
        return res.json(item);

      } else if (collection === "links") {
        const targetUserId = await resolveUserId(data.userId || id);
        if (targetUserId) await ensureUserExists(targetUserId);

        const payload: any = {
          userId: targetUserId,
          originalUrl: data.originalUrl,
          shortSlug: data.shortSlug,
          customDomain: data.customDomain || null,
          clickCount: data.clickCount || 0,
          qrScanCount: data.qrScanCount || 0,
          collectionId: data.collectionId || null,
          title: data.title || "",
          password: data.password || null,
          landingEnabled: !!data.landingEnabled,
          landingDescription: data.landingDescription || null,
          landingAvatar: data.landingAvatar || null,
          isEnabled: data.isEnabled !== false,
          category: data.category || "general"
        };
        if (data.expiresAt !== undefined) {
          payload.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
        }
        if (data.activatedAt !== undefined) {
          payload.activatedAt = data.activatedAt ? new Date(data.activatedAt) : null;
        }
        if (data.createdAt) payload.createdAt = new Date(data.createdAt);

        const item = await prisma.link.upsert({
          where: { id },
          update: payload,
          create: { id, ...payload }
        });
        return res.json(item);

      } else if (collection === "link_trees") {
        const resolvedId = await resolveUserId(id);
        if (resolvedId) await ensureUserExists(resolvedId);

        const treeLinksStr = typeof data.treeLinks === "string"
          ? data.treeLinks
          : JSON.stringify(data.treeLinks || []);

        const payload: any = {
          treeTitle: data.treeTitle || "",
          treeBio: data.treeBio || "",
          treeAvatar: data.treeAvatar || "",
          treeTheme: data.treeTheme || "slate",
          treeLinks: treeLinksStr,
          treeBgImage: data.treeBgImage || null,
          treeButtonStyle: data.treeButtonStyle || "classic",
          treeInstagram: data.treeInstagram || null,
          treeTwitter: data.treeTwitter || null,
          treeLinkedIn: data.treeLinkedIn || null,
          treeYoutube: data.treeYoutube || null,
          treeGithub: data.treeGithub || null,
          treeVideoUrl: data.treeVideoUrl || null,
          treeButtonBgImage: data.treeButtonBgImage || null,
          treeShowFolders: data.treeShowFolders !== false,
          updatedAt: new Date()
        };

        const item = await prisma.linkTree.upsert({
          where: { id: resolvedId },
          update: payload,
          create: { id: resolvedId, ...payload }
        });

        let treeLinksParsed = [];
        try {
          treeLinksParsed = JSON.parse(item.treeLinks);
        } catch (e) {
          treeLinksParsed = [];
        }

        return res.json({
          ...item,
          treeLinks: treeLinksParsed
        });

      } else if (collection === "collections") {
        const targetUserId = await resolveUserId(data.userId);
        if (targetUserId) await ensureUserExists(targetUserId);

        const payload: any = {
          userId: targetUserId,
          name: data.name,
          description: data.description || null
        };
        if (data.createdAt) payload.createdAt = new Date(data.createdAt);

        const item = await prisma.collection.upsert({
          where: { id },
          update: payload,
          create: { id, ...payload }
        });

        if (Array.isArray(data.linkIds)) {
          await prisma.link.updateMany({
            where: { collectionId: id },
            data: { collectionId: null }
          });
          await prisma.link.updateMany({
            where: { id: { in: data.linkIds } },
            data: { collectionId: id }
          });
        }

        return res.json(item);

      } else if (collection === "settings") {
        if (id === "global") {
          const item = await prisma.globalSettings.upsert({
            where: { id: "default" },
            update: { registrationEnabled: !!data.registrationEnabled },
            create: { id: "default", registrationEnabled: !!data.registrationEnabled }
          });
          return res.json(item);
        }
        return res.status(404).json({ error: "Settings ID not found" });

      } else if (collection === "test") {
        return res.json({ id, status: "connected", ...data });
      } else {
        return res.status(404).json({ error: `Collection ${collection} not found` });
      }
    } catch (err: any) {
      console.error(`POST document ${collection}/${id} failed:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/documents/:collection/:id", async (req, res) => {
    const { collection, id } = req.params;
    const data = req.body;

    try {
      if (collection === "links") {
        const updateData: any = {};
        
        if (data.originalUrl !== undefined) updateData.originalUrl = data.originalUrl;
        if (data.shortSlug !== undefined) updateData.shortSlug = data.shortSlug;
        if (data.customDomain !== undefined) updateData.customDomain = data.customDomain;
        if (data.title !== undefined) updateData.title = data.title;
        if (data.password !== undefined) updateData.password = data.password;
        if (data.landingEnabled !== undefined) updateData.landingEnabled = !!data.landingEnabled;
        if (data.landingDescription !== undefined) updateData.landingDescription = data.landingDescription;
        if (data.landingAvatar !== undefined) updateData.landingAvatar = data.landingAvatar;
        if (data.isEnabled !== undefined) updateData.isEnabled = data.isEnabled !== false;
        if (data.category !== undefined) updateData.category = data.category;
        if (data.collectionId !== undefined) updateData.collectionId = data.collectionId || null;
        if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
        if (data.activatedAt !== undefined) updateData.activatedAt = data.activatedAt ? new Date(data.activatedAt) : null;

        if (data.clickCount && data.clickCount.__increment) {
          updateData.clickCount = { increment: data.clickCount.__increment };
        } else if (typeof data.clickCount === "number") {
          updateData.clickCount = data.clickCount;
        }

        if (data.qrScanCount && data.qrScanCount.__increment) {
          updateData.qrScanCount = { increment: data.qrScanCount.__increment };
        } else if (typeof data.qrScanCount === "number") {
          updateData.qrScanCount = data.qrScanCount;
        }

        const item = await prisma.link.update({
          where: { id },
          data: updateData
        });
        return res.json(item);

      } else if (collection === "test") {
        return res.json({ id, status: "connected", ...data });
      } else {
        return res.status(400).json({ error: `Patch operation not supported for ${collection}` });
      }
    } catch (err: any) {
      console.error(`PATCH document ${collection}/${id} failed:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/documents/:collection/:id", async (req, res) => {
    const { collection, id } = req.params;

    try {
      if (collection === "links") {
        await prisma.link.delete({ where: { id } });
        return res.json({ success: true });
      } else if (collection === "collections") {
        await prisma.collection.delete({ where: { id } });
        return res.json({ success: true });
      } else if (collection === "clicks") {
        await prisma.click.delete({ where: { id } });
        return res.json({ success: true });
      } else if (collection === "test") {
        return res.json({ success: true });
      } else {
        return res.status(404).json({ error: `Deletion not supported for ${collection}` });
      }
    } catch (err: any) {
      console.error(`DELETE document ${collection}/${id} failed:`, err);
      res.status(500).json({ error: err.message });
    }
  });

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
    return null;
  }

  async function servePublicBioTree(req: any, res: any) {
    const { id } = req.params;
    try {
      const userId = await resolveUserId(id);
      if (!userId) {
        return res.status(404).send("Profil tidak ditemukan.");
      }

      // Fetch User settings and data
      const userObj = await prisma.user.findUnique({
        where: { id: userId }
      });

      const linkTree = await prisma.linkTree.findUnique({
        where: { id: userId }
      });

      const links = await prisma.link.findMany({
        where: { userId, isEnabled: true },
        orderBy: { createdAt: "desc" }
      });

      const collections = await prisma.collection.findMany({
        where: { userId },
        include: { links: true },
        orderBy: { createdAt: "desc" }
      });

      // Filter active links and preserve custom treeLinks order
      let activeLinks: any[] = [];
      let treeLinks: string[] = [];
      try {
        treeLinks = linkTree?.treeLinks ? JSON.parse(linkTree.treeLinks) : [];
      } catch (e) {
        treeLinks = [];
      }

      if (Array.isArray(treeLinks) && treeLinks.length > 0) {
        const linkMap = new Map(links.map((l: any) => [l.id, l]));
        activeLinks = treeLinks
          .map((id: string) => linkMap.get(id))
          .filter((l: any) => Boolean(l));
      } else {
        activeLinks = [];
      }

      // Filter non-expired links
      activeLinks = activeLinks.filter((l: any) => {
        if (l.expiresAt && new Date(l.expiresAt) < new Date()) return false;
        return true;
      });

      // Map theme
      const themeName = linkTree?.treeTheme || "slate";
      const THEMES: Record<string, any> = {
        slate: {
          bg: "background: linear-gradient(to bottom, #09090b, #18181b, #000000);",
          buttonBg: "background-color: #27272a; border-color: rgba(63, 63, 70, 0.5);",
          buttonText: "color: #f4f4f5; font-weight: 600;",
          accentColor: "#fb923c"
        },
        monochrome: {
          bg: "background: linear-gradient(to bottom, #000000, #09090b, #18181b);",
          buttonBg: "background-color: #18181b; border: 1px solid #ffffff;",
          buttonText: "color: #ffffff; font-weight: 800;",
          accentColor: "#ffffff"
        },
        lightMonochrome: {
          bg: "background: linear-gradient(to bottom, #ffffff, #f4f4f5, #e4e4e7);",
          buttonBg: "background-color: #ffffff; border: 2px solid #000000;",
          buttonText: "color: #000000; font-weight: 800;",
          accentColor: "#000000"
        },
        lightSlate: {
          bg: "background: linear-gradient(to bottom, #f8fafc, #f4f4f5, #ffffff);",
          buttonBg: "background-color: #ffffff; border: 1px solid #e4e4e7;",
          buttonText: "color: #18181b; font-weight: 600;",
          accentColor: "#ea580c"
        },
        sunset: {
          bg: "background: linear-gradient(to bottom right, #1e1b4b, #581c87, #2e1065);",
          buttonBg: "background-color: rgba(88, 28, 135, 0.3); border: 1px solid rgba(251, 146, 60, 0.2);",
          buttonText: "color: #f5f3ff; font-weight: 600;",
          accentColor: "#fb923c"
        },
        lightSunset: {
          bg: "background: linear-gradient(to bottom right, #fffbeb, #fff1f2, #fffbeb);",
          buttonBg: "background-color: #ffffff; border: 1px solid rgba(251, 146, 60, 0.5);",
          buttonText: "color: #451a03; font-weight: 600;",
          accentColor: "#fb923c"
        },
        forest: {
          bg: "background: linear-gradient(to bottom right, #1c1917, #022c22, #09090b);",
          buttonBg: "background-color: rgba(2, 44, 34, 0.3); border: 1px solid rgba(6, 95, 70, 0.3);",
          buttonText: "color: #ecfdf5; font-weight: 600;",
          accentColor: "#34d399"
        },
        lightForest: {
          bg: "background: linear-gradient(to bottom right, #ecfdf5, #fafaf9, #ffffff);",
          buttonBg: "background-color: #ffffff; border: 1px solid #d1fae5;",
          buttonText: "color: #064e3b; font-weight: 600;",
          accentColor: "#059669"
        },
        royal: {
          bg: "background: linear-gradient(to bottom, #0f172a, #172554, #000000);",
          buttonBg: "background-color: rgba(23, 37, 84, 0.35); border: 1px solid rgba(30, 58, 138, 0.3);",
          buttonText: "color: #eff6ff; font-weight: 600;",
          accentColor: "#60a5fa"
        }
      };

      const selectedTheme = THEMES[themeName] || THEMES.slate;

      // Handle custom backgrounds
      let bodyBgStyle = selectedTheme.bg;
      if (linkTree?.treeBgImage) {
        bodyBgStyle = `background-image: url(${linkTree.treeBgImage}); background-size: cover; background-position: center; background-repeat: no-repeat; background-attachment: fixed;`;
      }

      // Button customization
      const btnStyleKey = linkTree?.treeButtonStyle || "classic";
      let btnRadiusClass = "rounded-2xl";
      let customBtnBgStyle = selectedTheme.buttonBg;
      let fontClass = "font-semibold";

      if (btnStyleKey === "pill") {
        btnRadiusClass = "rounded-full";
      } else if (btnStyleKey === "outline") {
        btnRadiusClass = "rounded-full";
        customBtnBgStyle = `background-color: transparent !important; border: 1.5px solid ${selectedTheme.accentColor} !important; color: ${selectedTheme.accentColor} !important;`;
      } else if (btnStyleKey === "brutalist") {
        btnRadiusClass = "rounded-none";
        customBtnBgStyle = `background-color: ${selectedTheme.accentColor} !important; border: 2px solid #09090b !important; color: #09090b !important; box-shadow: 4px 4px 0px 0px rgba(0,0,0,1);`;
        fontClass = "font-black tracking-wide";
      } else if (btnStyleKey === "glass") {
        btnRadiusClass = "rounded-2xl";
        customBtnBgStyle = "background-color: rgba(255, 255, 255, 0.1) !important; border: 1px solid rgba(255, 255, 255, 0.2) !important; backdrop-filter: blur(12px); color: #ffffff !important;";
      } else if (btnStyleKey === "soft-hover") {
        btnRadiusClass = "rounded-xl";
        customBtnBgStyle = `background-color: rgba(251, 146, 60, 0.1) !important; color: ${selectedTheme.accentColor} !important; border: none !important;`;
      }

      if (linkTree?.treeButtonBgImage) {
        customBtnBgStyle = `background-image: url(${linkTree.treeButtonBgImage}); background-size: cover; background-position: center; color: #ffffff !important; font-weight: 900 !important; text-shadow: 0px 1.5px 2.5px rgba(0,0,0,0.85);`;
        fontClass = "font-black tracking-wide";
      }

      // Social Icons
      let socialIconsHtml = "";
      const socialPlatforms = [
        { key: "treeInstagram", url: "https://instagram.com/", label: "Instagram", svg: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>` },
        { key: "treeTwitter", url: "https://twitter.com/", label: "Twitter", svg: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></svg>` },
        { key: "treeLinkedIn", url: "https://linkedin.com/in/", label: "LinkedIn", svg: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>` },
        { key: "treeYoutube", url: "https://youtube.com/@", label: "YouTube", svg: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>` },
        { key: "treeGithub", url: "https://github.com/", label: "GitHub", svg: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>` }
      ];

      for (const platform of socialPlatforms) {
        const val = linkTree ? (linkTree as any)[platform.key] : "";
        if (val) {
          const finalUrl = val.startsWith("http") ? val : `${platform.url}${val.replace("@", "")}`;
          socialIconsHtml += `
            <a href="${finalUrl}" target="_blank" rel="noreferrer" class="text-zinc-400 hover:scale-110 transition-all p-2 bg-zinc-900/45 border border-zinc-800 rounded-full w-10 h-10 flex items-center justify-center hover:border-brand-500/20">
              ${platform.svg}
            </a>
          `;
        }
      }

      // Embedded Video
      let videoHtml = "";
      if (linkTree?.treeVideoUrl) {
        const embedUrl = getYouTubeEmbedUrl(linkTree.treeVideoUrl);
        if (embedUrl) {
          videoHtml = `
            <div class="w-full my-4 rounded-3xl overflow-hidden border border-zinc-500/10 shadow-lg bg-zinc-950/45 aspect-video hover:border-zinc-500/25 transition-all">
              <iframe src="${embedUrl}" class="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
          `;
        }
      }

      // Folders/Collections rendering and links rendering
      let linksListHtml = "";
      const showFolders = linkTree?.treeShowFolders !== false;

      // Track link IDs already shown in folders to avoid duplicate rendering if flat list is rendered
      const folderLinkIds = new Set<string>();

      if (showFolders) {
        for (const col of collections) {
          const colLinkIds = col.links ? col.links.map((l: any) => l.id) : [];
          const linksInFolder = activeLinks.filter((l: any) => colLinkIds.includes(l.id));
          if (linksInFolder.length > 0) {
            colLinkIds.forEach((id: string) => folderLinkIds.add(id));

            let folderLinksHtml = "";
            for (const link of linksInFolder) {
              const shortUrl = `/${link.shortSlug}`;
              folderLinksHtml += `
                <a href="${shortUrl}" class="block w-full py-3.5 px-5 transition-all duration-300 transform hover:-translate-y-0.5 flex justify-between items-center bg-opacity-80 backdrop-blur-sm ${btnRadiusClass}" style="${customBtnBgStyle}">
                  <span class="w-4"></span>
                  <span class="${fontClass}">${link.title || link.shortSlug}</span>
                  <svg class="w-4 h-4 opacity-70 hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polygon><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
              `;
            }

            linksListHtml += `
              <div class="w-full space-y-2">
                <button onclick="toggleFolder('${col.id}')" class="w-full py-4 px-6 transition-all duration-300 flex justify-between items-center group relative overflow-hidden cursor-pointer border ${btnRadiusClass}" style="${customBtnBgStyle}">
                  <div class="flex items-center gap-3">
                    <svg id="icon-closed-${col.id}" class="w-5 h-5 text-zinc-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    <svg id="icon-open-${col.id}" class="w-5 h-5 text-zinc-400 shrink-0 hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><path d="M2 10h20"></path></svg>
                    <span class="${fontClass}">${col.name}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] uppercase tracking-wider opacity-60 font-bold shrink-0">${linksInFolder.length} tautan</span>
                    <svg id="arrow-${col.id}" class="w-4 h-4 transition-all duration-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </button>
                <div id="folder-${col.id}" class="w-full pl-4 pr-1 space-y-2 border-l-2 border-dashed border-zinc-500/30 overflow-hidden hidden">
                  ${folderLinksHtml}
                </div>
              </div>
            `;
          }
        }
      }

      // Render Flat links
      const flatLinks = activeLinks.filter((l: any) => !folderLinkIds.has(l.id));
      for (const link of flatLinks) {
        const shortUrl = `/${link.shortSlug}`;
        linksListHtml += `
          <a href="${shortUrl}" class="block w-full py-4 px-6 transition-all duration-300 transform hover:-translate-y-0.5 flex justify-between items-center border ${btnRadiusClass}" style="${customBtnBgStyle}">
            <span class="w-4"></span>
            <span class="${fontClass}">${link.title || link.shortSlug}</span>
            <svg class="w-4 h-4 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polygon><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          </a>
        `;
      }

      const avatarHtml = linkTree?.treeAvatar 
        ? `<img src="${linkTree.treeAvatar}" alt="${linkTree.treeTitle || "Bio"}" class="w-full h-full object-cover rounded-full" />`
        : `<svg class="w-8 h-8 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;

      const title = linkTree?.treeTitle || userObj?.name || "Tautan Saya";
      const bio = linkTree?.treeBio || "Selamat datang di Link Tree kustom saya!";

      const responseHtml = `
        <!DOCTYPE html>
        <html lang="id">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                margin: 0;
                padding: 0;
                ${bodyBgStyle}
              }
              .theme-accent {
                color: ${selectedTheme.accentColor};
              }
            </style>
          </head>
          <body class="min-h-screen py-16 px-4 flex flex-col items-center justify-start text-zinc-100">
            <div class="w-full max-w-md flex flex-col items-center text-center space-y-8">
              <!-- Avatar Frame -->
              <div class="w-24 h-24 rounded-full border border-zinc-500/25 p-1 bg-zinc-900/60 shadow-xl overflow-hidden flex items-center justify-center">
                ${avatarHtml}
              </div>

              <!-- User Bio -->
              <div class="space-y-2">
                <h1 class="text-2xl font-extrabold tracking-tight" style="color: ${selectedTheme.accentColor || '#ffffff'};">${title}</h1>
                <p class="text-xs opacity-70 font-mono tracking-wide max-w-xs mx-auto leading-relaxed">${bio}</p>
              </div>

              <!-- Social Icons -->
              <div class="flex items-center justify-center gap-3.5 py-1.5 flex-wrap">
                ${socialIconsHtml}
              </div>

              <!-- Embedded Video -->
              ${videoHtml}

              <!-- Render Links List -->
              <div class="w-full space-y-4">
                ${linksListHtml}
              </div>
            </div>

            <script>
              function toggleFolder(colId) {
                const folderEl = document.getElementById('folder-' + colId);
                const arrowEl = document.getElementById('arrow-' + colId);
                const iconOpen = document.getElementById('icon-open-' + colId);
                const iconClosed = document.getElementById('icon-closed-' + colId);
                
                if (folderEl.classList.contains('hidden')) {
                  folderEl.classList.remove('hidden');
                  if (arrowEl) arrowEl.style.transform = 'rotate(180deg)';
                  if (iconOpen) iconOpen.classList.remove('hidden');
                  if (iconClosed) iconClosed.classList.add('hidden');
                } else {
                  folderEl.classList.add('hidden');
                  if (arrowEl) arrowEl.style.transform = 'rotate(0deg)';
                  if (iconOpen) iconOpen.classList.add('hidden');
                  if (iconClosed) iconClosed.classList.remove('hidden');
                }
              }
            </script>
          </body>
        </html>
      `;

      res.setHeader("Content-Type", "text/html");
      return res.send(responseHtml);
    } catch (err: any) {
      console.error("servePublicBioTree failed:", err);
      return res.status(500).send("Internal Server Error");
    }
  }

  // Redirection Logic using Prisma
  async function handleRedirection(req: any, res: any, next?: any) {
    const { slug } = req.params;
    const { p, c } = req.query; // p is password, c is continue

    if (!slug || slug.includes(".") || ["api", "tree", "lt", "t", "@", "node_modules", "src", "vite", "assets", "favicon", "public", "index", "robots.txt"].some(pref => slug.startsWith(pref))) {
      if (next) {
        return next();
      } else {
        return res.status(404).send("Not Found");
      }
    }

    try {
      const linkData = await prisma.link.findUnique({
        where: { shortSlug: slug }
      });

      if (!linkData) {
        if (next) {
          return next();
        }
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Tautan Tidak Ditemukan</title>
              <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body class="bg-black text-white min-h-screen flex items-center justify-center p-4 font-sans">
              <div class="text-center space-y-4">
                <h1 class="text-4xl font-extrabold text-brand-500">404</h1>
                <p class="text-zinc-400">Oops! Tautan ini tidak dapat ditemukan.</p>
                <a href="/" class="inline-block px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-all font-medium">Dashboard</a>
              </div>
            </body>
          </html>
        `);
      }

      if (linkData.isEnabled === false) {
        return res.status(403).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Tautan Dinonaktifkan - Linkly</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
              <style>
                body { font-family: 'Inter', sans-serif; background-color: #0a0a0a; color: #f4f4f5; }
              </style>
            </head>
            <body class="min-h-screen flex items-center justify-center p-4">
              <div class="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
                <div class="inline-flex items-center justify-center w-14 h-14 bg-zinc-950 text-amber-500 rounded-2xl mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/></svg>
                </div>
                <div class="space-y-2">
                  <h1 class="text-2xl font-bold tracking-tight">Tautan Dinonaktifkan</h1>
                  <p class="text-sm text-zinc-400">Tautan ini sedang tidak aktif atau sengaja dinonaktifkan oleh pemiliknya.</p>
                </div>
                <p class="text-xs text-zinc-600">Didukung oleh <span class="text-zinc-500 font-semibold">Linkly SaaS</span></p>
              </div>
            </body>
          </html>
        `);
      }

      if (linkData.activatedAt) {
        const activatedAt = new Date(linkData.activatedAt);
        if (activatedAt > new Date()) {
          const options: Intl.DateTimeFormatOptions = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
          };
          const formattedDate = activatedAt.toLocaleDateString('id-ID', options);
          return res.status(403).send(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <title>Tautan Belum Aktif - Linkly</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <style>
                  body { font-family: 'Inter', sans-serif; background-color: #0a0a0a; color: #f4f4f5; }
                </style>
              </head>
              <body class="min-h-screen flex items-center justify-center p-4">
                <div class="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
                  <div class="inline-flex items-center justify-center w-14 h-14 bg-zinc-950 text-blue-500 rounded-2xl mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                  </div>
                  <div class="space-y-2">
                    <h1 class="text-2xl font-bold tracking-tight">Tautan Belum Aktif</h1>
                    <p class="text-sm text-zinc-400">Tautan ini dikonfigurasi untuk mulai aktif pada:</p>
                    <p class="text-md font-semibold text-blue-400 bg-zinc-950/50 py-2 px-4 rounded-xl border border-zinc-800/50 inline-block">${formattedDate}</p>
                  </div>
                  <p class="text-xs text-zinc-600">Didukung oleh <span class="text-zinc-500 font-semibold">Linkly</span></p>
                </div>
              </body>
            </html>
          `);
        }
      }

      if (linkData.expiresAt) {
        const expiresAt = new Date(linkData.expiresAt);
        if (expiresAt < new Date()) {
          return res.status(410).send(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <title>Tautan Kedaluwarsa</title>
                <script src="https://cdn.tailwindcss.com"></script>
              </head>
              <body class="bg-black text-white min-h-screen flex items-center justify-center p-4 font-sans">
                <div class="text-center space-y-4">
                  <h1 class="text-4xl font-extrabold text-red-500">410</h1>
                  <p class="text-zinc-400">Tautan ini telah kedaluwarsa.</p>
                  <p class="text-xs text-zinc-600">Sandi/Pembatasan kedaluwarsa diaktifkan oleh pembuat tautan.</p>
                </div>
              </body>
            </html>
          `);
        }
      }

      if (linkData.password && linkData.password !== "") {
        if (!p || p !== linkData.password) {
          const isError = !!p;
          return res.send(`
            <!DOCTYPE html>
            <html lang="id">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Tautan Terproteksi - Linkly</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
              <style>
                body { font-family: 'Inter', sans-serif; background-color: #0a0a0a; color: #f4f4f5; }
              </style>
            </head>
            <body class="min-h-screen flex items-center justify-center p-4">
              <div class="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
                <div class="inline-flex items-center justify-center w-14 h-14 bg-brand-500/10 text-brand-500 rounded-2xl mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <div class="space-y-2">
                  <h1 class="text-2xl font-bold tracking-tight">Tautan Terproteksi</h1>
                  <p class="text-sm text-zinc-400">Tautan ini memerlukan kata sandi untuk dapat diakses.</p>
                </div>

                ${isError ? `<div class="bg-red-500/10 border border-red-500/20 text-red-400 text-sm py-3 px-4 rounded-xl font-medium">Kata sandi salah. Silakan coba lagi.</div>` : ""}

                <form method="GET" class="space-y-4">
                  <input type="password" name="p" required placeholder="Masukkan kata sandi..." class="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-center focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-white font-mono placeholder:text-zinc-600">
                  ${c ? `<input type="hidden" name="c" value="${c}">` : ""}
                  <button type="submit" class="w-full bg-brand-500 text-black font-bold py-3 px-4 rounded-xl hover:bg-brand-400 transition-colors shadow-lg shadow-brand-500/10">
                    Buka Tautan
                  </button>
                </form>
                <p class="text-xs text-zinc-600">Didukung oleh <span class="text-zinc-500 font-semibold">Linkly</span></p>
              </div>
            </body>
            </html>
          `);
        }
      }

      // Log traffic statistics
      const clickId = generateId(14);
      try {
        const ip = getClientIp(req);
        const geo = await getGeoLocation(ip, req.headers);
        const ua = parseUserAgent(req.headers["user-agent"]);
        const referrer = (req.headers["referer"] || req.headers["referrer"] || "Direct") as string;
        const isQrScan = req.query.qr === "1" || req.query.source === "qr" || req.query.qr === "true";

        await prisma.link.update({
          where: { id: linkData.id },
          data: {
            clickCount: { increment: 1 },
            qrScanCount: isQrScan ? { increment: 1 } : undefined
          }
        });

        await prisma.click.create({
          data: {
            id: clickId,
            linkId: linkData.id,
            userId: linkData.userId,
            timestamp: new Date(),
            shortSlug: slug,
            title: linkData.title || linkData.originalUrl,
            ip,
            country: geo.country,
            region: geo.region,
            city: geo.city,
            device: ua.device,
            os: ua.os,
            browser: ua.browser,
            referrer,
            isQrScan: !!isQrScan
          }
        });
      } catch (clickErr) {
        console.error("Failed to log statistics:", clickErr);
      }

      if (linkData.landingEnabled && c !== "true") {
        return res.send(`
          <!DOCTYPE html>
          <html lang="id">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${linkData.title || slug} - Info Portal</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
            <style>
              body { font-family: 'Inter', sans-serif; background-color: #0a0a0a; color: #f4f4f5; }
            </style>
          </head>
          <body class="min-h-screen flex items-center justify-center p-4">
            <div class="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden space-y-8">
              <div class="absolute -top-40 -left-40 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div class="absolute -bottom-40 -right-40 w-80 h-80 bg-brand-500/5 rounded-full blur-3xl pointer-events-none"></div>

              <div class="flex flex-col items-center text-center space-y-4 relative z-10">
                <div class="w-20 h-20 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden p-2">
                  ${linkData.landingAvatar ? `
                    <img src="${linkData.landingAvatar}" alt="Logo" class="w-full h-full object-contain rounded-xl">
                  ` : `
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#F97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                  `}
                </div>
                <div class="space-y-2">
                  <h1 class="text-3xl font-extrabold tracking-tight text-white">${linkData.title || slug}</h1>
                  <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-mono">
                    /${slug}
                  </div>
                </div>
                
                <p class="text-zinc-400 max-w-sm mt-2 text-sm leading-relaxed">
                  ${linkData.landingDescription || "Selamat datang! Anda akan diarahkan ke tujuan tautan eksternal yang aman."}
                </p>
              </div>

              <div class="space-y-4 relative z-10">
                <div class="bg-zinc-950 border border-zinc-800/85 rounded-2xl p-4 flex items-center gap-3">
                  <div class="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-500 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs text-zinc-500 font-medium uppercase tracking-wider">Tautan Tujuan</p>
                    <p class="text-sm font-mono text-zinc-300 truncate">${linkData.originalUrl}</p>
                  </div>
                </div>

                <a href="/${slug}?c=true${p ? `&p=${encodeURIComponent(p as string)}` : ""}" class="flex items-center justify-center gap-2 w-full bg-brand-500 hover:bg-brand-400 text-black font-extrabold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transform hover:-translate-y-0.5 text-lg">
                  Lanjutkan ke Website
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </a>
              </div>

              <div class="text-center pt-2 border-t border-zinc-800/40 relative z-10">
                <p class="text-xs text-zinc-600">Didukung oleh <strong class="text-zinc-500">Linkly SaaS Portal</strong></p>
              </div>
            </div>
          </body>
          </html>
        `);
      }

      res.redirect(linkData.originalUrl);
    } catch (error) {
      console.error("Redirection error:", error);
      res.status(500).send("Internal Server Error");
    }
  }

  // Public Bio Linktree server-side rendering
  app.get("/tree/:id", servePublicBioTree);
  app.get("/lt/:id", servePublicBioTree);
  app.get("/t/:id", servePublicBioTree);

  // Redirection routes
  app.get("/r/:slug", handleRedirection);
  app.get("/:slug", handleRedirection);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}

export { startServer };

if (!process.env.VERCEL) {
  startServer();
}
