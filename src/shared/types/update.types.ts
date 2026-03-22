export type UpdatePriority = 'normal' | 'security' | 'critical'

export interface UpdateMetadata {
  version: string
  priority: UpdatePriority
  message?: string
  forceRestart?: boolean
  releaseDate?: string
}

export interface UpdateInfo {
  available: boolean
  version?: string
  priority?: UpdatePriority
  message?: string
  progress?: number
  downloaded?: boolean
  manualDownload?: boolean
}

export interface PendingUpdate {
  version: string
  priority: UpdatePriority
  message?: string
}
