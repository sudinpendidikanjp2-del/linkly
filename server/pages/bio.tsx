import type { BioPage } from "@prisma/client";
import { BIO_CSS, BioView, resolveTheme } from "../../src/shared/bio-view";
import type { Block, Design, Floater, SocialKey } from "../../src/shared/bio-schema";
import { resolveBlocks, resolveFloaters, foldersOf, type LinkRef } from "../../src/shared/bio-resolve";
import { renderDocument, type Locale } from "./render";

const LABELS = {
  id: { links: (n: number) => `${n} tautan`, empty: "Belum ada konten.", poweredBy: "Dibuat dengan Linkly" },
  en: { links: (n: number) => `${n} ${n === 1 ? "link" : "links"}`, empty: "Nothing here yet.", poweredBy: "Made with Linkly" },
} as const;

export function bioPageHtml(
  lang: Locale,
  page: BioPage,
  data: { design: Design; blocks: Block[]; floaters: Floater[] },
  refs: Map<string, LinkRef>,
  origin: string,
) {
  const theme = resolveTheme(page.theme, data.design.colors);
  const blocks = resolveBlocks(data.blocks, refs);
  const floaters = resolveFloaters(data.floaters, refs);
  const folders = foldersOf(refs.values());
  const title = page.seoTitle || page.title;
  const description = page.seoDescription || page.bio || undefined;
  const image = page.ogImageUrl || page.avatarUrl || undefined;
  const url = `${origin}/b/${page.handle}`;

  return renderDocument({
    title,
    lang,
    css: `html,body{margin:0;min-height:100%;background:${theme.bg}}${BIO_CSS}`,
    description,
    head: (
      <>
        <link rel="canonical" href={url} />
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={title} />
        <meta property="og:url" content={url} />
        {description ? <meta property="og:description" content={description} /> : null}
        {image ? <meta property="og:image" content={image} /> : null}
        <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
        <meta name="theme-color" content={theme.bg} />
      </>
    ),
    body: (
      <BioView
        title={page.title}
        bio={page.bio}
        avatarUrl={page.avatarUrl}
        theme={page.theme}
        buttonStyle={page.buttonStyle}
        showFolders={page.showFolders}
        showBranding={page.showBranding}
        socials={(page.socials ?? {}) as Partial<Record<SocialKey, string>>}
        design={data.design}
        blocks={blocks}
        floaters={floaters}
        folders={folders}
        labels={LABELS[lang]}
        homeHref="/"
        floatPosition="fixed"
      />
    ),
  });
}
