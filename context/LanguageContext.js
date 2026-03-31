"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { copy, defaultLang } from "@/lib/copy";

const STORAGE_KEY = "uhc-lang";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(defaultLang);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "bn") setLangState(stored);
    } catch (_) {}
  }, []);

  const setLang = useCallback((next) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (_) {}
  }, []);

  const t = useCallback(
    (key) => {
      const keys = key.split(".");
      let obj = copy[lang];
      for (const k of keys) {
        obj = obj?.[k];
      }
      return obj ?? key;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, copy: copy[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
