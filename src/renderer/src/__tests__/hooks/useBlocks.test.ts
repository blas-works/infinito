import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useBlocks } from '../../hooks/useBlocks'

vi.mock('../../lib/id', () => ({
  generateId: vi.fn().mockReturnValue('test-id')
}))

vi.mock('date-fns', () => ({
  format: vi.fn(() => '21-03-2026')
}))

describe('useBlocks', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    vi.mocked(window.api.getBlocks).mockReset()
    vi.mocked(window.api.getBlocks).mockResolvedValue([])
    vi.mocked(window.api.saveBlocks).mockReset()
    vi.mocked(window.api.saveBlocks).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with empty blocks and not loaded', () => {
    vi.mocked(window.api.getBlocks).mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() => useBlocks())

    expect(result.current.blocks).toEqual([])
    expect(result.current.loaded).toBe(false)
  })

  it('should load blocks from service', async () => {
    const mockBlocks = [
      { id: '1', content: '# 01-01-2024', position: 0 },
      { id: '2', content: 'content', position: 1 }
    ]
    vi.mocked(window.api.getBlocks).mockResolvedValue(mockBlocks)

    const { result } = renderHook(() => useBlocks())

    await waitFor(() => {
      expect(result.current.loaded).toBe(true)
    })

    expect(result.current.blocks).toHaveLength(2)
  })

  it('should collapse dates that are not today on initial load', async () => {
    vi.mocked(window.api.getBlocks).mockResolvedValue([
      { id: 'date-1', content: '# 01-01-2024', position: 0 },
      { id: 'date-2', content: '# 21-03-2026', position: 1 }
    ])

    const { result } = renderHook(() => useBlocks())

    await waitFor(() => {
      expect(result.current.loaded).toBe(true)
    })

    expect(result.current.collapsedIds.has('date-1')).toBe(true)
    expect(result.current.collapsedIds.has('date-2')).toBe(false)
  })

  it('should add a new block', async () => {
    vi.mocked(window.api.getBlocks).mockResolvedValue([])

    const { result } = renderHook(() => useBlocks())

    await waitFor(() => {
      expect(result.current.loaded).toBe(true)
    })

    act(() => {
      result.current.addBlock()
    })

    expect(result.current.blocks).toHaveLength(1)
    expect(result.current.focusedId).toBe('test-id')
  })

  it('should update block content', async () => {
    vi.mocked(window.api.getBlocks).mockResolvedValue([
      { id: 'existing-1', content: 'old', position: 0 }
    ])

    const { result } = renderHook(() => useBlocks())

    await waitFor(() => {
      expect(result.current.loaded).toBe(true)
    })

    act(() => {
      result.current.updateBlock('existing-1', 'new content')
    })

    expect(result.current.blocks[0].content).toBe('new content')
  })

  it('should auto-insert content block when block becomes a date', async () => {
    vi.mocked(window.api.getBlocks).mockResolvedValue([
      { id: 'existing-1', content: 'old', position: 0 }
    ])

    const { result } = renderHook(() => useBlocks())

    await waitFor(() => {
      expect(result.current.loaded).toBe(true)
    })

    act(() => {
      result.current.updateBlock('existing-1', '# 21-03-2026')
    })

    expect(result.current.blocks).toHaveLength(2)
    expect(result.current.blocks[1].content).toBe('')
  })

  it('should set focused id', async () => {
    vi.mocked(window.api.getBlocks).mockResolvedValue([
      { id: 'block-1', content: 'content', position: 0 }
    ])

    const { result } = renderHook(() => useBlocks())

    await waitFor(() => {
      expect(result.current.loaded).toBe(true)
    })

    act(() => {
      result.current.setFocusedId('block-1')
    })

    expect(result.current.focusedId).toBe('block-1')
  })

  it('should remove orphan empty block on blur', async () => {
    vi.mocked(window.api.getBlocks).mockResolvedValue([
      { id: 'block-1', content: 'content', position: 0 },
      { id: 'block-2', content: '', position: 1 }
    ])

    const { result } = renderHook(() => useBlocks())

    await waitFor(() => {
      expect(result.current.loaded).toBe(true)
    })

    act(() => {
      result.current.setFocusedId('block-2')
    })

    act(() => {
      result.current.setFocusedId(null)
    })

    expect(result.current.blocks).toHaveLength(1)
    expect(result.current.blocks[0].id).toBe('block-1')
  })

  it('should not remove block when blurring from date block', async () => {
    vi.mocked(window.api.getBlocks).mockResolvedValue([
      { id: 'block-1', content: '# 21-03-2026', position: 0 },
      { id: 'block-2', content: '', position: 1 }
    ])

    const { result } = renderHook(() => useBlocks())

    await waitFor(() => {
      expect(result.current.loaded).toBe(true)
    })

    act(() => {
      result.current.setFocusedId('block-2')
    })

    act(() => {
      result.current.setFocusedId(null)
    })

    expect(result.current.blocks).toHaveLength(2)
  })

  it('should filter date blocks correctly', async () => {
    vi.mocked(window.api.getBlocks).mockResolvedValue([
      { id: 'date-1', content: '# 01-01-2024', position: 0 },
      { id: 'content-1', content: 'content', position: 1 },
      { id: 'date-2', content: '# 02-01-2024', position: 2 }
    ])

    const { result } = renderHook(() => useBlocks())

    await waitFor(() => {
      expect(result.current.loaded).toBe(true)
    })

    expect(result.current.dateBlocks).toHaveLength(2)
    expect(result.current.dateBlocks[0].id).toBe('date-1')
    expect(result.current.dateBlocks[1].id).toBe('date-2')
  })

  it('should group blocks by date', async () => {
    vi.mocked(window.api.getBlocks).mockResolvedValue([
      { id: 'date-1', content: '# 01-01-2024', position: 0 },
      { id: 'content-1', content: 'content 1', position: 1 },
      { id: 'date-2', content: '# 02-01-2024', position: 2 },
      { id: 'content-2', content: 'content 2', position: 3 }
    ])

    const { result } = renderHook(() => useBlocks())

    await waitFor(() => {
      expect(result.current.loaded).toBe(true)
    })

    expect(result.current.groupedBlocks).toHaveLength(2)
    expect(result.current.groupedBlocks[0].dateBlock?.id).toBe('date-1')
    expect(result.current.groupedBlocks[0].contentBlock?.id).toBe('content-1')
  })

  describe('addNewDay', () => {
    it('should add new day block', async () => {
      vi.mocked(window.api.getBlocks).mockResolvedValue([])

      const { result } = renderHook(() => useBlocks())

      await waitFor(() => {
        expect(result.current.loaded).toBe(true)
      })

      act(() => {
        result.current.addNewDay()
      })

      expect(result.current.blocks).toHaveLength(2)
      expect(result.current.blocks[0].content).toBe('# 21-03-2026')
      expect(result.current.blocks[1].content).toBe('')
    })

    it('should not duplicate todays date block', async () => {
      vi.mocked(window.api.getBlocks).mockResolvedValue([
        { id: 'existing-date', content: '# 21-03-2026', position: 0 }
      ])

      const { result } = renderHook(() => useBlocks())

      await waitFor(() => {
        expect(result.current.loaded).toBe(true)
      })

      act(() => {
        result.current.addNewDay()
      })

      expect(result.current.blocks).toHaveLength(1)
    })

    it('should move existing today block to top with its content', async () => {
      vi.mocked(window.api.getBlocks).mockResolvedValue([
        { id: 'date-today', content: '# 21-03-2026', position: 0 },
        { id: 'content-today', content: 'today content', position: 1 },
        { id: 'date-old', content: '# 20-03-2026', position: 2 },
        { id: 'content-old', content: 'old content', position: 3 }
      ])

      const { result } = renderHook(() => useBlocks())

      await waitFor(() => {
        expect(result.current.loaded).toBe(true)
      })

      act(() => {
        result.current.addNewDay()
      })

      expect(result.current.blocks).toHaveLength(4)
      expect(result.current.blocks[0].id).toBe('date-today')
      expect(result.current.blocks[1].id).toBe('content-today')
      expect(result.current.blocks[2].id).toBe('date-old')
      expect(result.current.blocks[3].id).toBe('content-old')
    })
  })

  describe('toggleCollapse', () => {
    it('should toggle collapse state', async () => {
      vi.mocked(window.api.getBlocks).mockResolvedValue([
        { id: 'date-1', content: '# 21-03-2026', position: 0 }
      ])

      const { result } = renderHook(() => useBlocks())

      await waitFor(() => {
        expect(result.current.loaded).toBe(true)
      })

      expect(result.current.collapsedIds.has('date-1')).toBe(false)

      act(() => {
        result.current.toggleCollapse('date-1')
      })

      expect(result.current.collapsedIds.has('date-1')).toBe(true)

      act(() => {
        result.current.toggleCollapse('date-1')
      })

      expect(result.current.collapsedIds.has('date-1')).toBe(false)
    })
  })

  describe('deleteGroup', () => {
    it('should delete date block and its content block', async () => {
      vi.mocked(window.api.getBlocks).mockResolvedValue([
        { id: 'date-1', content: '# 01-01-2024', position: 0 },
        { id: 'content-1', content: 'some content', position: 1 },
        { id: 'date-2', content: '# 02-01-2024', position: 2 }
      ])

      const { result } = renderHook(() => useBlocks())

      await waitFor(() => {
        expect(result.current.loaded).toBe(true)
      })

      act(() => {
        result.current.deleteGroup('date-1')
      })

      expect(result.current.blocks).toHaveLength(1)
      expect(result.current.blocks[0].id).toBe('date-2')
    })

    it('should only delete date block when next block is also a date', async () => {
      vi.mocked(window.api.getBlocks).mockResolvedValue([
        { id: 'date-1', content: '# 01-01-2024', position: 0 },
        { id: 'date-2', content: '# 02-01-2024', position: 1 }
      ])

      const { result } = renderHook(() => useBlocks())

      await waitFor(() => {
        expect(result.current.loaded).toBe(true)
      })

      act(() => {
        result.current.deleteGroup('date-1')
      })

      expect(result.current.blocks).toHaveLength(1)
      expect(result.current.blocks[0].id).toBe('date-2')
    })

    it('should do nothing when dateBlockId is not found', async () => {
      vi.mocked(window.api.getBlocks).mockResolvedValue([
        { id: 'date-1', content: '# 01-01-2024', position: 0 }
      ])

      const { result } = renderHook(() => useBlocks())

      await waitFor(() => {
        expect(result.current.loaded).toBe(true)
      })

      act(() => {
        result.current.deleteGroup('nonexistent')
      })

      expect(result.current.blocks).toHaveLength(1)
    })

    it('should remove collapsed state for deleted group', async () => {
      vi.mocked(window.api.getBlocks).mockResolvedValue([
        { id: 'date-old', content: '# 01-01-2024', position: 0 },
        { id: 'content-old', content: 'old content', position: 1 }
      ])

      const { result } = renderHook(() => useBlocks())

      await waitFor(() => {
        expect(result.current.loaded).toBe(true)
      })

      expect(result.current.collapsedIds.has('date-old')).toBe(true)

      act(() => {
        result.current.deleteGroup('date-old')
      })

      expect(result.current.collapsedIds.has('date-old')).toBe(false)
    })
  })

  describe('scrollToDate', () => {
    it('should expand collapsed group and scroll to element', async () => {
      const mockScrollIntoView = vi.fn()
      const mockElement = { scrollIntoView: mockScrollIntoView }
      vi.spyOn(document, 'getElementById').mockReturnValue(mockElement as unknown as HTMLElement)

      vi.mocked(window.api.getBlocks).mockResolvedValue([
        { id: 'date-old', content: '# 01-01-2024', position: 0 },
        { id: 'content-1', content: 'content', position: 1 }
      ])

      const { result } = renderHook(() => useBlocks())

      await waitFor(() => {
        expect(result.current.loaded).toBe(true)
      })

      expect(result.current.collapsedIds.has('date-old')).toBe(true)

      act(() => {
        result.current.scrollToDate('date-old')
      })

      expect(result.current.collapsedIds.has('date-old')).toBe(false)

      await waitFor(() => {
        expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
      })

      vi.restoreAllMocks()
    })

    it('should handle missing DOM element gracefully', async () => {
      vi.spyOn(document, 'getElementById').mockReturnValue(null)

      vi.mocked(window.api.getBlocks).mockResolvedValue([
        { id: 'date-1', content: '# 01-01-2024', position: 0 }
      ])

      const { result } = renderHook(() => useBlocks())

      await waitFor(() => {
        expect(result.current.loaded).toBe(true)
      })

      act(() => {
        result.current.scrollToDate('date-1')
      })

      await new Promise((r) => setTimeout(r, 300))

      vi.restoreAllMocks()
    })
  })

  describe('save debounce', () => {
    it('should debounce saving blocks', async () => {
      vi.mocked(window.api.getBlocks).mockResolvedValue([
        { id: 'block-1', content: 'initial', position: 0 }
      ])

      const { result } = renderHook(() => useBlocks())

      await waitFor(() => {
        expect(result.current.loaded).toBe(true)
      })

      vi.mocked(window.api.saveBlocks).mockClear()

      act(() => {
        result.current.updateBlock('block-1', 'updated')
      })

      expect(window.api.saveBlocks).not.toHaveBeenCalled()

      await waitFor(() => {
        expect(window.api.saveBlocks).toHaveBeenCalled()
      })
    })
  })

  describe('updateBlock edge cases', () => {
    it('should not insert content block when next block is not a date', async () => {
      vi.mocked(window.api.getBlocks).mockResolvedValue([
        { id: 'block-1', content: 'text', position: 0 },
        { id: 'block-2', content: 'more text', position: 1 }
      ])

      const { result } = renderHook(() => useBlocks())

      await waitFor(() => {
        expect(result.current.loaded).toBe(true)
      })

      act(() => {
        result.current.updateBlock('block-1', '# 21-03-2026')
      })

      expect(result.current.blocks).toHaveLength(2)
    })
  })
})
