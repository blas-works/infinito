import { useState, useEffect, useCallback } from 'react'
import type { CanvasElement, CanvasTool, LineStyle, Viewport } from '@renderer/types'

const STORAGE_KEY = 'infinito-canvas'
const DEBOUNCE_MS = 300

interface PersistedState {
  elements: CanvasElement[]
  viewport: Viewport
}

const DEFAULT_VIEWPORT: Viewport = { offsetX: 0, offsetY: 0, zoom: 1 }

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { elements: [], viewport: DEFAULT_VIEWPORT }
    const parsed = JSON.parse(raw) as PersistedState
    return {
      elements: parsed.elements ?? [],
      viewport: parsed.viewport ?? DEFAULT_VIEWPORT
    }
  } catch {
    return { elements: [], viewport: DEFAULT_VIEWPORT }
  }
}

export interface UseCanvasReturn {
  elements: CanvasElement[]
  selectedIds: string[]
  tool: CanvasTool
  strokeColor: string
  fillColor: string
  lineStyle: LineStyle
  viewport: Viewport
  setTool: (tool: CanvasTool) => void
  setStrokeColor: (color: string) => void
  setFillColor: (color: string) => void
  setLineStyle: (style: LineStyle) => void
  addElement: (element: CanvasElement) => void
  updateElement: (id: string, patch: Partial<CanvasElement>) => void
  deleteElement: (id: string) => void
  deleteElements: (ids: string[]) => void
  setSelectedIds: (ids: string[]) => void
  setViewport: (viewport: Viewport) => void
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>
}

export function useCanvas(): UseCanvasReturn {
  const [elements, setElements] = useState<CanvasElement[]>(() => loadState().elements)
  const [viewport, setViewport] = useState<Viewport>(() => loadState().viewport)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [tool, setTool] = useState<CanvasTool>('select')
  const [strokeColor, setStrokeColor] = useState('#f4f4f5')
  const [fillColor, setFillColor] = useState('none')
  const [lineStyle, setLineStyle] = useState<LineStyle>('solid')

  // Debounced persistence
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ elements, viewport }))
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [elements, viewport])

  const addElement = useCallback((element: CanvasElement) => {
    setElements((prev) => [...prev, element])
  }, [])

  const updateElement = useCallback((id: string, patch: Partial<CanvasElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? ({ ...el, ...patch } as CanvasElement) : el))
    )
  }, [])

  const deleteElement = useCallback((id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id))
    setSelectedIds((prev) => prev.filter((sid) => sid !== id))
  }, [])

  const deleteElements = useCallback((ids: string[]) => {
    const idSet = new Set(ids)
    setElements((prev) => prev.filter((el) => !idSet.has(el.id)))
    setSelectedIds((prev) => prev.filter((sid) => !idSet.has(sid)))
  }, [])

  return {
    elements,
    selectedIds,
    tool,
    strokeColor,
    fillColor,
    lineStyle,
    viewport,
    setTool,
    setStrokeColor,
    setFillColor,
    setLineStyle,
    addElement,
    updateElement,
    deleteElement,
    deleteElements,
    setSelectedIds,
    setViewport,
    setElements
  }
}
