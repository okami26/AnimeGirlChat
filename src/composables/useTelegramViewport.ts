// Мини-хелпер: включает expand только на iOS/Android и прокидывает стабильную высоту
import WebApp from '@twa-dev/sdk';

export function useTelegramViewport() {
  const platform = WebApp.platform || ''; // '', 'ios', 'android', 'tdesktop', 'web', 'macos', 'windows'
  const isMobile = () => platform === 'ios' || platform === 'android';

  const setup = () => {
    // Обязательная инициализация
    WebApp.ready();

    if (isMobile()) {
      // Только на мобилке — разворачиваем
      WebApp.expand();

      // Ставим переменную с высотой; используем стабильную, чтобы не прыгало
      const setH = () => {
        const h = WebApp.viewportStableHeight || WebApp.viewportHeight;
        document.documentElement.style.setProperty('--twa-h', `${h}px`);
      };
      setH();
      WebApp.onEvent?.('viewportChanged', setH);
    } else {
      // На десктопе — просто ограничим ширину контейнера в App.vue
      document.documentElement.style.removeProperty('--twa-h');
    }
  };

  return { WebApp, platform, isMobile, setup };
}
