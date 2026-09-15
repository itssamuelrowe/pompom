import { audioManager } from './AudioManager'

/**
 * Fires tactile + audible feedback for a control press. Vibration is best-effort
 * (unsupported on most desktops and iOS Safari) and audio failures are swallowed
 * by the AudioManager, so this never throws.
 */
export function pressFeedback(kind: 'start' | 'stop' = 'start'): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(kind === 'start' ? 15 : [10, 20, 10])
    }
  } catch {
    /* vibration not available */
  }
  audioManager.click(kind)
}
