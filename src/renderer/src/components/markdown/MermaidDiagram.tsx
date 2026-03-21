import { useEffect, useRef, useState, useId } from 'react'
import mermaid from 'mermaid'

let mermaidInitialized = false

function initMermaid(): void {
  if (mermaidInitialized) return
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: {
      primaryColor: '#27272a',
      primaryTextColor: '#d4d4d8',
      primaryBorderColor: '#3f3f46',
      lineColor: '#52525b',
      secondaryColor: '#18181b',
      tertiaryColor: '#09090b',
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px'
    }
  })
  mermaidInitialized = true
}

interface MermaidDiagramProps {
  content: string
}

export function MermaidDiagram({ content }: MermaidDiagramProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const uniqueId = useId().replace(/:/g, '_')

  useEffect(() => {
    initMermaid()

    let cancelled = false

    async function renderDiagram(): Promise<void> {
      try {
        const { svg } = await mermaid.render(`mermaid_${uniqueId}`, content)
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram')
        }
      }
    }

    renderDiagram()

    return () => {
      cancelled = true
    }
  }, [content, uniqueId])

  if (error) {
    return (
      <pre className="bg-zinc-900 border border-zinc-800/50 rounded-md p-3 text-[11px] text-red-400 overflow-x-auto">
        <code>{content}</code>
      </pre>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex justify-center my-2 [&_svg]:max-w-full"
    />
  )
}
