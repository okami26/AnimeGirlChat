import { mapRole } from './role'
import type { ChatMessage } from './types'

export function sortByCreatedAt(list: ChatMessage[]) {
  const hasDates = list.some(m => m.created_at && !Number.isNaN(Date.parse(m.created_at!)))
  if (!hasDates) return [...list]
  return [...list].sort((a, b) => {
    const ta = a.created_at ? (Date.parse(a.created_at) || 0) : 0
    const tb = b.created_at ? (Date.parse(b.created_at) || 0) : 0
    return ta - tb
  })
}

export function uniqMessages(list: ChatMessage[]) {
  const seen = new Set<string>()
  const out: ChatMessage[] = []
  for (const m of list) {
    const key = `${m.role}|${m.content}|${m.created_at ?? ''}`
    if (!seen.has(key)) { seen.add(key); out.push(m) }
  }
  return out
}

export function mapHistory(items: any[]): ChatMessage[] {
  const mapped = items.map((m:any) => {
    if (Array.isArray(m)) {
      const [text, roleLike] = m as [unknown, unknown]
      return { id: crypto.randomUUID(), role: mapRole(String(roleLike ?? 'assistant')), content: String(text ?? '') }
    }
    if (m && typeof m === 'object') {
      return {
        id: m.id ?? crypto.randomUUID(),
        role: mapRole(String(m.role ?? 'assistant')),
        content: String(m.content ?? ''),
        created_at: m.created_at, name: m.name, avatar: m.avatar,
      }
    }
    return null
  }).filter(Boolean) as ChatMessage[]
  return sortByCreatedAt(mapped)
}
