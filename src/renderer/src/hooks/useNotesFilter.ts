import { useState, useMemo, useCallback } from 'react'
import type { DateGroup } from '@renderer/types'

interface UseNotesFilterReturn {
  query: string
  isActive: boolean
  filteredGroups: DateGroup[]
  setQuery: (query: string) => void
}

export function useNotesFilter(groupedBlocks: DateGroup[]): UseNotesFilterReturn {
  const [query, setQueryState] = useState('')

  const isActive = query !== ''

  const filteredGroups = useMemo(() => {
    if (!isActive) return groupedBlocks

    const q = query.toLowerCase()

    return groupedBlocks.filter((group) => {
      const dateMatch = group.dateBlock?.content.toLowerCase().includes(q) ?? false
      const contentMatch = group.contentBlock?.content.toLowerCase().includes(q) ?? false
      return dateMatch || contentMatch
    })
  }, [groupedBlocks, query, isActive])

  const setQuery = useCallback((value: string) => {
    setQueryState(value)
  }, [])

  return { query, isActive, filteredGroups, setQuery }
}
