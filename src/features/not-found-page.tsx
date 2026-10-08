import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states";
import { useT } from "@/i18n";

export default function NotFoundPage() {
  const t = useT();
  return (
    <EmptyState
      title={t("notFound.title")}
      body={t("notFound.body")}
      action={
        <Button asChild>
          <Link to="/">{t("notFound.home")}</Link>
        </Button>
      }
    />
  );
}
