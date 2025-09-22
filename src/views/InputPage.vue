<script setup lang="ts">
import { ref, nextTick, onMounted, watch } from 'vue'
import { useSendMessage } from '@/composables/useSendMessage'
import Banner from '@/views/Banner.vue'
import ChatBubble from '@/views/ChatBubble.vue'
import { getHistory } from '@/api/messages'
import type { ChatMessage } from '@/utils/types'
import { mapHistory, sortByCreatedAt } from '@/utils/history'
import { saveCache, readCache, migrateAnonCacheTo } from '@/utils/cache'
import { useTelegram } from '@/composables/useTelegram'
import { useTelegramUser } from '@/composables/useTelegramUser'

const tgUser = useTelegramUser()              // НЕ деструктурируем, чтобы иметь .value
const { init } = useTelegram()

const userInput = ref<string>('')

const messages = ref<ChatMessage[]>([])
const historyLoading = ref(true)
const historyError = ref<string | null>(null)

const { send, loading, error } = useSendMessage()
const scrollWrapRef = ref<HTMLElement | null>(null)

const assistantAvatar = ref<string | null>('/ai.png')
const activeUserId = ref<string>('')

function scrollToBottom(smooth = true) {
  const el = scrollWrapRef.value
  if (!el) return
  el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
}

async function safeFetchHistory(uid: string): Promise<ChatMessage[] | null> {
  try {
    const raw = await getHistory(uid, { initData: tgUser.initData.value }) // <-- подпись
    return mapHistory(raw as any[])
  } catch (e: any) {
    const msg = String(e?.message ?? e ?? '')
    if (/did not match the expected pattern/i.test(msg) || /422/.test(msg) || /validation/i.test(msg)) {
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
  }

  try {
    const list = await safeFetchHistory(uid)
    messages.value = list ? sortByCreatedAt(list) : (messages.value || [])
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
  // 1) готовим Telegram WebApp
  init()

  // 2) ждём user до 1.5с, чтобы не свалиться в гостя при refresh
  await tgUser.waitForUser(1500, 50)

  // 3) выбираем активный userId
  if (tgUser.telegramUserId.value) {
    activeUserId.value = tgUser.telegramUserId.value
    migrateAnonCacheTo(activeUserId.value)
  } else {
    const key = 'guestId'
    const prev = localStorage.getItem(key)
    const guest = prev || `guest:${crypto.randomUUID()}`
    localStorage.setItem(key, guest)
    activeUserId.value = guest
  }

  // 4) загрузка истории
  await loadHistorySingle(activeUserId.value)
})

// если user появился позже — переключаемся и перезапрашиваем историю
watch(() => tgUser.telegramUserId.value, async (id) => {
  if (!id) return
  if (activeUserId.value === id) return
  activeUserId.value = id
  migrateAnonCacheTo(activeUserId.value)
  await loadHistorySingle(activeUserId.value)
})

function extractText(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return
  const obj = payload as Record<string, unknown>
  const cand = obj['message'] ?? obj['content'] ?? obj['text']
  return typeof cand === 'string' ? cand : undefined
}

function fillAssistantDraft(draftId: string, text: string) {
  const idx = messages.value.findIndex(m => m.id === draftId)
  if (idx !== -1) {
    messages.value[idx] = { ...messages.value[idx], content: text, pending: false }
  } else {
    messages.value.push({ id: draftId, role: 'assistant', content: text })
  }
  const uidToSave = tgUser.telegramUserId.value || activeUserId.value
  if (uidToSave) saveCache(uidToSave, messages.value)
}

async function handleSend() {
  const text = userInput.value.trim()
  if (!text || loading.value) return

  const uidToSend = tgUser.telegramUserId.value || activeUserId.value
  if (!uidToSend) return

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
    const res = await send(uidToSend, text, { initData: tgUser.initData.value })
    const textResp = extractText(res) || ''
    fillAssistantDraft(draftId, textResp || '✓')
  } catch (e:any) {
    const msg = e?.message ?? 'Неизвестная ошибка'
    fillAssistantDraft(draftId, `Ошибка: ${msg}`)
    throw e
  } finally {
    if (!error.value) userInput.value = ''
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-transparent">
    <Banner />

    <div class="mx-auto max-w-3xl h-full flex flex-col">
      <div
        ref="scrollWrapRef"
        class="scroll-wrap flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-smooth bg-transparent pb-20 pt-12"
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
              class="w-full px-4 py-2 pr-12 rounded-full border border-gray-300 bg-white/90 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 shadow-sm placeholder-gray-400 transition duration-200 break-words"
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
                <circle cx="12" cy="12" r="10" stroke-width="4" opacity="0.25" />
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
