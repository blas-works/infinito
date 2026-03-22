import { describe, it, expect } from 'vitest'
import {
  screenToWorld,
  getLineMidpoint,
  getControlPoint,
  getLinePath,
  getElementBounds,
  LINE_DASH_ARRAYS,
  STROKE_PRESETS,
  FILL_PRESETS
} from '../../types/canvas'
import type { LineElement, ShapeElement, TextElement } from '../../types/canvas'

describe('screenToWorld', () => {
  it('should convert screen coordinates to world coordinates with no offset or zoom', () => {
    const result = screenToWorld(100, 200, { offsetX: 0, offsetY: 0, zoom: 1 })
    expect(result).toEqual({ x: 100, y: 200 })
  })

  it('should account for offset', () => {
    const result = screenToWorld(100, 200, { offsetX: 50, offsetY: 100, zoom: 1 })
    expect(result).toEqual({ x: 50, y: 100 })
  })

  it('should account for zoom', () => {
    const result = screenToWorld(100, 200, { offsetX: 0, offsetY: 0, zoom: 2 })
    expect(result).toEqual({ x: 50, y: 100 })
  })

  it('should account for both offset and zoom', () => {
    const result = screenToWorld(200, 400, { offsetX: 100, offsetY: 200, zoom: 2 })
    expect(result).toEqual({ x: 50, y: 100 })
  })

  it('should handle negative offsets', () => {
    const result = screenToWorld(100, 200, { offsetX: -50, offsetY: -100, zoom: 1 })
    expect(result).toEqual({ x: 150, y: 300 })
  })

  it('should handle fractional zoom', () => {
    const result = screenToWorld(100, 200, { offsetX: 0, offsetY: 0, zoom: 0.5 })
    expect(result).toEqual({ x: 200, y: 400 })
  })
})

describe('getLineMidpoint', () => {
  it('should calculate midpoint correctly', () => {
    const line: LineElement = {
      id: '1',
      kind: 'line',
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 100,
      stroke: '#fff',
      fill: 'none',
      strokeWidth: 1,
      lineStyle: 'solid',
      opacity: 1
    }
    expect(getLineMidpoint(line)).toEqual({ x: 50, y: 50 })
  })

  it('should handle negative coordinates', () => {
    const line: LineElement = {
      id: '1',
      kind: 'line',
      x1: -100,
      y1: -100,
      x2: 100,
      y2: 100,
      stroke: '#fff',
      fill: 'none',
      strokeWidth: 1,
      lineStyle: 'solid',
      opacity: 1
    }
    expect(getLineMidpoint(line)).toEqual({ x: 0, y: 0 })
  })
})

describe('getControlPoint', () => {
  it('should return explicit control point when defined', () => {
    const line: LineElement = {
      id: '1',
      kind: 'line',
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 0,
      cx: 50,
      cy: 50,
      stroke: '#fff',
      fill: 'none',
      strokeWidth: 1,
      lineStyle: 'solid',
      opacity: 1
    }
    expect(getControlPoint(line)).toEqual({ x: 50, y: 50 })
  })

  it('should return midpoint when control point undefined', () => {
    const line: LineElement = {
      id: '1',
      kind: 'line',
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 100,
      stroke: '#fff',
      fill: 'none',
      strokeWidth: 1,
      lineStyle: 'solid',
      opacity: 1
    }
    expect(getControlPoint(line)).toEqual({ x: 50, y: 50 })
  })

  it('should prefer explicit control point over midpoint', () => {
    const line: LineElement = {
      id: '1',
      kind: 'line',
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 0,
      cx: 25,
      cy: 75,
      stroke: '#fff',
      fill: 'none',
      strokeWidth: 1,
      lineStyle: 'solid',
      opacity: 1
    }
    expect(getControlPoint(line)).toEqual({ x: 25, y: 75 })
  })
})

describe('getLinePath', () => {
  it('should return straight line path when no control point', () => {
    const line: LineElement = {
      id: '1',
      kind: 'line',
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 100,
      stroke: '#fff',
      fill: 'none',
      strokeWidth: 1,
      lineStyle: 'solid',
      opacity: 1
    }
    expect(getLinePath(line)).toBe('M 0,0 L 100,100')
  })

  it('should return curved path when control point defined', () => {
    const line: LineElement = {
      id: '1',
      kind: 'line',
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 0,
      cx: 50,
      cy: 50,
      stroke: '#fff',
      fill: 'none',
      strokeWidth: 1,
      lineStyle: 'solid',
      opacity: 1
    }
    expect(getLinePath(line)).toBe('M 0,0 Q 50,50 100,0')
  })

  it('should handle negative coordinates', () => {
    const line: LineElement = {
      id: '1',
      kind: 'line',
      x1: -100,
      y1: -50,
      x2: 100,
      y2: 50,
      stroke: '#fff',
      fill: 'none',
      strokeWidth: 1,
      lineStyle: 'solid',
      opacity: 1
    }
    expect(getLinePath(line)).toBe('M -100,-50 L 100,50')
  })
})

describe('getElementBounds', () => {
  describe('for shape elements', () => {
    it('should return bounds for rectangle', () => {
      const rect: ShapeElement = {
        id: '1',
        kind: 'rectangle',
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        stroke: '#fff',
        fill: 'none',
        strokeWidth: 1,
        lineStyle: 'solid',
        opacity: 1
      }
      expect(getElementBounds(rect)).toEqual({ x: 10, y: 20, width: 100, height: 50 })
    })

    it('should return bounds for circle', () => {
      const circle: ShapeElement = {
        id: '1',
        kind: 'circle',
        x: 50,
        y: 50,
        width: 200,
        height: 200,
        stroke: '#fff',
        fill: 'none',
        strokeWidth: 1,
        lineStyle: 'solid',
        opacity: 1
      }
      expect(getElementBounds(circle)).toEqual({ x: 50, y: 50, width: 200, height: 200 })
    })

    it('should return bounds for text element', () => {
      const text: TextElement = {
        id: '1',
        kind: 'text',
        x: 100,
        y: 200,
        width: 50,
        height: 30,
        content: 'Hello',
        fontSize: 12,
        stroke: '#fff',
        fill: 'none',
        strokeWidth: 1,
        lineStyle: 'solid',
        opacity: 1
      }
      expect(getElementBounds(text)).toEqual({ x: 100, y: 200, width: 50, height: 30 })
    })
  })

  describe('for line elements', () => {
    it('should return bounds for straight line', () => {
      const line: LineElement = {
        id: '1',
        kind: 'line',
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 50,
        stroke: '#fff',
        fill: 'none',
        strokeWidth: 1,
        lineStyle: 'solid',
        opacity: 1
      }
      expect(getElementBounds(line)).toEqual({ x: 0, y: 0, width: 100, height: 50 })
    })

    it('should return bounds for reversed line', () => {
      const line: LineElement = {
        id: '1',
        kind: 'line',
        x1: 100,
        y1: 50,
        x2: 0,
        y2: 0,
        stroke: '#fff',
        fill: 'none',
        strokeWidth: 1,
        lineStyle: 'solid',
        opacity: 1
      }
      expect(getElementBounds(line)).toEqual({ x: 0, y: 0, width: 100, height: 50 })
    })

    it('should return bounds for line with control point', () => {
      const line: LineElement = {
        id: '1',
        kind: 'line',
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        cx: 50,
        cy: 50,
        stroke: '#fff',
        fill: 'none',
        strokeWidth: 1,
        lineStyle: 'solid',
        opacity: 1
      }
      const bounds = getElementBounds(line)
      expect(bounds.x).toBe(0)
      expect(bounds.y).toBeCloseTo(0)
      expect(bounds.width).toBe(100)
      expect(bounds.height).toBeGreaterThan(0)
    })

    it('should include Bezier extrema in bounds for both axes', () => {
      // cx=100 pulls the curve far right, cy=100 pulls it far down
      // txDenom = 0 - 200 + 50 = -150, tx = (0-100)/-150 = 0.667 (in range)
      // tyDenom = 0 - 200 + 50 = -150, ty = (0-100)/-150 = 0.667 (in range)
      const line: LineElement = {
        id: '1',
        kind: 'line',
        x1: 0,
        y1: 0,
        x2: 50,
        y2: 50,
        cx: 100,
        cy: 100,
        stroke: '#fff',
        fill: 'none',
        strokeWidth: 1,
        lineStyle: 'solid',
        opacity: 1
      }
      const bounds = getElementBounds(line)
      // The curve bulges beyond the endpoints
      expect(bounds.width).toBeGreaterThan(50)
      expect(bounds.height).toBeGreaterThan(50)
    })
  })
})

describe('LINE_DASH_ARRAYS', () => {
  it('should have correct dash patterns', () => {
    expect(LINE_DASH_ARRAYS['solid']).toBe('')
    expect(LINE_DASH_ARRAYS['dashed']).toBe('8 4')
    expect(LINE_DASH_ARRAYS['dotted']).toBe('2 4')
    expect(LINE_DASH_ARRAYS['dashed-long']).toBe('16 6')
  })
})

describe('STROKE_PRESETS', () => {
  it('should have 8 color presets', () => {
    expect(STROKE_PRESETS).toHaveLength(8)
  })

  it('should include basic colors', () => {
    expect(STROKE_PRESETS).toContain('#f4f4f5')
    expect(STROKE_PRESETS).toContain('#ef4444')
    expect(STROKE_PRESETS).toContain('#3b82f6')
  })
})

describe('FILL_PRESETS', () => {
  it('should have 8 fill presets including none', () => {
    expect(FILL_PRESETS).toHaveLength(8)
  })

  it('should include none option', () => {
    expect(FILL_PRESETS).toContain('none')
  })

  it('should include dark color fills', () => {
    expect(FILL_PRESETS).toContain('#27272a')
    expect(FILL_PRESETS).toContain('#581c87')
  })
})
