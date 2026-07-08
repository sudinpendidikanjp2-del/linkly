import { execSync } from "child_process";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

// Load existing environment variables
dotenv.config();

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const user = process.env.SQL_USER;
  const password = process.env.SQL_PASSWORD;
  const dbName = process.env.SQL_DB_NAME;
  const host = process.env.SQL_HOST;

  if (user && dbName) {
    if (host && (host.startsWith("/") || host.includes("/cloudsql"))) {
      const encodedHost = encodeURIComponent(host);
      return `postgresql://${user}:${password || ""}@localhost/${dbName}?host=${encodedHost}`;
    } else {
      return `postgresql://${user}:${password || ""}@${host || "127.0.0.1"}/${dbName}`;
    }
  }

  // Fallback to local development PostgreSQL default
  return "postgresql://postgres:postgres@localhost:5432/postgres";
}

async function main() {
  const dbUrl = getDatabaseUrl();
  console.log("Initializing PostgreSQL database...");
  console.log(`Using Database Target: ${dbUrl.replace(/:[^:@]+@/, ":****@")}`); // Redact password in output

  // Set the environment variable so child processes see it
  process.env.DATABASE_URL = dbUrl;

  try {
    console.log("Step 1: Generating Prisma Client...");
    execSync("npx prisma generate", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: dbUrl }
    });

    console.log("Step 2: Pushing database schema...");
    execSync("npx prisma db push --accept-data-loss", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: dbUrl }
    });

    console.log("Step 3: Initializing default settings and data...");
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });

    // Check if GlobalSettings 'default' exists
    const settings = await prisma.globalSettings.findUnique({
      where: { id: "default" }
    });

    if (!settings) {
      await prisma.globalSettings.create({
        data: {
          id: "default",
          registrationEnabled: true
        }
      });
      console.log("-> Created default global settings.");
    } else {
      console.log("-> Global settings already exist.");
    }

    await prisma.$disconnect();
    console.log("PostgreSQL database initialization completed successfully! 🎉");
  } catch (error) {
    console.error("Initialization failed:", error);
    process.exit(1);
  }
}

main();
