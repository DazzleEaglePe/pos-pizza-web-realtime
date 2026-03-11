"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import en from "./locales/en.json";
import es from "./locales/es.json";

// Available locales
const dictionaries = { en, es } as const;
export type Locale = keyof typeof dictionaries;
export const locales: Locale[] = ["es", "en"];
export const localeNames: Record<Locale, string> = { es: "Español", en: "English" };

// Type-safe dictionary
type Dictionary = typeof en;

// Flatten nested keys: "login.title" => string
type FlattenKeys<T, Prefix extends string = ""> = T extends Record<string, any>
  ? {
      [K in keyof T]: T[K] extends Record<string, any>
        ? FlattenKeys<T[K], `${Prefix}${K & string}.`>
        : `${Prefix}${K & string}`;
    }[keyof T]
  : never;

type TranslationKey = FlattenKeys<Dictionary>;

// Helper to get nested value from a key like "login.title"
function getNestedValue(obj: any, path: string): string {
  return path.split(".").reduce((acc, part) => acc?.[part], obj) ?? path;
}

// Context
interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Provider
export function I18nProvider({
  children,
  defaultLocale = "es",
}: {
  children: ReactNode;
  defaultLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pos_locale") as Locale;
      if (saved && locales.includes(saved)) return saved;
    }
    return defaultLocale;
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem("pos_locale", newLocale);
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      let value = getNestedValue(dictionaries[locale], key);
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          value = value.replace(`{${k}}`, String(v));
        });
      }
      return value;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

// Hook
export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return context;
}
