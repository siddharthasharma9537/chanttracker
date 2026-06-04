import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'chant_language'
const DEFAULT_LANG = 'te'

export type MantraLanguage = 'te' | 'en' | 'hi' | 'ka' | 'ta' | 'ma'

export interface LanguageOption {
  code: MantraLanguage
  label: string  // short label shown in selector
  available: boolean
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'te', label: 'TE-IN', available: true },
  { code: 'en', label: 'EN-IN', available: false },
  { code: 'hi', label: 'HI-IN', available: false },
  { code: 'ka', label: 'KA-IN', available: false },
  { code: 'ta', label: 'TM-IN', available: false },
  { code: 'ma', label: 'MA-IN', available: false },
]

export function useLanguagePreference() {
  const [language, setLanguageState] = useState<MantraLanguage>(DEFAULT_LANG)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as MantraLanguage | null
      const option = LANGUAGE_OPTIONS.find(o => o.code === stored && o.available)
      if (option) setLanguageState(stored as MantraLanguage)
    } catch {}
  }, [])

  const setLanguage = useCallback((lang: MantraLanguage) => {
    setLanguageState(lang)
    try { localStorage.setItem(STORAGE_KEY, lang) } catch {}
  }, [])

  return { language, setLanguage }
}
