<!-- src/views/ChatPanel.vue -->
<script setup lang="ts">
import { ref, nextTick, onMounted, watch } from 'vue'
import { useSendMessage } from '@/composables/useSendMessage'
import ChatBubble from '@/views/ChatBubble.vue'
import { getHistory } from '@/api/messages'
import type { ChatMessage } from '@/utils/types'
import { mapHistory, sortByCreatedAt } from '@/utils/history'
import { saveCache, readCache, migrateAnonCacheTo } from '@/utils/cache'
import { useTelegram } from '@/composables/useTelegram'
import { useTelegramUser } from '@/composables/useTelegramUser'
import { ArrowUp } from 'lucide-vue-next'

const tgUser = useTelegramUser()
const { init, isInTelegram } = useTelegram()

const userInput = ref<string>('')

const messages = ref<ChatMessage[]>([])
const historyLoading = ref(true)
const historyError = ref<string | null>(null)

const { send, loading, error } = useSendMessage()
const scrollWrapRef = ref<HTMLElement | null>(null)

const assistantAvatar = ref<string | null>('/ai.png')
const activeUserId = ref<string>('')

const LAST_UID_KEY = 'lastUserId'

const pendingResponse = ref(false) // есть ли сейчас «ожидание ответа»
const elapsed = ref(0) // секунды с момента отправки
let timerId: number | null = null

function startTimer() {
  stopTimer()
  elapsed.value = 0
  timerId = window.setInterval(() => {
    elapsed.value += 1
  }, 1000)
}
function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId)
    timerId = null
  }
}

function fmt(t: number) {
  const m = Math.floor(t / 60)
    .toString()
    .padStart(2, '0')
  const s = (t % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function scrollToBottom(smooth = true) {
  const el = scrollWrapRef.value
  if (!el) return
  el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
}

async function safeFetchHistory(uid: string): Promise<ChatMessage[] | null> {
  try {
    const raw = await getHistory(uid, { initData: tgUser.initData.value })
    return mapHistory(raw as any[])
  } catch (e: any) {
    const msg = String(e?.message ?? e ?? '')
    if (
      /did not match the expected pattern/i.test(msg) ||
      /422/.test(msg) ||
      /validation/i.test(msg)
    ) {
      console.warn(`Пропускаем неподходящий формат userId "${uid}":`, msg)
      return null
    }
    throw e
  }
}

async function loadHistorySingle(uid: string) {
  historyLoading.value = true
  historyError.value = null

  const cached = readCache(uid)
  if (cached?.length) {
    messages.value = sortByCreatedAt(cached)
    await nextTick()
    scrollToBottom(false)
  } else {
    messages.value = []
  }

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

const DEMO = false

function seedDemoMessages() {
  messages.value = [
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'Привет! Это демо без бэкенда 🤖',
      created_at: new Date().toISOString(),
      avatar: assistantAvatar.value ?? undefined,
    },
    {
      id: crypto.randomUUID(),
      role: 'user',
      content: 'Ок, проверяю отправку сообщений.',
      created_at: new Date().toISOString(),
      name: tgUser.userName.value || 'Вы',
      avatar: tgUser.userAvatar.value ?? undefined,
    },
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'Привет! Это демо без бэкенда 🤖',
      created_at: new Date().toISOString(),
      avatar: assistantAvatar.value ?? undefined,
    },
    {
      id: crypto.randomUUID(),
      role: 'user',
      content: 'Ок, проверяю отправку сообщений.',
      created_at: new Date().toISOString(),
      name: tgUser.userName.value || 'Вы',
      avatar: tgUser.userAvatar.value ?? undefined,
    },
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'Привет! Это демо без бэкенда 🤖',
      created_at: new Date().toISOString(),
      avatar: assistantAvatar.value ?? undefined,
    },
    {
      id: crypto.randomUUID(),
      role: 'user',
      content: 'Ок, проверяю отправку сообщений.',
      created_at: new Date().toISOString(),
      name: tgUser.userName.value || 'Вы',
      avatar: tgUser.userAvatar.value ?? undefined,
    },
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'Привет! Это демо без бэкенда 🤖',
      created_at: new Date().toISOString(),
      avatar: assistantAvatar.value ?? undefined,
    },
    {
      id: crypto.randomUUID(),
      role: 'user',
      content: 'Ок, проверяю отправку сообщений.',
      created_at: new Date().toISOString(),
      name: tgUser.userName.value || 'Вы',
      avatar: tgUser.userAvatar.value ?? undefined,
    },
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'Привет! Это демо без бэкенда 🤖',
      created_at: new Date().toISOString(),
      avatar: assistantAvatar.value ?? undefined,
    },
    {
      id: crypto.randomUUID(),
      role: 'user',
      content: 'Ок, проверяю отправку сообщений.',
      created_at: new Date().toISOString(),
      name: tgUser.userName.value || 'Вы',
      avatar: tgUser.userAvatar.value ?? undefined,
    },
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'Привет! Это демо без бэкенда 🤖',
      created_at: new Date().toISOString(),
      avatar: assistantAvatar.value ?? undefined,
    },
    {
      id: crypto.randomUUID(),
      role: 'user',
      content: 'Ок, проверяю отправку сообщений.',
      created_at: new Date().toISOString(),
      name: tgUser.userName.value || 'Вы',
      avatar: tgUser.userAvatar.value ?? undefined,
    },
  ]
}

async function demoReply(draftId: string, userText: string) {
  // имитация «сети»
  await new Promise((r) => setTimeout(r, 600))
  const canned = /\?$/.test(userText)
    ? 'Хороший вопрос! Но это локальная заглушка 🙂'
    : 'Готово ✅ (демо-ответ)'
  fillAssistantDraft(draftId, canned)
}

onMounted(async () => {
  init()

  // ===== РАННИЙ ВЫХОД ДЛЯ ДЕМО =====
  if (DEMO) {
    activeUserId.value = 'guest:demo'
    localStorage.setItem(LAST_UID_KEY, activeUserId.value)
    historyLoading.value = true
    historyError.value = null

    seedDemoMessages()
    await nextTick()
    historyLoading.value = false
    scrollToBottom(false)
    return // важное: не идём в реальную загрузку истории
  }
  // ===== КОНЕЦ ДЕМО-БЛОКА =====

  // ... дальше твой реальный код как был
  const inTg = isInTelegram()
  await tgUser.waitForUser(inTg ? 5000 : 1500, 50)
  const tgId = tgUser.telegramUserId.value

  if (tgId) {
    activeUserId.value = tgId
    localStorage.setItem(LAST_UID_KEY, tgId)
    migrateAnonCacheTo(activeUserId.value)
    await loadHistorySingle(activeUserId.value)
  } else {
    if (inTg) {
      const prevUid = localStorage.getItem(LAST_UID_KEY)
      if (prevUid) {
        activeUserId.value = prevUid
        const cached = readCache(prevUid)
        messages.value = cached ? sortByCreatedAt(cached) : []
        await nextTick()
        scrollToBottom(false)
        setTimeout(async () => {
          const ok = await tgUser.waitForUser(5000, 50)
          if (
            ok &&
            tgUser.telegramUserId.value &&
            tgUser.telegramUserId.value !== activeUserId.value
          ) {
            activeUserId.value = tgUser.telegramUserId.value
            localStorage.setItem(LAST_UID_KEY, activeUserId.value)
            await loadHistorySingle(activeUserId.value)
          }
        }, 0)
      } else {
        const key = 'guestId'
        const prev = localStorage.getItem(key)
        const guest = prev || `guest:${crypto.randomUUID()}`
        localStorage.setItem(key, guest)
        activeUserId.value = guest
        await loadHistorySingle(activeUserId.value)
      }
    } else {
      const key = 'guestId'
      const prev = localStorage.getItem(key)
      const guest = prev || `guest:${crypto.randomUUID()}`
      localStorage.setItem(key, guest)
      activeUserId.value = guest
      await loadHistorySingle(activeUserId.value)
    }
  }
})

watch(
  () => tgUser.telegramUserId.value,
  async (id) => {
    if (!id) return
    if (activeUserId.value === id) return
    activeUserId.value = id
    localStorage.setItem(LAST_UID_KEY, id)
    migrateAnonCacheTo(activeUserId.value)
    await loadHistorySingle(activeUserId.value)
  }
)

function extractText(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return
  const obj = payload as Record<string, unknown>
  const cand = obj['message'] ?? obj['content'] ?? obj['text']
  return typeof cand === 'string' ? cand : undefined
}

// function fillAssistantDraft(draftId: string, text: string) {
//   const idx = messages.value.findIndex((m) => m.id === draftId)
//   if (idx !== -1) {
//     messages.value[idx] = {
//       ...messages.value[idx],
//       content: text,
//       pending: false,
//     }
//   } else {
//     messages.value.push({ id: draftId, role: 'assistant', content: text })
//   }
//   const uidToSave = tgUser.telegramUserId.value || activeUserId.value
//   if (uidToSave) saveCache(uidToSave, messages.value)
// }

function fillAssistantDraft(
  draftId: string,
  text: string,
  opts?: { audioBase64?: string; audioMime?: string }
) {
  const idx = messages.value.findIndex((m) => m.id === draftId)
  if (idx !== -1) {
    messages.value[idx] = {
      ...messages.value[idx],
      content: text,
      pending: false,
      // ↓ добавляем звуковые поля в сам месседж
      audio_base64: opts?.audioBase64,
      audio_mime: opts?.audioMime || 'audio/wav',
    } as any
  } else {
    messages.value.push({
      id: draftId,
      role: 'assistant',
      content: text,
      audio_base64: opts?.audioBase64,
      audio_mime: opts?.audioMime || 'audio/wav',
    } as any)
  }
  const uidToSave = tgUser.telegramUserId.value || activeUserId.value
  if (uidToSave) saveCache(uidToSave, messages.value)
}

async function handleSend() {
  const text = userInput.value.trim()
  // if (!text || loading.value) return
  if (!text || loading.value || pendingResponse.value) return

  const uidToSend =
    tgUser.telegramUserId.value || activeUserId.value || 'guest:demo'

  pendingResponse.value = true
  startTimer()

  const userMsg: ChatMessage = {
    id: crypto.randomUUID(),
    role: 'user',
    content: text,
    name: tgUser.userName.value,
    avatar: tgUser.userAvatar.value ?? undefined,
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
    if (DEMO) {
      await demoReply(draftId, text) // <-- демо-ответ
    } else {
      const res = await send(uidToSend, text, {
        initData: tgUser.initData.value,
      })
      const textResp = extractText(res) || ''
      const mime = 'audio/wav'
      fillAssistantDraft(draftId, textResp || '✓', {
        audioBase64: (res as any).audio_base64,
        audioMime: mime,
      })
    }
  } catch (e: any) {
    const msg = e?.message ?? 'Неизвестная ошибка'
    fillAssistantDraft(draftId, `Ошибка: ${msg}`)
    throw e
  } finally {
    stopTimer()
    pendingResponse.value = false
    if (!error.value) userInput.value = ''
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-transparent">
    <div class="mx-auto max-w-3xl h-[calc(100%-56px)] flex flex-col">
      <div
        ref="scrollWrapRef"
        class="scroll-wrap flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-smooth bg-transparent"
        :style="{ paddingBottom: 'calc(60px + var(--nav-h) + var(--safe-b))' }"
      >
        <template v-if="historyLoading">
          <div class="text-center text-gray-400 py-10 animate-pulse">
            Загружаем историю…
          </div>
        </template>

        <template v-else-if="messages.length">
          <ChatBubble
            v-for="m in messages"
            :key="m.id"
            :message="m"
            :user-avatar="tgUser.userAvatar.value"
            :user-name="tgUser.userName.value"
            :assistant-avatar="assistantAvatar"
          />
        </template>

        <template v-else>
          <div class="text-center text-gray-400 py-10">
            <div>История пуста. Напишите сообщение 👇</div>
            <div v-if="historyError" class="text-xs text-red-500 mt-2">
              ({{ historyError }})
            </div>
          </div>
        </template>
      </div>

      <!-- БЫЛО: bottom-0. СТАЛО: footer-above-nav (сидит над навигацией и safe-area) -->
      <footer class="fixed left-0 right-0 bg-transparent footer-above-nav z-40">
        <div class="mx-auto max-w-3xl px-4 pb-3 pt-2">
          <div class="relative flex items-center">
            <input
              v-model="userInput"
              :disabled="pendingResponse"
              type="text"
              placeholder="Спросите что-нибудь..."
              @keydown.enter.prevent="handleSend"
              class="w-full px-4 py-2 pr-12 rounded-full border border-gray-300 bg-white/90 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm placeholder-gray-400 transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              @click="handleSend"
              :disabled="loading || pendingResponse || !userInput.trim()"
              class="absolute right-2 z-10 flex items-center justify-center gap-1 min-w-[56px] h-9 px-2 rounded-full text-white transition disabled:opacity-50 disabled:cursor-not-allowed bg-blue-500 hover:bg-blue-600 active:scale-95"
              aria-label="Отправить"
            >
              <template v-if="pendingResponse">
                <svg
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
                <span class="tabular-nums text-sm">{{ fmt(elapsed) }}</span>
              </template>

              <!-- Иначе, если есть текст — показываем ArrowUp -->
              <template v-else-if="userInput.trim()">
                <ArrowUp class="w-4 h-4" />
              </template>

              <!-- Иначе (нет текста) — «О»/пусто, чтобы не прыгала кнопка -->
              <!-- <template v-else>
                <span class="opacity-70">О</span>
              </template>
              <span v-if="!loading">О</span> -->
              <!-- <svg
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
              </svg> -->
            </button>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<style>
html,
body {
  height: 100%;
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
