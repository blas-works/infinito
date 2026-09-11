import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { DateGroup } from '../../sections/daily/DateGroup'
import type { Block } from '../../types'

// Load only the hook DateGroup needs, so unrelated hooks from the barrel don't enter the coverage report
vi.mock('../../hooks', async () => {
  const { useAutoResize } = await import('../../hooks/useAutoResize')
  return { useAutoResize }
})

vi.mock('../../sections/daily/BlockItem', () => ({
  BlockItem: ({
    block,
    isFocused,
    onChange
  }: {
    block: Block
    isFocused: boolean
    onChange: (content: string) => void
  }): React.JSX.Element => (
    <div data-testid="block-item" data-focused={isFocused}>
      {block.content}
      <button onClick={() => onChange('edited')}>mock-change</button>
    </div>
  )
}))

type DateGroupProps = React.ComponentProps<typeof DateGroup>

const dateBlock: Block = { id: 'date-1', content: '# 11-09-2026' }
const contentBlock: Block = { id: 'content-1', content: 'Revisar la operación L-A208' }

function renderGroup(overrides: Partial<DateGroupProps> = {}): DateGroupProps {
  const props: DateGroupProps = {
    dateBlock,
    contentBlock,
    isCollapsed: false,
    onToggle: vi.fn(),
    focusedId: null,
    onFocus: vi.fn(),
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    ...overrides
  }
  render(<DateGroup {...props} />)
  return props
}

describe('DateGroup', () => {
  const writeText = vi.fn()

  beforeEach(() => {
    writeText.mockReset()
    writeText.mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render the date label without the heading marker', () => {
    renderGroup()

    expect(screen.getByText('11-09-2026')).toBeInTheDocument()
  })

  it('should render the content when expanded', () => {
    renderGroup()

    expect(screen.getByTestId('block-item')).toHaveTextContent('Revisar la operación L-A208')
  })

  it('should hide the content when collapsed', () => {
    renderGroup({ isCollapsed: true })

    expect(screen.queryByTestId('block-item')).not.toBeInTheDocument()
  })

  it('should forward content changes to onUpdate', () => {
    const props = renderGroup()

    fireEvent.click(screen.getByText('mock-change'))

    expect(props.onUpdate).toHaveBeenCalledWith('content-1', 'edited')
  })

  it('should toggle collapse when clicking the chevron', () => {
    const props = renderGroup()

    fireEvent.click(screen.getAllByRole('button')[0])

    expect(props.onToggle).toHaveBeenCalledTimes(1)
  })

  describe('actions', () => {
    it('should show copy, edit and delete when the note has content', () => {
      renderGroup()

      expect(screen.getByTitle('Copy note')).toBeInTheDocument()
      expect(screen.getByTitle('Edit note')).toBeInTheDocument()
      expect(screen.getByTitle('Delete note')).toBeInTheDocument()
    })

    it('should hide copy when the note is empty', () => {
      renderGroup({ contentBlock: { id: 'content-1', content: '   ' } })

      expect(screen.queryByTitle('Copy note')).not.toBeInTheDocument()
      expect(screen.getByTitle('Edit note')).toBeInTheDocument()
    })

    it('should only show delete when the date has no content block', () => {
      renderGroup({ contentBlock: null })

      expect(screen.queryByTitle('Copy note')).not.toBeInTheDocument()
      expect(screen.queryByTitle('Edit note')).not.toBeInTheDocument()
      expect(screen.getByTitle('Delete note')).toBeInTheDocument()
    })

    it('should request deletion with the date block id', () => {
      const props = renderGroup()

      fireEvent.click(screen.getByTitle('Delete note'))

      expect(props.onDelete).toHaveBeenCalledWith('date-1')
    })
  })

  describe('copy', () => {
    it('should copy the note content without embedded images', async () => {
      renderGroup({
        contentBlock: { id: 'content-1', content: 'texto\n![image](data:image/png;base64,AAAA)' }
      })

      await act(async () => {
        fireEvent.click(screen.getByTitle('Copy note'))
      })

      expect(writeText).toHaveBeenCalledWith('texto\n[image]')
      expect(screen.getByTitle('Copied')).toBeInTheDocument()
    })

    it('should reset the copied feedback after a delay', async () => {
      vi.useFakeTimers()
      renderGroup()

      await act(async () => {
        fireEvent.click(screen.getByTitle('Copy note'))
      })
      expect(screen.getByTitle('Copied')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(1500)
      })
      expect(screen.getByTitle('Copy note')).toBeInTheDocument()
    })

    it('should restart the feedback delay when copying again', async () => {
      vi.useFakeTimers()
      renderGroup()

      await act(async () => {
        fireEvent.click(screen.getByTitle('Copy note'))
      })
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      await act(async () => {
        fireEvent.click(screen.getByTitle('Copied'))
      })
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      expect(screen.getByTitle('Copied')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(500)
      })
      expect(screen.getByTitle('Copy note')).toBeInTheDocument()
    })

    it('should not show feedback when the clipboard write fails', async () => {
      writeText.mockRejectedValue(new Error('denied'))
      renderGroup()

      await act(async () => {
        fireEvent.click(screen.getByTitle('Copy note'))
      })

      expect(screen.queryByTitle('Copied')).not.toBeInTheDocument()
      expect(screen.getByTitle('Copy note')).toBeInTheDocument()
    })
  })

  describe('edit', () => {
    it('should focus the content block', () => {
      const props = renderGroup()

      fireEvent.click(screen.getByTitle('Edit note'))

      expect(props.onFocus).toHaveBeenCalledWith('content-1')
      expect(props.onToggle).not.toHaveBeenCalled()
    })

    it('should expand a collapsed note before focusing it', () => {
      const props = renderGroup({ isCollapsed: true })

      fireEvent.click(screen.getByTitle('Edit note'))

      expect(props.onToggle).toHaveBeenCalledTimes(1)
      expect(props.onFocus).toHaveBeenCalledWith('content-1')
    })
  })

  describe('date editing', () => {
    it('should focus the date on double click', () => {
      const props = renderGroup()

      fireEvent.doubleClick(screen.getByText('11-09-2026'))

      expect(props.onFocus).toHaveBeenCalledWith('date-1')
    })

    it('should update the date while focused', () => {
      const props = renderGroup({ focusedId: 'date-1' })

      fireEvent.change(screen.getByDisplayValue('# 11-09-2026'), {
        target: { value: '# 12-09-2026' }
      })

      expect(props.onUpdate).toHaveBeenCalledWith('date-1', '# 12-09-2026')
    })

    it('should leave date editing on Enter only', () => {
      const props = renderGroup({ focusedId: 'date-1' })
      const input = screen.getByDisplayValue('# 11-09-2026')

      fireEvent.keyDown(input, { key: 'a' })
      expect(props.onFocus).not.toHaveBeenCalled()

      fireEvent.keyDown(input, { key: 'Enter' })
      expect(props.onFocus).toHaveBeenCalledWith(null)
    })

    it('should leave date editing on blur', () => {
      const props = renderGroup({ focusedId: 'date-1' })

      fireEvent.blur(screen.getByDisplayValue('# 11-09-2026'))

      expect(props.onFocus).toHaveBeenCalledWith(null)
    })
  })

  it('should highlight the date and content blocks', () => {
    const { rerender } = render(
      <DateGroup
        dateBlock={dateBlock}
        contentBlock={contentBlock}
        isCollapsed={false}
        onToggle={vi.fn()}
        focusedId={null}
        highlightedId="date-1"
        onFocus={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    expect(document.getElementById('block-date-1')).toHaveClass('ring-1')

    rerender(
      <DateGroup
        dateBlock={dateBlock}
        contentBlock={contentBlock}
        isCollapsed={false}
        onToggle={vi.fn()}
        focusedId={null}
        highlightedId="content-1"
        onFocus={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    expect(document.getElementById('block-date-1')).not.toHaveClass('ring-1')
    expect(screen.getByTestId('block-item').parentElement).toHaveClass('ring-1')
  })
})
