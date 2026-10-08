-- Bio pages move from a link join table to ordered JSON blocks, and gain design, floating elements and SEO fields.
ALTER TABLE "BioPage"
  ADD COLUMN "showBranding" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "design" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "blocks" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "floaters" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "seoTitle" TEXT,
  ADD COLUMN "seoDescription" TEXT,
  ADD COLUMN "ogImageUrl" TEXT;

UPDATE "BioPage" p
SET "blocks" = COALESCE(
  (SELECT jsonb_agg(
            jsonb_build_object('type', 'link', 'id', left(md5(l."linkId"), 12), 'linkId', l."linkId", 'highlight', false)
            ORDER BY l."position")
   FROM "BioLink" l
   WHERE l."pageId" = p."userId"),
  '[]'::jsonb);

UPDATE "BioPage"
SET "blocks" = jsonb_build_array(jsonb_build_object('type', 'video', 'id', 'legacyvideo', 'url', "videoUrl")) || "blocks"
WHERE "videoUrl" IS NOT NULL AND "videoUrl" <> '';

UPDATE "BioPage"
SET "design" = jsonb_build_object('background', jsonb_build_object('type', 'image', 'imageUrl', "bgImageUrl", 'dim', 0))
WHERE "bgImageUrl" IS NOT NULL AND "bgImageUrl" <> '';

DROP TABLE "BioLink";
ALTER TABLE "BioPage" DROP COLUMN "videoUrl", DROP COLUMN "bgImageUrl";
