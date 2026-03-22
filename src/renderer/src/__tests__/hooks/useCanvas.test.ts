import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useCanvas } from '../../hooks/useCanvas'
import type { ShapeElement } from '../../types'

describe('useCanvas', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useCanvas())

    expect(result.current.elements).toEqual([])
    expect(result.current.selectedIds).toEqual([])
    expect(result.current.tool).toBe('select')
    expect(result.current.strokeColor).toBe('#f4f4f5')
    expect(result.current.fillColor).toBe('none')
    expect(result.current.lineStyle).toBe('solid')
    expect(result.current.viewport).toEqual({ offsetX: 0, offsetY: 0, zoom: 1 })
  })

  it('should handle invalid localStorage data gracefully', () => {
    localStorage.setItem('infinito-canvas', 'invalid-json')

    const { result } = renderHook(() => useCanvas())

    expect(result.current.elements).toEqual([])
    expect(result.current.viewport).toEqual({ offsetX: 0, offsetY: 0, zoom: 1 })
  })

  it('should handle localStorage with missing elements', () => {
    localStorage.setItem(
      'infinito-canvas',
      JSON.stringify({ viewport: { offsetX: 10, offsetY: 20, zoom: 2 } })
    )

    const { result } = renderHook(() => useCanvas())

    expect(result.current.elements).toEqual([])
    expect(result.current.viewport).toEqual({ offsetX: 10, offsetY: 20, zoom: 2 })
  })

  it('should set tool', () => {
    const { result } = renderHook(() => useCanvas())

    act(() => {
      result.current.setTool('rectangle')
    })

    expect(result.current.tool).toBe('rectangle')
  })

  it('should set stroke color', () => {
    const { result } = renderHook(() => useCanvas())

    act(() => {
      result.current.setStrokeColor('#ef4444')
    })

    expect(result.current.strokeColor).toBe('#ef4444')
  })

  it('should set fill color', () => {
    const { result } = renderHook(() => useCanvas())

    act(() => {
      result.current.setFillColor('#27272a')
    })

    expect(result.current.fillColor).toBe('#27272a')
  })

  it('should set line style', () => {
    const { result } = renderHook(() => useCanvas())

    act(() => {
      result.current.setLineStyle('dashed')
    })

    expect(result.current.lineStyle).toBe('dashed')
  })

  it('should add element', () => {
    const { result } = renderHook(() => useCanvas())

    const element: ShapeElement = {
      id: '1',
      kind: 'rectangle',
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      stroke: '#fff',
      fill: 'none',
      strokeWidth: 1,
      lineStyle: 'solid',
      opacity: 1
    }

    act(() => {
      result.current.addElement(element)
    })

    expect(result.current.elements).toHaveLength(1)
    expect(result.current.elements[0]).toEqual(element)
  })

  it('should update element', () => {
    const { result } = renderHook(() => useCanvas())

    const element: ShapeElement = {
      id: '1',
      kind: 'rectangle',
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      stroke: '#fff',
      fill: 'none',
      strokeWidth: 1,
      lineStyle: 'solid',
      opacity: 1
    }

    act(() => {
      result.current.addElement(element)
    })

    act(() => {
      result.current.updateElement('1', { width: 200 })
    })

    expect((result.current.elements[0] as ShapeElement).width).toBe(200)
  })

  it('should delete element', () => {
    const { result } = renderHook(() => useCanvas())

    const element: ShapeElement = {
      id: '1',
      kind: 'rectangle',
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      stroke: '#fff',
      fill: 'none',
      strokeWidth: 1,
      lineStyle: 'solid',
      opacity: 1
    }

    act(() => {
      result.current.addElement(element)
    })

    expect(result.current.elements).toHaveLength(1)

    act(() => {
      result.current.deleteElement('1')
    })

    expect(result.current.elements).toHaveLength(0)
  })

  it('should delete multiple elements', () => {
    const { result } = renderHook(() => useCanvas())

    const element1: ShapeElement = {
      id: '1',
      kind: 'rectangle',
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      stroke: '#fff',
      fill: 'none',
      strokeWidth: 1,
      lineStyle: 'solid',
      opacity: 1
    }

    const element2: ShapeElement = {
      id: '2',
      kind: 'circle',
      x: 100,
      y: 100,
      width: 50,
      height: 50,
      stroke: '#fff',
      fill: 'none',
      strokeWidth: 1,
      lineStyle: 'solid',
      opacity: 1
    }

    act(() => {
      result.current.addElement(element1)
      result.current.addElement(element2)
    })

    expect(result.current.elements).toHaveLength(2)

    act(() => {
      result.current.deleteElements(['1', '2'])
    })

    expect(result.current.elements).toHaveLength(0)
  })

  it('should set selected ids', () => {
    const { result } = renderHook(() => useCanvas())

    act(() => {
      result.current.setSelectedIds(['1', '2'])
    })

    expect(result.current.selectedIds).toEqual(['1', '2'])
  })

  it('should clear selection when element is deleted', () => {
    const { result } = renderHook(() => useCanvas())

    const element: ShapeElement = {
      id: '1',
      kind: 'rectangle',
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      stroke: '#fff',
      fill: 'none',
      strokeWidth: 1,
      lineStyle: 'solid',
      opacity: 1
    }

    act(() => {
      result.current.addElement(element)
      result.current.setSelectedIds(['1'])
    })

    expect(result.current.selectedIds).toEqual(['1'])

    act(() => {
      result.current.deleteElement('1')
    })

    expect(result.current.selectedIds).toEqual([])
  })

  it('should set viewport', () => {
    const { result } = renderHook(() => useCanvas())

    act(() => {
      result.current.setViewport({ offsetX: 100, offsetY: 200, zoom: 2 })
    })

    expect(result.current.viewport).toEqual({ offsetX: 100, offsetY: 200, zoom: 2 })
  })

  it('should set elements directly', () => {
    const { result } = renderHook(() => useCanvas())

    const elements: ShapeElement[] = [
      {
        id: '1',
        kind: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        stroke: '#fff',
        fill: 'none',
        strokeWidth: 1,
        lineStyle: 'solid',
        opacity: 1
      }
    ]

    act(() => {
      result.current.setElements(elements)
    })

    expect(result.current.elements).toEqual(elements)
  })

  it('should persist state to localStorage', async () => {
    const { result } = renderHook(() => useCanvas())

    const element: ShapeElement = {
      id: '1',
      kind: 'rectangle',
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      stroke: '#fff',
      fill: 'none',
      strokeWidth: 1,
      lineStyle: 'solid',
      opacity: 1
    }

    act(() => {
      result.current.addElement(element)
    })

    await waitFor(() => {
      const stored = localStorage.getItem('infinito-canvas')
      expect(stored).not.toBeNull()
    })
  })

  it('should load state from localStorage on mount', () => {
    const savedState = {
      elements: [
        {
          id: '1',
          kind: 'rectangle',
          x: 50,
          y: 50,
          width: 200,
          height: 100,
          stroke: '#fff',
          fill: 'none',
          strokeWidth: 2,
          lineStyle: 'dashed',
          opacity: 0.8
        }
      ],
      viewport: { offsetX: 10, offsetY: 20, zoom: 1.5 }
    }

    localStorage.setItem('infinito-canvas', JSON.stringify(savedState))

    const { result } = renderHook(() => useCanvas())

    expect(result.current.elements).toHaveLength(1)
    expect(result.current.elements[0].id).toBe('1')
    expect(result.current.viewport).toEqual({ offsetX: 10, offsetY: 20, zoom: 1.5 })
  })
})
