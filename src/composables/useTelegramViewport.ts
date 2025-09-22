import WebApp from '@twa-dev/sdk';

export function useTelegramViewport() {
  const platform = WebApp.platform || ''; // '', 'ios', 'android', 'tdesktop', 'web', 'macos', 'windows'
  const isMobile = () => platform === 'ios' || platform === 'android';

  let handler: (() => void) | null = null;

  const setup = () => {
    WebApp.ready();

    if (isMobile()) {
      WebApp.expand();

      const setH = () => {
        const h = WebApp.viewportStableHeight || WebApp.viewportHeight;
        document.documentElement.style.setProperty('--twa-h', `${h}px`);
      };
      setH();
      handler = setH;
      WebApp.onEvent?.('viewportChanged', setH);
    } else {
      document.documentElement.style.removeProperty('--twa-h');
    }
  };

  const teardown = () => {
    if (handler) {
      WebApp.offEvent?.('viewportChanged', handler);
      handler = null;
    }
  };

  return { WebApp, platform, isMobile, setup, teardown };
}
