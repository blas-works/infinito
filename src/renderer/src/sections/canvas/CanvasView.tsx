import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { useCanvas, useCanvasViewport, useCanvasPointer } from '@renderer/hooks'
import { screenToWorld, getElementBounds } from '@renderer/types'
import { CanvasSvg } from './CanvasSvg'
import { CanvasToolbar } from './CanvasToolbar'
import { CanvasStyleMenu } from './CanvasStyleMenu'
import type { CanvasTool } from '@renderer/types'

const TOOL_SHORTCUTS: Record<string, CanvasTool> = {
  v: 'select',
  r: 'rectangle',
  c: 'circle',
  t: 'text',
  a: 'arrow',
  l: 'line'
}

export function CanvasView(): React.JSX.Element {
  const canvas = useCanvas()
  const [editingId, setEditingId] = useState<string | null>(null)
  const { onWheel } = useCanvasViewport(canvas.viewport, canvas.setViewport)
  const { mode, onPointerDown, onPointerMove, onPointerUp } = useCanvasPointer(
    {
      tool: canvas.tool,
      viewport: canvas.viewport,
      elements: canvas.elements,
      strokeColor: canvas.strokeColor,
      fillColor: canvas.fillColor,
      lineStyle: canvas.lineStyle,
      selectedIds: canvas.selectedIds
    },
    {
      addElement: canvas.addElement,
      updateElement: canvas.updateElement,
      deleteElement: canvas.deleteElement,
      setSelectedIds: canvas.setSelectedIds,
      setViewport: canvas.setViewport,
      setElements: canvas.setElements
    }
  )

  // Clear editing when selection changes, delete empty text
  useEffect(() => {
    if (editingId && !canvas.selectedIds.includes(editingId)) {
      const el = canvas.elements.find((e) => e.id === editingId)
      if (el?.kind === 'text' && !el.content.trim()) {
        canvas.deleteElement(editingId)
      }
      setEditingId(null)
    }
  }, [canvas.selectedIds])

  // Auto-edit when creating a new text element
  useEffect(() => {
    if (canvas.selectedIds.length === 1 && canvas.tool === 'text') {
      const el = canvas.elements.find((e) => e.id === canvas.selectedIds[0])
      if (el?.kind === 'text' && !el.content) {
        setEditingId(el.id)
      }
    }
  }, [canvas.selectedIds])

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const world = screenToWorld(
        e.clientX - rect.left,
        e.clientY - rect.top,
        canvas.viewport
      )
      for (let i = canvas.elements.length - 1; i >= 0; i--) {
        const el = canvas.elements[i]
        if (el.kind !== 'text') continue
        if (el.id === editingId) return
        const bounds = getElementBounds(el)
        if (
          world.x >= bounds.x &&
          world.x <= bounds.x + bounds.width &&
          world.y >= bounds.y &&
          world.y <= bounds.y + bounds.height
        ) {
          canvas.setSelectedIds([el.id])
          setEditingId(el.id)
          return
        }
      }
    },
    [canvas.elements, canvas.viewport, canvas.setSelectedIds, editingId]
  )

  const handleEditEnd = useCallback(() => {
    setEditingId(null)
  }, [])

  const handleTextChange = useCallback(
    (id: string, content: string, height?: number) => {
      const patch: Record<string, unknown> = { content }
      if (height && height > 0) patch.height = height
      canvas.updateElement(id, patch)
    },
    [canvas.updateElement]
  )

  const handleDelete = useCallback(() => {
    if (canvas.selectedIds.length > 0) {
      canvas.deleteElements(canvas.selectedIds)
    }
  }, [canvas.selectedIds, canvas.deleteElements])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement
      if (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        handleDelete()
        return
      }

      if (e.key === 'Escape') {
        canvas.setSelectedIds([])
        canvas.setTool('select')
        return
      }

      // Ctrl+A / Cmd+A: select all
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        canvas.setSelectedIds(canvas.elements.map((el) => el.id))
        return
      }

      const tool = TOOL_SHORTCUTS[e.key.toLowerCase()]
      if (tool) {
        canvas.setTool(tool)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleDelete, canvas.setSelectedIds, canvas.setTool, canvas.elements])

  return (
    <motion.div
      key="canvas"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="relative w-full h-full"
    >
      <CanvasSvg
        elements={canvas.elements}
        selectedIds={canvas.selectedIds}
        editingId={editingId}
        viewport={canvas.viewport}
        mode={mode}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
        onDoubleClick={handleDoubleClick}
        onTextChange={handleTextChange}
        onEditEnd={handleEditEnd}
        onUpdateElement={canvas.updateElement}
      />
      <CanvasStyleMenu
        strokeColor={canvas.strokeColor}
        fillColor={canvas.fillColor}
        lineStyle={canvas.lineStyle}
        onStrokeColorChange={canvas.setStrokeColor}
        onFillColorChange={canvas.setFillColor}
        onLineStyleChange={canvas.setLineStyle}
      />
      <CanvasToolbar
        tool={canvas.tool}
        hasSelection={canvas.selectedIds.length > 0}
        onToolChange={canvas.setTool}
        onDelete={handleDelete}
      />
    </motion.div>
  )
}
