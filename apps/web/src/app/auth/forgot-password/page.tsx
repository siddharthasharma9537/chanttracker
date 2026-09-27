'use client'

import Link from 'next/link'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { Card } from '@/components/cards/Card'
import { KeyRound } from 'lucide-react'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-orange-500/20 rounded-2xl">
              <KeyRound className="w-8 h-8 text-orange-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: 'Merriweather, serif' }}>
            Reset your password
          </h1>
          <p className="text-white/70">We&apos;ll email you a link to set a new one</p>
        </div>

        {/* Forgot Password Form Card */}
        <Card variant="featured" className="mb-8">
          <ForgotPasswordForm />
        </Card>

        {/* Back to Sign In Link */}
        <p className="text-center text-white/70 text-sm">
          Remembered your password?{' '}
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
