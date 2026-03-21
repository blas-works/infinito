import { useState } from 'react'
import { AnimatePresence } from 'motion/react'
import type { View } from '@renderer/types'
import { windowService } from '@renderer/services'
import { useBlocks, useSettings } from '@renderer/hooks'
import { TitleBar } from '@renderer/components/layout'
import { IndexView } from '@renderer/sections/index'
import { NotesView } from '@renderer/sections/notes'
import { ConfigView } from '@renderer/sections/config'

export default function App(): React.JSX.Element {
  const [view, setView] = useState<View>('index')
  const [isPinned, setIsPinned] = useState(false)

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

  const handleTogglePin = async (): Promise<void> => {
    const pinned = await windowService.togglePin()
    setIsPinned(pinned)
  }

  const handleSelectDate = (id: string): void => {
    setView('notes')
    scrollToDate(id)
  }

  if (!loaded) {
    return <div className="flex h-screen items-center justify-center bg-zinc-950" />
  }

  return (
    <div
      className="flex flex-col h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-800"
      style={{ fontFamily: 'var(--app-font-family)' }}
    >
      <TitleBar
        view={view}
        isPinned={isPinned}
        onViewChange={setView}
        onTogglePin={handleTogglePin}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 pt-5">
          <AnimatePresence mode="wait">
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
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
