import type { BioPage } from "@prisma/client";
import { BIO_CSS, BioView, type BioViewLink } from "../../src/shared/bio-view";
import { getBioTheme } from "../../src/shared/bio-themes";
import type { SocialKey } from "../../src/shared/schemas";
import { renderDocument, type Locale } from "./render";

const LABELS = {
  id: { links: (n: number) => `${n} tautan`, empty: "Belum ada tautan.", poweredBy: "Dibuat dengan Linkly" },
  en: { links: (n: number) => `${n} ${n === 1 ? "link" : "links"}`, empty: "No links yet.", poweredBy: "Made with Linkly" },
} as const;

export function bioPageHtml(
  lang: Locale,
  page: BioPage,
  links: BioViewLink[],
  folders: { id: string; name: string }[],
) {
  const theme = getBioTheme(page.theme);
  const css = `html,body{margin:0;min-height:100%;background:${theme.bg}}${BIO_CSS}`;
  return renderDocument({
    title: page.title,
    lang,
    css,
    description: page.bio ?? undefined,
    body: (
      <BioView
        title={page.title}
        bio={page.bio}
        avatarUrl={page.avatarUrl}
        bgImageUrl={page.bgImageUrl}
        theme={page.theme}
        buttonStyle={page.buttonStyle}
        videoUrl={page.videoUrl}
        showFolders={page.showFolders}
        socials={(page.socials ?? {}) as Partial<Record<SocialKey, string>>}
        links={links}
        folders={folders}
        labels={LABELS[lang]}
        homeHref="/"
      />
    ),
  });
}
