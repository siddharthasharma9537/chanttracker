import { useEffect } from 'react'
import { useOfflineStore } from '@/store/offlineStore'

export function useOnlineStatus() {
  const isOnline = useOfflineStore((state) => state.isOnline)
  const setIsOnline = useOfflineStore((state) => state.setIsOnline)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setIsOnline])

  return isOnline
}
