import { useCallback } from 'react'
import type { Viewport } from '@renderer/types'

const MIN_ZOOM = 0.1
const MAX_ZOOM = 5
const ZOOM_SENSITIVITY = 0.001

export function useCanvasViewport(
  viewport: Viewport,
  setViewport: (v: Viewport) => void
): {
  onWheel: (e: React.WheelEvent<SVGSVGElement>) => void
} {
  const onWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault()
      const rect = e.currentTarget.getBoundingClientRect()
      const cursorX = e.clientX - rect.left
      const cursorY = e.clientY - rect.top

      const newZoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, viewport.zoom * (1 - e.deltaY * ZOOM_SENSITIVITY))
      )

      const scale = newZoom / viewport.zoom
      const newOffsetX = cursorX - (cursorX - viewport.offsetX) * scale
      const newOffsetY = cursorY - (cursorY - viewport.offsetY) * scale

      setViewport({ offsetX: newOffsetX, offsetY: newOffsetY, zoom: newZoom })
    },
    [viewport, setViewport]
  )

  return { onWheel }
}
