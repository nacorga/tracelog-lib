import { EventListenerManager } from './listeners.types';
import { debugLog } from '../utils/logging';

export class TouchListenerManager implements EventListenerManager {
  private readonly onActivity: () => void;
  private readonly options = { passive: true };
  private readonly motionThreshold: number;

  constructor(onActivity: () => void, motionThreshold: number) {
    this.onActivity = onActivity;
    this.motionThreshold = motionThreshold;
  }

  setup(): void {
    try {
      window.addEventListener('touchstart', this.onActivity, this.options);
      window.addEventListener('touchmove', this.onActivity, this.options);
      window.addEventListener('touchend', this.onActivity, this.options);
      window.addEventListener('orientationchange', this.onActivity, this.options);

      const hasDeviceMotion = 'DeviceMotionEvent' in window;
      if (hasDeviceMotion) {
        window.addEventListener('devicemotion', this.handleDeviceMotion, this.options);
      }
    } catch (error) {
      debugLog.error('TouchListenerManager', 'Failed to setup touch listeners', { error });
      throw error;
    }
  }

  cleanup(): void {
    try {
      window.removeEventListener('touchstart', this.onActivity);
      window.removeEventListener('touchmove', this.onActivity);
      window.removeEventListener('touchend', this.onActivity);
      window.removeEventListener('orientationchange', this.onActivity);

      if ('DeviceMotionEvent' in window) {
        window.removeEventListener('devicemotion', this.handleDeviceMotion);
      }
    } catch (error) {
      debugLog.warn('TouchListenerManager', 'Error during touch listeners cleanup', { error });
    }
  }

  private readonly handleDeviceMotion = (event: DeviceMotionEvent): void => {
    try {
      const acceleration = event.acceleration;

      if (acceleration) {
        const totalAcceleration =
          Math.abs(acceleration.x ?? 0) + Math.abs(acceleration.y ?? 0) + Math.abs(acceleration.z ?? 0);

        if (totalAcceleration > this.motionThreshold) {
          this.onActivity();
        }
      }
    } catch (error) {
      debugLog.warn('TouchListenerManager', 'Error handling device motion event', { error });
    }
  };
}
