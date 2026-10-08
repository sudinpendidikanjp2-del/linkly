import { useI18n } from "@/i18n";
import type { Target } from "@/shared/bio-schema";
import type { LinkDTO } from "@/shared/types";
import { ChoiceField, UrlField } from "./fields";
import { LinkPicker } from "./link-picker";

export type TargetValue = Target | { kind: "link"; linkId: string } | { kind: "url"; url: string } | null | undefined;

/** Chooses where a click goes: a tracked Linkly short link, or any web address. */
export function TargetPicker({ label, value, onChange, links, required = false, error }: { label: string; value: TargetValue; onChange: (value: TargetValue) => void; links: Map<string, LinkDTO>; required?: boolean; error?: string }) {
  const { t } = useI18n();
  const kind = value?.kind ?? (required ? "url" : "none");
  const options = [
    ...(required ? [] : [{ value: "none" as const, label: t("bioEditor.targetNone") }]),
    { value: "link" as const, label: t("bioEditor.targetLink") },
    { value: "url" as const, label: t("bioEditor.targetUrl") },
  ];

  return (
    <div className="grid gap-3">
      <ChoiceField
        label={label}
        value={kind}
        options={options}
        onChange={(next) => {
          if (next === "none") onChange(null);
          else if (next === "link") onChange({ kind: "link", linkId: "" });
          else onChange({ kind: "url", url: "" });
        }}
      />
      {value?.kind === "link" ? (
        <LinkPicker label={t("bioEditor.linkPick")} value={value.linkId} selected={links.get(value.linkId)} onChange={(link) => onChange({ kind: "link", linkId: link.id })} error={error} />
      ) : null}
      {value?.kind === "url" ? <UrlField label={t("bioEditor.targetUrl")} value={value.url} onChange={(url) => onChange({ kind: "url", url })} error={error} hint={undefined} /> : null}
      {value?.kind === "link" ? <p className="-mt-1 text-[13px] text-muted-foreground">{t("bioEditor.targetHint")}</p> : null}
    </div>
  );
}
