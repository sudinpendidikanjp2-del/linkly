import { BIO_THEMES } from "../src/shared/bio-themes";
import { contrastRatio } from "../src/shared/color";

const pairs: [string, "fg" | "muted" | "accent", "bg" | "surface"][] = [
  ["text", "fg", "bg"],
  ["text on card", "fg", "surface"],
  ["muted text", "muted", "bg"],
  ["muted on card", "muted", "surface"],
];

let failed = false;
for (const theme of Object.values(BIO_THEMES)) {
  const checks = [
    ...pairs.map(([label, a, b]) => [label, contrastRatio(theme[a], theme[b]), 4.5] as const),
    ["button label on accent", contrastRatio(theme.onAccent, theme.accent), 4.5] as const,
    ["accent focus ring on bg", contrastRatio(theme.accent, theme.bg), 3] as const,
  ];
  for (const [label, ratio, min] of checks) {
    const ok = ratio >= min;
    if (!ok) failed = true;
    if (!ok) console.log(`FAIL ${theme.id}: ${label} ${ratio.toFixed(2)} < ${min}`);
  }
}
console.log(failed ? "Contrast check failed." : "All bio themes meet WCAG AA.");
process.exit(failed ? 1 : 0);
