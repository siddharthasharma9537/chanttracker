'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function SettingsPage() {
  const router = useRouter()
  const { user, signOut } = useAuth()

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
