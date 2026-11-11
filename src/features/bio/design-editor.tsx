import { TriangleAlertIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/i18n";
import type { TKey } from "@/i18n/types";
import { BIO_BUTTON_STYLES, BIO_FONTS, BIO_THEME_IDS, type BioInput, type DesignInput } from "@/shared/bio-schema";
import { BIO_THEMES } from "@/shared/bio-themes";
import { resolveTheme } from "@/shared/bio-view";
import { contrastRatio } from "@/shared/color";
import { ChoiceField, ColorField, SliderField, UrlField } from "./fields";

const FONT_STACK: Record<(typeof BIO_FONTS)[number], string> = {
  sans: "ui-sans-serif, system-ui, sans-serif",
  serif: "ui-serif, Georgia, serif",
  rounded: 'ui-rounded, "SF Pro Rounded", Nunito, system-ui, sans-serif',
  humanist: 'Seravek, "Gill Sans Nova", Calibri, sans-serif',
  mono: "ui-monospace, Menlo, monospace",
};
const FONT_LABEL: Record<(typeof BIO_FONTS)[number], TKey> = { sans: "bioEditor.fontSans", serif: "bioEditor.fontSerif", rounded: "bioEditor.fontRounded", humanist: "bioEditor.fontHumanist", mono: "bioEditor.fontMono" };
const STYLE_LABEL: Record<(typeof BIO_BUTTON_STYLES)[number], TKey> = { classic: "bio.styleClassic", pill: "bio.stylePill", outline: "bio.styleOutline", hard: "bio.styleHard", soft: "bio.styleSoft" };

interface Props {
  values: BioInput;
  design: DesignInput;
  onDesign: (patch: Partial<DesignInput>) => void;
  onField: (patch: Partial<Pick<BioInput, "theme" | "buttonStyle" | "showFolders">>) => void;
}

function Group({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="grid gap-6">{children}</CardContent>
    </Card>
  );
}

export function DesignEditor({ values, design, onDesign, onField }: Props) {
  const { t } = useI18n();
  const colors = design.colors ?? {};
  const background = { type: "theme" as const, from: "#0f766e", to: "#17181c", angle: 160, imageUrl: "", dim: 35, ...(design.background ?? {}) };
  const resolved = resolveTheme(values.theme, { bg: colors.bg ?? undefined, fg: colors.fg ?? undefined, surface: colors.surface ?? undefined, accent: colors.accent ?? undefined });

  const textContrast =
    background.type === "gradient"
      ? Math.min(contrastRatio(resolved.fg, background.from), contrastRatio(resolved.fg, background.to))
      : contrastRatio(resolved.fg, resolved.bg);
  const cardContrast = contrastRatio(resolved.fg, resolved.surface);
  const lowest = Math.min(textContrast, cardContrast);

  const setColors = (patch: Partial<NonNullable<DesignInput["colors"]>>) => onDesign({ colors: { ...colors, ...patch } });
  const setBackground = (patch: Partial<typeof background>) => onDesign({ background: { ...background, ...patch } });
  const hasCustom = Object.values(colors).some(Boolean);

  return (
    <div className="grid gap-6">
      <Group title={t("bioEditor.groupColors")}>
        <div className="grid gap-2">
          <Label id="bio-theme-label">{t("bio.theme")}</Label>
          <RadioGroup value={values.theme} onValueChange={(theme) => onField({ theme: theme as BioInput["theme"] })} aria-labelledby="bio-theme-label" className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {BIO_THEME_IDS.map((id) => {
              const theme = BIO_THEMES[id];
              return (
                <label key={id} className="relative flex cursor-pointer flex-col gap-2 rounded-lg border p-2 transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40 has-[[data-state=checked]]:border-brand has-[[data-state=checked]]:bg-brand-soft">
                  <RadioGroupItem value={id} className="sr-only" aria-label={t("bio.themeLabel", { name: theme.label })} />
                  <span className="flex h-10 items-end gap-1 rounded-md p-1.5" style={{ background: theme.bg, border: `1px solid ${theme.border}` }} aria-hidden="true">
                    <span className="h-2 w-6 rounded-sm" style={{ background: theme.fg }} />
                    <span className="size-2.5 rounded-full" style={{ background: theme.accent }} />
                  </span>
                  <span className="text-[13px] font-medium">{theme.label}</span>
                </label>
              );
            })}
          </RadioGroup>
        </div>

        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{t("bioEditor.customColors")}</p>
              <p className="text-[13px] text-muted-foreground">{t("bioEditor.customColorsHint")}</p>
            </div>
            {hasCustom ? (
              <button type="button" className="press rounded-md px-2 py-1.5 text-[13px] font-medium text-brand-text hover:bg-brand-soft focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:outline-none" onClick={() => onDesign({ colors: {} })}>
                {t("bioEditor.colorsReset")}
              </button>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ColorField label={t("bioEditor.colorBg")} value={colors.bg ?? undefined} fallback={resolved.bg} onChange={(bg) => setColors({ bg })} />
            <ColorField label={t("bioEditor.colorFg")} value={colors.fg ?? undefined} fallback={resolved.fg} onChange={(fg) => setColors({ fg })} />
            <ColorField label={t("bioEditor.colorSurface")} value={colors.surface ?? undefined} fallback={resolved.surface} onChange={(surface) => setColors({ surface })} />
            <ColorField label={t("bioEditor.colorAccent")} value={colors.accent ?? undefined} fallback={resolved.accent} onChange={(accent) => setColors({ accent })} />
          </div>
          {lowest < 4.5 ? (
            <p role="alert" className="flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-[13px] font-medium text-warning-text">
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
              {t("bioEditor.contrastWarn", { ratio: lowest.toFixed(1) })}
            </p>
          ) : null}
        </div>
      </Group>

      <Group title={t("bioEditor.groupBackground")}>
        <ChoiceField
          label={t("bioEditor.bgType")}
          value={background.type}
          onChange={(type) => setBackground({ type })}
          options={[
            { value: "theme", label: t("bioEditor.bgTheme") },
            { value: "gradient", label: t("bioEditor.bgGradient") },
            { value: "image", label: t("bioEditor.bgImage") },
          ]}
        />
        {background.type === "gradient" ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ColorField label={t("bioEditor.gradFrom")} value={background.from} fallback={background.from} onChange={(from) => setBackground({ from: from ?? "#0f766e" })} />
              <ColorField label={t("bioEditor.gradTo")} value={background.to} fallback={background.to} onChange={(to) => setBackground({ to: to ?? "#17181c" })} />
            </div>
            <SliderField label={t("bioEditor.gradAngle")} value={background.angle} min={0} max={360} unit="°" onChange={(angle) => setBackground({ angle })} />
          </>
        ) : null}
        {background.type === "image" ? (
          <>
            <UrlField label={t("bioEditor.imgUrl")} value={background.imageUrl ?? ""} onChange={(imageUrl) => setBackground({ imageUrl })} />
            <SliderField label={t("bioEditor.imgDim")} value={background.dim} min={0} max={85} unit="%" onChange={(dim) => setBackground({ dim })} hint={t("bioEditor.imgDimHint")} />
          </>
        ) : null}
        <UrlField label={t("bioEditor.coverUrl")} value={design.coverUrl ?? ""} onChange={(coverUrl) => onDesign({ coverUrl })} hint={t("bioEditor.coverHint")} />
      </Group>

      <Group title={t("bioEditor.groupButtons")}>
        <ChoiceField label={t("bio.buttonStyle")} value={values.buttonStyle} onChange={(buttonStyle) => onField({ buttonStyle })} options={BIO_BUTTON_STYLES.map((style) => ({ value: style, label: t(STYLE_LABEL[style]) }))} />
        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="radius-auto">{t("bioEditor.radiusAuto")}</Label>
            <Switch id="radius-auto" checked={design.buttonRadius == null} onCheckedChange={(auto) => onDesign({ buttonRadius: auto ? null : 14 })} />
          </div>
          {design.buttonRadius != null ? <SliderField label={t("bioEditor.radius")} value={design.buttonRadius} min={0} max={32} unit="px" onChange={(buttonRadius) => onDesign({ buttonRadius })} /> : null}
        </div>
        <ChoiceField label={t("bioEditor.btnSize")} value={design.buttonSize ?? "md"} onChange={(buttonSize) => onDesign({ buttonSize })} options={[{ value: "sm", label: t("bioEditor.sizeSm") }, { value: "md", label: t("bioEditor.sizeMd") }, { value: "lg", label: t("bioEditor.sizeLg") }]} />
        <ChoiceField label={t("bioEditor.hover")} value={design.hover ?? "lift"} onChange={(hover) => onDesign({ hover })} options={[{ value: "lift", label: t("bioEditor.hovLift") }, { value: "grow", label: t("bioEditor.hovGrow") }, { value: "none", label: t("bioEditor.hovNone") }]} />
      </Group>

      <Group title={t("bioEditor.groupLayout")}>
        <div className="grid gap-2">
          <Label id="font-label">{t("bioEditor.font")}</Label>
          <RadioGroup value={design.font ?? "sans"} onValueChange={(font) => onDesign({ font: font as DesignInput["font"] })} aria-labelledby="font-label" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {BIO_FONTS.map((font) => (
              <label key={font} className="relative flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40 has-[[data-state=checked]]:border-brand has-[[data-state=checked]]:bg-brand-soft">
                <RadioGroupItem value={font} className="sr-only" />
                <span className="text-xl leading-none" style={{ fontFamily: FONT_STACK[font] }} aria-hidden="true">
                  Ag
                </span>
                <span className="text-[13px] font-medium">{t(FONT_LABEL[font])}</span>
              </label>
            ))}
          </RadioGroup>
        </div>
        <ChoiceField label={t("bioEditor.avatarShape")} value={design.avatarShape ?? "circle"} onChange={(avatarShape) => onDesign({ avatarShape })} options={[{ value: "circle", label: t("bioEditor.shapeCircle") }, { value: "rounded", label: t("bioEditor.shapeRounded") }, { value: "square", label: t("bioEditor.shapeSquare") }]} />
        <SliderField label={t("bioEditor.avatarSize")} value={design.avatarSize ?? 96} min={64} max={160} unit="px" onChange={(avatarSize) => onDesign({ avatarSize })} />
        <ChoiceField label={t("bioEditor.align")} value={design.align ?? "center"} onChange={(align) => onDesign({ align })} options={[{ value: "center", label: t("bioEditor.alignCenter") }, { value: "start", label: t("bioEditor.alignStart") }]} />
        <ChoiceField label={t("bioEditor.width")} value={design.width ?? "narrow"} onChange={(width) => onDesign({ width })} options={[{ value: "narrow", label: t("bioEditor.widthNarrow") }, { value: "wide", label: t("bioEditor.widthWide") }]} />
        <ChoiceField label={t("bioEditor.spacing")} value={design.spacing ?? "normal"} onChange={(spacing) => onDesign({ spacing })} options={[{ value: "tight", label: t("bioEditor.spTight") }, { value: "normal", label: t("bioEditor.spNormal") }, { value: "loose", label: t("bioEditor.spLoose") }]} />
        <ChoiceField label={t("bioEditor.entrance")} value={design.entrance ?? "rise"} onChange={(entrance) => onDesign({ entrance })} options={[{ value: "none", label: t("bioEditor.entNone") }, { value: "fade", label: t("bioEditor.entFade") }, { value: "rise", label: t("bioEditor.entRise") }]} />
        <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
          <Label htmlFor="show-folders" className="leading-snug">
            {t("bio.showFolders")}
          </Label>
          <Switch id="show-folders" checked={values.showFolders} onCheckedChange={(showFolders) => onField({ showFolders })} />
        </div>
      </Group>
    </div>
  );
}
