'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { joinProject } from '@/lib/api/projects'
import { useAuth } from '@/hooks/useAuth'

export default function JoinProjectPage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const attempted = useRef(false)

  useEffect(() => {
    if (!user || attempted.current) return
    attempted.current = true
    joinProject(code)
      .then((projectId) => router.replace(`/projects/${projectId}`))
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not join project'))
  }, [user, code, router])

  return (
    <div className="mx-auto max-w-sm py-16 text-center">
      {error ? (
        <>
          <p className="mb-2 text-lg font-semibold text-red-300">Couldn&apos;t join</p>
          <p className="text-white/60">{error}</p>
          <button
            onClick={() => router.push('/projects')}
            className="mt-6 rounded-xl bg-sacred-500/80 px-5 py-2.5 font-semibold text-white hover:bg-sacred-500"
          >
            Go to Projects
          </button>
        </>
      ) : (
        <p className="text-white/60">Joining project…</p>
      )}
    </div>
  )
}
