import type { SocialKey } from "./bio-schema";

export const SOCIAL_META: Record<SocialKey, { label: string; base: string; path: string }> = {
  instagram: {
    label: "Instagram",
    base: "https://instagram.com/",
    path: "M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm4.5 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5.5-1.2a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Z",
  },
  twitter: {
    label: "X",
    base: "https://x.com/",
    path: "M18.2 2H21l-6.5 7.4L22 22h-6l-4.7-6.2L5.9 22H3l7-8L2 2h6.1l4.2 5.6L18.2 2Zm-1 18h1.6L7 3.9H5.3L17.2 20Z",
  },
  linkedin: {
    label: "LinkedIn",
    base: "https://linkedin.com/in/",
    path: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.5h4V21H3V9.5Zm6.5 0h3.8v1.6h.1c.6-1 1.9-1.9 3.8-1.9 4 0 4.8 2.6 4.8 6V21h-4v-5c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9V21h-4V9.5Z",
  },
  youtube: {
    label: "YouTube",
    base: "https://youtube.com/@",
    path: "M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8ZM10 15V9l5.2 3L10 15Z",
  },
  github: {
    label: "GitHub",
    base: "https://github.com/",
    path: "M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z",
  },
};

export function socialHref(key: SocialKey, value: string): string {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `${SOCIAL_META[key].base}${trimmed.replace(/^@/, "")}`;
}
