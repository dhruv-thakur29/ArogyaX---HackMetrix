'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { OfflineAction } from '@/lib/types'
import { saveOfflineAction, getOfflineActions } from './indexedDB'
import { processSyncQueue } from './syncQueue'

interface OfflineContextType {
  isOnline: boolean
  pendingCount: number
  isSyncing: boolean
  lastSyncTime: string | null
  syncError: string | null
  toggleOnlineStatus: () => void
  queueAction: (type: OfflineAction['type'], payload: any) => Promise<void>
  syncNow: () => Promise<void>
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined)

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [pendingCount, setPendingCount] = useState<number>(0)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  const updatePendingCount = async () => {
    const actions = await getOfflineActions()
    setPendingCount(actions.length)
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine)

      const handleOnline = () => {
        setIsOnline(true)
        syncNow()
      }
      const handleOffline = () => {
        setIsOnline(false)
      }

      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      updatePendingCount()

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleOnlineStatus = () => {
    setIsOnline((prev) => {
      const next = !prev
      if (next) {
        setTimeout(() => syncNow(), 100)
      }
      return next
    })
  }

  const queueAction = async (type: OfflineAction['type'], payload: any) => {
    const action: OfflineAction = {
      id: `off_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      payload,
      timestamp: new Date().toISOString(),
      synced: false,
    }
    await saveOfflineAction(action)
    await updatePendingCount()

    if (isOnline) {
      await syncNow()
    }
  }

  const syncNow = async () => {
    setIsSyncing(true)
    setSyncError(null)
    try {
      const res = await processSyncQueue()
      setLastSyncTime(new Date().toLocaleTimeString())
      if (res.errors.length > 0) {
        setSyncError(res.errors.join(', '))
      }
    } catch (err: any) {
      setSyncError(err?.message || 'Sync failed')
    } finally {
      await updatePendingCount()
      setIsSyncing(false)
    }
  }

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        pendingCount,
        isSyncing,
        lastSyncTime,
        syncError,
        toggleOnlineStatus,
        queueAction,
        syncNow,
      }}
    >
      {children}
    </OfflineContext.Provider>
  )
}

export function useOffline() {
  const context = useContext(OfflineContext)
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider')
  }
  return context
}
