'use client'

import { useTransition, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const { resetPasswordForEmail } = useAuth()
  const [isPending, startTransition] = useTransition()
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    startTransition(async () => {
      try {
        await resetPasswordForEmail(data.email)
        setSent(true)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Could not send reset email'
        setError('email', { message })
      }
    })
  }

  if (sent) {
    return (
      <p className="text-white/70 text-center">
        If an account exists for that email, we&apos;ve sent a link to reset your password.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2 text-white" style={{ color: '#ffffff' }}>
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="your@email.com"
          {...register('email')}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white placeholder-gray-500 ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition"
      >
        {isPending ? 'Sending...' : 'Send reset link'}
      </button>
    </form>
  )
}
