import { useCallback, useRef } from 'react'
import type { LineElement, Viewport } from '@renderer/types'
import { getControlPoint, getLineMidpoint, screenToWorld } from '@renderer/types'

interface CurveHandleProps {
  element: LineElement
  viewport: Viewport
  zoom: number
  onUpdate: (id: string, patch: Partial<LineElement>) => void
}

export function CurveHandle({
  element,
  viewport,
  zoom,
  onUpdate
}: CurveHandleProps): React.JSX.Element {
  const dragging = useRef(false)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const cp = getControlPoint(element)
  const mid = getLineMidpoint(element)
  const isCurved = element.cx !== undefined && element.cy !== undefined
  const radius = 5 / zoom
  const strokeWidth = 1.5 / zoom

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGCircleElement>) => {
      e.stopPropagation()
      e.preventDefault()
      dragging.current = true
      svgRef.current = (e.target as SVGElement).ownerSVGElement

      const handleMove = (ev: PointerEvent): void => {
        if (!dragging.current || !svgRef.current) return
        const rect = svgRef.current.getBoundingClientRect()
        const world = screenToWorld(ev.clientX - rect.left, ev.clientY - rect.top, viewport)
        onUpdate(element.id, { cx: world.x, cy: world.y })
      }

      const handleUp = (): void => {
        dragging.current = false
        window.removeEventListener('pointermove', handleMove)
        window.removeEventListener('pointerup', handleUp)
      }

      window.addEventListener('pointermove', handleMove)
      window.addEventListener('pointerup', handleUp)
    },
    [element.id, viewport, onUpdate]
  )

  const onDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      // Reset to straight line
      onUpdate(element.id, { cx: undefined, cy: undefined })
    },
    [element.id, onUpdate]
  )

  return (
    <g>
      {/* Guide line from midpoint to control point */}
      {isCurved && (
        <line
          x1={mid.x}
          y1={mid.y}
          x2={cp.x}
          y2={cp.y}
          stroke="#3b82f6"
          strokeWidth={strokeWidth * 0.6}
          strokeDasharray={`${3 / zoom} ${2 / zoom}`}
          pointerEvents="none"
          opacity={0.5}
        />
      )}

      {/* Draggable handle */}
      <circle
        cx={cp.x}
        cy={cp.y}
        r={radius}
        fill={isCurved ? '#3b82f6' : '#1e293b'}
        stroke="#3b82f6"
        strokeWidth={strokeWidth}
        style={{ cursor: 'grab' }}
        onPointerDown={onPointerDown}
        onDoubleClick={onDoubleClick}
      />
    </g>
  )
}
