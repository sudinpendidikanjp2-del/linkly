import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

export type Locale = "id" | "en";

export function pickLocale(acceptLanguage: string | undefined): Locale {
  return acceptLanguage?.toLowerCase().startsWith("en") ? "en" : "id";
}

export const PUBLIC_CSS = `
:root{color-scheme:light dark;--bg:#f6f6f4;--card:#fff;--fg:#17181c;--muted:#5b5f6a;--border:#e2e1dc;--accent:#0f766e;--accent-fg:#fff;--danger:#b42318;--danger-bg:#fef3f2}
@media (prefers-color-scheme:dark){:root{--bg:#0e0f12;--card:#17181c;--fg:#f2f3f5;--muted:#a0a5b0;--border:#2a2d35;--accent:#2dd4bf;--accent-fg:#042f2c;--danger:#fda29b;--danger-bg:#2a1210}}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px 16px;background:var(--bg);color:var(--fg);font:16px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
.card{width:100%;max-width:420px;background:var(--card);border:1px solid var(--border);border-radius:20px;padding:32px 28px;display:flex;flex-direction:column;gap:20px}
.stack{display:flex;flex-direction:column;gap:8px}
h1{margin:0;font-size:24px;line-height:1.2;letter-spacing:-.02em;font-weight:650}
p{margin:0;color:var(--muted)}
.code{font:600 13px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--muted);letter-spacing:.02em}
.code b{color:var(--fg)}
.media{width:64px;height:64px;border-radius:16px;object-fit:cover;border:1px solid var(--border)}
.dest{display:flex;flex-direction:column;gap:2px;padding:12px 14px;border:1px solid var(--border);border-radius:12px;overflow:hidden}
.dest small{color:var(--muted);font-size:13px}
.dest span{font:500 14px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;word-break:break-all}
label{font-size:14px;font-weight:600}
input{width:100%;height:48px;padding:0 14px;font:inherit;color:var(--fg);background:var(--bg);border:1px solid var(--border);border-radius:12px}
input:focus-visible,.btn:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.btn{display:flex;align-items:center;justify-content:center;width:100%;height:48px;border:0;border-radius:12px;background:var(--accent);color:var(--accent-fg);font:600 16px/1 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-decoration:none;cursor:pointer;transition:transform .2s cubic-bezier(.32,.72,0,1)}
.btn:active{transform:scale(.98)}
.alert{padding:12px 14px;border-radius:12px;background:var(--danger-bg);color:var(--danger);font-size:14px;font-weight:500}
.foot{font-size:13px;text-align:center}
.foot a{color:inherit;text-underline-offset:3px}
@media (prefers-reduced-motion:reduce){.btn{transition:none}}
`;

export function renderDocument(options: {
  title: string;
  lang: Locale;
  css: string;
  body: ReactNode;
  noindex?: boolean;
  description?: string;
}): string {
  const html = renderToStaticMarkup(
    <html lang={options.lang}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {options.noindex ? <meta name="robots" content="noindex, nofollow" /> : null}
        {options.description ? <meta name="description" content={options.description} /> : null}
        <title>{options.title}</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <style dangerouslySetInnerHTML={{ __html: options.css }} />
      </head>
      <body>{options.body}</body>
    </html>,
  );
  return `<!doctype html>${html}`;
}
