// src/composables/useTelegram.ts
import WebApp from '@twa-dev/sdk';

export function useTelegram() {
  // дерните это в onMounted компонента
  const init = () => {
    WebApp.ready();
    WebApp.expand();
  };

  const getUserId = () => WebApp.initDataUnsafe?.user?.id ?? null;

  const getUserName = () => {
    const u = WebApp.initDataUnsafe?.user;
    return [u?.first_name, u?.last_name].filter(Boolean).join(' ') || 'Вы';
  };

  const getUserAvatar = () => WebApp.initDataUnsafe?.user?.photo_url ?? null;

  // строка initData (нужна бэку для проверки подписи)
  const getInitData = () => WebApp.initData;

  const isInTelegram = () => typeof WebApp !== 'undefined' && !!WebApp.platform;

  return { init, getUserId, getUserName, getUserAvatar, getInitData, isInTelegram, WebApp };
}
