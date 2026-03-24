import { useEffect, useRef } from 'react'
import { ChevronRight, ChevronDown, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import type { Block } from '@renderer/types'
import { useAutoResize } from '@renderer/hooks'
import { BlockItem } from './BlockItem'

interface DateGroupProps {
  dateBlock: Block
  contentBlock: Block | null
  isCollapsed: boolean
  onToggle: () => void
  focusedId: string | null
  onFocus: (id: string | null) => void
  onUpdate: (id: string, content: string) => void
  onDelete: (dateBlockId: string) => void
}

export function DateGroup({
  dateBlock,
  contentBlock,
  isCollapsed,
  onToggle,
  focusedId,
  onFocus,
  onUpdate,
  onDelete
}: DateGroupProps): React.JSX.Element {
  const dateLabel = dateBlock.content.replace('# ', '').trim()
  const dateInputRef = useRef<HTMLTextAreaElement>(null)
  const autoResize = useAutoResize()

  useEffect(() => {
    if (focusedId === dateBlock.id && dateInputRef.current) {
      dateInputRef.current.focus()
      const length = dateInputRef.current.value.length
      dateInputRef.current.setSelectionRange(length, length)
      autoResize(dateInputRef.current)
    }
  }, [focusedId, dateBlock.id, autoResize])

  const handleDateKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onFocus(null)
    }
  }

  return (
    <div className="mt-3 group/date">
      <div id={`block-${dateBlock.id}`} className="flex items-center">
        <button
          onClick={onToggle}
          className="w-5 shrink-0 flex items-center justify-center text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {focusedId === dateBlock.id ? (
          <textarea
            ref={dateInputRef}
            value={dateBlock.content}
            onChange={(e) => {
              autoResize(e.target)
              onUpdate(dateBlock.id, e.target.value)
            }}
            onKeyDown={handleDateKeyDown}
            onBlur={() => onFocus(null)}
            className="flex-1 bg-transparent outline-none resize-none overflow-hidden text-zinc-300 font-mono text-xs leading-relaxed py-1 min-h-[1.25rem]"
            rows={1}
          />
        ) : (
          <span
            onDoubleClick={() => onFocus(dateBlock.id)}
            className="flex-1 font-mono text-xs text-zinc-500 cursor-text py-1 hover:text-zinc-300 transition-colors"
          >
            {dateLabel}
          </span>
        )}

        <button
          onClick={() => onDelete(dateBlock.id)}
          className="opacity-0 group-hover/date:opacity-100 shrink-0 flex items-center justify-center w-5 h-5 rounded-sm text-zinc-600 hover:text-red-400 transition-all"
          title="Delete note"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {!isCollapsed && contentBlock && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pl-5 pt-1">
              <BlockItem
                block={contentBlock}
                isFocused={focusedId === contentBlock.id}
                onFocus={onFocus}
                onChange={(content) => onUpdate(contentBlock.id, content)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
