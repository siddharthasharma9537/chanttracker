'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type SignInFormData = z.infer<typeof signInSchema>

export function SignInForm() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  })

  const onSubmit = async (data: SignInFormData) => {
    startTransition(async () => {
      try {
        await signIn(data.email, data.password)
        router.push('/dashboard')
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Sign in failed'
        setError('password', {
          message,
        })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-900" style={{ color: '#111827' }}>
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

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-900" style={{ color: '#111827' }}>
          Password
        </label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register('password')}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white placeholder-gray-500 ${
            errors.password ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">
            {errors.password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition"
      >
        {isPending ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  )
}
