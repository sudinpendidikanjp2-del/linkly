import { useRef, useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, ChevronDownIcon, CircleIcon, ImageIcon, MousePointerClickIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n";
import type { TKey } from "@/i18n/types";
import { cn } from "@/lib/utils";
import { FLOATER_ANIMATIONS, FLOATER_SHAPES, MAX_FLOATERS, type FloaterInput } from "@/shared/bio-schema";
import type { LinkDTO } from "@/shared/types";
import { ChoiceField, ColorField, SliderField, TextField, UrlField, newId } from "./fields";
import { TargetPicker, type TargetValue } from "./target-picker";

const KIND_ICON = { image: ImageIcon, shape: CircleIcon, button: MousePointerClickIcon } as const;
const KIND_LABEL: Record<FloaterInput["kind"], TKey> = { image: "bioEditor.floatImage", shape: "bioEditor.floatShape", button: "bioEditor.floatButton" };
const SHAPE_LABEL: Record<(typeof FLOATER_SHAPES)[number], TKey> = {
  circle: "bioEditor.shapeCircleF",
  square: "bioEditor.shapeSquareF",
  diamond: "bioEditor.shapeDiamond",
  triangle: "bioEditor.shapeTriangle",
  ring: "bioEditor.shapeRing",
  blob: "bioEditor.shapeBlob",
  star: "bioEditor.shapeStar",
};
const ANIM_LABEL: Record<(typeof FLOATER_ANIMATIONS)[number], TKey> = {
  none: "bioEditor.animNone",
  float: "bioEditor.animFloat",
  pulse: "bioEditor.animPulse",
  spin: "bioEditor.animSpin",
  bounce: "bioEditor.animBounce",
};

export function createFloater(kind: FloaterInput["kind"]): FloaterInput {
  const base = { id: newId(), kind, x: 84, y: 86, size: kind === "button" ? 96 : 64, opacity: 100, rotate: 0, animation: "none" as const, layer: "front" as const, color: "#2dd4bf", shape: "circle" as const };
  if (kind === "button") return { ...base, label: "", emoji: "💬", target: { kind: "url", url: "" }, animation: "float" };
  if (kind === "image") return { ...base, url: "", color: "#ffffff", target: null };
  return { ...base, shape: "blob", color: "#2dd4bf", opacity: 60, layer: "behind", x: 14, y: 18, size: 120, target: null };
}

/** A small stage that mirrors the phone screen. Drag, tap or use arrow keys to place the element. */
function PositionPad({ x, y, onChange, label }: { x: number; y: number; onChange: (x: number, y: number) => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

  const place = (event: React.PointerEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    onChange(clamp(((event.clientX - rect.left) / rect.width) * 100), clamp(((event.clientY - rect.top) / rect.height) * 100));
  };

  return (
    <div
      ref={ref}
      role="application"
      aria-label={label}
      tabIndex={0}
      className={cn("relative mx-auto aspect-[9/16] w-40 cursor-crosshair touch-none rounded-2xl border-2 bg-muted outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40", dragging && "border-brand")}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
        place(event);
      }}
      onPointerMove={(event) => dragging && place(event)}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      onKeyDown={(event) => {
        const step = event.shiftKey ? 10 : 2;
        const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
        const move = moves[event.key];
        if (!move) return;
        event.preventDefault();
        onChange(clamp(x + move[0]), clamp(y + move[1]));
      }}
    >
      <span className="pointer-events-none absolute inset-x-3 top-3 h-2 rounded-full bg-border" aria-hidden="true" />
      <span className="pointer-events-none absolute inset-x-3 top-8 h-5 rounded-md bg-border/70" aria-hidden="true" />
      <span className="pointer-events-none absolute inset-x-3 top-16 h-5 rounded-md bg-border/70" aria-hidden="true" />
      <span className="pointer-events-none absolute inset-x-3 top-24 h-5 rounded-md bg-border/70" aria-hidden="true" />
      <span className="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-brand shadow-md" style={{ left: `${x}%`, top: `${y}%` }} aria-hidden="true" />
    </div>
  );
}

interface Props {
  floaters: FloaterInput[];
  onChange: (floaters: FloaterInput[]) => void;
  links: Map<string, LinkDTO>;
  errorsAt: (index: number) => Record<string, string>;
}

export function FloatersEditor({ floaters, onChange, links, errorsAt }: Props) {
  const { t } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);

  const replace = (index: number, patch: Partial<FloaterInput>) => onChange(floaters.map((floater, i) => (i === index ? ({ ...floater, ...patch } as FloaterInput) : floater)));
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= floaters.length) return;
    const next = [...floaters];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="grid gap-3">
      {floaters.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{t("bioEditor.floatEmpty")}</p>
      ) : (
        <ol className="grid gap-2">
          {floaters.map((floater, index) => {
            const Icon = KIND_ICON[floater.kind];
            const errors = errorsAt(index);
            const hasError = Object.keys(errors).length > 0;
            const open = openId === floater.id;
            const title = floater.label || (floater.kind === "shape" ? t(SHAPE_LABEL[floater.shape ?? "circle"]) : t(KIND_LABEL[floater.kind]));
            return (
              <li key={floater.id} className={cn("rounded-xl border bg-card", hasError && "border-destructive/60")}>
                <Collapsible open={open} onOpenChange={(next) => setOpenId(next ? floater.id : null)}>
                  <div className="flex items-center gap-1 p-1.5">
                    <CollapsibleTrigger className="press flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg px-2 text-left outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/30" aria-label={`${t(KIND_LABEL[floater.kind])}: ${title}`}>
                      <span className="grid size-8 shrink-0 place-items-center rounded-md" style={{ background: floater.kind === "image" ? undefined : floater.color }}>
                        <Icon className={cn("size-4", floater.kind === "image" && "text-muted-foreground")} style={floater.kind === "image" ? undefined : { color: "rgba(0,0,0,.55)" }} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] text-muted-foreground">{t(KIND_LABEL[floater.kind])}</span>
                        <span className={cn("block truncate text-sm font-medium", hasError && "text-destructive-text")}>{title}</span>
                      </span>
                      <ChevronDownIcon className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-ios", open && "rotate-180")} />
                    </CollapsibleTrigger>
                    <Button type="button" variant="ghost" size="icon-sm" disabled={index === 0} aria-label={t("bio.moveUp", { title })} onClick={() => move(index, -1)}>
                      <ArrowUpIcon />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" disabled={index === floaters.length - 1} aria-label={t("bio.moveDown", { title })} onClick={() => move(index, 1)}>
                      <ArrowDownIcon />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" className="text-destructive-text hover:bg-destructive-soft hover:text-destructive-text" aria-label={`${t("common.remove")}: ${title}`} onClick={() => onChange(floaters.filter((_, i) => i !== index))}>
                      <Trash2Icon />
                    </Button>
                  </div>
                  <CollapsibleContent className="data-[state=open]:animate-in data-[state=open]:fade-in-0">
                    <div className="grid gap-5 border-t p-4">
                      {floater.kind === "image" ? <UrlField label={t("bioEditor.imageUrl")} value={floater.url ?? ""} onChange={(url) => replace(index, { url })} error={errors.url} /> : null}
                      {floater.kind === "shape" ? (
                        <ChoiceField label={t("bioEditor.floatShape")} value={floater.shape ?? "circle"} onChange={(shape) => replace(index, { shape })} options={FLOATER_SHAPES.map((shape) => ({ value: shape, label: t(SHAPE_LABEL[shape]) }))} />
                      ) : null}
                      {floater.kind !== "image" ? <ColorField label={t("bioEditor.floatColor")} value={floater.color} fallback="#2dd4bf" onChange={(color) => replace(index, { color: color ?? "#2dd4bf" })} /> : null}
                      {floater.kind === "button" ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <TextField label={t("bioEditor.floatLabel")} value={floater.label ?? ""} onChange={(label) => replace(index, { label })} maxLength={40} />
                          <TextField label={t("bioEditor.emoji")} value={floater.emoji ?? ""} onChange={(emoji) => replace(index, { emoji })} maxLength={8} />
                        </div>
                      ) : null}

                      <TargetPicker
                        label={floater.kind === "button" ? t("bioEditor.buttonTarget") : t("bioEditor.floatTarget")}
                        required={floater.kind === "button"}
                        value={floater.target as TargetValue}
                        onChange={(target) => replace(index, { target } as Partial<FloaterInput>)}
                        links={links}
                        error={errors.target ?? errors["target.url"] ?? errors["target.linkId"]}
                      />
                      {floater.kind !== "button" && !floater.target ? <p className="-mt-3 text-[13px] text-muted-foreground">{t("bioEditor.floatDecorative")}</p> : null}

                      <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-start">
                        <div className="grid gap-2">
                          <Label>{t("bioEditor.floatPosition")}</Label>
                          <PositionPad x={floater.x ?? 50} y={floater.y ?? 50} label={t("bioEditor.floatPositionLabel")} onChange={(x, y) => replace(index, { x, y })} />
                          <p className="max-w-40 text-[13px] text-muted-foreground">{t("bioEditor.floatPositionHint")}</p>
                        </div>
                        <div className="grid gap-5">
                          <SliderField label="X" value={floater.x ?? 50} min={0} max={100} unit="%" onChange={(x) => replace(index, { x })} />
                          <SliderField label="Y" value={floater.y ?? 50} min={0} max={100} unit="%" onChange={(y) => replace(index, { y })} />
                          <SliderField label={t("bioEditor.floatSize")} value={floater.size ?? 64} min={24} max={240} unit="px" onChange={(size) => replace(index, { size })} />
                          <SliderField label={t("bioEditor.floatOpacity")} value={floater.opacity ?? 100} min={10} max={100} unit="%" onChange={(opacity) => replace(index, { opacity })} />
                          <SliderField label={t("bioEditor.floatRotate")} value={floater.rotate ?? 0} min={-180} max={180} unit="°" onChange={(rotate) => replace(index, { rotate })} />
                        </div>
                      </div>

                      <ChoiceField label={t("bioEditor.floatAnimation")} value={floater.animation ?? "none"} onChange={(animation) => replace(index, { animation })} options={FLOATER_ANIMATIONS.map((animation) => ({ value: animation, label: t(ANIM_LABEL[animation]) }))} />
                      <ChoiceField
                        label={t("bioEditor.floatLayer")}
                        value={floater.layer ?? "front"}
                        onChange={(layer) => replace(index, { layer })}
                        options={[
                          { value: "front", label: t("bioEditor.layerFront") },
                          { value: "behind", label: t("bioEditor.layerBehind") },
                        ]}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </li>
            );
          })}
        </ol>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" className="w-full justify-center" disabled={floaters.length >= MAX_FLOATERS}>
            <PlusIcon /> {floaters.length >= MAX_FLOATERS ? t("bioEditor.floatLimit", { max: MAX_FLOATERS }) : t("bioEditor.addFloat")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-56">
          {(["button", "image", "shape"] as const).map((kind) => {
            const Icon = KIND_ICON[kind];
            return (
              <DropdownMenuItem
                key={kind}
                onSelect={() => {
                  const created = createFloater(kind);
                  onChange([...floaters, created]);
                  setOpenId(created.id);
                }}
              >
                <Icon /> {t(KIND_LABEL[kind])}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
