import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  display_name: string
  email?: string
}

export function useUserProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!user?.id) return

    const loadProfile = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single()

        if (error) throw error

        if (data) {
          setProfile({
            display_name: data.display_name || user.email || 'User',
            email: user.email,
          })
        }
      } catch (error) {
        console.error('Error loading user profile:', error)
        // Fallback to email if profile load fails
        setProfile({
          display_name: user.email || 'User',
          email: user.email,
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [user?.id, supabase, user?.email])

  const getInitials = (displayName?: string) => {
    if (!displayName) return 'U'
    const parts = displayName.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return displayName.slice(0, 2).toUpperCase()
  }

  return {
    profile,
    isLoading,
    displayName: profile?.display_name || 'User',
    email: profile?.email,
    initials: getInitials(profile?.display_name),
  }
}
