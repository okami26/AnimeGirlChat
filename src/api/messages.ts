// src/api/messages.ts

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

const BASE = "https://5d42f4239538.ngrok-free.app";

/** POST: отправить сообщение */
export async function sendMessage(userId: string, message: string) {
  // ⚠️ если на бэке проверяется user_status, верни корректное значение
  const params = new URLSearchParams({ message });
  const url = `${BASE.replace(/\/$/, "")}/api/messages/${encodeURIComponent(userId)}?${params}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("timeout"), 120_000);

  try {
    const res = await fetch(url, { method: "POST", signal: controller.signal });
    if (!res.ok) throw new Error(`Ошибка запроса: ${res.status} ${res.statusText}`);
    return (await res.json()) as MessageResponse;
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new Error("Превышен таймаут ожидания ответа (TTS долго генерится).");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/** GET: получить историю сообщений для userId */
export async function getHistory(userId: string): Promise<HistoryItem[]> {
  const url = `${BASE.replace(/\/$/, "")}/api/messages/${encodeURIComponent(userId)}`;
  const res = await fetch(url, { method: "GET" });

  // Некоторые бэки возвращают 204 при пустой истории
  if (res.status === 204) return [];

  if (!res.ok) throw new Error(`Не удалось загрузить историю: ${res.status} ${res.statusText}`);

  const data = await res.json();

  // Нормализация возможных форматов
  let arr: unknown = data;
  if (data && typeof data === 'object') {
    if (Array.isArray((data as any).history)) arr = (data as any).history;
    else if (Array.isArray((data as any).items)) arr = (data as any).items;
  }
  if (!Array.isArray(arr)) return [];

  return arr as HistoryItem[];
}

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
