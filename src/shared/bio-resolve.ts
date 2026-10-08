import type { Block, Design, Floater, Target } from "./bio-schema";

export interface LinkRef {
  id: string;
  title: string;
  slug: string;
  collectionId: string | null;
  collectionName: string | null;
  /** False when the link is disabled, expired or not started yet. Inactive links never appear publicly. */
  active: boolean;
}

export type ResolvedBlock =
  | { type: "link"; id: string; title: string; href: string; folderId: string | null; emoji?: string; thumbnailUrl: string | null; highlight: boolean }
  | { type: "button"; id: string; title: string; href: string; folderId: null; emoji?: string; thumbnailUrl: string | null; highlight: boolean }
  | Extract<Block, { type: "image" }> & { href: string | null }
  | Extract<Block, { type: "video" | "heading" | "text" | "divider" }>;

export type ResolvedFloater = Floater & { href: string | null };

export function resolveTarget(target: Target | null | undefined, refs: Map<string, LinkRef>): string | null {
  if (!target) return null;
  if (target.kind === "url") return target.url;
  const ref = refs.get(target.linkId);
  return ref?.active ? `/${ref.slug}` : null;
}

export function resolveBlocks(blocks: Block[], refs: Map<string, LinkRef>): ResolvedBlock[] {
  const out: ResolvedBlock[] = [];
  for (const block of blocks) {
    if (block.type === "link") {
      const ref = refs.get(block.linkId);
      if (!ref?.active) continue;
      out.push({ type: "link", id: block.id, title: ref.title, href: `/${ref.slug}`, folderId: ref.collectionId, emoji: block.emoji, thumbnailUrl: block.thumbnailUrl, highlight: block.highlight });
    } else if (block.type === "button") {
      const href = resolveTarget(block.target, refs);
      if (!href) continue;
      out.push({ type: "button", id: block.id, title: block.label, href, folderId: null, emoji: block.emoji, thumbnailUrl: block.thumbnailUrl, highlight: block.highlight });
    } else if (block.type === "image") {
      out.push({ ...block, href: resolveTarget(block.target, refs) });
    } else {
      out.push(block);
    }
  }
  return out;
}

export function resolveFloaters(floaters: Floater[], refs: Map<string, LinkRef>): ResolvedFloater[] {
  return floaters.flatMap((floater) => {
    const href = resolveTarget(floater.target, refs);
    // A floating button without a working destination would be a dead control, so it is dropped.
    if (floater.kind === "button" && !href) return [];
    return [{ ...floater, href }];
  });
}

/** Every link id a bio page refers to, so the server can load and authorise them in one query. */
export function referencedLinkIds(blocks: Block[], floaters: Floater[]): string[] {
  const ids = new Set<string>();
  const add = (target: Target | null | undefined) => target?.kind === "link" && ids.add(target.linkId);
  for (const block of blocks) {
    if (block.type === "link") ids.add(block.linkId);
    else if (block.type === "button" || block.type === "image") add(block.target);
  }
  for (const floater of floaters) add(floater.target);
  return [...ids];
}

export function foldersOf(refs: Iterable<LinkRef>): { id: string; name: string }[] {
  const map = new Map<string, string>();
  for (const ref of refs) if (ref.collectionId && ref.collectionName) map.set(ref.collectionId, ref.collectionName);
  return [...map].map(([id, name]) => ({ id, name }));
}

export type { Design };
