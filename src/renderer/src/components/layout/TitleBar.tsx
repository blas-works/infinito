import { Pin, X, Minus } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { cn } from '@renderer/lib/utils'
import { windowService } from '@renderer/services'
import type { View } from '@renderer/types'

interface TitleBarProps {
  view: View
  isPinned: boolean
  onViewChange: (view: View) => void
  onTogglePin: () => void
}

export function TitleBar({ view, isPinned, onViewChange, onTogglePin }: TitleBarProps): React.JSX.Element {
  return (
    <header className="drag-region sticky top-0 z-50 flex items-center justify-between px-3 py-2 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-900/50">
      <div className="no-drag flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onTogglePin}
          className={cn(
            'h-6 w-6 text-zinc-600 hover:text-zinc-300',
            isPinned && 'text-zinc-300 bg-zinc-800/50'
          )}
          title="Pin on top"
        >
          <Pin className="w-3 h-3" />
        </Button>
      </div>

      <div className="no-drag flex items-center bg-zinc-900/40 p-0.5 rounded-md border border-zinc-800/30">
        <Button
          variant={view === 'index' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('index')}
          className={cn(
            'h-6 px-2.5 text-[11px] rounded-sm',
            view === 'index' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'
          )}
        >
          index
        </Button>
        <Button
          variant={view === 'notes' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('notes')}
          className={cn(
            'h-6 px-2.5 text-[11px] rounded-sm',
            view === 'notes' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'
          )}
        >
          notes
        </Button>
        <Button
          variant={view === 'config' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('config')}
          className={cn(
            'h-6 px-2.5 text-[11px] rounded-sm',
            view === 'config' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'
          )}
        >
          config
        </Button>
      </div>

      <div className="no-drag flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => windowService.minimize()}
          className="h-6 w-6 text-zinc-600 hover:text-zinc-300"
          title="Minimize"
        >
          <Minus className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => windowService.close()}
          className="h-6 w-6 text-zinc-600 hover:text-red-400"
          title="Close"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </header>
  )
}
