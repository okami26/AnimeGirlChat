import WebApp from '@twa-dev/sdk'

export interface UserRequest {
  id: number
  username: string
  status: 'free' | 'premium'
}

export interface MessageResponse {
  message: string
  audio_base64: string
}

export async function sendMessage(message: string): Promise<MessageResponse> {
  const base = 'https://d38c98ee6731.ngrok-free.app'

  const tgUser = WebApp.initDataUnsafe?.user
  if (!tgUser?.id) {
    throw new Error('Не удалось получить Telegram ID. Откройте приложение внутри Telegram.')
  }

  const body: UserRequest = {
    id: tgUser.id,
    username: tgUser.username ?? '',  // всегда строка
    status: 'free',                   // или своя логика
  }

  const res = await fetch(`${base}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    // полезно вывести тело ошибки от FastAPI с описанием 422
    const err = await res.text().catch(() => '')
    throw new Error(`Ошибка запроса: ${res.status} ${err}`)
  }

  return res.json() as Promise<MessageResponse>
}
