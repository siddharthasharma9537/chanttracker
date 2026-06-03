'use client'

import Link from 'next/link'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { Card } from '@/components/cards/Card'
import { Sparkles } from 'lucide-react'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-sacred-500/20 rounded-2xl">
              <Sparkles className="w-8 h-8 text-sacred-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: 'Merriweather, serif' }}>
            Begin your journey
          </h1>
          <p className="text-white/70">Start tracking your spiritual practice today</p>
        </div>

        {/* Sign Up Form Card */}
        <Card variant="featured" className="mb-8">
          <SignUpForm />
        </Card>

        {/* Sign In Link */}
        <p className="text-center text-white/70 text-sm">
          Already have an account?{' '}
          <Link
            href="/auth/signin"
            className="text-orange-400 hover:text-orange-300 font-semibold transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
