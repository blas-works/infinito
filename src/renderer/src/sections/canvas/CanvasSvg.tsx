import type { CanvasElement as CanvasElementType, Viewport, PointerMode, LineElement } from '@renderer/types'
import { CanvasElement, ArrowMarkerDef } from './CanvasElement'
import { SelectionOverlay } from './SelectionOverlay'
import { CurveHandle } from './CurveHandle'

interface CanvasSvgProps {
  elements: CanvasElementType[]
  selectedIds: string[]
  editingId: string | null
  viewport: Viewport
  mode: PointerMode
  onPointerDown: (e: React.PointerEvent<SVGSVGElement>) => void
  onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => void
  onPointerUp: () => void
  onWheel: (e: React.WheelEvent<SVGSVGElement>) => void
  onDoubleClick: (e: React.MouseEvent<SVGSVGElement>) => void
  onTextChange: (id: string, content: string, height?: number) => void
  onEditEnd: () => void
  onUpdateElement: (id: string, patch: Partial<CanvasElementType>) => void
}

export function CanvasSvg({
  elements,
  selectedIds,
  editingId,
  viewport,
  mode,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
  onDoubleClick,
  onTextChange,
  onEditEnd,
  onUpdateElement
}: CanvasSvgProps): React.JSX.Element {
  // Collect selected line/arrow elements for curve handles
  const selectedLineElements = selectedIds.length <= 4
    ? elements.filter(
        (el): el is LineElement =>
          (el.kind === 'line' || el.kind === 'arrow') && selectedIds.includes(el.id)
      )
    : []

  return (
    <svg
      className="w-full h-full cursor-crosshair bg-zinc-950"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={onDoubleClick}
      onWheel={onWheel}
      style={{ touchAction: 'none' }}
    >
      <ArrowMarkerDef />

      <g transform={`translate(${viewport.offsetX}, ${viewport.offsetY}) scale(${viewport.zoom})`}>
        {elements.map((element) => (
          <CanvasElement
            key={element.id}
            element={element}
            isSelected={selectedIds.includes(element.id)}
            isEditing={element.id === editingId}
            onTextChange={onTextChange}
            onEditEnd={onEditEnd}
          />
        ))}

        <SelectionOverlay
          elements={elements}
          selectedIds={selectedIds}
          mode={mode}
          zoom={viewport.zoom}
        />

        {selectedLineElements.map((el) => (
          <CurveHandle
            key={`curve-${el.id}`}
            element={el}
            viewport={viewport}
            zoom={viewport.zoom}
            onUpdate={onUpdateElement}
          />
        ))}
      </g>
    </svg>
  )
}
