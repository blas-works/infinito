import {
  MousePointer2,
  Square,
  Circle,
  Triangle,
  Type,
  ArrowUpRight,
  Minus,
  Trash2
} from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import type { CanvasTool } from '@renderer/types'

interface CanvasToolbarProps {
  tool: CanvasTool
  hasSelection: boolean
  onToolChange: (tool: CanvasTool) => void
  onDelete: () => void
}

const TOOLS: { id: CanvasTool; icon: React.ElementType; label: string }[] = [
  { id: 'select', icon: MousePointer2, label: 'Select (V)' },
  { id: 'rectangle', icon: Square, label: 'Rectangle (R)' },
  { id: 'circle', icon: Circle, label: 'Circle (C)' },
  { id: 'triangle', icon: Triangle, label: 'Triangle' },
  { id: 'text', icon: Type, label: 'Text (T)' },
  { id: 'arrow', icon: ArrowUpRight, label: 'Arrow (A)' },
  { id: 'line', icon: Minus, label: 'Line (L)' }
]

export function CanvasToolbar({
  tool,
  hasSelection,
  onToolChange,
  onDelete
}: CanvasToolbarProps): React.JSX.Element {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
      <div className="flex items-center bg-zinc-900/90 backdrop-blur-md p-1 rounded-lg border border-zinc-800/50 gap-0.5">
        {TOOLS.map(({ id, icon: Icon, label }) => (
          <Button
            key={id}
            variant={tool === id ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => onToolChange(id)}
            className={cn(
              'h-8 w-8',
              tool === id ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
            )}
            title={label}
          >
            <Icon className="w-4 h-4" />
          </Button>
        ))}
      </div>

      {hasSelection && (
        <div className="flex items-center bg-zinc-900/90 backdrop-blur-md p-1 rounded-lg border border-zinc-800/50">
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-950/50"
            title="Delete (Del)"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
