export {};

declare global {
  interface TelegramWebApp {
    requestFullscreen: () => void;
    // другие методы при необходимости
  }

  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}