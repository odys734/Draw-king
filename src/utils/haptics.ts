import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

let hapticsEnabled = true;

export const setHapticsEnabled = (enabled: boolean) => {
  hapticsEnabled = enabled;
};

export const triggerHapticImpact = async (style: 'light' | 'medium' | 'heavy' = 'light') => {
  if (!hapticsEnabled) return;
  try {
    const capacitorStyle =
      style === 'heavy'
        ? ImpactStyle.Heavy
        : style === 'medium'
        ? ImpactStyle.Medium
        : ImpactStyle.Light;
    await Haptics.impact({ style: capacitorStyle });
  } catch {
    // Web fallback for browser preview
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      const duration = style === 'heavy' ? 40 : style === 'medium' ? 25 : 12;
      navigator.vibrate(duration);
    }
  }
};

export const triggerHapticNotification = async (type: 'success' | 'warning' | 'error') => {
  if (!hapticsEnabled) return;
  try {
    const notificationType =
      type === 'success'
        ? NotificationType.Success
        : type === 'error'
        ? NotificationType.Error
        : NotificationType.Warning;
    await Haptics.notification({ type: notificationType });
  } catch {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      if (type === 'success') {
        navigator.vibrate([30, 40, 50, 40, 80]);
      } else if (type === 'error') {
        navigator.vibrate([70, 40, 70]);
      } else {
        navigator.vibrate(35);
      }
    }
  }
};

export const triggerSelectionHaptic = async () => {
  if (!hapticsEnabled) return;
  try {
    await Haptics.selectionStart();
  } catch {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      navigator.vibrate(8);
    }
  }
};
