// src/hooks/useLanguage.js
import { createContext, useContext, useState, useEffect } from "react";
import { LANGUAGES } from "../utils/i18n";

const LangContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("sp_lang") || "en";
  });

  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    localStorage.setItem("sp_lang", lang);
    // Set document direction for Arabic RTL
    document.documentElement.dir = currentLang.dir;
    document.documentElement.lang = lang;
  }, [lang, currentLang.dir]);

  return (
    <LangContext.Provider value={{ lang, setLang, currentLang, LANGUAGES }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
