import type { Collection, Link, User } from "@prisma/client";
import type { CollectionDTO, LinkDTO, UserDTO } from "../../src/shared/types";
import { deriveLinkStatus } from "../../src/shared/types";

type LinkWithCollection = Link & { collection?: Pick<Collection, "name"> | null };

export function toLinkDTO(link: LinkWithCollection): LinkDTO {
  return {
    id: link.id,
    title: link.title,
    originalUrl: link.originalUrl,
    slug: link.slug,
    collectionId: link.collectionId,
    collectionName: link.collection?.name ?? null,
    isEnabled: link.isEnabled,
    isProtected: Boolean(link.passwordHash),
    startsAt: link.startsAt?.toISOString() ?? null,
    expiresAt: link.expiresAt?.toISOString() ?? null,
    landingEnabled: link.landingEnabled,
    landingDescription: link.landingDescription,
    landingImageUrl: link.landingImageUrl,
    clickCount: link.clickCount,
    qrScanCount: link.qrScanCount,
    createdAt: link.createdAt.toISOString(),
    status: deriveLinkStatus(link),
  };
}

export function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role,
    hasPassword: Boolean(user.passwordHash),
  };
}

export function toCollectionDTO(
  collection: Collection & { links: Pick<Link, "id" | "clickCount">[] },
): CollectionDTO {
  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    linkCount: collection.links.length,
    clickCount: collection.links.reduce((sum, link) => sum + link.clickCount, 0),
    createdAt: collection.createdAt.toISOString(),
    linkIds: collection.links.map((link) => link.id),
  };
}

