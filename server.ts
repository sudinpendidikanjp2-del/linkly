import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { exec, execSync } from "child_process";
import fs from "fs";

dotenv.config();

let prisma: any;
let resetPrisma: any;
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
          await runCommandAsync("npx prisma db push --accept-data-loss", {
            env: { ...process.env, DATABASE_URL: dbUrl },
          });
          
          console.log("Database schema synchronized successfully on PostgreSQL.");
          process.env.DATABASE_URL = dbUrl;
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
    }

    // Dynamically import prisma so that the correct compiled client in memory is loaded as early as possible
    try {
      const prismaModule = await import("./src/prisma.js");
      prisma = prismaModule.prisma;
      resetPrisma = prismaModule.resetPrisma;
      if (resetPrisma) {
        resetPrisma();
      }
      console.log("Prisma client dynamic import completed successfully.");
    } catch (importError) {
      console.error("Failed to dynamically import Prisma module:", importError);
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

  // API endpoint to generate metadata using Gemini
  app.post("/api/generate-metadata", async (req, res) => {
    const { originalUrl } = req.body;

    if (!originalUrl || typeof originalUrl !== "string") {
      return res.status(400).json({ error: "Original URL is required and must be a string." });
    }

    try {
      const ai = getGeminiClient();
      const prompt = `Analyze this URL and generate an appropriate metadata title and meta description: "${originalUrl}". Your response should be tailored specifically to the nature of this website.`;

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
      console.error("Gemini metadata generation failed:", err);
      return res.status(500).json({
        error: "Gagal membuat metadata otomatis menggunakan AI.",
        details: err?.message || String(err)
      });
    }
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

      } else if (collection === "test") {
        return res.json([{ id: "connection", status: "connected" }]);
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
        return res.json({
          ...item,
          treeLinks: JSON.parse(item.treeLinks)
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
        const item = await prisma.user.upsert({
          where: { id },
          update: {
            email: data.email,
            name: data.displayName,
            avatar: data.photoURL
          },
          create: {
            id,
            email: data.email,
            name: data.displayName,
            avatar: data.photoURL
          }
        });
        return res.json(item);

      } else if (collection === "links") {
        const payload: any = {
          userId: data.userId,
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
        if (data.expiresAt) payload.expiresAt = new Date(data.expiresAt);
        if (data.createdAt) payload.createdAt = new Date(data.createdAt);

        const item = await prisma.link.upsert({
          where: { id },
          update: payload,
          create: { id, ...payload }
        });
        return res.json(item);

      } else if (collection === "link_trees") {
        const payload: any = {
          treeTitle: data.treeTitle || "",
          treeBio: data.treeBio || "",
          treeAvatar: data.treeAvatar || "",
          treeTheme: data.treeTheme || "slate",
          treeLinks: JSON.stringify(data.treeLinks || []),
          treeBgImage: data.treeBgImage || null,
          treeButtonStyle: data.treeButtonStyle || "classic",
          treeInstagram: data.treeInstagram || null,
          treeTwitter: data.treeTwitter || null,
          treeLinkedIn: data.treeLinkedIn || null,
          treeYoutube: data.treeYoutube || null,
          treeGithub: data.treeGithub || null,
          treeVideoUrl: data.treeVideoUrl || null,
          treeButtonBgImage: data.treeButtonBgImage || null,
          updatedAt: new Date()
        };

        const item = await prisma.linkTree.upsert({
          where: { id },
          update: payload,
          create: { id, ...payload }
        });
        return res.json(item);

      } else if (collection === "collections") {
        const payload: any = {
          userId: data.userId,
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
