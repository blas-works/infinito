import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { format } from 'date-fns'
import type { Block, DateGroup } from '@renderer/types'
import { blockService } from '@renderer/services'
import { generateId } from '@renderer/lib/id'
import { DATE_REGEX } from '@renderer/lib/constants'
import { groupBlocksByDate, consolidateBlocks } from '@renderer/lib/groupBlocks'

interface UseBlocksReturn {
  blocks: Block[]
  focusedId: string | null
  loaded: boolean
  dateBlocks: Block[]
  groupedBlocks: DateGroup[]
  collapsedIds: Set<string>
  setFocusedId: (id: string | null) => void
  updateBlock: (id: string, content: string) => void
  addBlock: () => void
  addNewDay: () => void
  scrollToDate: (id: string) => void
  toggleCollapse: (id: string) => void
  deleteGroup: (dateBlockId: string) => void
}

export function useBlocks(): UseBlocksReturn {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    blockService.getAll().then((rows) => {
      const mapped = rows.map((r) => ({ id: r.id, content: r.content }))
      const consolidated = consolidateBlocks(mapped)
      setBlocks(consolidated)

      // Set initial collapse state: collapse all dates except today
      const today = format(new Date(), 'dd-MM-yyyy')
      const idsToCollapse = new Set<string>()

      for (const block of consolidated) {
        if (DATE_REGEX.test(block.content)) {
          const dateStr = block.content.replace('# ', '').trim()
          if (dateStr !== today) {
            idsToCollapse.add(block.id)
          }
        }
      }

      if (idsToCollapse.size > 0) {
        setCollapsedIds(idsToCollapse)
      }

      setLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (!loaded) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      blockService.saveAll(blocks)
    }, 300)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [blocks, loaded])

  const groupedBlocks = useMemo(() => groupBlocksByDate(blocks), [blocks])

  const updateBlock = useCallback((id: string, content: string) => {
    let pendingFocusId: string | null = null

    setBlocks((prev) => {
      const newBlocks = prev.map((b) => (b.id === id ? { ...b, content } : b))
      const index = newBlocks.findIndex((b) => b.id === id)

      // When a block becomes a date, auto-insert a content block after it
      if (index !== -1 && DATE_REGEX.test(content) && !DATE_REGEX.test(prev[index].content)) {
        const next = newBlocks[index + 1]
        if (!next || DATE_REGEX.test(next.content)) {
          const contentBlock: Block = { id: generateId(), content: '' }
          newBlocks.splice(index + 1, 0, contentBlock)
          pendingFocusId = contentBlock.id
        }
      }

      return newBlocks
    })

    if (pendingFocusId) {
      setFocusedId(pendingFocusId)
    }
  }, [])

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const expandGroup = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  // Auto-delete empty orphan blocks on blur
  const handleFocusChange = useCallback(
    (id: string | null) => {
      if (id === null && focusedId) {
        const index = blocks.findIndex((b) => b.id === focusedId)
        if (index !== -1) {
          const block = blocks[index]
          const prevBlock = blocks[index - 1]
          const isOrphan = !prevBlock || !DATE_REGEX.test(prevBlock.content)
          if (isOrphan && block.content.trim() === '' && !DATE_REGEX.test(block.content)) {
            setBlocks((prev) => prev.filter((b) => b.id !== focusedId))
          }
        }
      }
      setFocusedId(id)
    },
    [focusedId, blocks]
  )

  const dateBlocks = blocks.filter((b) => DATE_REGEX.test(b.content))

  const scrollToDate = useCallback(
    (id: string) => {
      expandGroup(id)
      setTimeout(() => {
        const el = document.getElementById(`block-${id}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 250)
    },
    [expandGroup]
  )

  const deleteGroup = useCallback((dateBlockId: string) => {
    setBlocks((prev) => {
      const index = prev.findIndex((b) => b.id === dateBlockId)
      if (index === -1) return prev

      const idsToRemove = new Set<string>([dateBlockId])
      const next = prev[index + 1]
      if (next && !DATE_REGEX.test(next.content)) {
        idsToRemove.add(next.id)
      }

      return prev.filter((b) => !idsToRemove.has(b.id))
    })
    setCollapsedIds((prev) => {
      if (!prev.has(dateBlockId)) return prev
      const next = new Set(prev)
      next.delete(dateBlockId)
      return next
    })
  }, [])

  const addBlock = useCallback(() => {
    const newBlock: Block = { id: generateId(), content: '' }
    setBlocks((prev) => [newBlock, ...prev])
    setFocusedId(newBlock.id)
  }, [])

  const addNewDay = useCallback(() => {
    const today = format(new Date(), 'dd-MM-yyyy')
    const alreadyExists = blocks.some((b) => b.content.trim() === `# ${today}`)
    if (alreadyExists) {
      const existing = blocks.find((b) => b.content.trim() === `# ${today}`)
      if (existing) scrollToDate(existing.id)
      return
    }
    const dateBlock: Block = { id: generateId(), content: `# ${today}` }
    const contentBlock: Block = { id: generateId(), content: '' }
    setBlocks((prev) => [dateBlock, contentBlock, ...prev])
    setFocusedId(contentBlock.id)
    setTimeout(() => {
      const el = document.getElementById(`block-${dateBlock.id}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }, [blocks, scrollToDate])

  return {
    blocks,
    focusedId,
    loaded,
    dateBlocks,
    groupedBlocks,
    collapsedIds,
    setFocusedId: handleFocusChange,
    updateBlock,
    addBlock,
    addNewDay,
    scrollToDate,
    toggleCollapse,
    deleteGroup
  }
}
