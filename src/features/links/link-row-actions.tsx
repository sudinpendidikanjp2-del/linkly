import { Link } from "react-router";
import { toast } from "sonner";
import { BarChart3Icon, ExternalLinkIcon, EllipsisIcon, LinkIcon, PencilIcon, PowerIcon, QrCodeIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ApiError } from "@/lib/api";
import { copyText, shortUrl } from "@/lib/links";
import { useI18n } from "@/i18n";
import type { LinkDTO } from "@/shared/types";
import { useToggleLink } from "./api";
import { useLinkActions } from "./link-actions";

export function LinkRowActions({ link, redirectAfterDelete }: { link: LinkDTO; redirectAfterDelete?: string }) {
  const { t, te } = useI18n();
  const actions = useLinkActions();
  const toggle = useToggleLink();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={t("links.actions", { title: link.title })} onClick={(event) => event.stopPropagation()}>
          <EllipsisIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
        <DropdownMenuItem asChild>
          <a href={link.originalUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLinkIcon /> {t("links.openDestination")}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void copyText(shortUrl(link.slug), { ok: t("links.copiedToast"), fail: t("common.copyFailed") })}>
          <LinkIcon /> {t("links.copyShort")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => actions.showQr(link)}>
          <QrCodeIcon /> {t("links.qr")}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={`/links/${link.id}`}>
            <BarChart3Icon /> {t("links.analytics")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => actions.edit(link)}>
          <PencilIcon /> {t("common.edit")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={async () => {
            try {
              await toggle.mutateAsync({ id: link.id, isEnabled: !link.isEnabled });
              toast.success(t("links.updatedToast"));
            } catch (error) {
              toast.error(te(error instanceof ApiError ? error.code : undefined));
            }
          }}
        >
          <PowerIcon /> {link.isEnabled ? t("links.disable") : t("links.enable")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => actions.remove(link, redirectAfterDelete ? { redirectTo: redirectAfterDelete } : undefined)}>
          <Trash2Icon /> {t("links.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
