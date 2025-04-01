"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Define available languages
export type Language = {
  code: string
  name: string
  nativeName: string
}

export const languages: Language[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands" },
  { code: "pl", name: "Polish", nativeName: "Polski" },
  { code: "sv", name: "Swedish", nativeName: "Svenska" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "zh", name: "Chinese (Simplified)", nativeName: "简体中文" },
  { code: "zh-TW", name: "Chinese (Traditional)", nativeName: "繁體中文" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "th", name: "Thai", nativeName: "ไทย" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu" },
  { code: "fa", name: "Persian", nativeName: "فارسی" },
  { code: "he", name: "Hebrew", nativeName: "עברית" },
]

type LanguageContextType = {
  language: Language
  setLanguage: (language: Language) => void
  languages: Language[]
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Default to English
  const [language, setLanguageState] = useState<Language>(languages[0])

  // Load language preference from localStorage on initial render
  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem("preferred-language")
      if (savedLanguage) {
        const parsedLanguage = JSON.parse(savedLanguage)
        const foundLanguage = languages.find((lang) => lang.code === parsedLanguage.code)
        if (foundLanguage) {
          setLanguageState(foundLanguage)
        }
      } else {
        // If no saved preference, try to detect browser language
        const browserLang = navigator.language.split("-")[0] // Get the language code (e.g., 'en' from 'en-US')
        const matchedLanguage = languages.find((lang) => lang.code === browserLang)

        // If we found a match for the browser language, use it
        if (matchedLanguage) {
          setLanguageState(matchedLanguage)
          localStorage.setItem("preferred-language", JSON.stringify(matchedLanguage))
        }
      }
    } catch (e) {
      console.error("Failed to load language preference:", e)
    }
  }, [])

  // Save language preference to localStorage when it changes
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage)
    try {
      localStorage.setItem("preferred-language", JSON.stringify(newLanguage))

      // Dispatch a custom event to notify all components about the language change
      const event = new CustomEvent("languageChanged", { detail: newLanguage })
      window.dispatchEvent(event)

      console.log(`System language changed to ${newLanguage.name} (${newLanguage.code})`)
    } catch (e) {
      console.error("Failed to save language preference:", e)
    }
  }

  return <LanguageContext.Provider value={{ language, setLanguage, languages }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

