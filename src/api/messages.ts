export interface MessageRequest {
  message: string;
  user_status: "free" | "premium";
}

export interface MessageResponse {
  message: string;       // ответ ИИ
  audio_base64: string;  // аудио в base64
}

export async function sendMessage(
  id: string,
  payload: MessageRequest
): Promise<MessageResponse> {
  const base = "https://57d601e3c66c.ngrok-free.app"; // если есть общий BASE
  const res = await fetch(`${base}/api/messages/50712?message=&user_status=premium`, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error(`Ошибка запроса: ${res.status}`);
  }

  return res.json() as Promise<MessageResponse>;
}
