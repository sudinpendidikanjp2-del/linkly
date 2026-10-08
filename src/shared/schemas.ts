import { z } from "zod";
import { HANDLE_PATTERN, MAX_BULK_IMPORT, RESERVED_SLUGS, SLUG_PATTERN } from "./constants";

/** Accepts "example.com/path" and normalises it to an absolute http(s) URL. */
/** Validation messages are short codes; the UI translates them (see `errors.*` in the i18n dictionaries). */
z.config({
  customError: (issue) => {
    switch (issue.code) {
      case "too_small":
        return issue.minimum === 1 ? "required" : "too_small";
      case "too_big":
        return "too_big";
      case "invalid_type":
        return issue.input === undefined || issue.input === null ? "required" : "invalid_type";
      case "invalid_format":
        return issue.format === "email" ? "invalid_email" : "invalid_format";
      default:
        return undefined;
    }
  },
});

export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".") && url.hostname !== "localhost") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export const urlField = z
  .string()
  .max(2048)
  .transform((value, ctx) => {
    const normalized = normalizeUrl(value);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "invalid_url" });
      return z.NEVER;
    }
    return normalized;
  });

const optionalUrl = z
  .string()
  .max(2048)
  .nullish()
  .transform((value, ctx) => {
    if (!value || !value.trim()) return null;
    const normalized = normalizeUrl(value);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "invalid_url" });
      return z.NEVER;
    }
    return normalized;
  });

export const slugField = z
  .string()
  .trim()
  .toLowerCase()
  .refine((value) => SLUG_PATTERN.test(value), { message: "invalid_slug" })
  .refine((value) => !RESERVED_SLUGS.has(value), { message: "reserved_slug" });

export const handleField = z
  .string()
  .trim()
  .toLowerCase()
  .refine((value) => HANDLE_PATTERN.test(value), { message: "invalid_handle" })
  .refine((value) => !RESERVED_SLUGS.has(value), { message: "reserved_slug" });

const isoDate = z
  .string()
  .nullish()
  .transform((value, ctx) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: "custom", message: "invalid_date" });
      return z.NEVER;
    }
    return date.toISOString();
  });

export const passwordField = z.string().min(8, "password_short").max(72, "password_long");

export const registerSchema = z.object({
  name: z.string().trim().min(1, "required").max(80),
  email: z.string().trim().toLowerCase().pipe(z.email("invalid_email")),
  password: passwordField,
});
export type RegisterInput = z.input<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("invalid_email")),
  password: z.string().min(1, "required").max(72),
});
export type LoginInput = z.input<typeof loginSchema>;

const linkBase = z.object({
  title: z.string().trim().max(120).optional(),
  originalUrl: urlField,
  slug: z.preprocess((v) => (v === "" ? undefined : v), slugField.optional()),
  collectionId: z.string().nullish(),
  isEnabled: z.boolean().optional(),
  startsAt: isoDate,
  expiresAt: isoDate,
  landingEnabled: z.boolean().optional(),
  landingDescription: z.string().trim().max(300).nullish(),
  landingImageUrl: optionalUrl,
  /** Plain text on input, hashed server side. `null` removes protection on update. */
  password: z.union([z.string().min(4, "link_password_short").max(72), z.null()]).optional(),
});

const scheduleRefine = (value: { startsAt?: string | null; expiresAt?: string | null }) =>
  !value.startsAt || !value.expiresAt || new Date(value.startsAt) < new Date(value.expiresAt);

export const createLinkSchema = linkBase.refine(scheduleRefine, {
  path: ["expiresAt"],
  message: "expiry_before_start",
});
export type CreateLinkInput = z.input<typeof createLinkSchema>;

export const updateLinkSchema = linkBase
  .partial()
  .refine(scheduleRefine, { path: ["expiresAt"], message: "expiry_before_start" });
export type UpdateLinkInput = z.input<typeof updateLinkSchema>;

export const bulkImportSchema = z.object({
  collectionId: z.string().nullish(),
  items: z
    .array(
      z.object({
        originalUrl: z.string().max(2048),
        slug: z.string().max(80).optional(),
        title: z.string().max(120).optional(),
      }),
    )
    .min(1)
    .max(MAX_BULK_IMPORT),
});
export type BulkImportInput = z.input<typeof bulkImportSchema>;

export const bulkActionSchema = z.object({
  ids: z.array(z.string()).min(1).max(500),
  action: z.enum(["delete", "enable", "disable", "move"]),
  collectionId: z.string().nullish(),
});
export type BulkActionInput = z.input<typeof bulkActionSchema>;

export const collectionSchema = z.object({
  name: z.string().trim().min(1, "required").max(80),
  description: z.string().trim().max(240).nullish(),
  linkIds: z.array(z.string()).optional(),
});
export type CollectionInput = z.input<typeof collectionSchema>;

export const BIO_THEME_IDS = [
  "slate",
  "paper",
  "ink",
  "chalk",
  "dusk",
  "sand",
  "forest",
  "mint",
  "ocean",
] as const;
export const BIO_BUTTON_STYLES = ["classic", "pill", "outline", "hard", "soft"] as const;
export const SOCIAL_KEYS = ["instagram", "twitter", "linkedin", "youtube", "github"] as const;
export type SocialKey = (typeof SOCIAL_KEYS)[number];

export const bioSchema = z.object({
  handle: handleField,
  title: z.string().trim().min(1, "required").max(80),
  bio: z.string().trim().max(240).nullish(),
  avatarUrl: optionalUrl,
  bgImageUrl: optionalUrl,
  theme: z.enum(BIO_THEME_IDS),
  buttonStyle: z.enum(BIO_BUTTON_STYLES),
  videoUrl: optionalUrl,
  showFolders: z.boolean(),
  socials: z.partialRecord(z.enum(SOCIAL_KEYS), z.string().trim().max(200)).default({}),
  linkIds: z.array(z.string()).max(100),
});
export type BioInput = z.input<typeof bioSchema>;

export const profileSchema = z.object({
  name: z.string().trim().min(1, "required").max(80),
  avatarUrl: optionalUrl,
});
export type ProfileInput = z.input<typeof profileSchema>;

export const passwordChangeSchema = z.object({
  currentPassword: z.string().max(72).optional(),
  newPassword: passwordField,
});
export type PasswordChangeInput = z.input<typeof passwordChangeSchema>;
