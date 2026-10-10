import { memo } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { CodeBlock } from './CodeBlock'

const REMARK_PLUGINS = [remarkGfm]
const REHYPE_PLUGINS = [rehypeHighlight]

const BASE_COMPONENTS: Components = {
  code: CodeBlock
}

const INTERACTIVE_COMPONENTS: Components = {
  ...BASE_COMPONENTS,
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
}

interface MarkdownContentProps {
  content: string
  interactiveCheckboxes?: boolean
}

// Memoized so typing in one block doesn't re-parse and re-highlight every other block
export const MarkdownContent = memo(function MarkdownContent({
  content,
  interactiveCheckboxes = false
}: MarkdownContentProps): React.JSX.Element {
  return (
    <ReactMarkdown
      remarkPlugins={REMARK_PLUGINS}
      rehypePlugins={REHYPE_PLUGINS}
      components={interactiveCheckboxes ? INTERACTIVE_COMPONENTS : BASE_COMPONENTS}
    >
      {content}
    </ReactMarkdown>
  )
})
