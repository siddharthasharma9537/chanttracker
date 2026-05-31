'use client'

import Link from 'next/link'
import { SignUpForm } from '@/components/auth/SignUpForm'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Sign Up</h1>
          <p className="text-gray-600">Start tracking your chants today</p>
        </div>

        <SignUpForm />

        <p className="text-center text-gray-600 text-sm mt-6">
          Already have an account?{' '}
          <Link
            href="/auth/signin"
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
