import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/links";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

export function CopyButton({ value, label, className, size = "icon-sm" }: { value: string; label?: string; className?: string; size?: "icon" | "icon-sm" | "sm" }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      className={cn("text-muted-foreground hover:text-foreground", className)}
      aria-label={label ?? t("common.copy")}
      onClick={async (event) => {
        event.stopPropagation();
        if (await copyText(value, { ok: t("links.copiedToast"), fail: t("common.copyFailed") })) {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        }
      }}
    >
      {copied ? <CheckIcon className="text-success-text" /> : <CopyIcon />}
    </Button>
  );
}
