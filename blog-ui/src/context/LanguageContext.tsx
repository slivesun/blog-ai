import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Language, getTranslation, Translations } from "../i18n";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("portalcore_language");
    if (saved === "zh" || saved === "en") {
      return saved;
    }
    const navigatorLang = navigator.language;
    if (navigatorLang.startsWith("zh")) {
      return "zh";
    }
    return "en";
  });

  useEffect(() => {
    localStorage.setItem("portalcore_language", language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = getTranslation(language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}