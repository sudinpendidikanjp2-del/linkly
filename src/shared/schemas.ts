import { z } from "zod";
import { MAX_BULK_IMPORT } from "./constants";

/** Accepts "example.com/path" and normalises it to an absolute http(s) URL. */
export { handleField, normalizeUrl, optionalUrl, slugField, urlField } from "./fields";
import { optionalUrl, slugField, urlField } from "./fields";

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

export * from "./bio-schema";


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
