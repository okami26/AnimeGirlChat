<!-- src/views/InputPage.vue -->
<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import { useSendMessage } from '@/composables/useSendMessage'
import Banner from '@/views/Banner.vue'
import ChatBubble from '@/views/ChatBubble.vue'
import { getHistory, type HistoryItem } from '@/api/messages'

const userInput = ref<string>('')

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  pending?: boolean
  avatar?: string
  name?: string
  created_at?: string
}

const messages = ref<ChatMessage[]>([])
const historyLoading = ref(true)
const historyError = ref<string | null>(null)
const mergedFromSeveralIds = ref(false) // пометка, если история склеена из нескольких userId

const { send, loading, error, lastResponse } = useSendMessage()
const scrollWrapRef = ref<HTMLElement | null>(null)

/** аватарки/имя */
const userAvatar = ref<string | null>(null)
const userName = ref<string>('Вы')
const assistantAvatar = ref<string | null>('/ai.png')

// userId для бэка: будем вычислять активный
const activeUserId = ref<string>('anon')   // темп до инициализации
const telegramUserId = ref<string | null>(null) // если есть TG, положим сюда

// ---------- helpers: cache ----------
function cacheKey(uid: string) {
  return `chat:${uid}`
}
function saveCache(uid: string, list: ChatMessage[]) {
  try { localStorage.setItem(cacheKey(uid), JSON.stringify(list)) } catch {}
}
function readCache(uid: string): ChatMessage[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(uid))
    if (!raw) return null
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? (arr as ChatMessage[]) : null
  } catch { return null }
}
// Возможный старый локальный идентификатор пользователя:
function readLegacyUserId(): string | null {
  // Часто проекты хранят что-то вроде "clientId"/"userId" — попробуем найти
  const candidates = ['clientId', 'userId', 'uid', 'legacyUserId']
  for (const key of candidates) {
    const val = localStorage.getItem(key)
    if (val && typeof val === 'string' && val.trim()) return val.trim()
  }
  return null
}
// -----------------------------------

function sortByCreatedAt(list: ChatMessage[]) {
  return [...list].sort((a, b) => {
    const ta = a.created_at ? Date.parse(a.created_at) : 0
    const tb = b.created_at ? Date.parse(b.created_at) : 0
    return ta - tb
  })
}

function uniqMessages(list: ChatMessage[]) {
  const seen = new Set<string>()
  const out: ChatMessage[] = []
  for (const m of list) {
    const key = `${m.id ?? ''}|${m.role}|${m.content}|${m.created_at ?? ''}`
    if (!seen.has(key)) {
      seen.add(key)
      out.push(m)
    }
  }
  return out
}

// нормализуем серверные сообщения под формат UI
function mapHistory(items: HistoryItem[]): ChatMessage[] {
  const mapped = items.map((m) => ({
    id: m.id ?? crypto.randomUUID(),
    role: m.role,
    content: m.content,
    name: m.name,
    avatar: m.avatar,
    created_at: m.created_at,
  }))
  return sortByCreatedAt(mapped)
}

// Безопасный GET истории для одного userId
async function safeFetchHistory(uid: string): Promise<ChatMessage[] | null> {
  try {
    const raw = await getHistory(uid)
    const mapped = mapHistory(raw)
    return mapped
  } catch (e: any) {
    const msg = String(e?.message ?? e ?? '')
    // Пропускаем ошибки формата пути/валидации (например, «The string did not match the expected pattern.»)
    if (/did not match the expected pattern/i.test(msg) ||
        /422/.test(msg) ||
        /validation/i.test(msg)) {
      console.warn(`Пропускаем неподходящий формат userId "${uid}":`, msg)
      return null
    }
    // Другие ошибки пробрасываем наверх — полезно показать пользователю
    throw e
  }
}

// Главная загрузка истории: пробуем несколько userId
async function loadHistoryMulti() {
  historyLoading.value = true
  historyError.value = null
  mergedFromSeveralIds.value = false

  const candidates: string[] = []

  // 1) если есть TG — кладём первым кандидатом
  if (telegramUserId.value) candidates.push(telegramUserId.value)

  // 2) если раньше юзался локальный ID — добавим
  const legacy = readLegacyUserId()
  if (legacy && !candidates.includes(legacy)) candidates.push(legacy)

  // 3) часто старые сообщения лежат под 'anon'
  if (!candidates.includes('anon')) candidates.push('anon')

  // 4) если вдруг в кэше есть ещё ключи chat:* — добавим их (без фанатизма)
  for (let i = 0; i < localStorage.length && candidates.length < 6; i++) {
    const k = localStorage.key(i) || ''
    if (k.startsWith('chat:')) {
      const uid = k.slice('chat:'.length)
      if (uid && !candidates.includes(uid)) candidates.push(uid)
    }
  }

  // 1) Мгновенно показываем кэш первого годного кандидата, чтобы не мигало
  for (const uid of candidates) {
    const cached = readCache(uid)
    if (cached?.length) {
      messages.value = sortByCreatedAt(cached)
      activeUserId.value = uid
      await nextTick(); scrollToBottom(false)
      break
    }
  }

  // 2) Тянем с бэка все кандидаты и объединяем
  try {
    const fetchedParts: { uid: string; list: ChatMessage[] }[] = []
    for (const uid of candidates) {
      const list = await safeFetchHistory(uid)
      if (list && list.length) {
        fetchedParts.push({ uid, list })
      }
    }

    if (fetchedParts.length === 0) {
      // ничего не нашли — остаёмся на первом кандидате (или anon)
      messages.value = messages.value.length ? sortByCreatedAt(messages.value) : []
      return
    }

    // Слияние найденных историй
    let merged: ChatMessage[] = []
    for (const part of fetchedParts) merged = merged.concat(part.list)
    merged = uniqMessages(merged)
    merged = sortByCreatedAt(merged)
    messages.value = merged

    // Выбираем активный userId:
    //  - если TG есть и внутри для него тоже была история — используем его
    //  - иначе — берём тот uid, у которого было больше всего сообщений
    const tgPart = telegramUserId.value
      ? fetchedParts.find(p => p.uid === telegramUserId.value)
      : undefined

    if (tgPart) {
      activeUserId.value = tgPart.uid
    } else {
      fetchedParts.sort((a, b) => b.list.length - a.list.length)
      activeUserId.value = fetchedParts[0].uid
    }

    // Сохраним кэш под активным uid
    saveCache(activeUserId.value, merged)

    // Если историй >1 — пометим, что склеили
    const uniqueUidsUsed = new Set(fetchedParts.map(p => p.uid))
    mergedFromSeveralIds.value = uniqueUidsUsed.size > 1

  } catch (e: any) {
    console.warn('Не удалось получить историю:', e?.message ?? e)
    historyError.value = e?.message ?? 'Ошибка загрузки истории'
  } finally {
    historyLoading.value = false
    await nextTick(); scrollToBottom(false)
  }
}

onMounted(async () => {
  // Данные из Telegram WebApp
  const tgUser = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user
  if (tgUser) {
    userAvatar.value = tgUser.photo_url ?? null
    userName.value = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || 'Вы'
    if (tgUser.id) telegramUserId.value = String(tgUser.id)
  }

  await loadHistoryMulti()
})

function scrollToBottom(smooth = true) {
  const el = scrollWrapRef.value
  if (!el) return
  el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
}

function extractText(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return
  const obj = payload as Record<string, unknown>
  const cand = obj['message'] ?? obj['content'] ?? obj['text']
  return typeof cand === 'string' ? cand : undefined
}

async function handleSend() {
  const text = userInput.value.trim()
  if (!text || loading.value) return

  const userMsg: ChatMessage = {
    id: crypto.randomUUID(),
    role: 'user',
    content: text,
    name: userName.value,
    avatar: userAvatar.value ?? undefined,
    created_at: new Date().toISOString()
  }
  messages.value = [...messages.value, userMsg]
  saveCache(activeUserId.value, messages.value)
  await nextTick(); scrollToBottom(false)

  const draftId = crypto.randomUUID()
  messages.value = [...messages.value, {
    id: draftId,
    role: 'assistant',
    content: '…',
    pending: true,
    avatar: assistantAvatar.value ?? undefined,
    created_at: new Date().toISOString()
  }]
  await nextTick(); scrollToBottom(false)

  try {
    // ВАЖНО: теперь всегда используем активный userId,
    // который мы определили при загрузке истории
    await send(activeUserId.value, text)
  } finally {
    if (!error.value) userInput.value = ''
  }
}

function fillAssistantDraft(draftId: string, text: string) {
  const idx = messages.value.findIndex(m => m.id === draftId)
  if (idx !== -1) {
    messages.value[idx] = { ...messages.value[idx], content: text, pending: false }
  } else {
    messages.value.push({ id: draftId, role: 'assistant', content: text })
  }
  saveCache(activeUserId.value, messages.value)
}

watch(
  () => (lastResponse.value as unknown),
  async (val) => {
    const text = extractText(val)
    if (!text) return
    const draft = [...messages.value].reverse().find(m => m.role === 'assistant' && m.pending)
    if (draft) {
      fillAssistantDraft(draft.id, text)
    } else {
      messages.value.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: text,
        avatar: assistantAvatar.value ?? undefined,
        created_at: new Date().toISOString()
      })
      saveCache(activeUserId.value, messages.value)
    }
    await nextTick(); scrollToBottom()
  },
  { deep: false }
)
</script>

<template>
  <div class="fixed inset-0 bg-transparent">
    <Banner />

    <div class="mx-auto max-w-3xl h-full flex flex-col">
      <!-- резерв под баннер -->
      <div
        ref="scrollWrapRef"
        class="scroll-wrap flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-smooth bg-transparent pb-20 pt-12"
      >
        <!-- 1) пока история грузится -->
        <template v-if="historyLoading">
          <div class="text-center text-gray-400 py-10 animate-pulse">Загружаем историю…</div>
        </template>

        <!-- 2) история загрузилась и есть сообщения -->
        <template v-else-if="messages.length">
          <ChatBubble
            v-for="m in messages"
            :key="m.id"
            :message="m"
            :user-avatar="userAvatar"
            :user-name="userName"
            :assistant-avatar="assistantAvatar"
          />
          <div
            v-if="mergedFromSeveralIds"
            class="text-center text-[11px] text-gray-400 mt-2"
            >
            История объединена из нескольких ваших идентификаторов.
          </div>
        </template>

        <!-- 3) история загрузилась, но пусто -->
        <template v-else>
          <div class="text-center text-gray-400 py-10">
            <div>Начните диалог…</div>
            <div v-if="historyError" class="text-xs text-red-500 mt-2">({{ historyError }})</div>
          </div>
        </template>
      </div>

      <footer class="fixed bottom-0 left-0 right-0 bg-transparent">
        <div class="mx-auto max-w-3xl px-4 pb-3 pt-2">
          <div class="relative flex items-center">
            <input
              v-model="userInput"
              type="text"
              placeholder="Спросите что-нибудь..."
              @keydown.enter.prevent="handleSend"
              class="w-full px-4 py-2 pr-12 rounded-full border border-gray-300 bg-white/90
                     focus:outline-none focus:ring-2 focus:ring-blue-400
                     focus:border-blue-400 shadow-sm placeholder-gray-400
                     transition duration-200"
            />
            <button
              type="button"
              @click="handleSend"
              :disabled="loading || !userInput.trim()"
              class="absolute right-2 z-10 flex items-center justify-center
                     w-9 h-9 rounded-full text-white transition
                     disabled:opacity-50 disabled:cursor-not-allowed
                     bg-blue-500 hover:bg-blue-600 active:scale-95
                     cursor-pointer"
              aria-label="Отправить"
            >
              <span v-if="!loading">✈️</span>
              <svg v-else class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" stroke-width="4" opacity="0.25" />
                <path d="M22 12a10 10 0 0 1-10 10" stroke-width="4" />
              </svg>
            </button>
          </div>

          <p v-if="error" class="text-sm text-red-600 mt-2">Ошибка: {{ error }}</p>
        </div>
      </footer>
    </div>
  </div>
</template>

<!-- ВАЖНО: без scoped, чтобы правила попали в html/body -->
<style>
:root, body, html { overscroll-behavior: none; background: transparent; }
html, body { height: 100%; margin: 0; padding: 0; overflow: hidden; }

.scroll-wrap::-webkit-scrollbar { width: 6px; }
.scroll-wrap::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 8px; }
.scroll-wrap::-webkit-scrollbar-track { background: transparent; }
</style>
