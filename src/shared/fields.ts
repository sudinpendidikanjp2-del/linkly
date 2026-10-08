import { z } from "zod";
import { HANDLE_PATTERN, RESERVED_SLUGS, SLUG_PATTERN } from "./constants";

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

export const optionalUrl = z
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

