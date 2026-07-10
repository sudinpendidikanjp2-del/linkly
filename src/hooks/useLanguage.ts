import { useState } from "react";
import { TRANSLATIONS } from "../constants";

export function useLanguage() {
  const [lang, setLang] = useState<'id' | 'en'>(() => (localStorage.getItem("linkly-lang") as 'id' | 'en') || 'id');

  const toggleLang = () => {
    setLang(prev => {
      const next = prev === 'id' ? 'en' : 'id';
      localStorage.setItem("linkly-lang", next);
      return next;
    });
  };

  const t = (key: keyof typeof TRANSLATIONS.id) => {
    return TRANSLATIONS[lang]?.[key] || key;
  };

  return {
    lang,
    setLang,
    toggleLang,
    t,
  };
}
