import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MarkdownContent } from '../../components/markdown/MarkdownContent'

vi.mock('../../components/markdown/CodeBlock', () => ({
  CodeBlock: ({ children }: { children?: React.ReactNode }): React.JSX.Element => (
    <code data-testid="code-block">{children}</code>
  )
}))

describe('MarkdownContent', () => {
  it('renders markdown content', () => {
    render(<MarkdownContent content={'# Title\n\nsome **bold** text'} />)

    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument()
    expect(screen.getByText('bold').tagName).toBe('STRONG')
  })

  it('renders code through CodeBlock', () => {
    render(<MarkdownContent content={'`inline`'} />)

    expect(screen.getByTestId('code-block')).toHaveTextContent('inline')
  })

  it('renders task list checkboxes as disabled by default', () => {
    render(<MarkdownContent content={'- [x] done\n- [ ] todo'} />)

    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(2)
    checkboxes.forEach((checkbox) => expect(checkbox).toBeDisabled())
  })

  it('renders enabled checkboxes reflecting their state when interactive', () => {
    render(<MarkdownContent content={'- [x] done\n- [ ] todo'} interactiveCheckboxes />)

    const [done, todo] = screen.getAllByRole('checkbox')
    expect(done).toBeEnabled()
    expect(done).toBeChecked()
    expect(todo).not.toBeChecked()
  })
})
