'use client'

import { UpdatePasswordForm } from '@/components/auth/UpdatePasswordForm'
import { Card } from '@/components/cards/Card'
import { LockKeyhole } from 'lucide-react'

export default function UpdatePasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-orange-500/20 rounded-2xl">
              <LockKeyhole className="w-8 h-8 text-orange-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: 'Merriweather, serif' }}>
            Set a new password
          </h1>
          <p className="text-white/70">Choose a new password for your account</p>
        </div>

        {/* Update Password Form Card */}
        <Card variant="featured" className="mb-8">
          <UpdatePasswordForm />
        </Card>
      </div>
    </div>
  )
}
