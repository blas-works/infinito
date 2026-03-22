import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@renderer/components/ui/button'
import type { UpdateInfo } from '@renderer/types'

interface UpdateNotificationProps {
  updateInfo: UpdateInfo | null
  onRestart: () => void
  onSnooze: () => void
  onDismiss: () => void
}

const RELEASE_URL = 'https://github.com/torrescereno/infinito/releases/latest'

export function UpdateNotification({
  updateInfo,
  onRestart,
  onSnooze,
  onDismiss
}: UpdateNotificationProps): React.JSX.Element {
  const [countdown, setCountdown] = useState(300)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCountdown(300)
  }, [updateInfo])

  useEffect(() => {
    if (!updateInfo?.available || updateInfo.priority !== 'critical') return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          onRestart()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return (): void => {
      clearInterval(timer)
    }
  }, [updateInfo, onRestart])

  const handleDownload = (): void => {
    window.api?.openExternal(RELEASE_URL)
    onDismiss()
  }

  const isVisible = updateInfo?.available === true

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="no-drag overflow-hidden px-3 pt-2"
        >
          <BannerContent
            updateInfo={updateInfo}
            countdown={countdown}
            onRestart={onRestart}
            onSnooze={onSnooze}
            onDismiss={onDismiss}
            onDownload={handleDownload}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface BannerContentProps {
  updateInfo: UpdateInfo
  countdown: number
  onRestart: () => void
  onSnooze: () => void
  onDismiss: () => void
  onDownload: () => void
}

function BannerContent({
  updateInfo,
  countdown,
  onRestart,
  onSnooze,
  onDismiss,
  onDownload
}: BannerContentProps): React.JSX.Element {
  const isCritical = updateInfo.priority === 'critical'
  const isSecurity = updateInfo.priority === 'security'
  const isDownloaded = updateInfo.downloaded === true
  const isManualDownload = updateInfo.manualDownload === true

  if (isCritical) {
    const minutes = Math.floor(countdown / 60)
    const seconds = countdown % 60

    return (
      <div className="flex flex-col gap-1.5 rounded-lg bg-red-950/40 border border-red-900/30 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <svg
            className="h-4 w-4 shrink-0 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="flex-1 text-xs font-medium text-red-300">Critical update</span>
          {!isManualDownload && (
            <span className="font-mono text-[10px] text-red-400/60">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          )}
        </div>

        <div className="flex gap-1.5">
          {isManualDownload ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="flex-1 rounded-md text-red-400/60 hover:text-red-300 text-[10px]"
              >
                Later
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownload}
                className="flex-1 rounded-md bg-red-900/50 text-red-200 hover:bg-red-900/70 text-[10px]"
              >
                Download
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSnooze}
                className="flex-1 rounded-md text-red-400/60 hover:text-red-300 text-[10px]"
              >
                5 min
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRestart}
                disabled={!isDownloaded}
                className="flex-1 rounded-md bg-red-900/50 text-red-200 hover:bg-red-900/70 text-[10px]"
              >
                {isDownloaded ? 'Restart' : 'Downloading...'}
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  if (isSecurity) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-orange-950/40 border border-orange-900/30 px-3 py-2.5 text-xs">
        <svg
          className="h-4 w-4 shrink-0 text-orange-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>

        <span className="flex-1 text-orange-300">
          Security update
          {updateInfo.version && <span className="text-orange-400/60"> v{updateInfo.version}</span>}
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="rounded-md text-orange-800 hover:text-orange-400 text-[10px]"
        >
          Later
        </Button>
        {isManualDownload ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDownload}
            className="rounded-md bg-orange-900/50 text-orange-200 hover:bg-orange-900/70 text-[10px]"
          >
            Download
          </Button>
        ) : (
          isDownloaded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRestart}
              className="rounded-md bg-orange-900/50 text-orange-200 hover:bg-orange-900/70 text-[10px]"
            >
              Restart
            </Button>
          )
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-lg bg-zinc-900/60 border border-zinc-800/50 px-3 py-2.5 text-xs">
      <svg
        className="h-4 w-4 shrink-0 text-zinc-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
        />
      </svg>

      <span className="flex-1 text-zinc-300">
        Update available
        {updateInfo.version && <span className="text-zinc-500"> v{updateInfo.version}</span>}
      </span>

      <Button
        variant="ghost"
        size="sm"
        onClick={onDismiss}
        className="text-zinc-600 hover:text-zinc-400 text-[10px] rounded-md"
      >
        Skip
      </Button>
      {isManualDownload ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDownload}
          className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-[10px] rounded-md"
        >
          Download
        </Button>
      ) : (
        isDownloaded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRestart}
            className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-[10px] rounded-md"
          >
            Restart
          </Button>
        )
      )}
    </div>
  )
}
