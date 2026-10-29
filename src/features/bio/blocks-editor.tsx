import { useState, type ReactNode } from "react";
import { AlignLeftIcon, ArrowDownIcon, ArrowUpIcon, ChevronDownIcon, CopyIcon, HeadingIcon, ImageIcon, Link2Icon, MinusIcon, MousePointerClickIcon, PlusIcon, Trash2Icon, VideoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useI18n } from "@/i18n";
import type { TKey } from "@/i18n/types";
import { hostOf } from "@/lib/links";
import { cn } from "@/lib/utils";
import { MAX_BLOCKS, type BlockInput, type BlockType } from "@/shared/bio-schema";
import type { LinkDTO } from "@/shared/types";
import { ChoiceField, Field, TextField, UrlField, newId } from "./fields";
import { LinkPicker } from "./link-picker";
import { TargetPicker, type TargetValue } from "./target-picker";

const ICONS: Record<BlockType, typeof Link2Icon> = { link: Link2Icon, button: MousePointerClickIcon, image: ImageIcon, video: VideoIcon, heading: HeadingIcon, text: AlignLeftIcon, divider: MinusIcon };
const LABEL: Record<BlockType, TKey> = { link: "bioEditor.blockLink", button: "bioEditor.blockButton", image: "bioEditor.blockImage", video: "bioEditor.blockVideo", heading: "bioEditor.blockHeading", text: "bioEditor.blockText", divider: "bioEditor.blockDivider" };
const ORDER: BlockType[] = ["link", "button", "image", "video", "heading", "text", "divider"];

export function createBlock(type: BlockType): BlockInput {
  const id = newId();
  switch (type) {
    case "link":
      return { type, id, linkId: "", highlight: false };
    case "button":
      return { type, id, label: "", target: { kind: "url", url: "" }, highlight: false };
    case "image":
      return { type, id, url: "", alt: "", shape: "rounded", ratio: "auto", target: null };
    case "video":
      return { type, id, url: "" };
    case "heading":
      return { type, id, text: "", size: "md" };
    case "text":
      return { type, id, text: "", align: "center" };
    case "divider":
      return { type, id, style: "line" };
  }
}

interface Props {
  blocks: BlockInput[];
  onChange: (blocks: BlockInput[]) => void;
  links: Map<string, LinkDTO>;
  /** Field-level error codes for the block at `index`, keyed by field name. */
  errorsAt: (index: number) => Record<string, string>;
}

function summary(block: BlockInput, links: Map<string, LinkDTO>, empty: string): string {
  switch (block.type) {
    case "link":
      return links.get(block.linkId)?.title ?? empty;
    case "button":
      return block.label || empty;
    case "image":
      return block.alt || (block.url ? hostOf(block.url) : empty);
    case "video":
      return block.title || (block.url ? hostOf(block.url) : empty);
    case "heading":
    case "text":
      return block.text.slice(0, 48) || empty;
    case "divider":
      return block.style ?? "line";
  }
}

export function BlocksEditor({ blocks, onChange, links, errorsAt }: Props) {
  const { t } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);

  const replace = (index: number, next: BlockInput) => onChange(blocks.map((block, i) => (i === index ? next : block)));
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="grid gap-3">
      {blocks.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{t("bioEditor.blocksEmpty")}</p>
      ) : (
        <ol className="grid gap-2">
          {blocks.map((block, index) => {
            const Icon = ICONS[block.type];
            const errors = errorsAt(index);
            const hasError = Object.keys(errors).length > 0;
            const open = openId === block.id;
            const title = summary(block, links, t("bioEditor.untitled"));
            return (
              <li key={block.id} className={cn("rounded-xl border bg-card", hasError && "border-destructive/60")}>
                <Collapsible open={open} onOpenChange={(next) => setOpenId(next ? block.id : null)}>
                  <div className="flex items-center gap-1 p-1.5">
                    <CollapsibleTrigger className="press flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg px-2 text-left outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/30" aria-label={`${t(LABEL[block.type])}: ${title}`}>
                      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] text-muted-foreground">{t(LABEL[block.type])}</span>
                        <span className={cn("block truncate text-sm font-medium", hasError && "text-destructive-text")}>{title}</span>
                      </span>
                      <ChevronDownIcon className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-ios", open && "rotate-180")} />
                    </CollapsibleTrigger>
                    <Button type="button" variant="ghost" size="icon-sm" disabled={index === 0} aria-label={t("bio.moveUp", { title })} onClick={() => move(index, -1)}>
                      <ArrowUpIcon />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" disabled={index === blocks.length - 1} aria-label={t("bio.moveDown", { title })} onClick={() => move(index, 1)}>
                      <ArrowDownIcon />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="hidden sm:inline-flex"
                      aria-label={`${t("bioEditor.duplicate")}: ${title}`}
                      disabled={blocks.length >= MAX_BLOCKS}
                      onClick={() => {
                        const copy = { ...block, id: newId() } as BlockInput;
                        onChange([...blocks.slice(0, index + 1), copy, ...blocks.slice(index + 1)]);
                      }}
                    >
                      <CopyIcon />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" className="text-destructive-text hover:bg-destructive-soft hover:text-destructive-text" aria-label={`${t("common.remove")}: ${title}`} onClick={() => onChange(blocks.filter((_, i) => i !== index))}>
                      <Trash2Icon />
                    </Button>
                  </div>
                  <CollapsibleContent className="data-[state=open]:animate-in data-[state=open]:fade-in-0">
                    <div className="grid gap-4 border-t p-4">
                      <BlockFields block={block} errors={errors} links={links} onChange={(next) => replace(index, next)} />
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
          <Button type="button" variant="outline" className="w-full justify-center" disabled={blocks.length >= MAX_BLOCKS}>
            <PlusIcon /> {t("bioEditor.addBlock")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-60">
          {ORDER.map((type) => {
            const Icon = ICONS[type];
            return (
              <DropdownMenuItem
                key={type}
                onSelect={() => {
                  const block = createBlock(type);
                  onChange([...blocks, block]);
                  setOpenId(block.id);
                }}
              >
                <Icon /> {t(LABEL[type])}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function Highlight({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  const { t } = useI18n();
  return (
    <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm">
      <Checkbox checked={checked} onCheckedChange={(next) => onChange(next === true)} />
      {t("bioEditor.highlight")}
    </label>
  );
}

function BlockFields({ block, errors, links, onChange }: { block: BlockInput; errors: Record<string, string>; links: Map<string, LinkDTO>; onChange: (block: BlockInput) => void }) {
  const { t } = useI18n();
  const set = (patch: Record<string, unknown>) => onChange({ ...block, ...patch } as BlockInput);
  const targetError = errors.target ?? errors["target.url"] ?? errors["target.linkId"];

  let body: ReactNode = null;
  switch (block.type) {
    case "link":
      body = (
        <>
          <LinkPicker label={t("bioEditor.blockLink")} value={block.linkId} selected={links.get(block.linkId)} onChange={(link) => set({ linkId: link.id })} error={errors.linkId} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label={t("bioEditor.emoji")} value={block.emoji ?? ""} onChange={(emoji) => set({ emoji })} maxLength={8} hint={t("bioEditor.emojiHint")} />
            <UrlField label={t("bioEditor.thumbnail")} value={block.thumbnailUrl ?? ""} onChange={(thumbnailUrl) => set({ thumbnailUrl })} error={errors.thumbnailUrl} />
          </div>
          <Highlight checked={block.highlight ?? false} onChange={(highlight) => set({ highlight })} />
        </>
      );
      break;
    case "button":
      body = (
        <>
          <TextField label={t("bioEditor.buttonLabel")} value={block.label} onChange={(label) => set({ label })} error={errors.label} maxLength={60} />
          <TargetPicker label={t("bioEditor.buttonTarget")} required value={block.target as TargetValue} onChange={(target) => set({ target })} links={links} error={targetError} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label={t("bioEditor.emoji")} value={block.emoji ?? ""} onChange={(emoji) => set({ emoji })} maxLength={8} hint={t("bioEditor.emojiHint")} />
            <UrlField label={t("bioEditor.thumbnail")} value={block.thumbnailUrl ?? ""} onChange={(thumbnailUrl) => set({ thumbnailUrl })} error={errors.thumbnailUrl} />
          </div>
          <Highlight checked={block.highlight ?? false} onChange={(highlight) => set({ highlight })} />
        </>
      );
      break;
    case "image":
      body = (
        <>
          <UrlField label={t("bioEditor.imageUrl")} value={block.url} onChange={(url) => set({ url })} error={errors.url} />
          <TextField label={t("bioEditor.imageAlt")} value={block.alt ?? ""} onChange={(alt) => set({ alt })} maxLength={160} hint={t("bioEditor.imageAltHint")} />
          <TextField label={t("bioEditor.imageCaption")} value={block.caption ?? ""} onChange={(caption) => set({ caption })} maxLength={160} />
          <ChoiceField
            label={t("bioEditor.imageShape")}
            value={block.shape ?? "rounded"}
            onChange={(shape) => set({ shape })}
            options={[
              { value: "rounded", label: t("bioEditor.shapeRounded") },
              { value: "square", label: t("bioEditor.shapeSquare") },
              { value: "circle", label: t("bioEditor.shapeCircle") },
            ]}
          />
          {block.shape !== "circle" ? (
            <ChoiceField
              label={t("bioEditor.imageRatio")}
              value={block.ratio ?? "auto"}
              onChange={(ratio) => set({ ratio })}
              options={[
                { value: "auto", label: t("bioEditor.ratioAuto") },
                { value: "1:1", label: "1:1" },
                { value: "4:5", label: "4:5" },
                { value: "16:9", label: "16:9" },
                { value: "3:1", label: "3:1" },
              ]}
            />
          ) : null}
          <TargetPicker label={t("bioEditor.imageTarget")} value={block.target as TargetValue} onChange={(target) => set({ target })} links={links} error={targetError} />
        </>
      );
      break;
    case "video":
      body = (
        <>
          <UrlField label={t("bioEditor.videoUrl")} value={block.url} onChange={(url) => set({ url })} error={errors.url} hint={t("bioEditor.videoHint")} />
          <TextField label={t("bioEditor.videoTitle")} value={block.title ?? ""} onChange={(title) => set({ title })} maxLength={120} />
        </>
      );
      break;
    case "heading":
      body = (
        <>
          <TextField label={t("bioEditor.headingText")} value={block.text} onChange={(text) => set({ text })} error={errors.text} maxLength={80} />
          <ChoiceField label={t("bioEditor.headingSize")} value={block.size ?? "md"} onChange={(size) => set({ size })} options={[{ value: "md", label: t("bioEditor.sizeMd") }, { value: "lg", label: t("bioEditor.sizeLg") }]} />
        </>
      );
      break;
    case "text":
      body = (
        <>
          <Field label={t("bioEditor.textBody")} error={errors.text} htmlFor={`text-${block.id}`}>
            <Textarea id={`text-${block.id}`} value={block.text} onChange={(event) => set({ text: event.target.value })} rows={4} maxLength={600} aria-invalid={Boolean(errors.text)} />
          </Field>
          <ChoiceField label={t("bioEditor.textAlign")} value={block.align ?? "center"} onChange={(align) => set({ align })} options={[{ value: "start", label: t("bioEditor.alignStart") }, { value: "center", label: t("bioEditor.alignCenter") }]} />
        </>
      );
      break;
    case "divider":
      body = (
        <ChoiceField
          label={t("bioEditor.dividerStyle")}
          value={block.style ?? "line"}
          onChange={(style) => set({ style })}
          options={[
            { value: "line", label: t("bioEditor.dividerLine") },
            { value: "dots", label: t("bioEditor.dividerDots") },
            { value: "space", label: t("bioEditor.dividerSpace") },
          ]}
        />
      );
      break;
  }
  return <>{body}</>;
}

