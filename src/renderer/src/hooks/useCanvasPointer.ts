import { useState, useCallback } from 'react'
import type {
  CanvasElement,
  CanvasTool,
  LineStyle,
  Viewport,
  PointerMode,
  ShapeElement,
  TextElement
} from '@renderer/types'
import { screenToWorld, getElementBounds, getControlPoint } from '@renderer/types'
import { generateId } from '@renderer/lib/id'

const HIT_THRESHOLD = 8

interface PointerActions {
  addElement: (element: CanvasElement) => void
  updateElement: (id: string, patch: Partial<CanvasElement>) => void
  deleteElement: (id: string) => void
  setSelectedIds: (ids: string[]) => void
  setViewport: (v: Viewport) => void
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>
}

interface PointerConfig {
  tool: CanvasTool
  viewport: Viewport
  elements: CanvasElement[]
  strokeColor: string
  fillColor: string
  lineStyle: LineStyle
  selectedIds: string[]
}

function distanceToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1
  const dy = y2 - y1
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.hypot(px - x1, py - y1)
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

/** Distance from point to quadratic Bézier curve (sampled) */
function distanceToBezier(
  px: number,
  py: number,
  x1: number,
  y1: number,
  cx: number,
  cy: number,
  x2: number,
  y2: number
): number {
  let minDist = Infinity
  const steps = 32
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const mt = 1 - t
    const bx = mt * mt * x1 + 2 * mt * t * cx + t * t * x2
    const by = mt * mt * y1 + 2 * mt * t * cy + t * t * y2
    const dist = Math.hypot(px - bx, py - by)
    if (dist < minDist) minDist = dist
  }
  return minDist
}

function hitTest(
  worldX: number,
  worldY: number,
  elements: CanvasElement[],
  zoom: number
): CanvasElement | null {
  const threshold = HIT_THRESHOLD / zoom

  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i]
    if (el.kind === 'line' || el.kind === 'arrow') {
      const cp = getControlPoint(el)
      const dist =
        el.cx !== undefined && el.cy !== undefined
          ? distanceToBezier(worldX, worldY, el.x1, el.y1, cp.x, cp.y, el.x2, el.y2)
          : distanceToSegment(worldX, worldY, el.x1, el.y1, el.x2, el.y2)
      if (dist <= threshold) return el
    } else {
      const bounds = getElementBounds(el)
      if (
        worldX >= bounds.x &&
        worldX <= bounds.x + bounds.width &&
        worldY >= bounds.y &&
        worldY <= bounds.y + bounds.height
      ) {
        return el
      }
    }
  }
  return null
}

function elementsInRect(
  elements: CanvasElement[],
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string[] {
  const minX = Math.min(x1, x2)
  const minY = Math.min(y1, y2)
  const maxX = Math.max(x1, x2)
  const maxY = Math.max(y1, y2)

  return elements
    .filter((el) => {
      const bounds = getElementBounds(el)
      return (
        bounds.x >= minX &&
        bounds.y >= minY &&
        bounds.x + bounds.width <= maxX &&
        bounds.y + bounds.height <= maxY
      )
    })
    .map((el) => el.id)
}

function createShapeElement(
  kind: 'rectangle' | 'circle' | 'triangle',
  worldX: number,
  worldY: number,
  stroke: string,
  fill: string,
  lineStyle: LineStyle
): CanvasElement {
  return {
    id: generateId(),
    kind,
    x: worldX,
    y: worldY,
    width: 0,
    height: 0,
    stroke,
    fill,
    strokeWidth: 2,
    lineStyle,
    opacity: 1
  }
}

function createLineElement(
  kind: 'line' | 'arrow',
  worldX: number,
  worldY: number,
  stroke: string,
  lineStyle: LineStyle
): CanvasElement {
  return {
    id: generateId(),
    kind,
    x1: worldX,
    y1: worldY,
    x2: worldX,
    y2: worldY,
    stroke,
    fill: 'none',
    strokeWidth: 2,
    lineStyle,
    opacity: 1
  }
}

function createTextElement(worldX: number, worldY: number, stroke: string): CanvasElement {
  return {
    id: generateId(),
    kind: 'text',
    x: worldX,
    y: worldY,
    width: 200,
    height: 40,
    content: '',
    fontSize: 16,
    stroke,
    fill: 'none',
    strokeWidth: 1,
    lineStyle: 'solid',
    opacity: 1
  }
}

export function useCanvasPointer(
  config: PointerConfig,
  actions: PointerActions
): {
  mode: PointerMode
  onPointerDown: (e: React.PointerEvent<SVGSVGElement>) => void
  onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => void
  onPointerUp: () => void
} {
  const [mode, setMode] = useState<PointerMode>({ type: 'idle' })
  const { tool, viewport, elements, strokeColor, fillColor, lineStyle, selectedIds } = config

  const getWorldPos = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      return screenToWorld(e.clientX - rect.left, e.clientY - rect.top, viewport)
    },
    [viewport]
  )

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (e.button !== 0) return
      const rect = e.currentTarget.getBoundingClientRect()
      const screenX = e.clientX - rect.left
      const screenY = e.clientY - rect.top
      const world = screenToWorld(screenX, screenY, viewport)
      const isCtrl = e.ctrlKey || e.metaKey

      if (tool === 'select') {
        const hit = hitTest(world.x, world.y, elements, viewport.zoom)
        if (hit) {
          if (isCtrl) {
            // Ctrl+Click: toggle element in selection
            const alreadySelected = selectedIds.includes(hit.id)
            if (alreadySelected) {
              actions.setSelectedIds(selectedIds.filter((id) => id !== hit.id))
            } else {
              actions.setSelectedIds([...selectedIds, hit.id])
            }
          } else {
            // Normal click on element: select only this one and start moving
            if (!selectedIds.includes(hit.id)) {
              actions.setSelectedIds([hit.id])
            }
            const bounds = getElementBounds(hit)
            setMode({
              type: 'moving',
              elementId: hit.id,
              offsetX: world.x - bounds.x,
              offsetY: world.y - bounds.y
            })
          }
        } else {
          if (isCtrl) {
            // Ctrl+Click on empty: keep selection, start panning
            setMode({
              type: 'panning',
              startX: screenX,
              startY: screenY,
              startOffset: { ...viewport }
            })
          } else {
            // Click on empty: start marquee selection
            actions.setSelectedIds([])
            setMode({
              type: 'selecting',
              startX: world.x,
              startY: world.y,
              currentX: world.x,
              currentY: world.y
            })
          }
        }
        return
      }

      if (tool === 'text') {
        const el = createTextElement(world.x, world.y, strokeColor)
        actions.addElement(el)
        actions.setSelectedIds([el.id])
        return
      }

      let newElement: CanvasElement
      if (tool === 'line' || tool === 'arrow') {
        newElement = createLineElement(tool, world.x, world.y, strokeColor, lineStyle)
      } else {
        newElement = createShapeElement(tool, world.x, world.y, strokeColor, fillColor, lineStyle)
      }

      actions.addElement(newElement)
      actions.setSelectedIds([newElement.id])
      setMode({ type: 'drawing', elementId: newElement.id, startX: world.x, startY: world.y })
    },
    [tool, viewport, elements, strokeColor, fillColor, lineStyle, selectedIds, actions]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (mode.type === 'idle') return

      if (mode.type === 'panning') {
        const rect = e.currentTarget.getBoundingClientRect()
        const screenX = e.clientX - rect.left
        const screenY = e.clientY - rect.top
        actions.setViewport({
          offsetX: mode.startOffset.offsetX + (screenX - mode.startX),
          offsetY: mode.startOffset.offsetY + (screenY - mode.startY),
          zoom: viewport.zoom
        })
        return
      }

      if (mode.type === 'selecting') {
        const world = getWorldPos(e)
        setMode({ ...mode, currentX: world.x, currentY: world.y })
        return
      }

      const world = getWorldPos(e)

      if (mode.type === 'drawing') {
        const el = elements.find((el) => el.id === mode.elementId)
        if (!el) return

        if (el.kind === 'line' || el.kind === 'arrow') {
          actions.updateElement(mode.elementId, { x2: world.x, y2: world.y })
        } else if (el.kind !== 'text') {
          const x = Math.min(mode.startX, world.x)
          const y = Math.min(mode.startY, world.y)
          const width = Math.abs(world.x - mode.startX)
          const height = Math.abs(world.y - mode.startY)
          actions.updateElement(mode.elementId, { x, y, width, height })
        }
        return
      }

      if (mode.type === 'moving') {
        const el = elements.find((el) => el.id === mode.elementId)
        if (!el) return

        const newX = world.x - mode.offsetX
        const newY = world.y - mode.offsetY

        if (selectedIds.length > 1 && selectedIds.includes(mode.elementId)) {
          // Move all selected elements together
          const bounds = getElementBounds(el)
          const dx = newX - bounds.x
          const dy = newY - bounds.y

          actions.setElements((prev) =>
            prev.map((el) => {
              if (!selectedIds.includes(el.id)) return el
              if (el.kind === 'line' || el.kind === 'arrow') {
                const patch: Partial<typeof el> = {
                  x1: el.x1 + dx,
                  y1: el.y1 + dy,
                  x2: el.x2 + dx,
                  y2: el.y2 + dy
                }
                if (el.cx !== undefined && el.cy !== undefined) {
                  patch.cx = el.cx + dx
                  patch.cy = el.cy + dy
                }
                return { ...el, ...patch }
              }
              const shaped = el as ShapeElement | TextElement
              return { ...shaped, x: shaped.x + dx, y: shaped.y + dy } as CanvasElement
            })
          )
        } else {
          // Move single element
          if (el.kind === 'line' || el.kind === 'arrow') {
            const bounds = getElementBounds(el)
            const dx = newX - bounds.x
            const dy = newY - bounds.y
            const patch: Record<string, number> = {
              x1: el.x1 + dx,
              y1: el.y1 + dy,
              x2: el.x2 + dx,
              y2: el.y2 + dy
            }
            if (el.cx !== undefined && el.cy !== undefined) {
              patch.cx = el.cx + dx
              patch.cy = el.cy + dy
            }
            actions.updateElement(mode.elementId, patch)
          } else {
            actions.updateElement(mode.elementId, { x: newX, y: newY })
          }
        }
      }
    },
    [mode, viewport, elements, selectedIds, actions, getWorldPos]
  )

  const onPointerUp = useCallback(() => {
    if (mode.type === 'drawing') {
      const el = elements.find((el) => el.id === mode.elementId)
      if (el) {
        const bounds = getElementBounds(el)
        if (bounds.width < 2 && bounds.height < 2 && el.kind !== 'text') {
          actions.deleteElement(el.id)
        }
      }
    }

    if (mode.type === 'selecting') {
      const dx = Math.abs(mode.currentX - mode.startX)
      const dy = Math.abs(mode.currentY - mode.startY)
      if (dx > 2 || dy > 2) {
        // Marquee was dragged: select all elements fully inside the rect
        const ids = elementsInRect(elements, mode.startX, mode.startY, mode.currentX, mode.currentY)
        actions.setSelectedIds(ids)
      }
      // If marquee was tiny (just a click), selection was already cleared on pointer down
    }

    setMode({ type: 'idle' })
  }, [mode, elements, actions])

  return { mode, onPointerDown, onPointerMove, onPointerUp }
}
