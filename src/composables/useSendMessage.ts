import { ref } from "vue";
import { sendMessage, type MessageResponse } from "@/api/messages";
//import { playBase64Wav, playBase64Audio } from "@/utils/audio";

export function useSendMessage() {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastResponse = ref<MessageResponse | null>(null);

  async function send(
    userId: string,
    text: string,
    extra?: { initData?: string }
  ) {
    loading.value = true;
    error.value = null;
    try {
      const res = await sendMessage(userId, text, { initData: extra?.initData });
      lastResponse.value = res;

      // if (res.audio_base64) {
        // try { playBase64Wav(res.audio_base64) }
        // catch { playBase64Audio(res.audio_base64, 'audio/mpeg') }
      // }

      return res;
    } catch (e: any) {
      error.value = e?.message ?? "Неизвестная ошибка";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return { send, loading, error, lastResponse };
}
