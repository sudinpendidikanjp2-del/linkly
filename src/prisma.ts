import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// Dynamically construct database URL from SQL environment variables for PostgreSQL if not defined
if (!process.env.DATABASE_URL) {
  const user = process.env.SQL_USER;
  const password = process.env.SQL_PASSWORD;
  const dbName = process.env.SQL_DB_NAME;
  const host = process.env.SQL_HOST;

  if (user && dbName) {
    if (host && (host.startsWith("/") || host.includes("/cloudsql"))) {
      const encodedHost = encodeURIComponent(host);
      process.env.DATABASE_URL = `postgresql://${user}:${password || ""}@localhost/${dbName}?host=${encodedHost}`;
    } else {
      process.env.DATABASE_URL = `postgresql://${user}:${password || ""}@${host || "127.0.0.1"}/${dbName}`;
    }
  } else {
    // Detect provider from schema.prisma to avoid invalid URL schema matches
    let provider = "postgresql";
    try {
      const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
      if (fs.existsSync(schemaPath)) {
        const schemaContent = fs.readFileSync(schemaPath, "utf-8");
        const match = schemaContent.match(/provider\s*=\s*"([^"]+)"/);
        if (match) {
          provider = match[1];
        }
      }
    } catch (e) {
      // Ignore
    }

    if (provider === "sqlite") {
      process.env.DATABASE_URL = "file:./dev.db";
    } else {
      // Default fallback (e.g. local PostgreSQL)
      process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/postgres";
    }
  }
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | null };

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: ["error"],
    });
  }
  return globalForPrisma.prisma;
}

export function resetPrisma(): void {
  globalForPrisma.prisma = null;
}

// Proxy to allow existing imports of prisma to continue working seamlessly
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const instance = getPrisma();
    const value = (instance as any)[prop];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});

