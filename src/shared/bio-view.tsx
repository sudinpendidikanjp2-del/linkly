import type { CSSProperties } from "react";
import { BIO_THEMES, getBioTheme } from "./bio-themes";
import { getYouTubeEmbedUrl } from "./youtube";
import type { SocialKey } from "./schemas";

export interface BioViewLink {
  id: string;
  title: string;
  href: string;
  folderId: string | null;
}

export interface BioViewProps {
  title: string;
  bio?: string | null;
  avatarUrl?: string | null;
  bgImageUrl?: string | null;
  theme: string;
  buttonStyle: string;
  videoUrl?: string | null;
  showFolders: boolean;
  socials: Partial<Record<SocialKey, string>>;
  links: BioViewLink[];
  folders: { id: string; name: string }[];
  labels: { links: (count: number) => string; empty: string; poweredBy: string };
  homeHref?: string;
}

const SOCIAL_META: Record<SocialKey, { label: string; base: string; path: string }> = {
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

export const BIO_CSS = `
.bv{--bv-bg:#0f1115;--bv-fg:#f3f4f6;--bv-muted:#a3a8b3;--bv-surface:#1a1d24;--bv-border:#2e3440;--bv-accent:#5eead4;--bv-on-accent:#04201c;
  min-height:100%;background:var(--bv-bg);color:var(--bv-fg);padding:48px 16px 40px;display:flex;flex-direction:column;align-items:center;
  font:16px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased;box-sizing:border-box}
.bv *,.bv *::before,.bv *::after{box-sizing:border-box}
.bv--image{background-size:cover;background-position:center;background-attachment:fixed}
.bv-inner{width:100%;max-width:440px;display:flex;flex-direction:column;align-items:center;gap:20px}
.bv-header{display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;padding:4px 8px;width:100%}
.bv--image .bv-header{background:var(--bv-surface);border:1px solid var(--bv-border);border-radius:20px;padding:20px 16px}
.bv-avatar{width:88px;height:88px;border-radius:50%;object-fit:cover;background:var(--bv-surface);border:2px solid var(--bv-border);display:grid;place-items:center;font-size:32px;font-weight:600;color:var(--bv-muted)}
.bv-title{margin:0;font-size:24px;line-height:1.15;letter-spacing:-.02em;font-weight:650}
.bv-bio{margin:0;color:var(--bv-muted);font-size:15px;max-width:34ch;white-space:pre-line}
.bv-socials{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;padding:0;margin:0;list-style:none}
.bv-social{display:grid;place-items:center;width:44px;height:44px;border-radius:50%;color:var(--bv-fg);background:var(--bv-surface);border:1px solid var(--bv-border);transition:transform .2s cubic-bezier(.32,.72,0,1),border-color .2s}
.bv-social:hover{transform:translateY(-2px);border-color:var(--bv-accent)}
.bv-social svg{width:20px;height:20px;fill:currentColor}
.bv-video{width:100%;aspect-ratio:16/9;border:1px solid var(--bv-border);border-radius:16px;overflow:hidden;background:var(--bv-surface)}
.bv-video iframe{width:100%;height:100%;border:0}
.bv-list{width:100%;display:flex;flex-direction:column;gap:12px;margin:0;padding:0;list-style:none}
.bv-btn{display:flex;align-items:center;justify-content:center;min-height:52px;padding:12px 20px;text-align:center;text-decoration:none;font-weight:600;font-size:16px;color:var(--bv-fg);
  background:var(--bv-surface);border:1px solid var(--bv-border);border-radius:14px;transition:transform .2s cubic-bezier(.32,.72,0,1),border-color .2s,background-color .2s;width:100%;cursor:pointer;font-family:inherit}
.bv-btn:hover{transform:translateY(-2px);border-color:var(--bv-accent)}
.bv-btn:active{transform:scale(.98)}
.bv-btn:focus-visible,.bv-social:focus-visible,.bv-folder summary:focus-visible{outline:3px solid var(--bv-accent);outline-offset:3px}
.bv--pill .bv-btn{border-radius:999px}
.bv--outline .bv-btn{background:transparent;border:2px solid var(--bv-accent);color:var(--bv-fg);border-radius:12px}
.bv--hard .bv-btn{background:var(--bv-accent);color:var(--bv-on-accent);border:2px solid var(--bv-fg);border-radius:0;box-shadow:4px 4px 0 var(--bv-fg);font-weight:700}
.bv--hard .bv-btn:hover{transform:translate(-1px,-1px);box-shadow:6px 6px 0 var(--bv-fg)}
.bv--soft .bv-btn{background:color-mix(in srgb,var(--bv-accent) 14%,var(--bv-surface));border-color:transparent;border-radius:16px}
.bv-folder{width:100%;border:1px solid var(--bv-border);border-radius:14px;background:var(--bv-surface);overflow:hidden}
.bv-folder summary{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:52px;padding:12px 20px;font-weight:600;cursor:pointer;list-style:none}
.bv-folder summary::-webkit-details-marker{display:none}
.bv-folder summary::after{content:"";width:8px;height:8px;border-right:2px solid var(--bv-muted);border-bottom:2px solid var(--bv-muted);transform:rotate(45deg);transition:transform .2s cubic-bezier(.32,.72,0,1);flex:none}
.bv-folder[open] summary::after{transform:rotate(-135deg)}
.bv-count{margin-left:auto;margin-right:8px;font-size:13px;font-weight:500;color:var(--bv-muted)}
.bv-folder .bv-list{padding:0 12px 12px}
.bv-empty{color:var(--bv-muted);text-align:center;font-size:15px;padding:24px 8px}
.bv-foot{margin-top:auto;padding-top:32px;font-size:13px;color:var(--bv-muted)}
.bv-foot a{color:inherit;text-underline-offset:3px}
@media (prefers-reduced-motion:reduce){.bv *{transition:none!important}}
`;

function themeVars(themeId: string): CSSProperties {
  const theme = getBioTheme(themeId in BIO_THEMES ? themeId : "slate");
  return {
    "--bv-bg": theme.bg,
    "--bv-fg": theme.fg,
    "--bv-muted": theme.muted,
    "--bv-surface": theme.surface,
    "--bv-border": theme.border,
    "--bv-accent": theme.accent,
    "--bv-on-accent": theme.onAccent,
  } as CSSProperties;
}

export function BioView(props: BioViewProps) {
  const { title, bio, avatarUrl, bgImageUrl, theme, buttonStyle, videoUrl, showFolders, socials, links, folders, labels, homeHref } = props;
  const embed = getYouTubeEmbedUrl(videoUrl);
  const socialEntries = (Object.keys(SOCIAL_META) as SocialKey[]).filter((key) => socials[key]);

  const folderGroups = showFolders
    ? folders
        .map((folder) => ({ folder, items: links.filter((link) => link.folderId === folder.id) }))
        .filter((group) => group.items.length > 0)
    : [];
  const foldered = new Set(folderGroups.flatMap((group) => group.items.map((item) => item.id)));
  const flat = links.filter((link) => !foldered.has(link.id));

  const style: CSSProperties = {
    ...themeVars(theme),
    ...(bgImageUrl ? { backgroundImage: `url("${bgImageUrl.replace(/["\\\n]/g, "")}")` } : {}),
  };

  const renderLink = (link: BioViewLink) => (
    <li key={link.id}>
      <a className="bv-btn" href={link.href} rel="noopener">
        {link.title}
      </a>
    </li>
  );

  return (
    <div className={`bv bv--${buttonStyle}${bgImageUrl ? " bv--image" : ""}`} style={style}>
      <div className="bv-inner">
        <header className="bv-header">
          {avatarUrl ? (
            <img className="bv-avatar" src={avatarUrl} alt="" width={88} height={88} />
          ) : (
            <div className="bv-avatar" aria-hidden="true">
              {title.trim().charAt(0).toUpperCase() || "?"}
            </div>
          )}
          <h1 className="bv-title">{title}</h1>
          {bio ? <p className="bv-bio">{bio}</p> : null}
        </header>

        {socialEntries.length > 0 ? (
          <ul className="bv-socials">
            {socialEntries.map((key) => (
              <li key={key}>
                <a className="bv-social" href={socialHref(key, socials[key]!)} rel="noopener noreferrer" target="_blank" aria-label={SOCIAL_META[key].label}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d={SOCIAL_META[key].path} />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        ) : null}

        {embed ? (
          <div className="bv-video">
            <iframe src={embed} title={title} loading="lazy" allow="picture-in-picture; encrypted-media" allowFullScreen />
          </div>
        ) : null}

        {links.length === 0 ? (
          <p className="bv-empty">{labels.empty}</p>
        ) : (
          <ul className="bv-list">
            {folderGroups.map(({ folder, items }) => (
              <li key={folder.id}>
                <details className="bv-folder">
                  <summary>
                    <span>{folder.name}</span>
                    <span className="bv-count">{labels.links(items.length)}</span>
                  </summary>
                  <ul className="bv-list">{items.map(renderLink)}</ul>
                </details>
              </li>
            ))}
            {flat.map(renderLink)}
          </ul>
        )}
      </div>
      <footer className="bv-foot">
        {homeHref ? (
          <a href={homeHref}>{labels.poweredBy}</a>
        ) : (
          <span>{labels.poweredBy}</span>
        )}
      </footer>
    </div>
  );
}
