import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import type { LineStyle } from '@renderer/types'
import { STROKE_PRESETS, FILL_PRESETS, LINE_DASH_ARRAYS } from '@renderer/types'

interface CanvasStyleMenuProps {
  strokeColor: string
  fillColor: string
  lineStyle: LineStyle
  onStrokeColorChange: (color: string) => void
  onFillColorChange: (color: string) => void
  onLineStyleChange: (style: LineStyle) => void
}

const LINE_STYLES: { id: LineStyle; label: string }[] = [
  { id: 'solid', label: 'Solid' },
  { id: 'dashed', label: 'Dashed' },
  { id: 'dotted', label: 'Dotted' },
  { id: 'dashed-long', label: 'Long dash' }
]

export function CanvasStyleMenu({
  strokeColor,
  fillColor,
  lineStyle,
  onStrokeColorChange,
  onFillColorChange,
  onLineStyleChange
}: CanvasStyleMenuProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-14 left-3 z-20 flex items-center justify-center h-8 w-8 rounded-lg bg-zinc-900/90 backdrop-blur-md border border-zinc-800/50 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        title="Style menu"
      >
        {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="absolute top-14 left-14 z-10 bg-zinc-900/90 backdrop-blur-md p-2 rounded-lg border border-zinc-800/50 shadow-xl">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-zinc-500 mr-1">Stroke</span>
              {STROKE_PRESETS.map((color) => (
                <button
                  key={color}
                  onClick={() => onStrokeColorChange(color)}
                  className={cn(
                    'w-5 h-5 rounded-full border-2 transition-transform',
                    strokeColor === color
                      ? 'border-blue-500 scale-110'
                      : 'border-zinc-700 hover:scale-110'
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[10px] text-zinc-500 mr-1">Fill</span>
              {FILL_PRESETS.map((color) => (
                <button
                  key={color}
                  onClick={() => onFillColorChange(color)}
                  className={cn(
                    'w-5 h-5 rounded-full border-2 transition-transform',
                    fillColor === color
                      ? 'border-blue-500 scale-110'
                      : 'border-zinc-700 hover:scale-110'
                  )}
                  style={{
                    backgroundColor: color === 'none' ? 'transparent' : color,
                    backgroundImage:
                      color === 'none'
                        ? 'linear-gradient(45deg, #ef4444 50%, transparent 50%)'
                        : undefined
                  }}
                  title={color === 'none' ? 'Transparent' : color}
                />
              ))}
            </div>

            <div className="flex items-center gap-0.5">
              <span className="text-[10px] text-zinc-500 mr-1">Line</span>
              {LINE_STYLES.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => onLineStyleChange(id)}
                  className={cn(
                    'h-7 w-10 flex items-center justify-center rounded',
                    lineStyle === id ? 'bg-zinc-700' : 'hover:bg-zinc-800'
                  )}
                  title={label}
                >
                  <svg width="28" height="2" className="text-zinc-300">
                    <line
                      x1="0"
                      y1="1"
                      x2="28"
                      y2="1"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={LINE_DASH_ARRAYS[id] || undefined}
                    />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
