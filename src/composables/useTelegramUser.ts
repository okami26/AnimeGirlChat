// src/composables/useTelegram.ts
import WebApp from '@twa-dev/sdk';

export function useTelegram() {
  // дерните это в onMounted компонента
  const init = () => {
    WebApp.ready();
    WebApp.expand();
  };

  const getUserId = () => WebApp.initDataUnsafe?.user?.id ?? null;

  // строка initData (нужна бэку для проверки подписи)
  const getInitData = () => WebApp.initData;

  const isInTelegram = () => typeof WebApp !== 'undefined' && !!WebApp.platform;

  return { init, getUserId, getInitData, isInTelegram, WebApp };
}
