import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { asyncHandler, HttpError, parse, queryString } from "../lib/http";
import { loadLinks, toBioDTO } from "../lib/bio-data";
import { bioSchema, designSchema, type Block, type Floater, type Target } from "../../src/shared/bio-schema";
import { handleField } from "../../src/shared/schemas";
import { referencedLinkIds } from "../../src/shared/bio-resolve";
import type { BioDTO } from "../../src/shared/types";

export const bioRouter = Router();

bioRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const page = await prisma.bioPage.findUnique({ where: { userId } });
    if (page) return res.json(await toBioDTO(page));

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const base = (user?.email.split("@")[0] ?? "me").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 24);
    const draft: BioDTO = {
      handle: base.length >= 3 ? base : `${base}user`,
      title: user?.name ?? "",
      bio: null,
      avatarUrl: user?.avatarUrl ?? null,
      theme: "slate",
      buttonStyle: "classic",
      showFolders: true,
      showBranding: true,
      socials: {},
      design: designSchema.parse({}),
      blocks: [],
      floaters: [],
      seoTitle: null,
      seoDescription: null,
      ogImageUrl: null,
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

    const owned = new Set((await loadLinks(userId, referencedLinkIds(input.blocks, input.floaters))).map((link) => link.id));
    const ownsTarget = (target: Target | null | undefined) => !target || target.kind === "url" || owned.has(target.linkId);

    // Anything pointing at a link the user does not own is removed or neutralised rather than trusted.
    const blocks: Block[] = input.blocks.flatMap((block): Block[] => {
      if (block.type === "link") return owned.has(block.linkId) ? [block] : [];
      if (block.type === "button") return ownsTarget(block.target) ? [block] : [];
      if (block.type === "image") return [{ ...block, target: ownsTarget(block.target) ? block.target : null }];
      return [block];
    });
    const floaters: Floater[] = input.floaters.flatMap((floater): Floater[] => {
      const target = ownsTarget(floater.target) ? floater.target : null;
      if (floater.kind === "button" && !target) return [];
      return [{ ...floater, target }];
    });

    const taken = await prisma.bioPage.findUnique({ where: { handle: input.handle }, select: { userId: true } });
    if (taken && taken.userId !== userId) {
      throw new HttpError(409, "handle_taken", "This handle is already in use.", { handle: "handle_taken" });
    }

    const data = {
      handle: input.handle,
      title: input.title,
      bio: input.bio || null,
      avatarUrl: input.avatarUrl,
      theme: input.theme,
      buttonStyle: input.buttonStyle,
      showFolders: input.showFolders,
      showBranding: input.showBranding,
      socials: Object.fromEntries(Object.entries(input.socials).filter(([, value]) => value)),
      design: input.design as unknown as Prisma.InputJsonValue,
      blocks: blocks as unknown as Prisma.InputJsonValue,
      floaters: floaters as unknown as Prisma.InputJsonValue,
      seoTitle: input.seoTitle || null,
      seoDescription: input.seoDescription || null,
      ogImageUrl: input.ogImageUrl,
    };

    const saved = await prisma.bioPage.upsert({ where: { userId }, create: { userId, ...data }, update: data });
    res.json(await toBioDTO(saved));
  }),
);
