import { useState, useEffect, useCallback, useRef } from 'react'
import type { View, DateGroup } from '@renderer/types'

export type VimLevel = 'tabs' | 'view'

const VIEWS: View[] = ['daily', 'notes', 'canvas', 'config']
const VIEW_MAP: Record<string, View> = { '1': 'daily', '2': 'notes', '3': 'canvas', '4': 'config' }

interface UseVimModeOptions {
  enabled: boolean
  activeView: View
  setView: (view: View) => void
  groupedBlocks: DateGroup[]
  focusedId: string | null
  collapsedIds: Set<string>
  setFocusedId: (id: string | null) => void
  addBlock: () => void
  toggleCollapse: (id: string) => void
}

interface UseVimModeReturn {
  highlightedId: string | null
  vimLevel: VimLevel
}

function getVisibleBlockIds(groups: DateGroup[], collapsedIds: Set<string>): string[] {
  const ids: string[] = []
  for (const group of groups) {
    if (group.dateBlock) {
      ids.push(group.dateBlock.id)
      if (!collapsedIds.has(group.dateBlock.id) && group.contentBlock) {
        ids.push(group.contentBlock.id)
      }
    } else if (group.contentBlock) {
      ids.push(group.contentBlock.id)
    }
  }
  return ids
}

function isEditableElement(el: Element | null): boolean {
  if (!el) return false
  const tag = el.tagName.toLowerCase()
  if (tag === 'textarea' || tag === 'input') return true
  if ((el as HTMLElement).isContentEditable) return true
  return false
}

export function useVimMode({
  enabled,
  activeView,
  setView,
  groupedBlocks,
  focusedId,
  collapsedIds,
  setFocusedId,
  addBlock,
  toggleCollapse
}: UseVimModeOptions): UseVimModeReturn {
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [level, setLevel] = useState<VimLevel>('tabs')

  const optionsRef = useRef({
    activeView,
    groupedBlocks,
    focusedId,
    collapsedIds,
    highlightedId,
    level
  })

  optionsRef.current = {
    activeView,
    groupedBlocks,
    focusedId,
    collapsedIds,
    highlightedId,
    level
  }

  // Reset to tabs level when switching views or disabling
  useEffect(() => {
    setHighlightedId(null)
    setLevel('tabs')
  }, [activeView, enabled])

  // Clear highlight when entering edit mode (focusedId set by textarea)
  useEffect(() => {
    if (focusedId) {
      setHighlightedId(null)
    }
  }, [focusedId])

  const scrollToBlock = useCallback((blockId: string) => {
    requestAnimationFrame(() => {
      document.getElementById(`block-${blockId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    })
  }, [])

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent): void => {
      // Always skip if user is typing in an editable element
      if (isEditableElement(document.activeElement)) return

      const {
        activeView: view,
        groupedBlocks: groups,
        focusedId: focused,
        collapsedIds: collapsed,
        highlightedId: highlighted,
        level: currentLevel
      } = optionsRef.current

      // ── TABS LEVEL ──
      if (currentLevel === 'tabs') {
        // Direct view switching: 1-4
        if (VIEW_MAP[e.key]) {
          e.preventDefault()
          setView(VIEW_MAP[e.key])
          return
        }

        // Cycle tabs with h/l
        if (e.key === 'h' || e.key === 'l') {
          e.preventDefault()
          const currentIdx = VIEWS.indexOf(view)
          const delta = e.key === 'l' ? 1 : -1
          const nextIdx = (currentIdx + delta + VIEWS.length) % VIEWS.length
          setView(VIEWS[nextIdx])
          return
        }

        // Enter current view with i
        if (e.key === 'i') {
          e.preventDefault()
          setLevel('view')

          // View-specific enter behavior
          if (view === 'daily') {
            const visibleIds = getVisibleBlockIds(groups, collapsed)
            if (visibleIds.length > 0) {
              setHighlightedId(visibleIds[0])
              scrollToBlock(visibleIds[0])
            }
          } else if (view === 'notes') {
            // Enter edit mode in notes
            document.dispatchEvent(new CustomEvent('vim:enter-notes-edit'))
          }
          return
        }

        return
      }

      // ── VIEW LEVEL ──

      // Escape returns to tabs level
      if (e.key === 'Escape') {
        e.preventDefault()
        setHighlightedId(null)
        setLevel('tabs')
        return
      }

      // Daily view keybindings
      if (view === 'daily') {
        const visibleIds = getVisibleBlockIds(groups, collapsed)

        if (e.key === 'j' || e.key === 'k') {
          e.preventDefault()
          if (visibleIds.length === 0) return

          if (!highlighted) {
            const nextId = e.key === 'j' ? visibleIds[0] : visibleIds[visibleIds.length - 1]
            setHighlightedId(nextId)
            scrollToBlock(nextId)
            return
          }

          const currentIndex = visibleIds.indexOf(highlighted)
          const delta = e.key === 'j' ? 1 : -1
          const nextIndex = Math.max(0, Math.min(visibleIds.length - 1, currentIndex + delta))
          const nextId = visibleIds[nextIndex]
          setHighlightedId(nextId)
          scrollToBlock(nextId)
          return
        }

        if ((e.key === 'i' || e.key === 'Enter') && highlighted && !focused) {
          e.preventDefault()
          setFocusedId(highlighted)
          return
        }

        if (e.key === 'o') {
          e.preventDefault()
          addBlock()
          return
        }

        if (e.key === '/') {
          e.preventDefault()
          const filterInput = document.querySelector<HTMLInputElement>('[data-vim-search]')
          filterInput?.focus()
          return
        }

        // Expand collapsed date block with l
        if (e.key === 'l' && highlighted) {
          const group = groups.find((g) => g.dateBlock?.id === highlighted)
          if (group?.dateBlock && collapsed.has(group.dateBlock.id)) {
            e.preventDefault()
            toggleCollapse(group.dateBlock.id)
            return
          }
        }

        // Collapse expanded date block with h
        if (e.key === 'h' && highlighted) {
          const group = groups.find((g) => g.dateBlock?.id === highlighted)
          if (group?.dateBlock && !collapsed.has(group.dateBlock.id)) {
            e.preventDefault()
            toggleCollapse(group.dateBlock.id)
            return
          }
        }
      }

      // Notes view keybindings at view level
      if (view === 'notes') {
        if (e.key === 'i') {
          e.preventDefault()
          document.dispatchEvent(new CustomEvent('vim:enter-notes-edit'))
          return
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enabled, setView, setFocusedId, addBlock, toggleCollapse, scrollToBlock])

  return {
    highlightedId: enabled ? highlightedId : null,
    vimLevel: enabled ? level : 'tabs'
  }
}
