'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { MantraPicker } from '@/components/practice/MantraPicker'
import { Counter } from '@/components/practice/Counter'
import type { Mantra } from '@/lib/api/mantras'
import { getStreak } from '@/lib/api/progress'
import { getProfile } from '@/lib/api/profile'
import { useAuth } from '@/hooks/useAuth'

export default function PracticePage() {
  const { user } = useAuth()
  const [selected, setSelected] = useState<Mantra | null>(null)

  const { data: streak } = useQuery({
    queryKey: ['streak', user?.id],
    queryFn: () => getStreak(user!.id),
    enabled: !!user,
  })
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => getProfile(user!.id),
    enabled: !!user,
  })

  if (selected)
    return <Counter mantra={selected} onBack={() => setSelected(null)} />

  const today = new Date().toLocaleDateString('sv')
  const chantedToday = streak?.last_chant_date === today
  const nowHm = new Date().toTimeString().slice(0, 5)
  const dueReminder = profile?.reminder_time?.slice(0, 5)
  const showNudge = !!dueReminder && !chantedToday && nowHm >= dueReminder

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-white">Practice</h1>
      <p className="mb-4 text-white/60">Select a mantra to begin chanting</p>
      {showNudge && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-sacred-400/30 bg-sacred-500/10 px-4 py-3 text-sm text-sacred-300">
          <Bell className="h-4 w-4 shrink-0" />
          You haven&apos;t chanted today yet — your reminder was set for {dueReminder}.
        </div>
      )}
      <MantraPicker onSelect={setSelected} />
    </div>
  )
}
