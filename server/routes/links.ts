import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { asyncHandler, HttpError, param, parse, queryString } from "../lib/http";
import { hashPassword } from "../lib/crypto";
import { generateSlug } from "../lib/slug";
import { toLinkDTO } from "../lib/dto";
import { fetchPageTitle } from "../lib/safe-fetch";
import {
  bulkActionSchema,
  bulkImportSchema,
  createLinkSchema,
  normalizeUrl,
  slugField,
  updateLinkSchema,
  urlField,
} from "../../src/shared/schemas";
import type { BulkImportResultDTO, LinkListDTO } from "../../src/shared/types";
import { buildLinkAnalytics } from "./analytics";

export const linksRouter = Router();

const include = { collection: { select: { name: true } } } as const;

async function requireOwnedLink(userId: string, id: string) {
  const link = await prisma.link.findFirst({ where: { id, userId }, include });
  if (!link) throw new HttpError(404, "not_found", "Link not found.");
  return link;
}

async function assertOwnedCollection(userId: string, collectionId: string | null | undefined) {
  if (!collectionId) return;
  const owned = await prisma.collection.count({ where: { id: collectionId, userId } });
  if (!owned) throw new HttpError(400, "invalid_collection", "Collection not found.", { collectionId: "invalid_collection" });
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002";
}

async function createWithFreshSlug(build: (slug: string) => Prisma.LinkUncheckedCreateInput, requested?: string) {
  if (requested) {
    try {
      return await prisma.link.create({ data: build(requested), include });
    } catch (error) {
      if (isUniqueViolation(error)) throw new HttpError(409, "slug_taken", "This short link is already in use.", { slug: "slug_taken" });
      throw error;
    }
  }
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      return await prisma.link.create({ data: build(generateSlug(attempt < 3 ? 6 : 8)), include });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
  }
  throw new HttpError(503, "slug_exhausted", "Could not allocate a short link. Try again.");
}

linksRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const page = Math.max(1, Number(queryString(req.query.page)) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(queryString(req.query.pageSize)) || 10));
    const search = queryString(req.query.search)?.trim();
    const status = queryString(req.query.status);
    const collectionId = queryString(req.query.collectionId);
    const protectedOnly = queryString(req.query.protected);
    const sort = queryString(req.query.sort);
    const order = queryString(req.query.order) === "asc" ? "asc" : "desc";
    const now = new Date();

    const and: Prisma.LinkWhereInput[] = [{ userId }];
    if (search) {
      and.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { originalUrl: { contains: search, mode: "insensitive" } },
          { slug: { contains: search.toLowerCase() } },
        ],
      });
    }
    if (collectionId === "none") and.push({ collectionId: null });
    else if (collectionId) and.push({ collectionId });
    if (protectedOnly === "yes") and.push({ passwordHash: { not: null } });
    if (protectedOnly === "no") and.push({ passwordHash: null });
    if (status === "disabled") and.push({ isEnabled: false });
    if (status === "expired") and.push({ isEnabled: true, expiresAt: { lte: now } });
    if (status === "scheduled") and.push({ isEnabled: true, startsAt: { gt: now } });
    if (status === "active") {
      and.push({
        isEnabled: true,
        AND: [
          { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        ],
      });
    }
    const where: Prisma.LinkWhereInput = { AND: and };

    const orderBy: Prisma.LinkOrderByWithRelationInput =
      sort === "clicks" ? { clickCount: order } : sort === "title" ? { title: order } : { createdAt: order };

    const [total, items] = await Promise.all([
      prisma.link.count({ where }),
      prisma.link.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize, include }),
    ]);

    const body: LinkListDTO = {
      items: items.map(toLinkDTO),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
    res.json(body);
  }),
);

linksRouter.get(
  "/slug-available",
  asyncHandler(async (req, res) => {
    const parsed = slugField.safeParse(queryString(req.query.slug) ?? "");
    if (!parsed.success) return res.json({ available: false, reason: parsed.error.issues[0]?.message ?? "invalid_slug" });
    const exceptId = queryString(req.query.exceptId);
    const existing = await prisma.link.findUnique({ where: { slug: parsed.data }, select: { id: true } });
    const available = !existing || existing.id === exceptId;
    res.json({ available, reason: available ? null : "slug_taken" });
  }),
);

linksRouter.post(
  "/metadata",
  asyncHandler(async (req, res) => {
    const url = parse(urlField, (req.body as { url?: string })?.url ?? "");
    let title: string | null = null;
    try {
      title = await fetchPageTitle(url);
    } catch {
      title = null;
    }
    res.json({ title: title ?? new URL(url).hostname.replace(/^www\./, "") });
  }),
);

linksRouter.get(
  "/export.csv",
  asyncHandler(async (req, res) => {
    const links = await prisma.link.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: "desc" }, include });
    const escape = (value: string | number | null) => {
      const text = String(value ?? "");
      const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
      return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
    };
    const rows = [
      ["title", "slug", "destination", "collection", "status", "clicks", "qr_scans", "created_at"].join(","),
      ...links.map((link) => {
        const dto = toLinkDTO(link);
        return [dto.title, dto.slug, dto.originalUrl, dto.collectionName, dto.status, dto.clickCount, dto.qrScanCount, dto.createdAt].map(escape).join(",");
      }),
    ];
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="linkly-links.csv"');
    res.send(rows.join("\n"));
  }),
);

linksRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const input = parse(createLinkSchema, req.body);
    await assertOwnedCollection(userId, input.collectionId);
    const passwordHash = input.password ? await hashPassword(input.password) : null;
    const hostname = new URL(input.originalUrl).hostname.replace(/^www\./, "");
    const link = await createWithFreshSlug(
      (slug) => ({
        userId,
        slug,
        originalUrl: input.originalUrl,
        title: input.title || hostname,
        collectionId: input.collectionId || null,
        isEnabled: input.isEnabled ?? true,
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        landingEnabled: input.landingEnabled ?? false,
        landingDescription: input.landingDescription || null,
        landingImageUrl: input.landingImageUrl,
        passwordHash,
      }),
      input.slug,
    );
    res.status(201).json(toLinkDTO(link));
  }),
);

linksRouter.post(
  "/import",
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const input = parse(bulkImportSchema, req.body);
    await assertOwnedCollection(userId, input.collectionId);
    const result: BulkImportResultDTO = { imported: 0, skipped: [] };
    const seen = new Set<string>();

    for (const item of input.items) {
      const originalUrl = normalizeUrl(item.originalUrl);
      const requested = item.slug?.trim().toLowerCase() || undefined;
      const skip = (reason: string) => result.skipped.push({ originalUrl: item.originalUrl, slug: requested ?? "", reason });

      if (!originalUrl) {
        skip("invalid_url");
        continue;
      }
      if (requested) {
        const slugCheck = slugField.safeParse(requested);
        if (!slugCheck.success) {
          skip(slugCheck.error.issues[0]?.message ?? "invalid_slug");
          continue;
        }
        if (seen.has(requested)) {
          skip("slug_taken");
          continue;
        }
        seen.add(requested);
      }
      try {
        await createWithFreshSlug(
          (slug) => ({
            userId,
            slug,
            originalUrl,
            title: item.title?.trim() || new URL(originalUrl).hostname.replace(/^www\./, ""),
            collectionId: input.collectionId || null,
          }),
          requested,
        );
        result.imported += 1;
      } catch (error) {
        skip(error instanceof HttpError ? error.code : "failed");
      }
    }
    res.json(result);
  }),
);

linksRouter.post(
  "/bulk",
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const input = parse(bulkActionSchema, req.body);
    const where = { id: { in: input.ids }, userId };
    let affected = 0;
    if (input.action === "delete") affected = (await prisma.link.deleteMany({ where })).count;
    else if (input.action === "enable") affected = (await prisma.link.updateMany({ where, data: { isEnabled: true } })).count;
    else if (input.action === "disable") affected = (await prisma.link.updateMany({ where, data: { isEnabled: false } })).count;
    else {
      await assertOwnedCollection(userId, input.collectionId);
      affected = (await prisma.link.updateMany({ where, data: { collectionId: input.collectionId || null } })).count;
    }
    res.json({ affected });
  }),
);

linksRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(toLinkDTO(await requireOwnedLink(req.user!.id, param(req, "id"))));
  }),
);

linksRouter.get(
  "/:id/analytics",
  asyncHandler(async (req, res) => {
    const link = await requireOwnedLink(req.user!.id, param(req, "id"));
    const range = Number(queryString(req.query.range)) || 30;
    res.json(await buildLinkAnalytics(req.user!.id, link.id, range, queryString(req.query.tz)));
  }),
);

linksRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const existing = await requireOwnedLink(userId, param(req, "id"));
    const input = parse(updateLinkSchema, req.body);
    await assertOwnedCollection(userId, input.collectionId);

    const data: Prisma.LinkUncheckedUpdateInput = {};
    if (input.title !== undefined) data.title = input.title || existing.title;
    if (input.originalUrl !== undefined) data.originalUrl = input.originalUrl;
    if (input.slug !== undefined) data.slug = input.slug;
    if (input.collectionId !== undefined) data.collectionId = input.collectionId || null;
    if (input.isEnabled !== undefined) data.isEnabled = input.isEnabled;
    if (input.startsAt !== undefined) data.startsAt = input.startsAt ? new Date(input.startsAt) : null;
    if (input.expiresAt !== undefined) data.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
    if (input.landingEnabled !== undefined) data.landingEnabled = input.landingEnabled;
    if (input.landingDescription !== undefined) data.landingDescription = input.landingDescription || null;
    if (input.landingImageUrl !== undefined) data.landingImageUrl = input.landingImageUrl;
    if (input.password !== undefined) data.passwordHash = input.password ? await hashPassword(input.password) : null;

    const nextStarts = (data.startsAt as Date | null | undefined) === undefined ? existing.startsAt : (data.startsAt as Date | null);
    const nextExpires = (data.expiresAt as Date | null | undefined) === undefined ? existing.expiresAt : (data.expiresAt as Date | null);
    if (nextStarts && nextExpires && nextStarts >= nextExpires) {
      throw new HttpError(400, "validation_error", "Invalid input", { expiresAt: "expiry_before_start" });
    }

    try {
      const link = await prisma.link.update({ where: { id: existing.id }, data, include });
      res.json(toLinkDTO(link));
    } catch (error) {
      if (isUniqueViolation(error)) throw new HttpError(409, "slug_taken", "This short link is already in use.", { slug: "slug_taken" });
      throw error;
    }
  }),
);

linksRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const link = await requireOwnedLink(req.user!.id, param(req, "id"));
    await prisma.link.delete({ where: { id: link.id } });
    res.json({ ok: true });
  }),
);
