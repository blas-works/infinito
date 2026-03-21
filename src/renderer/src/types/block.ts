export type View = 'index' | 'notes' | 'config'

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
