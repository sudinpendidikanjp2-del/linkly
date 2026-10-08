import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";
export const ACCENTS = ["teal", "blue", "orange", "rose", "violet"] as const;
export type Accent = (typeof ACCENTS)[number];

interface ThemeValue {
  mode: ThemeMode;
  resolved: "light" | "dark";
  accent: Accent;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: Accent) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

function read<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    if (value && (allowed as readonly string[]).includes(value)) return value as T;
  } catch {
    /* storage unavailable */
  }
  return fallback;
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => read("linkly-theme", ["light", "dark", "system"], "system"));
  const [accent, setAccentState] = useState<Accent>(() => read("linkly-accent", ACCENTS, "teal"));
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const resolved: "light" | "dark" = mode === "system" ? (systemDark ? "dark" : "light") : mode;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolved === "dark");
    root.style.colorScheme = resolved;
  }, [resolved]);

  useEffect(() => {
    const root = document.documentElement;
    if (accent === "teal") delete root.dataset.accent;
    else root.dataset.accent = accent;
  }, [accent]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    write("linkly-theme", next);
  }, []);

  const setAccent = useCallback((next: Accent) => {
    setAccentState(next);
    write("linkly-accent", next === "teal" ? "" : next);
  }, []);

  const value = useMemo(() => ({ mode, resolved, accent, setMode, setAccent }), [mode, resolved, accent, setMode, setAccent]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside <ThemeProvider>");
  return value;
}
