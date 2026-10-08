import dotenv from "dotenv";
import { randomBytes } from "node:crypto";

dotenv.config();

function buildDatabaseUrl(): string | undefined {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const { SQL_USER: user, SQL_PASSWORD: password = "", SQL_DB_NAME: dbName, SQL_HOST: host } = process.env;
  if (!user || !dbName) return undefined;
  const auth = `${encodeURIComponent(user)}:${encodeURIComponent(password)}`;
  if (host?.startsWith("/")) {
    return `postgresql://${auth}@localhost/${dbName}?host=${encodeURIComponent(host)}`;
  }
  return `postgresql://${auth}@${host || "127.0.0.1"}/${dbName}`;
}

const databaseUrl = buildDatabaseUrl();
if (databaseUrl) process.env.DATABASE_URL = databaseUrl;

const isProd = process.env.NODE_ENV === "production";

let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  if (isProd) throw new Error("SESSION_SECRET is required in production.");
  sessionSecret = randomBytes(32).toString("hex");
  console.warn("SESSION_SECRET is not set. Using a throwaway secret: sessions reset on every restart.");
}

export const env = {
  isProd,
  port: Number(process.env.PORT) || 3000,
  databaseUrl,
  sessionSecret,
  appUrl: process.env.APP_URL?.replace(/\/$/, ""),
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  adminEmails: (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
};
