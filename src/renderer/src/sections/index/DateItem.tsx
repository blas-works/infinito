interface DateItemProps {
  id: string
  label: string
  onSelect: (id: string) => void
}

export function DateItem({ id, label, onSelect }: DateItemProps): React.JSX.Element {
  return (
    <button
      onClick={() => onSelect(id)}
      className="w-full text-left px-3 py-2 rounded-md hover:bg-zinc-900/60 transition-colors text-zinc-400 hover:text-zinc-200 flex items-center gap-2.5 group"
    >
      <span className="w-1 h-1 rounded-full bg-zinc-700 group-hover:bg-zinc-500 transition-colors shrink-0" />
      <span className="font-mono text-xs">{label}</span>
    </button>
  )
}
