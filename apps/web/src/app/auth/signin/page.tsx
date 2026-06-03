'use client'

import Link from 'next/link'
import { SignInForm } from '@/components/auth/SignInForm'
import { Card } from '@/components/cards/Card'
import { Flame } from 'lucide-react'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-orange-500/20 rounded-2xl">
              <Flame className="w-8 h-8 text-orange-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: 'Merriweather, serif' }}>
            Welcome back
          </h1>
          <p className="text-white/70">Sign in to continue your spiritual practice</p>
        </div>

        {/* Sign In Form Card */}
        <Card variant="featured" className="mb-8">
          <SignInForm />
        </Card>

        {/* Sign Up Link */}
        <p className="text-center text-white/70 text-sm">
          Don&apos;t have an account?{' '}
          <Link
            href="/auth/signup"
            className="text-orange-400 hover:text-orange-300 font-semibold transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
