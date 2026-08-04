import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

export interface AndroidAppHooks {
  onHardwareBack?: () => boolean; // return true if handled, false to exit app
}

export const initCapacitorAndroid = async (hooks: AndroidAppHooks = {}) => {
  // 1. Fullscreen Immersive Mode & Dark Status Bar Setup
  try {
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#171717' });
  } catch {
    // Falls back gracefully on web browser
  }

  // 2. Hardware Back Button handling for native Android
  try {
    App.addListener('backButton', () => {
      if (hooks.onHardwareBack) {
        const isHandled = hooks.onHardwareBack();
        if (!isHandled) {
          App.exitApp();
        }
      } else {
        App.exitApp();
      }
    });
  } catch {
    // Falls back gracefully on web browser
  }
};
