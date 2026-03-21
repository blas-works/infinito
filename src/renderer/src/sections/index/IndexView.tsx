import { Plus } from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@renderer/components/ui/button'
import type { Block } from '@renderer/types'
import { DateItem } from './DateItem'

interface IndexViewProps {
  dateBlocks: Block[]
  onSelectDate: (id: string) => void
  onAddDay: () => void
}

export function IndexView({
  dateBlocks,
  onSelectDate,
  onAddDay
}: IndexViewProps): React.JSX.Element {
  return (
    <motion.div
      key="index"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="space-y-0.5"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Dates</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddDay}
          className="h-6 px-2 text-zinc-500 hover:text-zinc-300"
        >
          <Plus className="w-3 h-3 mr-1" />
          <span className="text-[11px]">Today</span>
        </Button>
      </div>

      {dateBlocks.length === 0 ? (
        <p className="text-zinc-600 text-xs text-center py-12">
          No dates yet. Click &quot;Today&quot; to start.
        </p>
      ) : (
        dateBlocks.map((block) => (
          <DateItem
            key={block.id}
            id={block.id}
            label={block.content.replace('# ', '').trim()}
            onSelect={onSelectDate}
          />
        ))
      )}
    </motion.div>
  )
}
