import type { ComponentPropsWithoutRef } from 'react'
import { MermaidDiagram } from './MermaidDiagram'

type CodeBlockProps = ComponentPropsWithoutRef<'code'>

export function CodeBlock({ className, children, ...props }: CodeBlockProps): React.JSX.Element {
  const isMermaid = className?.includes('language-mermaid')
  const isInline = !className && typeof children === 'string' && !children.includes('\n')

  if (isMermaid && typeof children === 'string') {
    return <MermaidDiagram content={children.trim()} />
  }

  if (isInline) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    )
  }

  return (
    <code className={className} {...props}>
      {children}
    </code>
  )
}
