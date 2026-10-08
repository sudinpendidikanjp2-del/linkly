import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/i18n";
import type { LinkDTO } from "@/shared/types";
import { useDeleteLink } from "./api";
import { ImportDialog } from "./import-dialog";
import { LinkFormDialog } from "./link-form-dialog";
import { QrDialog } from "./qr-dialog";

interface LinkActions {
  create: (initialUrl?: string) => void;
  edit: (link: LinkDTO) => void;
  showQr: (link: LinkDTO) => void;
  remove: (link: LinkDTO, options?: { redirectTo?: string }) => void;
  importLinks: () => void;
}

const LinkActionsContext = createContext<LinkActions | null>(null);

/** Hosts the link dialogs once so any page can open them without owning their state. */
export function LinkActionsProvider({ children }: { children: ReactNode }) {
  const { t, te } = useI18n();
  const navigate = useNavigate();
  const deleteLink = useDeleteLink();

  const [form, setForm] = useState<{ open: boolean; link: LinkDTO | null; initialUrl?: string }>({ open: false, link: null });
  const [qr, setQr] = useState<{ open: boolean; link: LinkDTO | null }>({ open: false, link: null });
  const [pendingDelete, setPendingDelete] = useState<{ link: LinkDTO; redirectTo?: string } | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const create = useCallback((initialUrl?: string) => setForm({ open: true, link: null, initialUrl }), []);
  const edit = useCallback((link: LinkDTO) => setForm({ open: true, link }), []);
  const showQr = useCallback((link: LinkDTO) => setQr({ open: true, link }), []);
  const remove = useCallback((link: LinkDTO, options?: { redirectTo?: string }) => setPendingDelete({ link, redirectTo: options?.redirectTo }), []);
  const importLinks = useCallback(() => setImportOpen(true), []);

  const value = useMemo<LinkActions>(() => ({ create, edit, showQr, remove, importLinks }), [create, edit, showQr, remove, importLinks]);

  return (
    <LinkActionsContext.Provider value={value}>
      {children}
      <LinkFormDialog link={form.link} open={form.open} initialUrl={form.initialUrl} onOpenChange={(open) => setForm((current) => ({ ...current, open }))} />
      <QrDialog link={qr.link} open={qr.open} onOpenChange={(open) => setQr((current) => ({ ...current, open }))} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={t("links.deleteTitle")}
        description={t("links.deleteBody", { slug: pendingDelete?.link.slug ?? "" })}
        confirmLabel={t("common.delete")}
        pending={deleteLink.isPending}
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await deleteLink.mutateAsync(pendingDelete.link.id);
            toast.success(t("links.deletedToast"));
            const redirectTo = pendingDelete.redirectTo;
            setPendingDelete(null);
            if (redirectTo) navigate(redirectTo);
          } catch (error) {
            toast.error(te(error instanceof ApiError ? error.code : undefined));
          }
        }}
      />
    </LinkActionsContext.Provider>
  );
}

export function useLinkActions(): LinkActions {
  const value = useContext(LinkActionsContext);
  if (!value) throw new Error("useLinkActions must be used inside <LinkActionsProvider>");
  return value;
}
