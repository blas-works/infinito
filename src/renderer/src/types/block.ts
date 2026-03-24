export type View = 'daily' | 'notes' | 'config' | 'canvas'

export interface Block {
  id: string
  content: string
}

export interface BlockData {
  id: string
  content: string
  position: number
}

export interface DateGroup {
  dateBlock: Block | null
  contentBlock: Block | null
}
