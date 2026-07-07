'use client'

import { useState } from 'react'
import { MantraPicker } from '@/components/practice/MantraPicker'
import { Counter } from '@/components/practice/Counter'
import type { Mantra } from '@/lib/api/mantras'

export default function PracticePage() {
  const [selected, setSelected] = useState<Mantra | null>(null)

  if (selected)
    return <Counter mantra={selected} onBack={() => setSelected(null)} />

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-white">Practice</h1>
      <p className="mb-6 text-white/60">Select a mantra to begin chanting</p>
      <MantraPicker onSelect={setSelected} />
    </div>
  )
}
