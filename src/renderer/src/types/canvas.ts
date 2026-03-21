export type CanvasTool = 'select' | 'rectangle' | 'circle' | 'triangle' | 'text' | 'arrow' | 'line'

export type LineStyle = 'solid' | 'dashed' | 'dotted' | 'dashed-long'

export const LINE_DASH_ARRAYS: Record<LineStyle, string> = {
  solid: '',
  dashed: '8 4',
  dotted: '2 4',
  'dashed-long': '16 6'
}

export const STROKE_PRESETS = [
  '#f4f4f5', // zinc-100
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#eab308', // yellow-500
  '#22c55e', // green-500
  '#3b82f6', // blue-500
  '#a855f7', // purple-500
  '#ec4899'  // pink-500
] as const

export const FILL_PRESETS = [
  'none',
  '#27272a', // zinc-800
  '#7f1d1d', // red-900
  '#7c2d12', // orange-900
  '#713f12', // yellow-900
  '#14532d', // green-900
  '#1e3a5f', // blue-900
  '#581c87'  // purple-900
] as const

// --- Element types (discriminated union by kind) ---

interface BaseElement {
  id: string
  stroke: string
  fill: string
  strokeWidth: number
  lineStyle: LineStyle
  opacity: number
}

export interface ShapeElement extends BaseElement {
  kind: 'rectangle' | 'circle' | 'triangle'
  x: number
  y: number
  width: number
  height: number
}

export interface LineElement extends BaseElement {
  kind: 'line' | 'arrow'
  x1: number
  y1: number
  x2: number
  y2: number
  /** Quadratic Bézier control point (undefined = straight line) */
  cx?: number
  cy?: number
}

export interface TextElement extends BaseElement {
  kind: 'text'
  x: number
  y: number
  width: number
  height: number
  content: string
  fontSize: number
}

export type CanvasElement = ShapeElement | LineElement | TextElement

// --- Viewport ---

export interface Viewport {
  offsetX: number
  offsetY: number
  zoom: number
}

// --- Pointer interaction state machine ---

export type PointerMode =
  | { type: 'idle' }
  | { type: 'panning'; startX: number; startY: number; startOffset: Viewport }
  | { type: 'drawing'; elementId: string; startX: number; startY: number }
  | { type: 'moving'; elementId: string; offsetX: number; offsetY: number }
  | { type: 'selecting'; startX: number; startY: number; currentX: number; currentY: number }

// --- Helpers ---

export function screenToWorld(
  screenX: number,
  screenY: number,
  viewport: Viewport
): { x: number; y: number } {
  return {
    x: (screenX - viewport.offsetX) / viewport.zoom,
    y: (screenY - viewport.offsetY) / viewport.zoom
  }
}

/** Midpoint of a line/arrow (used as default control point when cx/cy are undefined) */
export function getLineMidpoint(el: LineElement): { x: number; y: number } {
  return { x: (el.x1 + el.x2) / 2, y: (el.y1 + el.y2) / 2 }
}

/** Effective control point: explicit cx/cy or midpoint for straight lines */
export function getControlPoint(el: LineElement): { x: number; y: number } {
  if (el.cx !== undefined && el.cy !== undefined) return { x: el.cx, y: el.cy }
  return getLineMidpoint(el)
}

/** Build SVG path data for a line/arrow (quadratic Bézier if curved, straight otherwise) */
export function getLinePath(el: LineElement): string {
  if (el.cx !== undefined && el.cy !== undefined) {
    return `M ${el.x1},${el.y1} Q ${el.cx},${el.cy} ${el.x2},${el.y2}`
  }
  return `M ${el.x1},${el.y1} L ${el.x2},${el.y2}`
}

export function getElementBounds(element: CanvasElement): {
  x: number
  y: number
  width: number
  height: number
} {
  if (element.kind === 'line' || element.kind === 'arrow') {
    const xs = [element.x1, element.x2]
    const ys = [element.y1, element.y2]

    if (element.cx !== undefined && element.cy !== undefined) {
      // For quadratic Bézier, find extrema: t = (P0-P1)/(P0-2P1+P2)
      const txDenom = element.x1 - 2 * element.cx + element.x2
      if (txDenom !== 0) {
        const tx = (element.x1 - element.cx) / txDenom
        if (tx > 0 && tx < 1) {
          const bx = (1 - tx) * (1 - tx) * element.x1 + 2 * (1 - tx) * tx * element.cx + tx * tx * element.x2
          xs.push(bx)
        }
      }
      const tyDenom = element.y1 - 2 * element.cy + element.y2
      if (tyDenom !== 0) {
        const ty = (element.y1 - element.cy) / tyDenom
        if (ty > 0 && ty < 1) {
          const by = (1 - ty) * (1 - ty) * element.y1 + 2 * (1 - ty) * ty * element.cy + ty * ty * element.y2
          ys.push(by)
        }
      }
    }

    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    const maxX = Math.max(...xs)
    const maxY = Math.max(...ys)
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
  }
  return { x: element.x, y: element.y, width: element.width, height: element.height }
}
