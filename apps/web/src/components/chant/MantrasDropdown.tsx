'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown } from 'lucide-react'

interface Mantra {
  id: string
  name: string
  name_devanagari: string
  name_te?: string
  category: string
  color?: string
  adhidevata_te?: string
  adhidevata_devanagari?: string
  adhidevata_mantra_te?: string
  adhidevata_mantra_devanagari?: string
  pratyadhidevata_te?: string
  pratyadhidevata_devanagari?: string
  pratyadhidevata_mantra_te?: string
  pratyadhidevata_mantra_devanagari?: string
  mantra_te?: string
  mantra_devanagari?: string
}

interface MantrasDropdownProps {
  onSelect: (mantraId: string, mantra: Mantra) => void
  isLoading?: boolean
}

// Raw row shape from the `mantras` reference table
interface MantraRow {
  id: string
  name_en: string | null
  name_te: string | null
  name_sa: string | null
  devanagari: string | null
  accent_color: string | null
  category: string | null
  mantra_type: string | null
  parent_graha_id: string | null
}

// "Agni (Adhidevata of Surya)" -> "Agni"
const stripLabel = (s?: string | null) =>
  (s || '').replace(/\s*\(.*\)\s*/g, '').trim()

export function MantrasDropdown({ onSelect, isLoading }: MantrasDropdownProps) {
  const [mantras, setMantras] = useState<Mantra[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedMantra, setSelectedMantra] = useState<Mantra | null>(null)
  const [isLoadingMantras, setIsLoadingMantras] = useState(true)

  useEffect(() => {
    const fetchMantras = async () => {
      const supabase = createClient()
      try {
        setIsLoadingMantras(true)
        const { data, error } = await supabase
          .from('mantras')
          .select(
            'id, name_en, name_te, name_sa, devanagari, mantra_telugu_plain, mantra_telugu, accent_color, category, mantra_type, parent_graha_id, deity'
          )
          .eq('is_active', true)
          .eq('is_archived', false)

        if (error) throw error

        const rows = (data || []) as (MantraRow & { deity?: string | null })[]

        // Adhidevata / pratyadhidevata rows enrich their parent graha mantra;
        // they are not directly selectable.
        const byParentAdhi = new Map<string, MantraRow>()
        const byParentPratya = new Map<string, MantraRow>()
        for (const r of rows) {
          if (r.mantra_type === 'adhidevata' && r.parent_graha_id)
            byParentAdhi.set(r.parent_graha_id, r)
          if (r.mantra_type === 'pratyadhidevata' && r.parent_graha_id)
            byParentPratya.set(r.parent_graha_id, r)
        }

        // Selectable mantras: the graha mantras + standalone devata mantras.
        const selectable = rows.filter(
          (r) => r.mantra_type === 'graha' || r.mantra_type === 'devata'
        )

        const mapped: Mantra[] = selectable.map((r) => {
          const adhi = byParentAdhi.get(r.id)
          const pratya = byParentPratya.get(r.id)
          return {
            id: r.id,
            name: r.name_en || 'Mantra',
            name_devanagari: r.name_sa || r.name_en || '',
            name_te: r.name_te || undefined,
            category: r.category || 'custom',
            color: r.accent_color || undefined,
            // plain = swaras stripped → renders with Noto Sans Telugu
            mantra_devanagari: (r as any).mantra_telugu_plain || (r as any).mantra_telugu || r.devanagari || undefined,
            adhidevata_te: adhi ? stripLabel(adhi.name_en) : undefined,
            adhidevata_mantra_devanagari: (adhi as any)?.mantra_telugu_plain || (adhi as any)?.mantra_telugu || adhi?.devanagari || undefined,
            pratyadhidevata_te: pratya ? stripLabel(pratya.name_en) : undefined,
            pratyadhidevata_mantra_devanagari: (pratya as any)?.mantra_telugu_plain || (pratya as any)?.mantra_telugu || pratya?.devanagari || undefined,
          }
        })

        // Grahas first, then everything else, alphabetical within each group.
        mapped.sort((a, b) => {
          const ag = a.category === 'navagraha' ? 0 : 1
          const bg = b.category === 'navagraha' ? 0 : 1
          if (ag !== bg) return ag - bg
          return a.name.localeCompare(b.name)
        })

        setMantras(mapped)
      } catch (err) {
        console.error('Failed to load mantras:', err)
        setMantras([])
      } finally {
        setIsLoadingMantras(false)
      }
    }

    fetchMantras()
  }, [])

  const handleSelect = (mantra: Mantra) => {
    setSelectedMantra(mantra)
    setIsOpen(false)
    onSelect(mantra.id, mantra)
  }

  return (
    <div className="w-full max-w-md">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading || isLoadingMantras}
          className="w-full flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white/8 hover:bg-white/12 disabled:bg-white/5 border border-white/20 hover:border-white/30 disabled:border-white/15 rounded-xl font-semibold text-white transition shadow-md hover:shadow-lg disabled:shadow-none"
        >
          <div className="text-left">
            {selectedMantra ? (
              <>
                <p className="text-sm sm:text-base text-white/70">Selected:</p>
                <p className="text-base sm:text-lg text-white font-bold">{selectedMantra.name_te || selectedMantra.name}</p>
                {selectedMantra.name_te && (
                  <p className="text-xs sm:text-sm text-white/60">{selectedMantra.name}</p>
                )}
              </>
            ) : (
              <p className="text-base sm:text-lg text-white">
                {isLoadingMantras ? 'Loading mantras…' : 'Select a Mantra'}
              </p>
            )}
          </div>
          <ChevronDown
            className={`w-5 h-5 transition-transform text-sacred-400 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 border border-white/20 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto" style={{ backgroundColor: '#1a1f2c' }}>
            {mantras.length === 0 ? (
              <p className="px-4 sm:px-6 py-4 text-sm text-white/60">
                No mantras available.
              </p>
            ) : (
              mantras.map((mantra) => (
                <button
                  key={mantra.id}
                  onClick={() => handleSelect(mantra)}
                  className="w-full text-left px-4 sm:px-6 py-3 sm:py-4 hover:bg-white/12 transition border-b border-white/10 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base sm:text-lg font-semibold text-white">{mantra.name_te || mantra.name}</p>
                      <p className="text-xs sm:text-sm text-white/60">{mantra.name_te ? mantra.name : mantra.name_devanagari}</p>
                    </div>
                    {mantra.color && (
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0 shadow-md"
                        style={{ backgroundColor: mantra.color }}
                      />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
