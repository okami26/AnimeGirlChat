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
  const mapped = items.map((m: any) => {
    if (Array.isArray(m)) {
      const [text, roleLike, audioMaybe] = m as [unknown, unknown, unknown]

      const out: ChatMessage = {
        id: crypto.randomUUID(),
        role: mapRole(String(roleLike ?? 'assistant')),
        content: String(text ?? ''),
      }

      // 3-й элемент: base64-строка или объект { audio_base64, audio_mime }
      if (typeof audioMaybe === 'string' && audioMaybe.trim()) {
        out.audio_base64 = audioMaybe
        out.audio_mime = 'audio/wav'
      } else if (audioMaybe && typeof audioMaybe === 'object') {
        const a = audioMaybe as any
        const base64 = a.audio_base64 ?? a.audio ?? ''
        if (base64) out.audio_base64 = String(base64)
        if (a.audio_mime) out.audio_mime = String(a.audio_mime)
        else if (base64) out.audio_mime = 'audio/wav'
      }

      return out
    }

    if (m && typeof m === 'object') {
      return {
        id: m.id ?? crypto.randomUUID(),
        role: mapRole(String(m.role ?? 'assistant')),
        content: String(m.content ?? ''),
        created_at: m.created_at,
        name: m.name,
        avatar: m.avatar,
        audio_base64: m.audio_base64 ?? m.audio ?? undefined,
        audio_mime: m.audio_mime ?? undefined,
      }
    }

    return null
  }).filter(Boolean) as ChatMessage[]

  return sortByCreatedAt(mapped)
}
