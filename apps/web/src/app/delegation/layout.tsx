import { ReactNode } from 'react'

export const metadata = {
  title: 'Host & Delegation | ChantTracker',
  description: 'Manage delegation projects and priest assignments',
}

export default function DelegationLayout({
  children,
}: {
  children: ReactNode
}) {
  return <>{children}</>
}
