import { useState, useEffect } from 'react'
import { AnimatePresence } from 'motion/react'
import type { View } from '@renderer/types'
import { windowService } from '@renderer/services'
import { useBlocks, useSettings, useUpdate } from '@renderer/hooks'
import { cn } from '@renderer/lib/utils'
import { TitleBar } from '@renderer/components/layout'
import { UpdateNotification } from '@renderer/components/UpdateNotification'
import { IndexView } from '@renderer/sections/index'
import { NotesView } from '@renderer/sections/notes'
import { ConfigView } from '@renderer/sections/config'
import { CanvasView } from '@renderer/sections/canvas'

export default function App(): React.JSX.Element {
  const [view, setView] = useState<View>('index')
  const [isPinned, setIsPinned] = useState(false)
  const [version, setVersion] = useState('0.0.0')

  const {
    blocks,
    focusedId,
    loaded,
    dateBlocks,
    groupedBlocks,
    collapsedIds,
    setFocusedId,
    updateBlock,
    addBlock,
    addNewDay,
    scrollToDate,
    toggleCollapse
  } = useBlocks()

  const { settings, setFontSize, setFontFamily, setCodeTheme } = useSettings()
  const { updateInfo, checkForUpdates, restartNow, snoozeUpdate, dismissUpdate } = useUpdate()

  useEffect(() => {
    window.api
      ?.getVersion()
      .then((v) => setVersion(v))
      .catch(() => setVersion('0.0.0'))
  }, [])

  const handleTogglePin = async (): Promise<void> => {
    const pinned = await windowService.togglePin()
    setIsPinned(pinned)
  }

  const handleSelectDate = (id: string): void => {
    setView('notes')
    scrollToDate(id)
  }

  if (!loaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 rounded-lg overflow-hidden" />
    )
  }

  return (
    <div
      className="relative flex flex-col h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-800 rounded-lg overflow-hidden"
      style={{ fontFamily: 'var(--app-font-family)' }}
    >
      <TitleBar
        view={view}
        isPinned={isPinned}
        onViewChange={setView}
        onTogglePin={handleTogglePin}
      />

      <UpdateNotification
        updateInfo={updateInfo}
        onRestart={restartNow}
        onSnooze={snoozeUpdate}
        onDismiss={dismissUpdate}
      />

      <main className={cn('flex-1', view === 'canvas' ? 'overflow-hidden' : 'overflow-y-auto')}>
        <AnimatePresence mode="wait">
          {view === 'canvas' ? (
            <CanvasView />
          ) : (
            <div className="max-w-2xl mx-auto px-4 pt-5">
              {view === 'index' ? (
                <IndexView
                  dateBlocks={dateBlocks}
                  onSelectDate={handleSelectDate}
                  onAddDay={addNewDay}
                />
              ) : view === 'config' ? (
                <ConfigView
                  settings={settings}
                  onFontSize={setFontSize}
                  onFontFamily={setFontFamily}
                  onCodeTheme={setCodeTheme}
                  onCheckUpdate={checkForUpdates}
                  updateInfo={updateInfo}
                  version={version}
                />
              ) : (
                <NotesView
                  groupedBlocks={groupedBlocks}
                  focusedId={focusedId}
                  collapsedIds={collapsedIds}
                  onFocus={setFocusedId}
                  onUpdate={updateBlock}
                  onAddBlock={addBlock}
                  onToggleCollapse={toggleCollapse}
                  isEmpty={blocks.length === 0}
                />
              )}
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
