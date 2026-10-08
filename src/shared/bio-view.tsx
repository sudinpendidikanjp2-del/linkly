import type { CSSProperties, ReactNode } from "react";
import { BIO_THEMES, getBioTheme, type BioTheme } from "./bio-themes";
import { SOCIAL_META, socialHref } from "./bio-social";
import { getYouTubeEmbedUrl } from "./youtube";
import { contrastRatio, mixHex, readableOn } from "./color";
import type { Design, SocialKey } from "./bio-schema";
import type { ResolvedBlock, ResolvedFloater } from "./bio-resolve";

export { socialHref } from "./bio-social";

export interface BioViewProps {
  title: string;
  bio?: string | null;
  avatarUrl?: string | null;
  theme: string;
  buttonStyle: string;
  showFolders: boolean;
  showBranding: boolean;
  socials: Partial<Record<SocialKey, string>>;
  design: Design;
  blocks: ResolvedBlock[];
  floaters: ResolvedFloater[];
  folders: { id: string; name: string }[];
  labels: { links: (count: number) => string; empty: string; poweredBy: string };
  homeHref?: string;
  /** "fixed" on the public page, "absolute" inside the editor's phone frame. */
  floatPosition?: "fixed" | "absolute";
}

const FONTS: Record<Design["font"], string> = {
  sans: 'ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
  serif: 'ui-serif,Georgia,Cambria,"Times New Roman",Times,serif',
  rounded: 'ui-rounded,"SF Pro Rounded","Hiragino Maru Gothic ProN",Nunito,Quicksand,system-ui,sans-serif',
  humanist: 'Seravek,"Gill Sans Nova","Gill Sans",Ubuntu,Calibri,"DejaVu Sans",source-sans-pro,sans-serif',
  mono: 'ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,"Liberation Mono",monospace',
};

/** Theme palette with the owner's colour overrides applied and the dependent colours re-derived. */
export function resolveTheme(themeId: string, colors: Design["colors"]): BioTheme {
  const base = getBioTheme(themeId in BIO_THEMES ? themeId : "slate");
  const bg = colors.bg ?? base.bg;
  const fg = colors.fg ?? base.fg;
  const accent = colors.accent ?? base.accent;
  const customised = Boolean(colors.bg || colors.fg);
  const surface = colors.surface ?? (colors.bg || colors.fg ? mixHex(bg, fg, 0.07) : base.surface);
  let muted = customised ? mixHex(fg, bg, 0.3) : base.muted;
  if (contrastRatio(muted, bg) < 4.5 || contrastRatio(muted, surface) < 4.5) muted = fg;
  return {
    ...base,
    bg,
    fg,
    surface,
    accent,
    muted,
    border: customised || colors.surface ? mixHex(bg, fg, 0.22) : base.border,
    onAccent: readableOn(accent),
  };
}

export function bioBackground(theme: BioTheme, design: Design): CSSProperties {
  const { background } = design;
  if (background.type === "gradient") {
    return { backgroundColor: background.from, backgroundImage: `linear-gradient(${background.angle}deg, ${background.from}, ${background.to})` };
  }
  if (background.type === "image" && background.imageUrl) {
    const dim = `color-mix(in srgb, ${theme.bg} ${background.dim}%, transparent)`;
    const url = background.imageUrl.replace(/["\\\n]/g, "");
    return { backgroundColor: theme.bg, backgroundImage: `linear-gradient(${dim}, ${dim}), url("${url}")`, backgroundSize: "cover", backgroundPosition: "center" };
  }
  return { backgroundColor: theme.bg };
}

const SPACING = { tight: 8, normal: 12, loose: 18 } as const;
const BUTTON_MIN = { sm: 44, md: 52, lg: 64 } as const;
const BUTTON_FONT = { sm: 15, md: 16, lg: 18 } as const;

export function bioVars(themeId: string, design: Design): CSSProperties {
  const theme = resolveTheme(themeId, design.colors);
  return {
    "--bv-bg": theme.bg,
    "--bv-fg": theme.fg,
    "--bv-muted": theme.muted,
    "--bv-surface": theme.surface,
    "--bv-border": theme.border,
    "--bv-accent": theme.accent,
    "--bv-on-accent": theme.onAccent,
    "--bv-font": FONTS[design.font],
    "--bv-gap": `${SPACING[design.spacing]}px`,
    "--bv-w": design.width === "wide" ? "600px" : "440px",
    "--bv-btn-min": `${BUTTON_MIN[design.buttonSize]}px`,
    "--bv-btn-font": `${BUTTON_FONT[design.buttonSize]}px`,
    "--bv-avatar": `${design.avatarSize}px`,
    ...(design.buttonRadius !== null ? { "--bv-radius": `${design.buttonRadius}px` } : {}),
    ...bioBackground(theme, design),
  } as CSSProperties;
}

export const BIO_CSS = `
.bv{--bv-bg:#0f1115;--bv-fg:#f3f4f6;--bv-muted:#a3a8b3;--bv-surface:#1a1d24;--bv-border:#2e3440;--bv-accent:#5eead4;--bv-on-accent:#04201c;--bv-font:ui-sans-serif,system-ui,sans-serif;--bv-gap:12px;--bv-w:440px;--bv-btn-min:52px;--bv-btn-font:16px;--bv-avatar:96px;--bv-radius:14px;--bv-ease:cubic-bezier(.32,.72,0,1);
  position:relative;min-height:100%;color:var(--bv-fg);padding:40px 16px 40px;display:flex;flex-direction:column;align-items:center;
  font:16px/1.5 var(--bv-font);-webkit-font-smoothing:antialiased;box-sizing:border-box;overflow-x:clip}
.bv *,.bv *::before,.bv *::after{box-sizing:border-box}
.bv-inner{position:relative;z-index:1;width:100%;max-width:var(--bv-w);display:flex;flex-direction:column;align-items:center;gap:calc(var(--bv-gap) + 8px)}
.bv--start .bv-inner{align-items:stretch}
.bv-cover{width:100%;height:160px;border-radius:20px;overflow:hidden;background:var(--bv-surface);border:1px solid var(--bv-border)}
.bv-cover img{width:100%;height:100%;object-fit:cover;display:block}
.bv-header{display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;padding:4px 8px;width:100%}
.bv--start .bv-header{align-items:flex-start;text-align:left;padding-left:0}
.bv--cover .bv-header{margin-top:calc(var(--bv-avatar) / -2 - 8px)}
.bv--image .bv-header,.bv--gradient .bv-header{background:var(--bv-surface);border:1px solid var(--bv-border);border-radius:20px;padding:20px 16px}
.bv--cover.bv--image .bv-header,.bv--cover.bv--gradient .bv-header{margin-top:0}
.bv-avatar{width:var(--bv-avatar);height:var(--bv-avatar);border-radius:50%;object-fit:cover;background:var(--bv-surface);border:3px solid var(--bv-bg);outline:1px solid var(--bv-border);display:grid;place-items:center;font-size:calc(var(--bv-avatar) / 3);font-weight:600;color:var(--bv-muted);position:relative;z-index:2}
.bv--av-rounded .bv-avatar{border-radius:24%}
.bv--av-square .bv-avatar{border-radius:6px}
.bv-title{margin:0;font-size:26px;line-height:1.15;letter-spacing:-.02em;font-weight:650}
.bv-bio{margin:0;color:var(--bv-muted);font-size:15px;max-width:38ch;white-space:pre-line}
.bv--image .bv-bio,.bv--gradient .bv-bio{color:var(--bv-muted)}
.bv-socials{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;padding:0;margin:0;list-style:none}
.bv--start .bv-socials{justify-content:flex-start}
.bv-social{display:grid;place-items:center;width:44px;height:44px;border-radius:50%;color:var(--bv-fg);background:var(--bv-surface);border:1px solid var(--bv-border);transition:transform .2s var(--bv-ease),border-color .2s}
.bv-social:hover{transform:translateY(-2px);border-color:var(--bv-accent)}
.bv-social svg{width:20px;height:20px;fill:currentColor}
.bv-list{width:100%;display:flex;flex-direction:column;gap:var(--bv-gap);margin:0;padding:0;list-style:none}
.bv-list>li{width:100%}
.bv-btn{display:flex;align-items:center;justify-content:center;gap:12px;min-height:var(--bv-btn-min);padding:10px 20px;text-align:center;text-decoration:none;font-weight:600;font-size:var(--bv-btn-font);color:var(--bv-fg);
  background:var(--bv-surface);border:1px solid var(--bv-border);border-radius:var(--bv-radius);transition:transform .2s var(--bv-ease),border-color .2s,background-color .2s;width:100%;cursor:pointer;font-family:inherit}
.bv-btn-label{min-width:0;overflow-wrap:anywhere}
.bv-btn-emoji{font-size:1.25em;line-height:1;flex:none}
.bv-btn-thumb{width:calc(var(--bv-btn-min) - 16px);height:calc(var(--bv-btn-min) - 16px);border-radius:calc(var(--bv-radius) * .6);object-fit:cover;flex:none;margin-left:-12px}
.bv--hover-lift .bv-btn:hover{transform:translateY(-2px);border-color:var(--bv-accent)}
.bv--hover-grow .bv-btn:hover{transform:scale(1.025);border-color:var(--bv-accent)}
.bv--hover-none .bv-btn:hover{border-color:var(--bv-accent)}
.bv-btn:active{transform:scale(.98)}
.bv-btn:focus-visible,.bv-social:focus-visible,.bv-folder summary:focus-visible,.bv-image a:focus-visible,.bv-float a:focus-visible{outline:3px solid var(--bv-accent);outline-offset:3px}
.bv-btn--hl{background:var(--bv-accent);color:var(--bv-on-accent);border-color:var(--bv-accent)}
.bv--pill{--bv-radius:999px}
.bv--outline .bv-btn:not(.bv-btn--hl){background:transparent;border:2px solid var(--bv-accent)}
.bv--hard .bv-btn{background:var(--bv-accent);color:var(--bv-on-accent);border:2px solid var(--bv-fg);box-shadow:4px 4px 0 var(--bv-fg);font-weight:700}
.bv--hard .bv-btn:hover{transform:translate(-1px,-1px);box-shadow:6px 6px 0 var(--bv-fg)}
.bv--soft .bv-btn:not(.bv-btn--hl){background:color-mix(in srgb,var(--bv-accent) 14%,var(--bv-surface));border-color:transparent}
.bv--classic{--bv-radius:14px}.bv--outline{--bv-radius:12px}.bv--hard{--bv-radius:0px}.bv--soft{--bv-radius:16px}
.bv-folder{width:100%;border:1px solid var(--bv-border);border-radius:var(--bv-radius);background:var(--bv-surface);overflow:hidden}
.bv-folder summary{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:var(--bv-btn-min);padding:12px 20px;font-weight:600;font-size:var(--bv-btn-font);cursor:pointer;list-style:none}
.bv-folder summary::-webkit-details-marker{display:none}
.bv-folder summary::after{content:"";width:8px;height:8px;border-right:2px solid var(--bv-muted);border-bottom:2px solid var(--bv-muted);transform:rotate(45deg);transition:transform .2s var(--bv-ease);flex:none}
.bv-folder[open] summary::after{transform:rotate(-135deg)}
.bv-count{margin-left:auto;margin-right:8px;font-size:13px;font-weight:500;color:var(--bv-muted)}
.bv-folder .bv-list{padding:0 12px 12px}
.bv-heading{margin:8px 0 0;width:100%;text-align:center;font-weight:650;letter-spacing:-.015em;font-size:18px;line-height:1.25}
.bv-heading--lg{font-size:24px}
.bv--start .bv-heading{text-align:left}
.bv-text{margin:0;width:100%;color:var(--bv-fg);font-size:15px;white-space:pre-line;text-align:center}
.bv-text--start{text-align:left}
.bv--image .bv-heading,.bv--image .bv-text,.bv--gradient .bv-heading,.bv--gradient .bv-text{background:var(--bv-surface);border-radius:14px;padding:10px 14px}
.bv-divider{width:100%;border:0;margin:4px 0;color:var(--bv-muted)}
.bv-divider--line{height:1px;background:var(--bv-border)}
.bv-divider--dots{text-align:center;letter-spacing:.6em;height:auto}
.bv-divider--space{height:20px}
.bv-image{margin:0;width:100%;display:flex;flex-direction:column;align-items:center;gap:8px}
.bv-image a,.bv-image .bv-image-frame{display:block;width:100%;overflow:hidden;border:1px solid var(--bv-border);background:var(--bv-surface);transition:transform .2s var(--bv-ease)}
.bv--hover-lift .bv-image a:hover{transform:translateY(-2px)}
.bv--hover-grow .bv-image a:hover{transform:scale(1.015)}
.bv-image img{display:block;width:100%;height:100%;object-fit:cover}
.bv-image--rounded a,.bv-image--rounded .bv-image-frame{border-radius:18px}
.bv-image--square a,.bv-image--square .bv-image-frame{border-radius:0}
.bv-image--circle a,.bv-image--circle .bv-image-frame{border-radius:50%;aspect-ratio:1/1;max-width:260px}
.bv-image--auto img{height:auto}
.bv-image figcaption{font-size:13px;color:var(--bv-muted);text-align:center}
.bv--image .bv-image figcaption,.bv--gradient .bv-image figcaption{background:var(--bv-surface);padding:4px 10px;border-radius:10px}
.bv-video{width:100%;border:1px solid var(--bv-border);border-radius:16px;overflow:hidden;background:#000;aspect-ratio:16/9}
.bv-video iframe,.bv-video video{width:100%;height:100%;border:0;display:block}
.bv-empty{color:var(--bv-muted);text-align:center;font-size:15px;padding:24px 8px}
.bv-foot{position:relative;z-index:1;margin-top:auto;padding-top:32px;font-size:13px;color:var(--bv-muted)}
.bv-foot a{color:inherit;text-underline-offset:3px}
.bv--image .bv-foot,.bv--gradient .bv-foot{background:var(--bv-surface);padding:6px 12px;margin-top:32px;border-radius:10px}
.bv-floats{pointer-events:none;inset:0;z-index:30;overflow:hidden}
.bv-floats--fixed{position:fixed}.bv-floats--absolute{position:absolute}
.bv-floats--behind{z-index:0}
.bv-float{position:absolute;transform:translate(-50%,-50%);pointer-events:none;line-height:0}
.bv-float a{pointer-events:auto;display:block;line-height:0;border-radius:inherit}
.bv-float-in{display:block;transform:rotate(var(--rot,0deg));transition:transform .25s var(--bv-ease)}
.bv-float a:hover .bv-float-in{transform:rotate(var(--rot,0deg)) scale(1.08)}
.bv-float-shape{display:block;width:100%;height:100%;background:var(--c)}
.bv-shape-circle{border-radius:50%}
.bv-shape-square{border-radius:12%}
.bv-shape-diamond{clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)}
.bv-shape-triangle{clip-path:polygon(50% 4%,100% 96%,0 96%)}
.bv-shape-ring{border-radius:50%;background:transparent;border:calc(var(--s) * .14) solid var(--c)}
.bv-shape-blob{border-radius:63% 37% 54% 46% / 55% 48% 52% 45%}
.bv-shape-star{clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)}
.bv-float-img{display:block;width:100%;height:100%;object-fit:contain}
.bv-float-btn{display:inline-flex;align-items:center;justify-content:center;gap:.4em;height:100%;padding:0 1.1em;border-radius:999px;font:600 var(--fs)/1 var(--bv-font);white-space:nowrap;text-decoration:none;box-shadow:0 6px 18px rgba(0,0,0,.28);background:var(--c);color:var(--ink)}
.bv-anim-float{animation:bv-float 3.4s ease-in-out infinite}
.bv-anim-pulse{animation:bv-pulse 2.2s ease-in-out infinite}
.bv-anim-spin{animation:bv-spin 14s linear infinite}
.bv-anim-bounce{animation:bv-bounce 1.6s var(--bv-ease) infinite}
@keyframes bv-float{0%,100%{transform:translateY(0) rotate(var(--rot,0deg))}50%{transform:translateY(-10px) rotate(var(--rot,0deg))}}
@keyframes bv-pulse{0%,100%{transform:scale(1) rotate(var(--rot,0deg))}50%{transform:scale(1.1) rotate(var(--rot,0deg))}}
@keyframes bv-spin{to{transform:rotate(calc(var(--rot,0deg) + 360deg))}}
@keyframes bv-bounce{0%,100%{transform:translateY(0) rotate(var(--rot,0deg))}35%{transform:translateY(-14px) rotate(var(--rot,0deg))}60%{transform:translateY(0) rotate(var(--rot,0deg))}}
@keyframes bv-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes bv-fade{from{opacity:0}to{opacity:1}}
.bv--rise .bv-item{animation:bv-rise .55s var(--bv-ease) both;animation-delay:calc(var(--i,0) * 55ms)}
.bv--fade .bv-item{animation:bv-fade .6s ease both;animation-delay:calc(var(--i,0) * 55ms)}
@media (prefers-reduced-motion:reduce){.bv *,.bv-floats *{transition:none!important;animation:none!important}}
`;

function Emoji({ value }: { value?: string }) {
  return value ? (
    <span className="bv-btn-emoji" aria-hidden="true">
      {value}
    </span>
  ) : null;
}

function BlockButton({ block }: { block: Extract<ResolvedBlock, { type: "link" | "button" }> }) {
  return (
    <a className={`bv-btn${block.highlight ? " bv-btn--hl" : ""}`} href={block.href} rel="noopener">
      {block.thumbnailUrl ? <img className="bv-btn-thumb" src={block.thumbnailUrl} alt="" loading="lazy" /> : null}
      <Emoji value={block.emoji} />
      <span className="bv-btn-label">{block.title}</span>
    </a>
  );
}

const RATIO: Record<string, string | undefined> = { auto: undefined, "1:1": "1 / 1", "4:5": "4 / 5", "16:9": "16 / 9", "3:1": "3 / 1" };
const FILE_VIDEO = /\.(mp4|webm|ogg)(\?.*)?$/i;

function renderBlock(block: ResolvedBlock, index: number): ReactNode {
  const item = { className: "bv-item", style: { "--i": index } as CSSProperties };
  switch (block.type) {
    case "link":
    case "button":
      return (
        <li key={block.id} {...item}>
          <BlockButton block={block} />
        </li>
      );
    case "image": {
      const frame = (
        <img src={block.url} alt={block.alt} loading="lazy" style={{ aspectRatio: block.shape === "circle" ? "1 / 1" : RATIO[block.ratio] }} />
      );
      return (
        <li key={block.id} {...item}>
          <figure className={`bv-image bv-image--${block.shape} bv-image--${block.ratio === "auto" ? "auto" : "ratio"}`}>
            {block.href ? (
              <a href={block.href} rel="noopener" aria-label={block.alt || block.caption || block.href}>
                {frame}
              </a>
            ) : (
              <div className="bv-image-frame">{frame}</div>
            )}
            {block.caption ? <figcaption>{block.caption}</figcaption> : null}
          </figure>
        </li>
      );
    }
    case "video": {
      const embed = getYouTubeEmbedUrl(block.url);
      return (
        <li key={block.id} {...item}>
          <div className="bv-video">
            {embed ? (
              <iframe src={embed} title={block.title ?? "Video"} loading="lazy" allow="picture-in-picture; encrypted-media" allowFullScreen />
            ) : FILE_VIDEO.test(block.url) ? (
              <video src={block.url} controls playsInline preload="metadata" aria-label={block.title} />
            ) : (
              <a className="bv-btn" href={block.url} rel="noopener noreferrer" style={{ height: "100%" }}>
                {block.title ?? block.url}
              </a>
            )}
          </div>
        </li>
      );
    }
    case "heading":
      return (
        <li key={block.id} {...item}>
          <h2 className={`bv-heading${block.size === "lg" ? " bv-heading--lg" : ""}`}>{block.text}</h2>
        </li>
      );
    case "text":
      return (
        <li key={block.id} {...item}>
          <p className={`bv-text${block.align === "start" ? " bv-text--start" : ""}`}>{block.text}</p>
        </li>
      );
    case "divider":
      return (
        <li key={block.id} {...item}>
          {block.style === "dots" ? (
            <div className="bv-divider bv-divider--dots" aria-hidden="true">
              •••
            </div>
          ) : (
            <hr className={`bv-divider bv-divider--${block.style}`} />
          )}
        </li>
      );
  }
}

export function BioFloaters({ floaters, position, layer }: { floaters: ResolvedFloater[]; position: "fixed" | "absolute"; layer: "front" | "behind" }) {
  const items = floaters.filter((floater) => floater.layer === layer);
  if (items.length === 0) return null;
  return (
    <div className={`bv-floats bv-floats--${position}${layer === "behind" ? " bv-floats--behind" : ""}`}>
      {items.map((floater) => {
        const style = {
          left: `${floater.x}%`,
          top: `${floater.y}%`,
          width: floater.kind === "button" ? "auto" : floater.size,
          height: floater.kind === "button" ? Math.round(floater.size * 0.62) : floater.size,
          opacity: floater.opacity / 100,
          "--rot": `${floater.rotate}deg`,
          "--c": floater.color,
          "--s": `${floater.size}px`,
          "--ink": readableOn(floater.color),
          "--fs": `${Math.max(12, Math.round(floater.size * 0.22))}px`,
        } as CSSProperties;
        const inner =
          floater.kind === "image" && floater.url ? (
            <img className="bv-float-img" src={floater.url} alt="" />
          ) : floater.kind === "button" ? (
            <span className="bv-float-btn">
              {floater.emoji ? <span aria-hidden="true">{floater.emoji}</span> : null}
              {floater.label ? <span>{floater.label}</span> : null}
            </span>
          ) : (
            <span className={`bv-float-shape bv-shape-${floater.shape}`} />
          );
        const animated = (
          <span className={`bv-float-in${floater.animation !== "none" ? ` bv-anim-${floater.animation}` : ""}`} style={{ display: "block", width: "100%", height: "100%" }}>
            {inner}
          </span>
        );
        const label = floater.label || floater.emoji || floater.href || "";
        return (
          <div key={floater.id} className="bv-float" style={style} aria-hidden={floater.href ? undefined : true}>
            {floater.href ? (
              <a href={floater.href} rel="noopener" aria-label={label} style={{ width: "100%", height: "100%" }}>
                {animated}
              </a>
            ) : (
              animated
            )}
          </div>
        );
      })}
    </div>
  );
}

export function BioContent(props: BioViewProps) {
  const { title, bio, avatarUrl, showFolders, showBranding, socials, design, blocks, folders, labels, homeHref } = props;
  const socialEntries = (Object.keys(SOCIAL_META) as SocialKey[]).filter((key) => socials[key]);

  const rendered: ReactNode[] = [];
  const done = new Set<string>();
  let index = 0;
  for (const block of blocks) {
    if (done.has(block.id)) continue;
    if (showFolders && block.type === "link" && block.folderId) {
      const folder = folders.find((candidate) => candidate.id === block.folderId);
      if (folder) {
        const members = blocks.filter((other): other is Extract<ResolvedBlock, { type: "link" }> => other.type === "link" && other.folderId === folder.id);
        members.forEach((member) => done.add(member.id));
        rendered.push(
          <li key={`folder-${folder.id}`} className="bv-item" style={{ "--i": index++ } as CSSProperties}>
            <details className="bv-folder">
              <summary>
                <span>{folder.name}</span>
                <span className="bv-count">{labels.links(members.length)}</span>
              </summary>
              <ul className="bv-list">
                {members.map((member) => (
                  <li key={member.id}>
                    <BlockButton block={member} />
                  </li>
                ))}
              </ul>
            </details>
          </li>,
        );
        continue;
      }
    }
    rendered.push(renderBlock(block, index++));
  }

  return (
    <>
      <div className="bv-inner">
        {design.coverUrl ? (
          <div className="bv-cover bv-item" style={{ "--i": 0 } as CSSProperties}>
            <img src={design.coverUrl} alt="" />
          </div>
        ) : null}
        <header className="bv-header bv-item" style={{ "--i": 1 } as CSSProperties}>
          {avatarUrl ? (
            <img className="bv-avatar" src={avatarUrl} alt="" width={design.avatarSize} height={design.avatarSize} />
          ) : (
            <div className="bv-avatar" aria-hidden="true">
              {title.trim().charAt(0).toUpperCase() || "?"}
            </div>
          )}
          <h1 className="bv-title">{title}</h1>
          {bio ? <p className="bv-bio">{bio}</p> : null}
        </header>

        {socialEntries.length > 0 ? (
          <ul className="bv-socials bv-item" style={{ "--i": 2 } as CSSProperties}>
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

        {rendered.length === 0 ? <p className="bv-empty">{labels.empty}</p> : <ul className="bv-list">{rendered}</ul>}
      </div>
      {showBranding ? (
        <footer className="bv-foot">{homeHref ? <a href={homeHref}>{labels.poweredBy}</a> : <span>{labels.poweredBy}</span>}</footer>
      ) : null}
    </>
  );
}

export function bioClassName(props: Pick<BioViewProps, "buttonStyle" | "design">): string {
  const { design, buttonStyle } = props;
  const bg = design.background.type === "image" && design.background.imageUrl ? " bv--image" : design.background.type === "gradient" ? " bv--gradient" : "";
  return [
    "bv",
    `bv--${buttonStyle}`,
    `bv--av-${design.avatarShape}`,
    `bv--hover-${design.hover}`,
    design.entrance !== "none" ? `bv--${design.entrance}` : "",
    design.align === "start" ? "bv--start" : "",
    design.coverUrl ? "bv--cover" : "",
  ]
    .join(" ")
    .trim() + bg;
}

export function BioView(props: BioViewProps) {
  const position = props.floatPosition ?? "fixed";
  return (
    <div className={bioClassName(props)} style={bioVars(props.theme, props.design)}>
      <BioFloaters floaters={props.floaters} position={position} layer="behind" />
      <BioContent {...props} />
      <BioFloaters floaters={props.floaters} position={position} layer="front" />
    </div>
  );
}
