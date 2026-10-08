import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { asyncHandler, parse, queryString } from "../lib/http";
import { toBioDTO } from "../lib/dto";
import { bioSchema, handleField } from "../../src/shared/schemas";
import { HttpError } from "../lib/http";
import type { BioDTO } from "../../src/shared/types";

export const bioRouter = Router();

const pageInclude = { links: { include: { link: { include: { collection: { select: { name: true } } } } } } } satisfies Prisma.BioPageInclude;

bioRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const page = await prisma.bioPage.findUnique({ where: { userId }, include: pageInclude });
    if (page) return res.json(toBioDTO(page));

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const base = (user?.email.split("@")[0] ?? "me").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 24);
    const draft: BioDTO = {
      handle: base.length >= 3 ? base : `${base}user`,
      title: user?.name ?? "",
      bio: null,
      avatarUrl: user?.avatarUrl ?? null,
      bgImageUrl: null,
      theme: "slate",
      buttonStyle: "classic",
      videoUrl: null,
      showFolders: true,
      socials: {},
      linkIds: [],
      links: [],
      published: false,
    };
    res.json(draft);
  }),
);

bioRouter.get(
  "/handle-available",
  asyncHandler(async (req, res) => {
    const parsed = handleField.safeParse(queryString(req.query.handle) ?? "");
    if (!parsed.success) return res.json({ available: false, reason: parsed.error.issues[0]?.message ?? "invalid_handle" });
    const existing = await prisma.bioPage.findUnique({ where: { handle: parsed.data }, select: { userId: true } });
    const available = !existing || existing.userId === req.user!.id;
    res.json({ available, reason: available ? null : "handle_taken" });
  }),
);

bioRouter.put(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const input = parse(bioSchema, req.body);

    const owned = await prisma.link.findMany({ where: { userId, id: { in: input.linkIds } }, select: { id: true } });
    const ownedIds = new Set(owned.map((link) => link.id));
    const linkIds = input.linkIds.filter((id) => ownedIds.has(id));

    const taken = await prisma.bioPage.findUnique({ where: { handle: input.handle }, select: { userId: true } });
    if (taken && taken.userId !== userId) {
      throw new HttpError(409, "handle_taken", "This handle is already in use.", { handle: "handle_taken" });
    }

    const data = {
      handle: input.handle,
      title: input.title,
      bio: input.bio || null,
      avatarUrl: input.avatarUrl,
      bgImageUrl: input.bgImageUrl,
      theme: input.theme,
      buttonStyle: input.buttonStyle,
      videoUrl: input.videoUrl,
      showFolders: input.showFolders,
      socials: Object.fromEntries(Object.entries(input.socials).filter(([, value]) => value)),
    };

    await prisma.$transaction([
      prisma.bioPage.upsert({ where: { userId }, create: { userId, ...data }, update: data }),
      prisma.bioLink.deleteMany({ where: { pageId: userId } }),
      prisma.bioLink.createMany({ data: linkIds.map((linkId, position) => ({ pageId: userId, linkId, position })) }),
    ]);

    const saved = await prisma.bioPage.findUniqueOrThrow({ where: { userId }, include: pageInclude });
    res.json(toBioDTO(saved));
  }),
);
