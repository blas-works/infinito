import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { useNoteSessions } from '@renderer/hooks'
import { CodeBlock } from '@renderer/components/markdown'
import { NoteSessionBar, type EditorMode } from './NoteSessionBar'

export function NotesView(): React.JSX.Element {
  const {
    sessions,
    activeSessionId,
    activeContent,
    setActiveSession,
    createSession,
    deleteSession,
    renameSession,
    updateContent
  } = useNoteSessions()

  const [mode, setMode] = useState<EditorMode>('edit')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (mode === 'edit' && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [mode, activeSessionId])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateContent(e.target.value)
    },
    [updateContent]
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData.items
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault()
          const file = items[i].getAsFile()
          if (file) {
            const reader = new FileReader()
            reader.onload = (event) => {
              const base64 = event.target?.result as string
              const insertion = `![image](${base64})`
              const textarea = textareaRef.current
              if (textarea) {
                const start = textarea.selectionStart
                const end = textarea.selectionEnd
                const before = activeContent.slice(0, start)
                const after = activeContent.slice(end)
                updateContent(before + insertion + after)
              } else {
                updateContent(activeContent + (activeContent ? '\n' : '') + insertion)
              }
            }
            reader.readAsDataURL(file)
          }
          break
        }
      }
    },
    [activeContent, updateContent]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Tab') {
        e.preventDefault()
        const textarea = e.currentTarget
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const before = activeContent.slice(0, start)
        const after = activeContent.slice(end)
        updateContent(before + '  ' + after)
        requestAnimationFrame(() => {
          textarea.selectionStart = start + 2
          textarea.selectionEnd = start + 2
        })
      }
    },
    [activeContent, updateContent]
  )

  return (
    <motion.div
      key="notes"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="relative flex flex-col h-full"
    >
      <NoteSessionBar
        sessions={sessions}
        activeSessionId={activeSessionId}
        mode={mode}
        onSelect={setActiveSession}
        onCreate={createSession}
        onDelete={deleteSession}
        onRename={renameSession}
        onModeChange={setMode}
      />

      <div className="flex-1 overflow-y-auto">
        {mode === 'edit' ? (
          <textarea
            ref={textareaRef}
            key={activeSessionId}
            value={activeContent}
            onChange={handleChange}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            className="w-full h-full bg-transparent outline-none resize-none text-zinc-300 font-mono leading-relaxed p-4 placeholder:text-zinc-700"
            style={{ fontSize: 'var(--app-font-size)', minHeight: '100%' }}
            placeholder="Start writing..."
            spellCheck={false}
          />
        ) : (
          <div className="max-w-2xl mx-auto p-4">
            {activeContent ? (
              <div
                className="prose prose-invert prose-zinc max-w-none
                  prose-p:my-1 prose-p:leading-relaxed
                  prose-headings:mt-4 prose-headings:mb-2 prose-headings:font-semibold prose-headings:text-zinc-200
                  prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
                  prose-ul:my-1 prose-ol:my-1 prose-li:my-0
                  prose-a:text-zinc-400 hover:prose-a:text-zinc-200 prose-a:underline prose-a:underline-offset-2
                  prose-code:text-zinc-400 prose-code:bg-zinc-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:border-0
                  prose-pre:bg-zinc-900 prose-pre:p-0 prose-pre:rounded-lg prose-pre:overflow-hidden prose-pre:border prose-pre:border-zinc-800/40
                  prose-blockquote:border-zinc-700 prose-blockquote:text-zinc-400
                  prose-hr:border-zinc-800
                  prose-img:rounded-md prose-img:max-h-64
                  prose-th:text-zinc-300 prose-th:border-zinc-700 prose-th:py-1.5 prose-th:px-2
                  prose-td:border-zinc-800 prose-td:py-1.5 prose-td:px-2
                  text-zinc-300 [&_input[type=checkbox]]:accent-zinc-500
                  [&_.contains-task-list]:list-none [&_.contains-task-list]:pl-1"
                style={{ fontSize: 'var(--app-font-size)' }}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    code: CodeBlock
                  }}
                >
                  {activeContent}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-zinc-600 text-xs text-center py-12">
                Nothing to preview. Switch to edit mode to start writing.
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
