import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'motion/react'
import { Excalidraw } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types'
import type { AppState } from '@excalidraw/excalidraw/types'
import { useCanvasSessions } from '@renderer/hooks'
import { CanvasSessionBar } from './CanvasSessionBar'

if (typeof window !== 'undefined' && !window.EXCALIDRAW_ASSET_PATH) {
  if (import.meta.env.DEV) {
    window.EXCALIDRAW_ASSET_PATH = '/'
  } else {
    window.EXCALIDRAW_ASSET_PATH = new URL('.', window.location.href).href
  }
}

const CANVAS_PREFIX = 'infinito-canvas-'
const DEBOUNCE_MS = 300
const TRANSITION_MS = 150

interface PersistedData {
  elements: ExcalidrawElement[]
  appState: Partial<AppState>
}

function loadSessionData(sessionId: string): PersistedData | null {
  try {
    const raw = localStorage.getItem(`${CANVAS_PREFIX}${sessionId}`)
    if (!raw) return null
    return JSON.parse(raw) as PersistedData
  } catch {
    return null
  }
}

function CanvasExcalidraw({
  sessionId,
  onReady
}: {
  sessionId: string
  onReady: () => void
}): React.JSX.Element {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [initial] = useState(() => loadSessionData(sessionId))
  const readyFired = useRef(false)

  const handleChange = useCallback(
    (elements: readonly ExcalidrawElement[], appState: AppState) => {
      if (!readyFired.current) {
        readyFired.current = true
        onReady()
      }
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        localStorage.setItem(
          `${CANVAS_PREFIX}${sessionId}`,
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
    },
    [sessionId, onReady]
  )

  return (
    <div className="flex-1 excalidraw-wrapper">
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
    </div>
  )
}

export function CanvasView(): React.JSX.Element {
  const { sessions, activeSessionId, setActiveSession, createSession, deleteSession, renameSession } =
    useCanvasSessions()

  const [renderedSessionId, setRenderedSessionId] = useState(activeSessionId)
  const [overlayVisible, setOverlayVisible] = useState(false)
  const pendingSessionRef = useRef<string | null>(null)

  useEffect(() => {
    if (activeSessionId === renderedSessionId) return

    pendingSessionRef.current = activeSessionId
    setOverlayVisible(true)

    const timeout = setTimeout(() => {
      setRenderedSessionId(activeSessionId)
    }, TRANSITION_MS)

    return () => clearTimeout(timeout)
  }, [activeSessionId, renderedSessionId])

  const handleExcalidrawReady = useCallback(() => {
    setTimeout(() => {
      setOverlayVisible(false)
      pendingSessionRef.current = null
    }, 80)
  }, [])

  return (
    <motion.div
      key="canvas"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="relative flex flex-col h-full"
    >
      <CanvasSessionBar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelect={setActiveSession}
        onCreate={createSession}
        onDelete={deleteSession}
        onRename={renameSession}
      />
      <div className="relative flex-1">
        <CanvasExcalidraw
          key={renderedSessionId}
          sessionId={renderedSessionId}
          onReady={handleExcalidrawReady}
        />
        <div
          className="absolute inset-0 bg-zinc-950 pointer-events-none transition-opacity"
          style={{
            opacity: overlayVisible ? 1 : 0,
            transitionDuration: `${TRANSITION_MS}ms`
          }}
        />
      </div>
    </motion.div>
  )
}
