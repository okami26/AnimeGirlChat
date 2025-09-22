export const BASE = (import.meta.env.VITE_API_BASE || 'https://c5b52c12450c.ngrok-free.app').replace(/\/$/,'')
const COMMON_HEADERS = { 'ngrok-skip-browser-warning': '1', Accept: 'application/json' } as const

async function readJsonStrict(res: Response) {
  const ct = res.headers.get('content-type') || ''
  const body = await res.text()
  if (!ct.includes('application/json')) throw new Error(`Ожидали JSON, но пришло ${ct || 'unknown'}: ${body.slice(0,160)}`)
  return JSON.parse(body)
}

/**
 * Жёсткий таймаут через Promise.race.
 * Не «прерывает» исходную операцию, но для UI этого достаточно.
 */
export async function withTimeout<T>(p: Promise<T>, ms = 120_000, msg = 'Превышен таймаут ожидания ответа') {
  let timer: any
  try {
    const timeoutP = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(msg)), ms)
    })
    return await Promise.race([p, timeoutP])
  } finally {
    clearTimeout(timer)
  }
}

/**
 * GET JSON с реальным таймаутом.
 */
export async function getJson(url: string, opts: RequestInit = {}, timeoutMs = 120_000) {
  const fetchPromise = fetch(url, {
    ...opts,
    headers: { ...COMMON_HEADERS, ...(opts.headers||{}) },
  })
  const res = await withTimeout(fetchPromise, timeoutMs, 'Превышен таймаут ожидания ответа')
  if (!res.ok && res.status !== 204) throw new Error(`Ошибка запроса: ${res.status} ${res.statusText}`)
  if (res.status === 204) return null
  return readJsonStrict(res)
}
