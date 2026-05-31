'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown } from 'lucide-react'

interface Mantra {
  id: string
  name: string
  name_devanagari: string
  category: string
  color?: string
}

interface MantrasDropdownProps {
  onSelect: (mantraId: string, mantra: Mantra) => void
  isLoading?: boolean
}

// Demo mantras for dev/testing
const DEMO_MANTRAS: Mantra[] = [
  {
    id: 'sun-1',
    name: 'Surya Mantra',
    name_devanagari: 'सूर्य मंत्र',
    category: 'navagraha',
    color: '#F59E0B',
  },
  {
    id: 'moon-1',
    name: 'Chandra Mantra',
    name_devanagari: 'चंद्र मंत्र',
    category: 'navagraha',
    color: '#60A5FA',
  },
  {
    id: 'gayatri-1',
    name: 'Gayatri Mantra',
    name_devanagari: 'गायत्री मंत्र',
    category: 'devata',
    color: '#EC4899',
  },
  {
    id: 'om-1',
    name: 'Om Chanting',
    name_devanagari: 'ॐ',
    category: 'beeja',
    color: '#8B5CF6',
  },
]

export function MantrasDropdown({ onSelect, isLoading }: MantrasDropdownProps) {
  const [mantras, setMantras] = useState<Mantra[]>(DEMO_MANTRAS)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedMantra, setSelectedMantra] = useState<Mantra | null>(null)
  const [isLoadingMantras, setIsLoadingMantras] = useState(false)

  useEffect(() => {
    // Try to fetch today's mantras via RPC
    const fetchMantras = async () => {
      const supabase = createClient()
      try {
        setIsLoadingMantras(true)
        const { data, error } = await (supabase.rpc as any)('get_panchang', {
          p_date: new Date().toLocaleDateString('sv'),
        })

        if (error) {
          console.warn('Failed to fetch panchang, using demo mantras:', error)
          setMantras(DEMO_MANTRAS)
        } else if (data && Array.isArray(data)) {
          // Parse RPC response if it contains mantra recommendations
          setMantras(data.length > 0 ? data : DEMO_MANTRAS)
        }
      } catch (err) {
        console.warn('Error fetching mantras:', err)
        setMantras(DEMO_MANTRAS)
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
    <div className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoadingMantras}
        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-temple-500 disabled:opacity-50"
      >
        <span className="flex items-center gap-3">
          {selectedMantra ? (
            <>
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: selectedMantra.color || '#9CA3AF' }}
              />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">
                  {selectedMantra.name}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedMantra.name_devanagari}
                </p>
              </div>
            </>
          ) : (
            <span className="text-gray-500">
              {isLoadingMantras ? 'Loading mantras...' : 'Select a mantra'}
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {mantras.map((mantra) => (
            <button
              key={mantra.id}
              onClick={() => handleSelect(mantra)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: mantra.color || '#9CA3AF' }}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {mantra.name}
                </p>
                <p className="text-xs text-gray-500">
                  {mantra.name_devanagari}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
