export interface NoteSession {
  id: string
  name: string
  createdAt: number
}

export interface NoteSessionRegistry {
  sessions: NoteSession[]
  activeSessionId: string
}
