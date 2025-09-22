// src/composables/useTelegramUser.ts
import { ref } from 'vue'
import { useTelegram } from './useTelegram'

export function useTelegramUser() {
  const { WebApp } = useTelegram()

  const telegramUserId = ref<string | null>(null)
  const userAvatar = ref<string | null>(null)
  const userName = ref<string>('Вы')
  const initData = ref<string>('')

  function refreshOnce() {
    const u = WebApp?.initDataUnsafe?.user
    telegramUserId.value = u?.id ? String(u.id) : null
    userAvatar.value = u?.photo_url ?? null
    userName.value = [u?.first_name, u?.last_name].filter(Boolean).join(' ') || 'Вы'
    initData.value = WebApp?.initData || ''
  }

  /**
   * Ждём, пока Telegram проставит user (до timeout мс).
   * Если мы внутри Telegram, разумно ждать дольше.
   */
  async function waitForUser(timeout = 5000, interval = 50): Promise<boolean> {
    const start = Date.now()
    refreshOnce()
    if (telegramUserId.value) return true
    while (Date.now() - start < timeout) {
      await new Promise(r => setTimeout(r, interval))
      refreshOnce()
      if (telegramUserId.value) return true
    }
    return !!telegramUserId.value
  }

  return { telegramUserId, userAvatar, userName, initData, refreshOnce, waitForUser }
}
