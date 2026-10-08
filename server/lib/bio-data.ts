import type { BioPage, Prisma } from "@prisma/client";
import { prisma } from "../db";
import { blockSchema, designSchema, floaterSchema, type Block, type Design, type Floater, type SocialKey } from "../../src/shared/bio-schema";
import { referencedLinkIds, type LinkRef } from "../../src/shared/bio-resolve";
import type { BioDTO } from "../../src/shared/types";
import { deriveLinkStatus } from "../../src/shared/types";
import { toLinkDTO } from "./dto";

const defaultDesign = designSchema.parse({});

/** Reads the JSON columns defensively: a malformed entry is dropped instead of breaking the public page. */
export function readBioData(page: Pick<BioPage, "design" | "blocks" | "floaters">): { design: Design; blocks: Block[]; floaters: Floater[] } {
  const design = designSchema.safeParse(page.design ?? {});
  const blocks = Array.isArray(page.blocks) ? page.blocks.flatMap((entry) => {
    const parsed = blockSchema.safeParse(entry);
    return parsed.success ? [parsed.data] : [];
  }) : [];
  const floaters = Array.isArray(page.floaters) ? page.floaters.flatMap((entry) => {
    const parsed = floaterSchema.safeParse(entry);
    return parsed.success ? [parsed.data] : [];
  }) : [];
  return { design: design.success ? design.data : defaultDesign, blocks, floaters };
}

const linkInclude = { collection: { select: { name: true } } } satisfies Prisma.LinkInclude;

export async function loadLinks(userId: string, ids: string[]) {
  if (ids.length === 0) return [];
  return prisma.link.findMany({ where: { userId, id: { in: ids } }, include: linkInclude });
}

export function toRefs(links: Awaited<ReturnType<typeof loadLinks>>): Map<string, LinkRef> {
  return new Map(
    links.map((link) => [
      link.id,
      {
        id: link.id,
        title: link.title,
        slug: link.slug,
        collectionId: link.collectionId,
        collectionName: link.collection?.name ?? null,
        active: deriveLinkStatus(link) === "active",
      },
    ]),
  );
}

export async function toBioDTO(page: BioPage): Promise<BioDTO> {
  const data = readBioData(page);
  const links = await loadLinks(page.userId, referencedLinkIds(data.blocks, data.floaters));
  const known = new Set(links.map((link) => link.id));
  // Drop link blocks whose link no longer exists, so the editor never shows a ghost row.
  const blocks = data.blocks.filter((block) => block.type !== "link" || known.has(block.linkId));
  return {
    handle: page.handle,
    title: page.title,
    bio: page.bio,
    avatarUrl: page.avatarUrl,
    theme: page.theme,
    buttonStyle: page.buttonStyle,
    showFolders: page.showFolders,
    showBranding: page.showBranding,
    socials: (page.socials ?? {}) as Partial<Record<SocialKey, string>>,
    design: data.design,
    blocks,
    floaters: data.floaters,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    ogImageUrl: page.ogImageUrl,
    links: links.map(toLinkDTO),
    published: true,
  };
}
