import { ref } from "vue";
import { sendMessage, type MessageResponse } from "@/api";
import { playBase64Wav } from "@/utils/audio";

export function useSendMessage() {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastResponse = ref<MessageResponse | null>(null);

  async function send(text: string, userStatus: "free" | "premium" = "premium") {
    loading.value = true;
    error.value = null;
    try {
      const res = await sendMessage("56789", {
        message: text,
        user_status: userStatus,
      });
      lastResponse.value = res;

      if (res.audio_base64) {
        playBase64Wav(res.audio_base64);
      }

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
