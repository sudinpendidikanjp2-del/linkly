import { useMemo } from "react";
import { BIO_CSS, BioContent, BioFloaters, bioClassName, bioVars } from "@/shared/bio-view";
import { blockSchema, designSchema, floaterSchema, type BioInput, type SocialKey } from "@/shared/bio-schema";
import { foldersOf, resolveBlocks, resolveFloaters, type LinkRef } from "@/shared/bio-resolve";
import { useI18n } from "@/i18n";
import type { LinkDTO } from "@/shared/types";

const defaultDesign = designSchema.parse({});

/** Renders the same components as the public page. Incomplete drafts are skipped instead of breaking the preview. */
export function BioPreview({ values, links }: { values: BioInput; links: Map<string, LinkDTO> }) {
  const { t } = useI18n();

  const model = useMemo(() => {
    const design = designSchema.safeParse(values.design ?? {});
    const blocks = (values.blocks ?? []).flatMap((entry) => {
      const parsed = blockSchema.safeParse(entry);
      return parsed.success ? [parsed.data] : [];
    });
    const floaters = (values.floaters ?? []).flatMap((entry) => {
      const parsed = floaterSchema.safeParse(entry);
      return parsed.success ? [parsed.data] : [];
    });
    const refs = new Map<string, LinkRef>();
    for (const link of links.values()) {
      refs.set(link.id, { id: link.id, title: link.title, slug: link.slug, collectionId: link.collectionId, collectionName: link.collectionName, active: link.status === "active" });
    }
    return {
      design: design.success ? design.data : defaultDesign,
      blocks: resolveBlocks(blocks, refs),
      floaters: resolveFloaters(floaters, refs),
      folders: foldersOf(refs.values()),
    };
  }, [values.design, values.blocks, values.floaters, links]);

  const viewProps = {
    title: values.title || "...",
    bio: values.bio,
    avatarUrl: values.avatarUrl || null,
    theme: values.theme,
    buttonStyle: values.buttonStyle,
    showFolders: values.showFolders,
    showBranding: values.showBranding ?? true,
    socials: (values.socials ?? {}) as Partial<Record<SocialKey, string>>,
    design: model.design,
    blocks: model.blocks,
    floaters: model.floaters,
    folders: model.folders,
    labels: { links: (count: number) => t("bio.previewCount", { count }), empty: t("bio.previewEmpty"), poweredBy: t("bio.poweredBy") },
  };
  const vars = bioVars(values.theme, model.design);

  return (
    <div className="relative mx-auto h-[640px] w-full max-w-[340px] overflow-hidden rounded-[2rem] border-[6px] border-foreground/90 bg-card" role="region" aria-label={t("bio.tabPreview")}>
      <style>{BIO_CSS}</style>
      {/* `inert` keeps the preview out of the tab order and stops links from navigating away. */}
      <div className="h-full overflow-y-auto" inert>
        <div className={bioClassName(viewProps)} style={vars}>
          <BioFloaters floaters={model.floaters} position="absolute" layer="behind" />
          <BioContent {...viewProps} />
        </div>
      </div>
      {/* Front floaters sit above the scroll area, like position:fixed on the real page. */}
      <div className={bioClassName(viewProps)} inert style={{ ...vars, position: "absolute", inset: 0, padding: 0, minHeight: 0, background: "none", pointerEvents: "none", overflow: "hidden", display: "block" }}>
        <BioFloaters floaters={model.floaters} position="absolute" layer="front" />
      </div>
    </div>
  );
}
