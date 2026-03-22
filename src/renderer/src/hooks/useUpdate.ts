import { useState, useEffect, useCallback } from 'react'
import type { UpdateInfo } from '@renderer/types'

export function useUpdate(): {
  updateInfo: UpdateInfo | null
  checkForUpdates: () => Promise<void>
  restartNow: () => Promise<void>
  snoozeUpdate: () => Promise<void>
  dismissUpdate: () => void
} {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)

  useEffect(() => {
    if (!window.api?.update) return

    const unsubscribe = window.api.update.onStatus((status) => {
      setUpdateInfo(status as UpdateInfo)
    })

    window.api.update.getStatus().then((status) => {
      const info = status as UpdateInfo
      if (info.available) {
        setUpdateInfo(info)
      }
    })

    return unsubscribe
  }, [])

  const checkForUpdates = useCallback(async (): Promise<void> => {
    if (!window.api?.update) return
    await window.api.update.check()
  }, [])

  const restartNow = useCallback(async (): Promise<void> => {
    if (!window.api?.update) return
    await window.api.update.restart()
  }, [])

  const snoozeUpdate = useCallback(async (): Promise<void> => {
    if (!window.api?.update) return
    setUpdateInfo(null)
    await window.api.update.snooze()
  }, [])

  const dismissUpdate = useCallback((): void => {
    setUpdateInfo(null)
  }, [])

  return {
    updateInfo,
    checkForUpdates,
    restartNow,
    snoozeUpdate,
    dismissUpdate
  }
}
