import { Search } from 'lucide-react'

interface NotesFilterProps {
  query: string
  onQueryChange: (value: string) => void
}

export function NotesFilter({ query, onQueryChange }: NotesFilterProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Search className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search..."
        className="w-full bg-transparent text-xs text-zinc-300 placeholder:text-zinc-700 outline-none"
      />
    </div>
  )
}
