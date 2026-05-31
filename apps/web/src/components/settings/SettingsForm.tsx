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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={handleRetry}
            className="text-red-700 hover:text-red-800 font-medium text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Profile Section */}
      <section className="space-y-4 pb-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Profile</h2>

        <div>
          <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-1">
            Display Name
          </label>
          <p className="text-xs text-gray-500 mb-2">How your name appears in the app</p>
          <input
            id="display_name"
            type="text"
            placeholder="Your name"
            {...register('display_name')}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              errors.display_name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.display_name && (
            <p className="text-red-500 text-sm mt-1">{errors.display_name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="daily_goal" className="block text-sm font-medium text-gray-700 mb-1">
            Daily Goal
          </label>
          <p className="text-xs text-gray-500 mb-2">Target chant count per day</p>
          <input
            id="daily_goal"
            type="number"
            min="1"
            {...register('daily_goal', { valueAsNumber: true })}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              errors.daily_goal ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.daily_goal && (
            <p className="text-red-500 text-sm mt-1">{errors.daily_goal.message}</p>
          )}
        </div>
      </section>

      {/* Preferences Section */}
      <section className="space-y-4 pb-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
          <div className="space-y-2">
            {['temple', 'midnight', 'dawn'].map((themeOption) => (
              <label key={themeOption} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value={themeOption}
                  {...register('theme')}
                  className="w-4 h-4 text-orange-600 focus:ring-2 focus:ring-orange-500"
                />
                <span className="ml-3 text-sm text-gray-700 capitalize">{themeOption}</span>
              </label>
            ))}
          </div>
          {errors.theme && (
            <p className="text-red-500 text-sm mt-1">{errors.theme.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="preferred_language" className="block text-sm font-medium text-gray-700 mb-1">
            Language
          </label>
          <select
            id="preferred_language"
            {...register('preferred_language')}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              errors.preferred_language ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
          {errors.preferred_language && (
            <p className="text-red-500 text-sm mt-1">{errors.preferred_language.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
            Timezone
          </label>
          <select
            id="timezone"
            {...register('timezone')}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              errors.timezone ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
          {errors.timezone && (
            <p className="text-red-500 text-sm mt-1">{errors.timezone.message}</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Haptics</label>
              <p className="text-xs text-gray-500">Vibration feedback</p>
            </div>
            <input
              type="checkbox"
              {...register('haptics_enabled')}
              className="w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Chant Sound</label>
              <p className="text-xs text-gray-500">Sound effects during chanting</p>
            </div>
            <input
              type="checkbox"
              {...register('chant_sound_enabled')}
              className="w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </section>

      {/* Account Section */}
      <section className="space-y-4 pb-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Account</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
            {user?.email || 'Not available'}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full px-4 py-2 border border-red-500 text-red-700 rounded-lg hover:bg-red-50 transition font-medium"
        >
          Sign Out
        </button>
      </section>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition"
        >
          {isSaving ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
