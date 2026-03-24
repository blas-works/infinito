import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import type { Block } from '@renderer/types'
import { useAutoResize } from '@renderer/hooks'
import { CodeBlock } from '@renderer/components/markdown'

interface BlockItemProps {
  block: Block
  isFocused: boolean
  onFocus: (id: string | null) => void
  onChange: (content: string) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

export function BlockItem({
  block,
  isFocused,
  onFocus,
  onChange,
  onKeyDown
}: BlockItemProps): React.JSX.Element {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const autoResize = useAutoResize()

  const handleCheckboxToggle = (index: number): void => {
    const lines = block.content.split('\n')
    let count = 0
    const newLines = lines.map((line) => {
      if (/^\s*(?:[-*+]|\d+[.)])\s+\[[ xX]\]/.test(line)) {
        if (count === index) {
          count++
          return line.includes('[ ]') ? line.replace('[ ]', '[x]') : line.replace(/\[[xX]\]/, '[ ]')
        }
        count++
      }
      return line
    })
    onChange(newLines.join('\n'))
  }

  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus()
      const length = inputRef.current.value.length
      inputRef.current.setSelectionRange(length, length)
      autoResize(inputRef.current)
    }
  }, [isFocused, autoResize])

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    autoResize(e.target)
    onChange(e.target.value)
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>): void => {
    const items = e.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault()
        const file = items[i].getAsFile()
        if (file) {
          const reader = new FileReader()
          reader.onload = (event) => {
            const base64 = event.target?.result as string
            const newContent = block.content + (block.content ? '\n' : '') + `![image](${base64})`
            onChange(newContent)
          }
          reader.readAsDataURL(file)
        }
        break
      }
    }
  }

  if (isFocused) {
    return (
      <textarea
        ref={inputRef}
        value={block.content}
        onChange={handleInput}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault()
            onFocus(null)
            return
          }
          onKeyDown?.(e)
        }}
        onPaste={handlePaste}
        onBlur={() => onFocus(null)}
        className="w-full bg-transparent outline-none resize-none overflow-hidden text-zinc-300 font-mono leading-relaxed py-1 min-h-5 placeholder:text-zinc-700"
        style={{ fontSize: 'var(--app-font-size)' }}
        rows={1}
        placeholder="Type something..."
      />
    )
  }

  return (
    <div onDoubleClick={() => onFocus(block.id)} className="min-h-5 cursor-text py-1">
      {block.content ? (
        <div
          className="prose prose-invert prose-zinc max-w-none
            prose-p:my-0.5 prose-p:leading-relaxed
            prose-headings:mt-4 prose-headings:mb-1 prose-headings:font-semibold prose-headings:text-zinc-200
            prose-h1:text-base prose-h2:text-sm prose-h3:text-xs
            prose-ul:my-1 prose-ol:my-1 prose-li:my-0
            prose-a:text-zinc-400 hover:prose-a:text-zinc-200 prose-a:underline prose-a:underline-offset-2
            prose-code:text-zinc-400 prose-code:bg-zinc-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:border-0
            prose-pre:bg-zinc-900 prose-pre:p-0 prose-pre:rounded-lg prose-pre:overflow-hidden prose-pre:border prose-pre:border-zinc-800/40
            prose-blockquote:border-zinc-700 prose-blockquote:text-zinc-400
            prose-hr:border-zinc-800
            prose-img:rounded-md prose-img:max-h-48
            prose-th:text-zinc-300 prose-th:border-zinc-700 prose-th:py-1.5 prose-th:px-2
            prose-td:border-zinc-800 prose-td:py-1.5 prose-td:px-2
            text-zinc-300 [&_input[type=checkbox]]:accent-zinc-500
            [&_.contains-task-list]:list-none [&_.contains-task-list]:pl-1"
          style={{ fontSize: 'var(--app-font-size)' }}
          onClick={(e) => {
            const target = e.target as HTMLInputElement
            if (target.tagName !== 'INPUT' || target.type !== 'checkbox') return
            e.stopPropagation()
            const container = e.currentTarget
            const checkboxes = Array.from(container.querySelectorAll('input[type="checkbox"]'))
            const idx = checkboxes.indexOf(target)
            if (idx >= 0) handleCheckboxToggle(idx)
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              code: CodeBlock,
              input: ({ type, checked }) => {
                if (type === 'checkbox') {
                  return (
                    <input
                      type="checkbox"
                      checked={checked ?? false}
                      onChange={() => {}}
                      className="accent-zinc-500 cursor-pointer mr-1.5"
                    />
                  )
                }
                return <input type={type} />
              }
            }}
          >
            {block.content}
          </ReactMarkdown>
        </div>
      ) : (
        <span className="text-zinc-800 text-xs opacity-0 group-hover:opacity-100 transition-opacity select-none">
          ...
        </span>
      )}
    </div>
  )
}
