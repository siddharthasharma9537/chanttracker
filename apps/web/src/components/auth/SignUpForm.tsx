'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one number'),
  displayName: z.string().optional(),
})

type SignUpFormData = z.infer<typeof signUpSchema>

export function SignUpForm() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  })

  const onSubmit = async (data: SignUpFormData) => {
    startTransition(async () => {
      try {
        await signUp(data.email, data.password, data.displayName)
        router.push('/dashboard')
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Sign up failed'
        setError('password', {
          message,
        })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-900">
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
        <label htmlFor="displayName" className="block text-sm font-medium mb-1 text-gray-900">
          Display Name (optional)
        </label>
        <input
          id="displayName"
          type="text"
          placeholder="Your name"
          {...register('displayName')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white placeholder-gray-500"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1 text-gray-900">
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
        <p className="text-gray-600 text-xs mt-2 text-gray-600">
          At least 8 characters, 1 uppercase, 1 number
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition"
      >
        {isPending ? 'Creating account...' : 'Sign Up'}
      </button>
    </form>
  )
}
