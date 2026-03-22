import { useState, useRef, useCallback } from 'react'
import { motion } from 'motion/react'
import { Excalidraw } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types'
import type { AppState } from '@excalidraw/excalidraw/types'

const STORAGE_KEY = 'infinito-excalidraw'
const DEBOUNCE_MS = 300

interface PersistedData {
  elements: ExcalidrawElement[]
  appState: Partial<AppState>
}

function loadSavedData(): PersistedData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedData
  } catch {
    return null
  }
}

export function CanvasView(): React.JSX.Element {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [initial] = useState(loadSavedData)

  const handleChange = useCallback((elements: readonly ExcalidrawElement[], appState: AppState) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          elements,
          appState: {
            theme: appState.theme,
            viewBackgroundColor: appState.viewBackgroundColor,
            zoom: appState.zoom,
            scrollX: appState.scrollX,
            scrollY: appState.scrollY
          }
        })
      )
    }, DEBOUNCE_MS)
  }, [])

  return (
    <motion.div
      key="canvas"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="excalidraw-wrapper"
    >
      <Excalidraw
        initialData={
          initial
            ? {
                elements: initial.elements,
                appState: {
                  ...initial.appState,
                  theme: 'dark'
                }
              }
            : {
                appState: { theme: 'dark' }
              }
        }
        onChange={handleChange}
        theme="dark"
        UIOptions={{
          canvasActions: {
            export: false,
            saveAsImage: false,
            loadScene: false
          }
        }}
      />
    </motion.div>
  )
}
