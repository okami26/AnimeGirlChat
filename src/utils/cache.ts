import type { ChatMessage } from './types'

const key = (uid:string) => `chat:${uid}`

export function saveCache(uid: string, list: ChatMessage[]) {
  try { localStorage.setItem(key(uid), JSON.stringify(list)) } catch {}
}
export function readCache(uid: string): ChatMessage[] | null {
  try { const raw = localStorage.getItem(key(uid)); return raw ? JSON.parse(raw) : null } catch { return null }
}
export function migrateAnonCacheTo(uid: string) {
  const anon = readCache('anon'); if (!anon?.length) return
  const prev = readCache(uid) || []
  const merged = [...prev, ...anon]
  saveCache(uid, merged)
  try { localStorage.removeItem(key('anon')) } catch {}
}
