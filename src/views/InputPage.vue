<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import { useSendMessage } from '@/composables/useSendMessage'
import Banner from '@/views/Banner.vue'
import ChatBubble from '@/views/ChatBubble.vue'

const userInput = ref<string>('')

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  pending?: boolean
  avatar?: string
  name?: string
}

const messages = ref<ChatMessage[]>([])
const { send, loading, error, lastResponse } = useSendMessage()
const scrollWrapRef = ref<HTMLElement | null>(null)

/** аватарки/имя */
const userAvatar = ref<string | null>(null)
const userName = ref<string>('Вы')
const assistantAvatar = ref<string | null>('/ai.png') // ← поставь свой URL

onMounted(() => {
  // аватар/имя из Telegram WebApp
  const tgUser = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user
  if (tgUser) {
    userAvatar.value = tgUser.photo_url ?? null
    userName.value = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || 'Вы'
  }
  scrollToBottom(false)
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

  const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text, name: userName.value }
  messages.value.push(userMsg)
  await nextTick(); scrollToBottom(false)

  const draftId = crypto.randomUUID()
  messages.value.push({ id: draftId, role: 'assistant', content: '…', pending: true })
  await nextTick(); scrollToBottom(false)

  const clientId = draftId
  try {
    await send(JSON.stringify({ clientId, text }))
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
      messages.value.push({ id: crypto.randomUUID(), role: 'assistant', content: text })
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
        <template v-if="messages.length">
          <ChatBubble
            v-for="m in messages"
            :key="m.id"
            :message="m"
            :user-avatar="userAvatar"
            :user-name="userName"
            :assistant-avatar="assistantAvatar"
          />
        </template>
        <template v-else>
          <div class="text-center text-gray-400 py-10">Начните диалог…</div>
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
