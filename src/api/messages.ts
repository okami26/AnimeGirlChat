// src/api/messages.ts
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
  audio_base64?: string;
  audio_mime?: string;
}

// ========= БАЗА =========
const BASE = import.meta.env.VITE_API_BASE || '';
const BASE_CLEAN = BASE ? BASE.replace(/\/$/, '') : '';
const COMMON_HEADERS = {
  'ngrok-skip-browser-warning': '1',
  Accept: 'application/json',
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
  const timer = setTimeout(() => controller.abort('timeout'), 120_000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: COMMON_HEADERS,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Ошибка запроса: ${res.status} ${res.statusText}`);
    return (await readJsonStrict(res)) as MessageResponse;
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      throw new Error('Превышен таймаут ожидания ответа (TTS долго генерится).');
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
  const params = new URLSearchParams({ 'ngrok-skip-browser-warning': '1' });
  if (opts?.initData) params.set('init_data', opts.initData);

  const url = `${BASE_CLEAN}/api/messages/${encodeURIComponent(userId)}?${params.toString()}`;
  const res = await fetch(url, { method: 'GET', headers: COMMON_HEADERS });

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

  // нормализация (главная правка — НЕТ раннего return)
  const normalized: HistoryItem[] = (arr as any[])
    .map((item) => {
      if (Array.isArray(item)) {
        const [text, roleLike, audioMaybe] = item as [unknown, unknown, unknown];

        const out: HistoryItem = {
          id: crypto.randomUUID(),
          role: mapRole(String(roleLike ?? 'assistant')),
          content: String(text ?? ''),
        };

        // 3-й элемент: строка base64 или объект с полями
        if (typeof audioMaybe === 'string' && audioMaybe.trim()) {
          out.audio_base64 = audioMaybe;
          out.audio_mime = 'audio/wav';
        } else if (audioMaybe && typeof audioMaybe === 'object') {
          const a = audioMaybe as any;
          const base64 = a.audio_base64 ?? a.audio ?? '';
          if (base64) out.audio_base64 = String(base64);
          if (a.audio_mime) out.audio_mime = String(a.audio_mime);
          else if (base64) out.audio_mime = 'audio/wav';
        }

        return out;
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
          audio_base64: obj.audio_base64 ?? obj.audio ?? undefined,
          audio_mime: obj.audio_mime ?? undefined,
        };
      }

      return null as any;
    })
    .filter(Boolean);

  return normalized;
}
