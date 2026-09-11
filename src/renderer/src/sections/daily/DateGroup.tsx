import { useEffect, useRef, useState } from 'react'
import { ChevronRight, ChevronDown, Trash2, Copy, Check, Pencil } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@renderer/lib/utils'
import { formatForClipboard } from '@renderer/lib/clipboard'
import type { Block } from '@renderer/types'
import { useAutoResize } from '@renderer/hooks'
import { BlockItem } from './BlockItem'

const COPIED_FEEDBACK_MS = 1500

interface DateGroupProps {
  dateBlock: Block
  contentBlock: Block | null
  isCollapsed: boolean
  onToggle: () => void
  focusedId: string | null
  highlightedId?: string | null
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
  highlightedId,
  onFocus,
  onUpdate,
  onDelete
}: DateGroupProps): React.JSX.Element {
  const dateLabel = dateBlock.content.replace('# ', '').trim()
  const dateInputRef = useRef<HTMLTextAreaElement>(null)
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [copied, setCopied] = useState(false)
  const autoResize = useAutoResize()

  useEffect(() => {
    if (focusedId === dateBlock.id && dateInputRef.current) {
      dateInputRef.current.focus()
      const length = dateInputRef.current.value.length
      dateInputRef.current.setSelectionRange(length, length)
      autoResize(dateInputRef.current)
    }
  }, [focusedId, dateBlock.id, autoResize])

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current)
    }
  }, [])

  const handleDateKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onFocus(null)
    }
  }

  const handleCopy = async (block: Block): Promise<void> => {
    try {
      await navigator.clipboard.writeText(formatForClipboard(block.content))
    } catch {
      return
    }
    setCopied(true)
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current)
    copiedTimeoutRef.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS)
  }

  const handleEdit = (block: Block): void => {
    if (isCollapsed) onToggle()
    onFocus(block.id)
  }

  return (
    <div className="mt-3 group/date">
      <div
        id={`block-${dateBlock.id}`}
        className={cn(
          'flex items-center',
          highlightedId === dateBlock.id && 'ring-1 ring-zinc-700 rounded'
        )}
      >
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

        {contentBlock && contentBlock.content.trim() !== '' && (
          <button
            onClick={() => handleCopy(contentBlock)}
            className={cn(
              'shrink-0 flex items-center justify-center w-5 h-5 rounded-sm transition-all',
              copied
                ? 'opacity-100 text-zinc-300'
                : 'opacity-0 group-hover/date:opacity-100 text-zinc-600 hover:text-zinc-300'
            )}
            title={copied ? 'Copied' : 'Copy note'}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
        )}

        {contentBlock && (
          <button
            onClick={() => handleEdit(contentBlock)}
            className="opacity-0 group-hover/date:opacity-100 shrink-0 flex items-center justify-center w-5 h-5 rounded-sm text-zinc-600 hover:text-zinc-300 transition-all"
            title="Edit note"
          >
            <Pencil className="w-3 h-3" />
          </button>
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
            <div
              className={cn(
                'pl-5 pt-1',
                highlightedId === contentBlock.id && 'ring-1 ring-zinc-700 rounded'
              )}
            >
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
