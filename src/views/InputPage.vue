<script setup lang="ts">
import { ref } from "vue";
import { useSendMessage } from "@/composables/useSendMessage";

const userInput = ref<string>("");
const { send, loading, error, lastResponse } = useSendMessage();

async function handleSend() {
  if (!userInput.value.trim()) return;
  await send(userInput.value, "premium");
}
</script>

<template>
  <div style="padding: 20px">
    <h2>Введите данные</h2>

    <input
      v-model="userInput"
      type="text"
      placeholder="Введите что-нибудь"
      style="background: rgba(255,255,255,.85); border: 1px solid #ddd; border-radius: 8px; padding: 8px;"
    />

    <p style="margin-top: 10px">
      Вы ввели: <b>{{ userInput }}</b>
    </p>

    <button
      @click="handleSend"
      :disabled="loading || !userInput"
      style="margin-top: 10px; padding: 8px 16px; border-radius: 6px; border: none; background: #4caf50; color: white; cursor: pointer; opacity: var(--op);"
      :style="{ '--op': (loading || !userInput) ? 0.6 : 1 }"
    >
      {{ loading ? "Отправка..." : "Отправить" }}
    </button>

    <p v-if="error" style="color: #d32f2f; margin-top: 8px">
      Ошибка: {{ error }}
    </p>
    <p v-if="lastResponse" style="margin-top: 8px">
      Ответ ИИ: <b>{{ lastResponse.message }}</b>
    </p>
  </div>
</template>
