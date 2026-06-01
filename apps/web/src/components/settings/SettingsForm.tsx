'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/store/uiStore'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const settingsSchema = z.object({
  display_name: z.string().min(1, 'Display name is required'),
  daily_goal: z.number().int().min(1, 'Daily goal must be at least 1'),
  theme: z.enum(['temple', 'midnight', 'dawn']),
  preferred_language: z.enum(['en', 'hi', 'te', 'sa']),
  timezone: z.string().min(1, 'Timezone is required'),
  haptics_enabled: z.boolean(),
  chant_sound_enabled: z.boolean(),
})

type SettingsFormData = z.infer<typeof settingsSchema>

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
  'Pacific/Auckland',
]

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'te', label: 'Telugu' },
  { value: 'sa', label: 'Sanskrit' },
]

interface SettingsFormProps {
  onProfileLoad?: (data: SettingsFormData) => void
}

export function SettingsForm({ onProfileLoad }: SettingsFormProps) {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useUIStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      display_name: '',
      daily_goal: 500,
      theme: theme as any,
      preferred_language: 'en',
      timezone: 'UTC',
      haptics_enabled: true,
      chant_sound_enabled: true,
    },
  })

  const currentTheme = watch('theme')

  // Load profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return

      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(
            'display_name, daily_goal, theme, preferred_language, timezone, haptics_enabled, chant_sound_enabled'
          )
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error loading profile:', error)
          return
        }

        if (data) {
          const profileData = data as Record<string, any>
          const formData: SettingsFormData = {
            display_name: profileData.display_name || '',
            daily_goal: profileData.daily_goal || 500,
            theme: (profileData.theme as any) || 'temple',
            preferred_language: (profileData.preferred_language as any) || 'en',
            timezone: profileData.timezone || 'UTC',
            haptics_enabled: profileData.haptics_enabled ?? true,
            chant_sound_enabled: profileData.chant_sound_enabled ?? true,
          }
          reset(formData)
          onProfileLoad?.(formData)
        }
      } catch (error) {
        console.error('Failed to load profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [user?.id, supabase, reset, onProfileLoad])

  const applyTheme = useCallback((newTheme: string) => {
    const html = document.documentElement
    html.classList.remove('theme-temple', 'theme-midnight', 'theme-dawn')
    html.classList.add(`theme-${newTheme}`)
    setTheme(newTheme as any)
  }, [setTheme])

  const onSubmit = async (data: SettingsFormData) => {
    if (!user?.id) return

    setIsSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      // Apply theme change immediately
      if (data.theme !== theme) {
        applyTheme(data.theme)
      }

      // Update profile in Supabase
      const { error } = await supabase.from('profiles').upsert(
        {
          id: user.id,
          display_name: data.display_name,
          daily_goal: data.daily_goal,
          theme: data.theme,
          preferred_language: data.preferred_language,
          timezone: data.timezone,
          haptics_enabled: data.haptics_enabled,
          chant_sound_enabled: data.chant_sound_enabled,
          updated_at: new Date().toISOString(),
        } as any
      )

      if (error) throw error

      setSuccessMessage('Settings saved successfully')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save settings'
      setErrorMessage(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth/signin')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign out'
      setErrorMessage(message)
    }
  }

  const handleRetry = () => {
    setErrorMessage('')
    if (user?.id) {
      // Trigger profile reload
      const loadProfile = async () => {
        setIsLoading(true)
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select(
              'display_name, daily_goal, theme, preferred_language, timezone, haptics_enabled, chant_sound_enabled'
            )
            .eq('id', user.id)
            .single()

          if (error) {
            throw error
          }

          if (data) {
            const profileData = data as Record<string, any>
            const formData: SettingsFormData = {
              display_name: profileData.display_name || '',
              daily_goal: profileData.daily_goal || 500,
              theme: (profileData.theme as any) || 'temple',
              preferred_language: (profileData.preferred_language as any) || 'en',
              timezone: profileData.timezone || 'UTC',
              haptics_enabled: profileData.haptics_enabled ?? true,
              chant_sound_enabled: profileData.chant_sound_enabled ?? true,
            }
            reset(formData)
          }
        } catch (error) {
          console.error('Failed to reload profile:', error)
        } finally {
          setIsLoading(false)
        }
      }
      loadProfile()
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-white/30 border-t-amber-400"></div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
      {successMessage && (
        <div className="glassmorphic border-green-500/50 bg-green-500/10 text-green-200 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="glassmorphic border-red-500/50 bg-red-500/10 text-red-200 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={handleRetry}
            className="text-red-300 hover:text-red-200 font-medium text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Profile Section */}
      <section className="glassmorphic space-y-4 p-6 pb-6 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white">Profile</h2>

        <div>
          <label htmlFor="display_name" className="block text-sm font-medium text-white/90 mb-1">
            Display Name
          </label>
          <p className="text-xs text-white/60 mb-2">How your name appears in the app</p>
          <input
            id="display_name"
            type="text"
            placeholder="Your name"
            {...register('display_name')}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sacred-500 text-white bg-white/10 placeholder-white/50 ${
              errors.display_name ? 'border-red-500/50' : 'border-white/20'
            }`}
          />
          {errors.display_name && (
            <p className="text-red-400 text-sm mt-1">{errors.display_name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="daily_goal" className="block text-sm font-medium text-white/90 mb-1">
            Daily Goal
          </label>
          <p className="text-xs text-white/60 mb-2">Target chant count per day</p>
          <input
            id="daily_goal"
            type="number"
            min="1"
            {...register('daily_goal', { valueAsNumber: true })}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sacred-500 text-white bg-white/10 placeholder-white/50 ${
              errors.daily_goal ? 'border-red-500/50' : 'border-white/20'
            }`}
          />
          {errors.daily_goal && (
            <p className="text-red-400 text-sm mt-1">{errors.daily_goal.message}</p>
          )}
        </div>
      </section>

      {/* Preferences Section */}
      <section className="glassmorphic space-y-4 p-6 pb-6 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white">Preferences</h2>

        <div>
          <label className="block text-sm font-medium text-white/90 mb-3">Theme</label>
          <div className="space-y-2">
            {['temple', 'midnight', 'dawn'].map((themeOption) => (
              <label key={themeOption} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value={themeOption}
                  {...register('theme')}
                  className="w-4 h-4 text-sacred-500 focus:ring-2 focus:ring-sacred-400"
                />
                <span className="ml-3 text-sm text-white/80 capitalize">{themeOption}</span>
              </label>
            ))}
          </div>
          {errors.theme && (
            <p className="text-red-400 text-sm mt-1">{errors.theme.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="preferred_language" className="block text-sm font-medium text-white/90 mb-1">
            Language
          </label>
          <select
            id="preferred_language"
            {...register('preferred_language')}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sacred-500 text-white bg-white/10 ${
              errors.preferred_language ? 'border-red-500/50' : 'border-white/20'
            }`}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
          {errors.preferred_language && (
            <p className="text-red-400 text-sm mt-1">{errors.preferred_language.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-white/90 mb-1">
            Timezone
          </label>
          <select
            id="timezone"
            {...register('timezone')}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sacred-500 text-white bg-white/10 ${
              errors.timezone ? 'border-red-500/50' : 'border-white/20'
            }`}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
          {errors.timezone && (
            <p className="text-red-400 text-sm mt-1">{errors.timezone.message}</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div>
              <label className="text-sm font-medium text-white/90">Haptics</label>
              <p className="text-xs text-white/60">Vibration feedback</p>
            </div>
            <input
              type="checkbox"
              {...register('haptics_enabled')}
              className="w-5 h-5 text-sacred-500 rounded focus:ring-2 focus:ring-sacred-400"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div>
              <label className="text-sm font-medium text-white/90">Chant Sound</label>
              <p className="text-xs text-white/60">Sound effects during chanting</p>
            </div>
            <input
              type="checkbox"
              {...register('chant_sound_enabled')}
              className="w-5 h-5 text-sacred-500 rounded focus:ring-2 focus:ring-sacred-400"
            />
          </div>
        </div>
      </section>

      {/* Account Section */}
      <section className="glassmorphic space-y-4 p-6 pb-6 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white">Account</h2>

        <div>
          <label className="block text-sm font-medium text-white/90 mb-1">Email</label>
          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/80">
            {user?.email || 'Not available'}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full px-4 py-2 border border-red-500/50 text-red-300 rounded-lg hover:bg-red-500/10 transition font-medium"
        >
          Sign Out
        </button>
      </section>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-sacred-500 hover:bg-sacred-600 disabled:bg-white/20 text-white font-medium py-3 rounded-lg transition-all shadow-lg shadow-sacred-500/50 hover:shadow-sacred-500/70"
        >
          {isSaving ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
