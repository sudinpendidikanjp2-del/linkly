import { toast } from "sonner";

export function shortUrl(slug: string): string {
  return `${window.location.origin}/${slug}`;
}

export function shortLabel(slug: string): string {
  return `${window.location.host}/${slug}`;
}

export function qrTarget(slug: string): string {
  return `${shortUrl(slug)}?qr=1`;
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export async function copyText(text: string, messages: { ok: string; fail: string }): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(messages.ok);
    return true;
  } catch {
    toast.error(messages.fail);
    return false;
  }
}

/** `datetime-local` inputs use a zone-less local string. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromLocalInput(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}
