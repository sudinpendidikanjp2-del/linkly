import type { BIO_BUTTON_STYLES, BIO_THEME_IDS } from "./schemas";

export type BioThemeId = (typeof BIO_THEME_IDS)[number];
export type BioButtonStyle = (typeof BIO_BUTTON_STYLES)[number];

export interface BioTheme {
  id: BioThemeId;
  label: string;
  /** Page background, solid so text contrast is predictable. */
  bg: string;
  fg: string;
  muted: string;
  surface: string;
  border: string;
  accent: string;
  /** Text colour that sits on top of `accent`. */
  onAccent: string;
}

/**
 * Themes are the visitor-facing palette of a bio page, chosen by the page owner.
 * Every foreground/background pair is checked against WCAG AA by `npm run check:contrast`.
 */
export const BIO_THEMES: Record<BioThemeId, BioTheme> = {
  slate: { id: "slate", label: "Slate", bg: "#0f1115", fg: "#f3f4f6", muted: "#a3a8b3", surface: "#1a1d24", border: "#2e3440", accent: "#5eead4", onAccent: "#04201c" },
  paper: { id: "paper", label: "Paper", bg: "#f7f6f3", fg: "#17181c", muted: "#5b5f6a", surface: "#ffffff", border: "#dcd9d0", accent: "#0f766e", onAccent: "#ffffff" },
  ink: { id: "ink", label: "Ink", bg: "#000000", fg: "#ffffff", muted: "#a1a1aa", surface: "#0a0a0a", border: "#52525b", accent: "#ffffff", onAccent: "#000000" },
  chalk: { id: "chalk", label: "Chalk", bg: "#ffffff", fg: "#000000", muted: "#52525b", surface: "#ffffff", border: "#000000", accent: "#000000", onAccent: "#ffffff" },
  dusk: { id: "dusk", label: "Dusk", bg: "#1c1410", fg: "#fbf1e6", muted: "#c9b5a3", surface: "#2a1e17", border: "#4a382d", accent: "#fb923c", onAccent: "#2a1204" },
  sand: { id: "sand", label: "Sand", bg: "#fbf3e4", fg: "#3b2a14", muted: "#6f5a3d", surface: "#fffaf0", border: "#e0cda5", accent: "#b45309", onAccent: "#ffffff" },
  forest: { id: "forest", label: "Forest", bg: "#0c1a15", fg: "#e8f5ee", muted: "#9bbfad", surface: "#13271f", border: "#24493b", accent: "#34d399", onAccent: "#04211a" },
  mint: { id: "mint", label: "Mint", bg: "#eef8f2", fg: "#0b3a2a", muted: "#3f6b58", surface: "#ffffff", border: "#bddfcc", accent: "#047857", onAccent: "#ffffff" },
  ocean: { id: "ocean", label: "Ocean", bg: "#0b1426", fg: "#e8effc", muted: "#9fb2d3", surface: "#121f38", border: "#25406b", accent: "#60a5fa", onAccent: "#04162e" },
};

export function getBioTheme(id: string | null | undefined): BioTheme {
  return BIO_THEMES[(id as BioThemeId) ?? "slate"] ?? BIO_THEMES.slate;
}
