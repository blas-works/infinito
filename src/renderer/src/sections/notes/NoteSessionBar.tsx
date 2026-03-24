import { useState, useRef, useEffect, useCallback } from 'react'
import { Plus, X, Pencil, Eye } from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import type { NoteSession } from '@renderer/types'
import { ConfirmDialog } from '@renderer/components/ui/ConfirmDialog'

export type EditorMode = 'edit' | 'preview'

interface NoteSessionBarProps {
  sessions: NoteSession[]
  activeSessionId: string
  mode: EditorMode
  onSelect: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
  onModeChange: (mode: EditorMode) => void
}

function SessionTab({
  session,
  isActive,
  onSelect,
  onRequestDelete,
  onRename
}: {
  session: NoteSession
  isActive: boolean
  onSelect: () => void
  onRequestDelete: () => void
  onRename: (name: string) => void
}): React.JSX.Element {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(session.name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const commitRename = (): void => {
    setEditing(false)
    if (draft.trim() && draft.trim() !== session.name) {
      onRename(draft.trim())
    } else {
      setDraft(session.name)
    }
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      onDoubleClick={(e) => {
        e.stopPropagation()
        setDraft(session.name)
        setEditing(true)
      }}
      className={cn(
        'group relative flex items-center gap-1 h-5 px-2 text-[11px] rounded-sm shrink-0 transition-colors',
        isActive ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'
      )}
    >
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename()
            if (e.key === 'Escape') {
              setDraft(session.name)
              setEditing(false)
            }
          }}
          className="bg-transparent outline-none text-[11px] text-zinc-200 w-16 min-w-0 select-text caret-zinc-200 session-tab-input"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="truncate max-w-24">{session.name}</span>
      )}
      {!editing && (
        <span
          role="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation()
            onRequestDelete()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.stopPropagation()
              onRequestDelete()
            }
          }}
          className="hidden group-hover:flex items-center justify-center w-3 h-3 rounded-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700"
        >
          <X className="w-2.5 h-2.5" />
        </span>
      )}
    </button>
  )
}

export function NoteSessionBar({
  sessions,
  activeSessionId,
  mode,
  onSelect,
  onCreate,
  onDelete,
  onRename,
  onModeChange
}: NoteSessionBarProps): React.JSX.Element {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const pendingSession = pendingDeleteId ? sessions.find((s) => s.id === pendingDeleteId) : null

  const handleConfirmDelete = useCallback(() => {
    if (pendingDeleteId) {
      onDelete(pendingDeleteId)
      setPendingDeleteId(null)
    }
  }, [pendingDeleteId, onDelete])

  const handleCancelDelete = useCallback(() => {
    setPendingDeleteId(null)
  }, [])

  return (
    <>
      <div className="flex items-center h-7 px-2 bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-800/30">
        <div className="flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
          {sessions.map((session) => (
            <SessionTab
              key={session.id}
              session={session}
              isActive={session.id === activeSessionId}
              onSelect={() => onSelect(session.id)}
              onRequestDelete={() => setPendingDeleteId(session.id)}
              onRename={(name) => onRename(session.id, name)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="flex items-center justify-center h-5 w-5 shrink-0 rounded-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors ml-1"
          title="New note"
        >
          <Plus className="w-3 h-3" />
        </button>
        <div className="flex items-center gap-0.5 ml-2 shrink-0 bg-zinc-900/50 p-0.5 rounded">
          <button
            type="button"
            onClick={() => onModeChange('edit')}
            className={cn(
              'flex items-center gap-1 h-5 px-1.5 text-[10px] font-medium rounded-sm transition-colors',
              mode === 'edit' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <Pencil className="w-2.5 h-2.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onModeChange('preview')}
            className={cn(
              'flex items-center gap-1 h-5 px-1.5 text-[10px] font-medium rounded-sm transition-colors',
              mode === 'preview' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <Eye className="w-2.5 h-2.5" />
            Preview
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={pendingDeleteId !== null}
        title={`Delete "${pendingSession?.name ?? ''}"?`}
        description="This note and all its content will be permanently deleted."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  )
}
