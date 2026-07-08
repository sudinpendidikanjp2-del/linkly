import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  console.log("=================================================");
  console.log("   Running SQL DDL Table Initialization...");
  console.log("=================================================");

  const dbUrl = getDatabaseUrl();
  console.log(`Connecting to: ${dbUrl.replace(/:[^:@]+@/, ":****@")}`);

  // Create prisma instance with the calculated URL
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

  try {
    const sqlPath = path.join(__dirname, "init-db.sql");
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`SQL initialization script not found at path: ${sqlPath}`);
    }

    console.log(`Reading SQL script from: ${sqlPath}`);
    const rawSql = fs.readFileSync(sqlPath, "utf-8");

    // We can execute the whole SQL block using $executeRawUnsafe
    console.log("Executing SQL statements on database...");
    await prisma.$executeRawUnsafe(rawSql);

    console.log("Database tables initialized successfully! 🎉");
  } catch (error) {
    console.error("❌ SQL Table initialization failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
