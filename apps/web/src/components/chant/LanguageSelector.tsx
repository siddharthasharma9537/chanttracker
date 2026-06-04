'use client'

import { useState, useRef, useEffect } from 'react'
import { useLanguagePreference, LANGUAGE_OPTIONS, MantraLanguage } from '@/hooks/useLanguagePreference'

interface LanguageSelectorProps {
  onChange?: (lang: MantraLanguage) => void
}

export function LanguageSelector({ onChange }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguagePreference()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = LANGUAGE_OPTIONS.find(o => o.code === language)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleSelect = (code: MantraLanguage, available: boolean) => {
    if (!available) return
    setLanguage(code)
    onChange?.(code)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white/80 text-xs font-semibold tracking-wide transition-colors border border-white/10"
      >
        {current?.label ?? 'TE-IN'}
        <span className="text-[9px] opacity-60">▼</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-28 rounded-lg border border-white/15 overflow-hidden z-50 shadow-xl"
          style={{ backgroundColor: '#1a1f2c' }}
        >
          {LANGUAGE_OPTIONS.map(opt => (
            <button
              key={opt.code}
              onClick={() => handleSelect(opt.code, opt.available)}
              disabled={!opt.available}
              className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between transition-colors
                ${opt.code === language
                  ? 'bg-sacred-500/30 text-white'
                  : opt.available
                    ? 'text-white/80 hover:bg-white/10'
                    : 'text-white/30 cursor-not-allowed'
                }`}
            >
              <span>{opt.label}</span>
              {!opt.available && <span className="text-[9px] text-white/25">soon</span>}
              {opt.code === language && <span className="text-sacred-400 text-[10px]">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
