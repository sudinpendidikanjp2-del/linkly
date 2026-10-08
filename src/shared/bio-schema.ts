import { z } from "zod";
import { handleField, optionalUrl, urlField } from "./fields";

export const BIO_THEME_IDS = ["slate", "paper", "ink", "chalk", "dusk", "sand", "forest", "mint", "ocean"] as const;
export const BIO_BUTTON_STYLES = ["classic", "pill", "outline", "hard", "soft"] as const;
export const BIO_FONTS = ["sans", "serif", "rounded", "humanist", "mono"] as const;
export const SOCIAL_KEYS = ["instagram", "twitter", "linkedin", "youtube", "github"] as const;
export type SocialKey = (typeof SOCIAL_KEYS)[number];

export const MAX_BLOCKS = 60;
export const MAX_FLOATERS = 8;

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "invalid_color");
const optionalHex = hex.nullish().transform((value) => value ?? undefined);
const shortId = z.string().min(1).max(40);
const emoji = z.string().trim().max(8).nullish().transform((value) => value || undefined);

/** Where a block, image or floating element sends the visitor: a tracked short link or any web address. */
export const targetSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("link"), linkId: z.string().min(1) }),
  z.object({ kind: z.literal("url"), url: urlField }),
]);
export type Target = z.output<typeof targetSchema>;
const optionalTarget = targetSchema.nullish().transform((value) => value ?? null);

export const BLOCK_TYPES = ["link", "button", "image", "video", "heading", "text", "divider"] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export const blockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("link"),
    id: shortId,
    linkId: z.string().min(1),
    emoji,
    thumbnailUrl: optionalUrl,
    highlight: z.boolean().default(false),
  }),
  z.object({
    type: z.literal("button"),
    id: shortId,
    label: z.string().trim().min(1, "required").max(60),
    target: targetSchema,
    emoji,
    thumbnailUrl: optionalUrl,
    highlight: z.boolean().default(false),
  }),
  z.object({
    type: z.literal("image"),
    id: shortId,
    url: urlField,
    alt: z.string().trim().max(160).default(""),
    caption: z.string().trim().max(160).nullish().transform((value) => value || undefined),
    target: optionalTarget,
    shape: z.enum(["rounded", "square", "circle"]).default("rounded"),
    ratio: z.enum(["auto", "1:1", "4:5", "16:9", "3:1"]).default("auto"),
  }),
  z.object({
    type: z.literal("video"),
    id: shortId,
    /** YouTube watch / share / shorts URL, or a direct .mp4 / .webm file. */
    url: urlField,
    title: z.string().trim().max(120).nullish().transform((value) => value || undefined),
  }),
  z.object({
    type: z.literal("heading"),
    id: shortId,
    text: z.string().trim().min(1, "required").max(80),
    size: z.enum(["md", "lg"]).default("md"),
  }),
  z.object({
    type: z.literal("text"),
    id: shortId,
    text: z.string().trim().min(1, "required").max(600),
    align: z.enum(["start", "center"]).default("center"),
  }),
  z.object({
    type: z.literal("divider"),
    id: shortId,
    style: z.enum(["line", "dots", "space"]).default("line"),
  }),
]);
export type Block = z.output<typeof blockSchema>;
export type BlockInput = z.input<typeof blockSchema>;

export const FLOATER_SHAPES = ["circle", "square", "diamond", "triangle", "ring", "blob", "star"] as const;
export const FLOATER_ANIMATIONS = ["none", "float", "pulse", "spin", "bounce"] as const;

export const floaterSchema = z.object({
  id: shortId,
  kind: z.enum(["image", "shape", "button"]),
  /** Image address for kind "image". */
  url: optionalUrl,
  shape: z.enum(FLOATER_SHAPES).default("circle"),
  color: hex.default("#2dd4bf"),
  label: z.string().trim().max(40).nullish().transform((value) => value || undefined),
  emoji,
  target: optionalTarget,
  /** Centre of the element as a percentage of the viewport. */
  x: z.number().min(0).max(100).default(88),
  y: z.number().min(0).max(100).default(88),
  size: z.number().min(24).max(240).default(64),
  opacity: z.number().min(10).max(100).default(100),
  rotate: z.number().min(-180).max(180).default(0),
  animation: z.enum(FLOATER_ANIMATIONS).default("none"),
  layer: z.enum(["front", "behind"]).default("front"),
});
export type Floater = z.output<typeof floaterSchema>;
export type FloaterInput = z.input<typeof floaterSchema>;

export const designSchema = z.object({
  /** Colour overrides applied on top of the chosen theme. */
  colors: z
    .object({ bg: optionalHex, fg: optionalHex, surface: optionalHex, accent: optionalHex })
    .default({ bg: undefined, fg: undefined, surface: undefined, accent: undefined }),
  background: z
    .object({
      type: z.enum(["theme", "gradient", "image"]).default("theme"),
      from: hex.default("#0f766e"),
      to: hex.default("#17181c"),
      angle: z.number().min(0).max(360).default(160),
      imageUrl: optionalUrl,
      /** Darkens (or lightens, on light themes) the image so text stays readable. */
      dim: z.number().min(0).max(85).default(35),
    })
    .default({ type: "theme", from: "#0f766e", to: "#17181c", angle: 160, imageUrl: null, dim: 35 }),
  font: z.enum(BIO_FONTS).default("sans"),
  buttonRadius: z.number().min(0).max(32).nullish().transform((value) => value ?? null),
  buttonSize: z.enum(["sm", "md", "lg"]).default("md"),
  spacing: z.enum(["tight", "normal", "loose"]).default("normal"),
  align: z.enum(["center", "start"]).default("center"),
  width: z.enum(["narrow", "wide"]).default("narrow"),
  avatarShape: z.enum(["circle", "rounded", "square"]).default("circle"),
  avatarSize: z.number().min(64).max(160).default(96),
  coverUrl: optionalUrl,
  entrance: z.enum(["none", "fade", "rise"]).default("rise"),
  hover: z.enum(["lift", "grow", "none"]).default("lift"),
});
export type Design = z.output<typeof designSchema>;
export type DesignInput = z.input<typeof designSchema>;

export const bioSchema = z.object({
  handle: handleField,
  title: z.string().trim().min(1, "required").max(80),
  bio: z.string().trim().max(240).nullish(),
  avatarUrl: optionalUrl,
  theme: z.enum(BIO_THEME_IDS),
  buttonStyle: z.enum(BIO_BUTTON_STYLES),
  showFolders: z.boolean(),
  showBranding: z.boolean().default(true),
  socials: z.partialRecord(z.enum(SOCIAL_KEYS), z.string().trim().max(200)).default({}),
  design: designSchema.default(designSchema.parse({})),
  blocks: z.array(blockSchema).max(MAX_BLOCKS),
  floaters: z.array(floaterSchema).max(MAX_FLOATERS).default([]),
  seoTitle: z.string().trim().max(70).nullish(),
  seoDescription: z.string().trim().max(160).nullish(),
  ogImageUrl: optionalUrl,
});
export type BioInput = z.input<typeof bioSchema>;
export type BioParsed = z.output<typeof bioSchema>;
