export interface MessageResponse {
  message: string;       // ответ ИИ
  audio_base64: string;  // аудио в base64
}

// Формат одного сообщения из истории
export interface HistoryItem {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
  name?: string;
  avatar?: string;
}

// ========= БАЗА =========
const BASE = "https://c5b52c12450c.ngrok-free.app";
const BASE_CLEAN = BASE.replace(/\/$/, "");

const COMMON_HEADERS = {
  'ngrok-skip-browser-warning': '1',
  'Accept': 'application/json',
} as const;

async function readJsonStrict(res: Response) {
  const ct = res.headers.get('content-type') || '';
  const body = await res.text();
  if (!ct.includes('application/json')) {
    // Бросаем осмысленную ошибку — увидишь её в historyError
    throw new Error(`Ожидали JSON, но пришло ${ct || 'unknown'}: ${body.slice(0, 160)}`);
  }
  return JSON.parse(body);
}

// ========= ОТПРАВКА СООБЩЕНИЯ =========
/** POST: отправить сообщение */
export async function sendMessage(userId: string, message: string) {
  const params = new URLSearchParams({
    message,
    'ngrok-skip-browser-warning': '1', // важный флаг для ngrok
  });
  const url = `${BASE_CLEAN}/api/messages/${encodeURIComponent(userId)}?${params}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("timeout"), 120_000);

  try {
    const res = await fetch(url, { method: "POST", headers: COMMON_HEADERS, signal: controller.signal });
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

/** GET: получить историю сообщений для userId */
export async function getHistory(userId: string): Promise<HistoryItem[]> {
  const url = `${BASE_CLEAN}/api/messages/${encodeURIComponent(userId)}?ngrok-skip-browser-warning=1`;
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

  // НОРМАЛИЗАЦИЯ: кортежи [text, role] -> HistoryItem
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

// ========= УТИЛИТА АУДИО =========
/** Утилита: конвертация base64-аудио в blob-URL */
export function audioBase64ToUrl(b64: string, mime: string = "audio/mpeg"): string {
  const pure = b64.includes(",") ? b64.split(",").pop()! : b64;
  const bin = atob(pure);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  const blob = new Blob([bytes], { type: mime });
  return URL.createObjectURL(blob);
}
