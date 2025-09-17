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
const activeUserId = ref<string>('') // темп до инициализации
const telegramUserId = ref<string | null>(null) // если есть TG, положим сюда

// ---------- helpers: cache ----------

function cacheKey(uid: string) {
  return `chat:${uid}`
}

function migrateAnonCacheToTG() {
  if (!telegramUserId.value) return
  const anon = readCache('anon')
  if (!anon?.length) return
  const tg = readCache(telegramUserId.value) || []
  const merged = uniqMessages(sortByCreatedAt([...tg, ...anon]))
  saveCache(telegramUserId.value, merged)
  try {
    localStorage.removeItem(cacheKey('anon'))
  } catch {}
}

function saveCache(uid: string, list: ChatMessage[]) {
  try {
    localStorage.setItem(cacheKey(uid), JSON.stringify(list))
  } catch {}
}

function readCache(uid: string): ChatMessage[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(uid))
    if (!raw) return null
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? (arr as ChatMessage[]) : null
  } catch {
    return null
  }
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
  const hasDates = list.some(
    (m) => m.created_at && !Number.isNaN(Date.parse(m.created_at))
  )
  if (!hasDates) return [...list] // сохранить порядок как пришёл с бэка
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
    // ключ без id
    const key = `${m.role}|${m.content}|${m.created_at ?? ''}`
    if (!seen.has(key)) {
      seen.add(key)
      out.push(m)
    }
  }
  return out
}
function mapRole(roleLike: string): ChatMessage['role'] {
  if (roleLike === 'human') return 'user'
  if (roleLike === 'ai') return 'assistant'
  if (roleLike === 'user' || roleLike === 'assistant' || roleLike === 'system')
    return roleLike
  return 'assistant'
}

// нормализуем серверные сообщения под формат UI
function mapHistory(items: any[]): ChatMessage[] {
  const mapped = items
    .map((m: any) => {
      // формат: [text, role]
      if (Array.isArray(m)) {
        const [text, roleLike] = m as [unknown, unknown]
        return {
          id: crypto.randomUUID(),
          role: mapRole(String(roleLike ?? 'assistant')),
          content: String(text ?? ''),
          // у кортежей обычно нет даты — оставляем undefined
        } as ChatMessage
      }

      // формат: объект { id?, role?, content?, created_at? ... }
      if (m && typeof m === 'object') {
        return {
          id: m.id ?? crypto.randomUUID(),
          role: mapRole(String(m.role ?? 'assistant')),
          content: String(m.content ?? ''),
          created_at: m.created_at,
          name: m.name,
          avatar: m.avatar,
        } as ChatMessage
      }

      // безопасно пропускаем неожиданные элементы
      return null as any
    })
    .filter(Boolean)

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
    if (
      /did not match the expected pattern/i.test(msg) ||
      /422/.test(msg) ||
      /validation/i.test(msg)
    ) {
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

  const uid = activeUserId.value
  if (!uid) {
    historyLoading.value = false
    return
  }

  // 1) моментально показываем локальный кэш под активным uid
  const cached = readCache(uid)
  if (cached?.length) {
    messages.value = sortByCreatedAt(cached)
    await nextTick()
    scrollToBottom(false)
  }

  // 2) тянем историю ТОЛЬКО для активного uid
  try {
    const list = await safeFetchHistory(uid)
    messages.value = list ? sortByCreatedAt(list) : messages.value || []
    saveCache(uid, messages.value)
  } catch (e: any) {
    console.warn('Не удалось получить историю:', e?.message ?? e)
    historyError.value = e?.message ?? 'Ошибка загрузки истории'
  } finally {
    historyLoading.value = false
    await nextTick()
    scrollToBottom(false)
  }
}

onMounted(async () => {
  // Данные из Telegram WebApp
  const tgUser = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user

  if (tgUser?.id) {
    telegramUserId.value = String(tgUser.id)
    userAvatar.value = tgUser.photo_url ?? null
    userName.value =
      [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || 'Вы'

    activeUserId.value = telegramUserId.value // ВСЕГДА под TG
    migrateAnonCacheToTG() // переносим локальный anon->TG
  } else {
    // нет Telegram: стабильный гостевой id вместо anon
    const key = 'guestId'
    const prev = localStorage.getItem(key)
    const guest = prev || `guest:${crypto.randomUUID()}`
    localStorage.setItem(key, guest)
    activeUserId.value = guest
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

  const uidToSend = telegramUserId.value || activeUserId.value
  if (!uidToSend) return

  const userMsg: ChatMessage = {
    id: crypto.randomUUID(),
    role: 'user',
    content: text,
    name: userName.value,
    avatar: userAvatar.value ?? undefined,
    created_at: new Date().toISOString(),
  }
  messages.value = [...messages.value, userMsg]
  saveCache(uidToSend, messages.value)
  await nextTick()
  scrollToBottom(false)

  const draftId = crypto.randomUUID()
  messages.value = [
    ...messages.value,
    {
      id: draftId,
      role: 'assistant',
      content: '…',
      pending: true,
      avatar: assistantAvatar.value ?? undefined,
      created_at: new Date().toISOString(),
    },
  ]
  saveCache(uidToSend, messages.value)
  await nextTick()
  scrollToBottom(false)

  try {
    await send(uidToSend, text)
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
  const uidToSave = telegramUserId.value || activeUserId.value
  if (uidToSave) saveCache(uidToSave, messages.value)
}

watch(
  () => lastResponse.value as unknown,
  async (val) => {
    const text = extractText(val)
    if (!text) return
    const draft = [...messages.value]
      .reverse()
      .find((m) => m.role === 'assistant' && m.pending)
    if (draft) {
      fillAssistantDraft(draft.id, text)
    } else {
      messages.value.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: text,
        avatar: assistantAvatar.value ?? undefined,
        created_at: new Date().toISOString(),
      })
      // saveCache(activeUserId.value, messages.value)
      telegramUserId.value || activeUserId.value
    }
    await nextTick()
    scrollToBottom()
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
          <div class="text-center text-gray-400 py-10 animate-pulse">
            Загружаем историю…
          </div>
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
        </template>

        <!-- 3) история загрузилась, но пусто -->
        <template v-else>
          <div class="text-center text-gray-400 py-10">
            <div>Начните диалог…</div>
            <div v-if="historyError" class="text-xs text-red-500 mt-2">
              ({{ historyError }})
            </div>
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
              class="w-full px-4 py-2 pr-12 rounded-full border border-gray-300 bg-white/90 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm placeholder-gray-400 transition duration-200"
            />
            <button
              type="button"
              @click="handleSend"
              :disabled="loading || !userInput.trim()"
              class="absolute right-2 z-10 flex items-center justify-center w-9 h-9 rounded-full text-white transition disabled:opacity-50 disabled:cursor-not-allowed bg-blue-500 hover:bg-blue-600 active:scale-95 cursor-pointer"
              aria-label="Отправить"
            >
              <span v-if="!loading">✈️</span>
              <svg
                v-else
                class="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke-width="4"
                  opacity="0.25"
                />
                <path d="M22 12a10 10 0 0 1-10 10" stroke-width="4" />
              </svg>
            </button>
          </div>

          <p v-if="error" class="text-sm text-red-600 mt-2">
            Ошибка: {{ error }}
          </p>
        </div>
      </footer>
    </div>
  </div>
</template>

<!-- ВАЖНО: без scoped, чтобы правила попали в html/body -->
<style>
:root,
body,
html {
  overscroll-behavior: none;
  background: transparent;
}
html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.scroll-wrap::-webkit-scrollbar {
  width: 6px;
}
.scroll-wrap::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
}
.scroll-wrap::-webkit-scrollbar-track {
  background: transparent;
}
</style>
