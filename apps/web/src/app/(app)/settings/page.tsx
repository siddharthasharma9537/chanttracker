'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { LogOut, Flame, Lock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getStreak, listAchievements } from '@/lib/api/progress'

export default function SettingsPage() {
  const router = useRouter()
  const { user, signOut } = useAuth()

  const { data: streak } = useQuery({
    queryKey: ['streak', user?.id],
    queryFn: () => getStreak(user!.id),
    enabled: !!user,
  })
  const { data: achievements } = useQuery({
    queryKey: ['achievements', user?.id],
    queryFn: () => listAchievements(user!.id),
    enabled: !!user,
  })

  return (
    <div className="max-w-md">
      <h1 className="mb-6 text-2xl font-bold text-white">Settings</h1>
      <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.05] p-4">
        <p className="text-xs uppercase tracking-wider text-white/50">Account</p>
        <p className="mt-1 font-medium text-white">
          {(user?.user_metadata?.display_name as string) || user?.email}
        </p>
        <p className="text-sm text-white/50">{user?.email}</p>
      </div>

      {!!streak?.current_streak && (
        <div className="mb-6 flex items-center gap-4 rounded-xl border border-orange-400/20 bg-orange-500/10 p-4">
          <Flame className="h-8 w-8 shrink-0 text-orange-400" />
          <div>
            <p className="text-lg font-bold text-white">
              {streak.current_streak} day{streak.current_streak === 1 ? '' : 's'}
            </p>
            <p className="text-xs text-white/50">
              Current streak · longest {streak.longest_streak}
            </p>
          </div>
        </div>
      )}

      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/40">
        Achievements
      </p>
      <div className="mb-6 grid grid-cols-3 gap-2">
        {(achievements ?? []).map((a) => (
          <div
            key={a.code}
            title={a.description ?? a.title}
            className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center ${
              a.unlocked_at
                ? 'border-sacred-400/30 bg-sacred-500/10'
                : 'border-white/10 bg-white/[0.03] opacity-40'
            }`}
          >
            {a.unlocked_at ? (
              <span className="text-2xl">{a.emoji ?? '🏅'}</span>
            ) : (
              <Lock className="h-5 w-5 text-white/40" />
            )}
            <span className="text-[11px] font-medium leading-tight text-white">{a.title}</span>
          </div>
        ))}
      </div>

      <button
        onClick={async () => {
          await signOut()
          router.push('/auth/signin')
        }}
        className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 font-medium text-red-300 hover:bg-red-500/20"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  )
}
