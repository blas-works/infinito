import type { CanvasElement, PointerMode } from '@renderer/types'
import { getElementBounds } from '@renderer/types'

interface SelectionOverlayProps {
  elements: CanvasElement[]
  selectedIds: string[]
  mode: PointerMode
  zoom: number
}

export function SelectionOverlay({
  elements,
  selectedIds,
  mode,
  zoom
}: SelectionOverlayProps): React.JSX.Element {
  const padding = 4 / zoom
  const strokeWidth = 1.5 / zoom

  return (
    <>
      {selectedIds.map((id) => {
        const element = elements.find((el) => el.id === id)
        if (!element) return null
        const bounds = getElementBounds(element)
        return (
          <rect
            key={id}
            x={bounds.x - padding}
            y={bounds.y - padding}
            width={bounds.width + padding * 2}
            height={bounds.height + padding * 2}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={strokeWidth}
            strokeDasharray={`${4 / zoom} ${3 / zoom}`}
            pointerEvents="none"
            rx={2 / zoom}
          />
        )
      })}

      {mode.type === 'selecting' && (
        <rect
          x={Math.min(mode.startX, mode.currentX)}
          y={Math.min(mode.startY, mode.currentY)}
          width={Math.abs(mode.currentX - mode.startX)}
          height={Math.abs(mode.currentY - mode.startY)}
          fill="rgba(59, 130, 246, 0.08)"
          stroke="#3b82f6"
          strokeWidth={strokeWidth}
          strokeDasharray={`${4 / zoom} ${3 / zoom}`}
          pointerEvents="none"
          rx={2 / zoom}
        />
      )}
    </>
  )
}
