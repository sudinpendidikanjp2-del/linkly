import { Router } from "express";
import { prisma } from "../db";
import { asyncHandler, HttpError, param, parse } from "../lib/http";
import { toCollectionDTO } from "../lib/dto";
import { collectionSchema } from "../../src/shared/schemas";

export const collectionsRouter = Router();

const include = { links: { select: { id: true, clickCount: true } } } as const;

async function requireOwned(userId: string, id: string) {
  const collection = await prisma.collection.findFirst({ where: { id, userId }, include });
  if (!collection) throw new HttpError(404, "not_found", "Collection not found.");
  return collection;
}

async function assignLinks(userId: string, collectionId: string, linkIds: string[]) {
  await prisma.$transaction([
    prisma.link.updateMany({ where: { userId, collectionId, id: { notIn: linkIds } }, data: { collectionId: null } }),
    prisma.link.updateMany({ where: { userId, id: { in: linkIds } }, data: { collectionId } }),
  ]);
}

collectionsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const items = await prisma.collection.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: "desc" }, include });
    res.json(items.map(toCollectionDTO));
  }),
);

collectionsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const input = parse(collectionSchema, req.body);
    const created = await prisma.collection.create({ data: { userId, name: input.name, description: input.description || null } });
    if (input.linkIds?.length) await assignLinks(userId, created.id, input.linkIds);
    res.status(201).json(toCollectionDTO(await requireOwned(userId, created.id)));
  }),
);

collectionsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const existing = await requireOwned(userId, param(req, "id"));
    const input = parse(collectionSchema, req.body);
    await prisma.collection.update({ where: { id: existing.id }, data: { name: input.name, description: input.description || null } });
    if (input.linkIds) await assignLinks(userId, existing.id, input.linkIds);
    res.json(toCollectionDTO(await requireOwned(userId, existing.id)));
  }),
);

collectionsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await requireOwned(req.user!.id, param(req, "id"));
    await prisma.collection.delete({ where: { id: existing.id } });
    res.json({ ok: true });
  }),
);
