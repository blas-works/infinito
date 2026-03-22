import { useRef, useEffect, useLayoutEffect } from 'react'
import type { CanvasElement as CanvasElementType } from '@renderer/types'
import { LINE_DASH_ARRAYS, getLinePath } from '@renderer/types'

interface CanvasElementProps {
  element: CanvasElementType
  isSelected?: boolean
  isEditing?: boolean
  onTextChange?: (id: string, content: string, height?: number) => void
  onEditEnd?: () => void
}

const ARROW_MARKER_ID = 'arrowhead'

export function ArrowMarkerDef(): React.JSX.Element {
  return (
    <defs>
      <marker
        id={ARROW_MARKER_ID}
        markerWidth="10"
        markerHeight="7"
        refX="10"
        refY="3.5"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
      </marker>
    </defs>
  )
}

export function CanvasElement({
  element,
  isEditing,
  onTextChange,
  onEditEnd
}: CanvasElementProps): React.JSX.Element {
  const dashArray = LINE_DASH_ARRAYS[element.lineStyle] || undefined

  switch (element.kind) {
    case 'rectangle':
      return (
        <rect
          x={element.x}
          y={element.y}
          width={element.width}
          height={element.height}
          rx={4}
          stroke={element.stroke}
          fill={element.fill}
          strokeWidth={element.strokeWidth}
          strokeDasharray={dashArray}
          opacity={element.opacity}
        />
      )

    case 'circle':
      return (
        <ellipse
          cx={element.x + element.width / 2}
          cy={element.y + element.height / 2}
          rx={element.width / 2}
          ry={element.height / 2}
          stroke={element.stroke}
          fill={element.fill}
          strokeWidth={element.strokeWidth}
          strokeDasharray={dashArray}
          opacity={element.opacity}
        />
      )

    case 'triangle': {
      const { x, y, width, height } = element
      const points = `${x + width / 2},${y} ${x + width},${y + height} ${x},${y + height}`
      return (
        <polygon
          points={points}
          stroke={element.stroke}
          fill={element.fill}
          strokeWidth={element.strokeWidth}
          strokeDasharray={dashArray}
          opacity={element.opacity}
        />
      )
    }

    case 'line':
      return (
        <path
          d={getLinePath(element)}
          stroke={element.stroke}
          fill="none"
          strokeWidth={element.strokeWidth}
          strokeDasharray={dashArray}
          opacity={element.opacity}
          strokeLinecap="round"
        />
      )

    case 'arrow':
      return (
        <path
          d={getLinePath(element)}
          stroke={element.stroke}
          fill="none"
          strokeWidth={element.strokeWidth}
          strokeDasharray={dashArray}
          opacity={element.opacity}
          strokeLinecap="round"
          markerEnd={`url(#${ARROW_MARKER_ID})`}
          style={{ color: element.stroke }}
        />
      )

    case 'text':
      return (
        <TextElement
          element={element}
          isEditing={isEditing}
          onTextChange={onTextChange}
          onEditEnd={onEditEnd}
        />
      )
  }
}

interface TextElementProps {
  element: CanvasElementType & { kind: 'text' }
  isEditing?: boolean
  onTextChange?: (id: string, content: string, height?: number) => void
  onEditEnd?: () => void
}

function TextElement({
  element,
  isEditing,
  onTextChange,
  onEditEnd
}: TextElementProps): React.JSX.Element {
  const divRef = useRef<HTMLDivElement>(null)
  const wasEditing = useRef(false)

  useLayoutEffect(() => {
    if (isEditing && divRef.current && !wasEditing.current) {
      wasEditing.current = true
      const div = divRef.current
      div.textContent = element.content || ''
      requestAnimationFrame(() => {
        div.focus()
        const range = document.createRange()
        const sel = window.getSelection()
        range.selectNodeContents(div)
        range.collapse(false)
        sel?.removeAllRanges()
        sel?.addRange(range)
      })
    }
    if (!isEditing && wasEditing.current) {
      wasEditing.current = false
    }
  }, [isEditing, element.content])

  // Native keydown listener - React onKeyDown inside foreignObject is unreliable
  useEffect(() => {
    const div = divRef.current
    if (!div || !isEditing) return

    const handleKeyDown = (e: KeyboardEvent): void => {
      e.stopPropagation()
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        onEditEnd?.()
      }
    }

    div.addEventListener('keydown', handleKeyDown)
    return () => div.removeEventListener('keydown', handleKeyDown)
  }, [isEditing, onEditEnd])

  const syncContent = (): void => {
    const div = divRef.current
    if (!div) return
    onTextChange?.(element.id, div.textContent ?? '', div.scrollHeight)
  }

  const stopAll = (e: React.SyntheticEvent): void => {
    if (isEditing) e.stopPropagation()
  }

  return (
    <foreignObject
      x={element.x}
      y={element.y}
      width={Math.max(element.width, 200)}
      height={isEditing ? Math.max(element.height, 500) : Math.max(element.height, 24)}
    >
      <div
        ref={divRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onInput={syncContent}
        onPointerDown={stopAll}
        onDoubleClick={stopAll}
        style={{
          color: element.stroke,
          fontSize: `${element.fontSize}px`,
          fontFamily: 'var(--app-font-family, sans-serif)',
          width: '100%',
          minHeight: '24px',
          outline: 'none',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          opacity: element.opacity,
          cursor: isEditing ? 'text' : 'default',
          caretColor: element.stroke
        }}
      >
        {isEditing ? null : element.content || 'Text'}
      </div>
    </foreignObject>
  )
}
