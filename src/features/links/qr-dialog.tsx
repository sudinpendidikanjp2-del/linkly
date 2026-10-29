import { useMemo, useRef, useState } from "react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { TriangleAlertIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlugChip } from "@/components/slug-chip";
import { qrTarget } from "@/lib/links";
import { contrastRatio } from "@/shared/color";
import { useT } from "@/i18n";
import type { LinkDTO } from "@/shared/types";

type Level = "L" | "M" | "Q" | "H";
const SIZES = [512, 1024, 2048] as const;

function download(href: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function QrDialog({ link, open, onOpenChange }: { link: LinkDTO | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT();
  const [fg, setFg] = useState("#17181c");
  const [bg, setBg] = useState("#ffffff");
  const [size, setSize] = useState<(typeof SIZES)[number]>(1024);
  const [level, setLevel] = useState<Level>("M");
  const [logo, setLogo] = useState("");
  const svgBox = useRef<HTMLDivElement>(null);
  const canvasBox = useRef<HTMLDivElement>(null);

  const value = link ? qrTarget(link.slug) : "";
  const lowContrast = contrastRatio(fg, bg) < 3;
  const effectiveLevel: Level = logo ? "H" : level;
  const imageSettings = useMemo(
    () => (logo ? { src: logo, height: 0.2 * size, width: 0.2 * size, excavate: true, crossOrigin: "anonymous" as const } : undefined),
    [logo, size],
  );
  const filename = `qr-${link?.slug ?? "link"}`;

  function canvasDataUrl(): string | null {
    const canvas = canvasBox.current?.querySelector("canvas");
    if (!canvas) return null;
    try {
      return canvas.toDataURL("image/png");
    } catch {
      toast.error(t("qr.logoHint"));
      return null;
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("qr.title")}</DialogTitle>
          <DialogDescription>{t("qr.desc")}</DialogDescription>
        </DialogHeader>
        {link ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-[220px_1fr]">
            <div className="flex flex-col items-center gap-3">
              <div ref={svgBox} className="rounded-xl border p-3" style={{ background: bg }} role="img" aria-label={t("qr.preview", { url: value })}>
                <QRCodeSVG value={value} size={196} fgColor={fg} bgColor={bg} level={effectiveLevel} marginSize={0} imageSettings={imageSettings ? { ...imageSettings, width: 40, height: 40 } : undefined} />
              </div>
              <SlugChip slug={link.slug} />
            </div>

            <div className="grid content-start gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="qr-fg">{t("qr.foreground")}</Label>
                  <Input id="qr-fg" type="color" value={fg} onChange={(event) => setFg(event.target.value)} className="h-10 cursor-pointer p-1" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="qr-bg">{t("qr.background")}</Label>
                  <Input id="qr-bg" type="color" value={bg} onChange={(event) => setBg(event.target.value)} className="h-10 cursor-pointer p-1" />
                </div>
              </div>
              {lowContrast ? (
                <p role="alert" className="flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-[13px] font-medium text-warning-text">
                  <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
                  {t("qr.lowContrast")}
                </p>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>{t("qr.size")}</Label>
                  <Select value={String(size)} onValueChange={(next) => setSize(Number(next) as (typeof SIZES)[number])}>
                    <SelectTrigger className="w-full" aria-label={t("qr.size")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SIZES.map((option) => (
                        <SelectItem key={option} value={String(option)}>
                          {option} px
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>{t("qr.level")}</Label>
                  <Select value={effectiveLevel} onValueChange={(next) => setLevel(next as Level)} disabled={Boolean(logo)}>
                    <SelectTrigger className="w-full" aria-label={t("qr.level")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">{t("qr.levelL")}</SelectItem>
                      <SelectItem value="M">{t("qr.levelM")}</SelectItem>
                      <SelectItem value="Q">{t("qr.levelQ")}</SelectItem>
                      <SelectItem value="H">{t("qr.levelH")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="qr-logo">
                  {t("qr.logo")} <span className="font-normal text-muted-foreground">({t("common.optional")})</span>
                </Label>
                <Input id="qr-logo" type="text" inputMode="url" placeholder="https://" value={logo} onChange={(event) => setLogo(event.target.value.trim())} />
                <p className="text-[13px] text-muted-foreground">{t("qr.logoHint")}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  onClick={() => {
                    const url = canvasDataUrl();
                    if (url) download(url, `${filename}.png`);
                  }}
                >
                  {t("qr.png")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const svg = svgBox.current?.querySelector("svg");
                    if (!svg) return;
                    const clone = svg.cloneNode(true) as SVGElement;
                    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
                    clone.setAttribute("width", String(size));
                    clone.setAttribute("height", String(size));
                    const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" });
                    const href = URL.createObjectURL(blob);
                    download(href, `${filename}.svg`);
                    URL.revokeObjectURL(href);
                  }}
                >
                  {t("qr.svg")}
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    const url = canvasDataUrl();
                    if (!url) return;
                    const { jsPDF } = await import("jspdf");
                    const pdf = new jsPDF({ unit: "mm", format: "a4" });
                    pdf.setFontSize(14);
                    pdf.text(link.title, 105, 28, { align: "center", maxWidth: 170 });
                    pdf.addImage(url, "PNG", 35, 40, 140, 140);
                    pdf.setFont("courier", "normal");
                    pdf.setFontSize(11);
                    pdf.text(value.replace("?qr=1", ""), 105, 192, { align: "center" });
                    pdf.save(`${filename}.pdf`);
                  }}
                >
                  {t("qr.pdf")}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFg("#17181c");
                    setBg("#ffffff");
                    setLogo("");
                    setLevel("M");
                  }}
                >
                  {t("qr.reset")}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
        {/* Off-screen full resolution canvas used for PNG and PDF export. */}
        <div ref={canvasBox} className="hidden" aria-hidden="true">
          {link ? <QRCodeCanvas value={value} size={size} fgColor={fg} bgColor={bg} level={effectiveLevel} marginSize={2} imageSettings={imageSettings} /> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
