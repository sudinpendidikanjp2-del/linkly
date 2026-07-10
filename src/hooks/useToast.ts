import { useState } from "react";

export function useToast() {
  const [customToast, setCustomToast] = useState("");
  const [customToastType, setCustomToastType] = useState<"success" | "error">("success");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setCustomToast(message);
    setCustomToastType(type);
    const timeoutId = setTimeout(() => {
      setCustomToast(prev => prev === message ? "" : prev);
    }, 3000);
    return timeoutId;
  };

  return {
    customToast,
    customToastType,
    showToast,
    setCustomToast,
    setCustomToastType,
  };
}
