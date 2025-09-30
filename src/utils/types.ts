export interface MessageResponse {
  message: string
  audio_base64: string
}
export type Role = 'user' | 'assistant' | 'system'

export interface HistoryItem {
  id?: string
  role: Role
  content: string
  created_at?: string
  name?: string
  avatar?: string
  audio_base64?: string
  audio_mime?: string
}

export interface ChatMessage extends HistoryItem {
  id: string
  pending?: boolean
  audio_base64?: string
  audio_mime?: string
}
