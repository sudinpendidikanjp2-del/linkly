import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { enUS, id as idLocale, type Locale } from "date-fns/locale";
import { id } from "./id";
import { en } from "./en";
import type { Dict, TKey } from "./types";

export type Lang = "id" | "en";
type Vars = Record<string, string | number>;

const DICTIONARIES: Record<Lang, Dict> = { id, en };
const STORAGE_KEY = "linkly-lang";

function readStoredLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "id" || saved === "en") return saved;
  } catch {
    /* storage unavailable */
  }
  return typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("en") ? "en" : "id";
}

function lookup(dict: Dict, key: string): string | undefined {
  let node: unknown = dict;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}

function interpolate(template: string, vars?: Vars): string {
  return vars ? template.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`)) : template;
}

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TKey, vars?: Vars) => string;
  /** Translates an API / validation error code, falling back to the generic message. */
  te: (code: string | undefined) => string;
  dateLocale: Locale;
  numberFormat: Intl.NumberFormat;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const value = useMemo<I18nValue>(() => {
    const dict = DICTIONARIES[lang];
    return {
      lang,
      setLang,
      t: (key, vars) => interpolate(lookup(dict, key) ?? key, vars),
      te: (code) => (code && lookup(dict, `errors.${code}`)) || lookup(dict, "errors.internal_error") || "Error",
      dateLocale: lang === "id" ? idLocale : enUS,
      numberFormat: new Intl.NumberFormat(lang === "id" ? "id-ID" : "en-US"),
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>");
  return value;
}

export function useT() {
  return useI18n().t;
}
