import { CalendarPlus, Plus } from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@renderer/components/ui/button'
import type { DateGroup as DateGroupType } from '@renderer/types'
import { useNotesFilter } from '@renderer/hooks/useNotesFilter'
import { BlockItem } from './BlockItem'
import { DateGroup } from './DateGroup'
import { NotesFilter } from './NotesFilter'

interface NotesViewProps {
  groupedBlocks: DateGroupType[]
  focusedId: string | null
  collapsedIds: Set<string>
  onFocus: (id: string | null) => void
  onUpdate: (id: string, content: string) => void
  onAddBlock: () => void
  onAddDay: () => void
  onToggleCollapse: (id: string) => void
  isEmpty: boolean
}

export function NotesView({
  groupedBlocks,
  focusedId,
  collapsedIds,
  onFocus,
  onUpdate,
  onAddBlock,
  onAddDay,
  onToggleCollapse,
  isEmpty
}: NotesViewProps): React.JSX.Element {
  const { query, isActive, filteredGroups, setQuery } = useNotesFilter(groupedBlocks)

  return (
    <motion.div
      key="notes"
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="space-y-px"
    >
      {!isEmpty && <NotesFilter query={query} onQueryChange={setQuery} />}

      {isEmpty ? (
        <p className="text-zinc-600 text-xs text-center py-12">
          No blocks yet. Add a block to start.
        </p>
      ) : filteredGroups.length === 0 && isActive ? (
        <p className="text-zinc-600 text-xs text-center py-12">
          No matching notes found.
        </p>
      ) : (
        filteredGroups.map((group) => {
          if (group.dateBlock) {
            return (
              <DateGroup
                key={group.dateBlock.id}
                dateBlock={group.dateBlock}
                contentBlock={group.contentBlock}
                isCollapsed={collapsedIds.has(group.dateBlock.id)}
                onToggle={() => onToggleCollapse(group.dateBlock!.id)}
                focusedId={focusedId}
                onFocus={onFocus}
                onUpdate={onUpdate}
              />
            )
          }

          if (group.contentBlock) {
            return (
              <div
                key={group.contentBlock.id}
                id={`block-${group.contentBlock.id}`}
                className="group relative flex items-start"
              >
                <div className="w-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity pt-2">
                  <div className="w-1 h-1 rounded-full bg-zinc-800" />
                </div>
                <div className="flex-1 min-w-0">
                  <BlockItem
                    block={group.contentBlock}
                    isFocused={focusedId === group.contentBlock.id}
                    onFocus={onFocus}
                    onChange={(content) => onUpdate(group.contentBlock!.id, content)}
                  />
                </div>
              </div>
            )
          }

          return null
        })
      )}

      <div className="flex items-center gap-1 pt-3 pl-5">
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddBlock}
          className="text-zinc-600 hover:text-zinc-400 h-7 px-2 text-[11px]"
        >
          <Plus className="w-3 h-3 mr-1.5" />
          Add block
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddDay}
          className="text-zinc-600 hover:text-zinc-400 h-7 px-2 text-[11px]"
        >
          <CalendarPlus className="w-3 h-3 mr-1.5" />
          Today
        </Button>
      </div>
    </motion.div>
  )
}
