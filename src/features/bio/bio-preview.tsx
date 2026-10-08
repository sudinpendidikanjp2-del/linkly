import { useMemo } from "react";
import { BIO_CSS, BioView } from "@/shared/bio-view";
import { useI18n } from "@/i18n";
import type { BioInput } from "@/shared/schemas";
import type { LinkDTO } from "@/shared/types";
import type { SocialKey } from "@/shared/schemas";

/** Renders the exact component the public page uses, so the preview cannot drift from the real thing. */
export function BioPreview({ values, links }: { values: BioInput; links: LinkDTO[] }) {
  const { t } = useI18n();

  const { viewLinks, folders } = useMemo(() => {
    const folderMap = new Map<string, string>();
    for (const link of links) if (link.collectionId && link.collectionName) folderMap.set(link.collectionId, link.collectionName);
    return {
      viewLinks: links.map((link) => ({ id: link.id, title: link.title, href: `/${link.slug}`, folderId: link.collectionId })),
      folders: [...folderMap].map(([id, name]) => ({ id, name })),
    };
  }, [links]);

  return (
    <div
      className="mx-auto h-[600px] w-full max-w-[340px] overflow-hidden rounded-[2rem] border-[6px] border-foreground/90 bg-card"
      role="region"
      aria-label={t("bio.tabPreview")}
    >
      <style>{BIO_CSS}</style>
      {/* `inert` keeps the preview out of the tab order and stops links from navigating away. */}
      <div className="h-full overflow-y-auto" inert>
        <BioView
          title={values.title || "..."}
          bio={values.bio}
          avatarUrl={values.avatarUrl || null}
          bgImageUrl={values.bgImageUrl || null}
          theme={values.theme}
          buttonStyle={values.buttonStyle}
          videoUrl={values.videoUrl || null}
          showFolders={values.showFolders}
          socials={(values.socials ?? {}) as Partial<Record<SocialKey, string>>}
          links={viewLinks}
          folders={folders}
          labels={{ links: (count) => t("bio.previewCount", { count }), empty: t("bio.previewEmpty"), poweredBy: t("bio.poweredBy") }}
        />
      </div>
    </div>
  );
}
