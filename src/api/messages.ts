export interface MessageResponse {
  message: string;       // ответ ИИ
  audio_base64: string;  // аудио в base64
}

export interface HistoryItem {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
  name?: string;
  avatar?: string;
}

// ========= БАЗА =========
const BASE = (import.meta.env.VITE_API_BASE || "https://c5b52c12450c.ngrok-free.app");
const BASE_CLEAN = BASE.replace(/\/$/, "");

const COMMON_HEADERS = {
  'ngrok-skip-browser-warning': '1',
  'Accept': 'application/json',
} as const;

async function readJsonStrict(res: Response) {
  const ct = res.headers.get('content-type') || '';
  const body = await res.text();
  if (!ct.includes('application/json')) {
    throw new Error(`Ожидали JSON, но пришло ${ct || 'unknown'}: ${body.slice(0, 160)}`);
  }
  return JSON.parse(body);
}

// ========= ОТПРАВКА СООБЩЕНИЯ =========
/** POST: отправить сообщение */
export async function sendMessage(
  userId: string,
  message: string,
  opts?: { initData?: string }
) {
  const params = new URLSearchParams({
    message,
    'ngrok-skip-browser-warning': '1',
  });
  if (opts?.initData) params.set('init_data', opts.initData);

  const url = `${BASE_CLEAN}/api/messages/${encodeURIComponent(userId)}?${params}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("timeout"), 120_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: COMMON_HEADERS,
      signal: controller.signal
    });
    if (!res.ok) throw new Error(`Ошибка запроса: ${res.status} ${res.statusText}`);
    return (await readJsonStrict(res)) as MessageResponse;
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new Error("Превышен таймаут ожидания ответа (TTS долго генерится).");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// ========= ИСТОРИЯ =========
function mapRole(roleLike: string): HistoryItem['role'] {
  if (roleLike === 'human') return 'user';
  if (roleLike === 'ai') return 'assistant';
  if (roleLike === 'user' || roleLike === 'assistant' || roleLike === 'system') return roleLike;
  return 'assistant';
}

/** GET: получить историю сообщений для userId (c опциональной подписью Telegram) */
export async function getHistory(
  userId: string,
  opts?: { initData?: string }
): Promise<HistoryItem[]> {
  const params = new URLSearchParams({ 'ngrok-skip-browser-warning': '1' })
  if (opts?.initData) params.set('init_data', opts.initData)

  const url = `${BASE_CLEAN}/api/messages/${encodeURIComponent(userId)}?${params.toString()}`
  const res = await fetch(url, { method: "GET", headers: COMMON_HEADERS });

  if (res.status === 204) return [];
  if (!res.ok) throw new Error(`Не удалось загрузить историю: ${res.status} ${res.statusText}`);

  const data = await readJsonStrict(res);

  // вытаскиваем массив
  let arr: unknown = data;
  if (data && typeof data === 'object') {
    if (Array.isArray((data as any).history)) arr = (data as any).history;
    else if (Array.isArray((data as any).items)) arr = (data as any).items;
  }
  if (!Array.isArray(arr)) return [];

  // нормализация
  const normalized: HistoryItem[] = (arr as any[]).map((item) => {
    if (Array.isArray(item)) {
      const [text, roleLike] = item as [string, string];
      return {
        id: crypto.randomUUID(),
        role: mapRole(String(roleLike || 'assistant')),
        content: String(text ?? ''),
      };
    }
    if (item && typeof item === 'object') {
      const obj = item as any;
      return {
        id: obj.id ?? crypto.randomUUID(),
        role: mapRole(String(obj.role ?? 'assistant')),
        content: String(obj.content ?? ''),
        created_at: obj.created_at,
        name: obj.name,
        avatar: obj.avatar,
      };
    }
    return null as any;
  }).filter(Boolean);

  return normalized;
}
