-- PostgreSQL Database Initialization Script for Link Shortener Application

-- Clean up existing tables (with cascade to clean up dependencies in order)
DROP TABLE IF EXISTS "GlobalSettings" CASCADE;
DROP TABLE IF EXISTS "LinkTree" CASCADE;
DROP TABLE IF EXISTS "Click" CASCADE;
DROP TABLE IF EXISTS "Link" CASCADE;
DROP TABLE IF EXISTS "Collection" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- 1. Create User table
CREATE TABLE "User" (
    "id" VARCHAR(255) PRIMARY KEY,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "name" VARCHAR(255),
    "avatar" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Create Collection table
CREATE TABLE "Collection" (
    "id" VARCHAR(255) PRIMARY KEY,
    "userId" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "Collection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- Create Index on Collection.userId for faster relationship queries
CREATE INDEX "Collection_userId_idx" ON "Collection"("userId");

-- 3. Create Link table
CREATE TABLE "Link" (
    "id" VARCHAR(255) PRIMARY KEY,
    "userId" VARCHAR(255) NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "shortSlug" VARCHAR(255) UNIQUE NOT NULL,
    "customDomain" VARCHAR(255),
    "clickCount" INTEGER DEFAULT 0 NOT NULL,
    "qrScanCount" INTEGER DEFAULT 0 NOT NULL,
    "collectionId" VARCHAR(255),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" TIMESTAMP WITH TIME ZONE,
    "title" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255),
    "landingEnabled" BOOLEAN DEFAULT FALSE NOT NULL,
    "landingDescription" TEXT,
    "landingAvatar" TEXT,
    "isEnabled" BOOLEAN DEFAULT TRUE NOT NULL,
    "category" VARCHAR(100),
    CONSTRAINT "Link_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE,
    CONSTRAINT "Link_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE SET NULL
);

-- Create Indexes on Link table
CREATE INDEX "Link_userId_idx" ON "Link"("userId");
CREATE INDEX "Link_collectionId_idx" ON "Link"("collectionId");

-- 4. Create Click table
CREATE TABLE "Click" (
    "id" VARCHAR(255) PRIMARY KEY,
    "linkId" VARCHAR(255) NOT NULL,
    "userId" VARCHAR(255) NOT NULL,
    "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "shortSlug" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "ip" VARCHAR(45),
    "country" VARCHAR(100),
    "region" VARCHAR(100),
    "city" VARCHAR(100),
    "device" VARCHAR(50),
    "os" VARCHAR(50),
    "browser" VARCHAR(50),
    "referrer" TEXT,
    "isQrScan" BOOLEAN DEFAULT FALSE NOT NULL,
    CONSTRAINT "Click_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link" ("id") ON DELETE CASCADE,
    CONSTRAINT "Click_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- Create Indexes on Click table
CREATE INDEX "Click_linkId_idx" ON "Click"("linkId");
CREATE INDEX "Click_userId_idx" ON "Click"("userId");

-- 5. Create LinkTree table
CREATE TABLE "LinkTree" (
    "id" VARCHAR(255) PRIMARY KEY, -- acts as userId and primary key
    "treeTitle" VARCHAR(255) NOT NULL,
    "treeBio" TEXT,
    "treeAvatar" TEXT,
    "treeTheme" VARCHAR(50) DEFAULT 'slate' NOT NULL,
    "treeLinks" TEXT DEFAULT '[]' NOT NULL, -- JSON formatted string
    "treeBgImage" TEXT,
    "treeButtonStyle" VARCHAR(50) DEFAULT 'classic' NOT NULL,
    "treeInstagram" VARCHAR(255),
    "treeTwitter" VARCHAR(255),
    "treeLinkedIn" VARCHAR(255),
    "treeYoutube" VARCHAR(255),
    "treeGithub" VARCHAR(255),
    "treeVideoUrl" TEXT,
    "treeButtonBgImage" TEXT,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "LinkTree_id_fkey" FOREIGN KEY ("id") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- 6. Create GlobalSettings table
CREATE TABLE "GlobalSettings" (
    "id" VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    "registrationEnabled" BOOLEAN DEFAULT TRUE NOT NULL
);

-- Insert default settings row if not present
INSERT INTO "GlobalSettings" ("id", "registrationEnabled")
VALUES ('default', TRUE)
ON CONFLICT ("id") DO NOTHING;
