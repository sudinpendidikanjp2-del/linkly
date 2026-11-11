import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "@/providers/theme";

function Toaster(props: ToasterProps) {
  const { resolved } = useTheme();
  return (
    <Sonner
      theme={resolved}
      position="bottom-right"
      closeButton
      mobileOffset={{ bottom: "calc(84px + env(safe-area-inset-bottom))", left: 16, right: 16 }}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "!rounded-xl !border-border !bg-popover !text-popover-foreground !shadow-md",
          description: "!text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
