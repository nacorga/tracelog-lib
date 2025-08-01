import { EventListenerManager } from './listeners.types';

export class TouchListenerManager implements EventListenerManager {
  private readonly onActivity: () => void;
  private readonly options = { passive: true };
  private readonly motionThreshold: number;

  constructor(onActivity: () => void, motionThreshold: number) {
    this.onActivity = onActivity;
    this.motionThreshold = motionThreshold;
  }

  setup(): void {
    window.addEventListener('touchstart', this.onActivity, this.options);
    window.addEventListener('touchmove', this.onActivity, this.options);
    window.addEventListener('touchend', this.onActivity, this.options);
    window.addEventListener('orientationchange', this.onActivity, this.options);

    if ('DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', this.handleDeviceMotion, this.options);
    }
  }

  cleanup(): void {
    window.removeEventListener('touchstart', this.onActivity);
    window.removeEventListener('touchmove', this.onActivity);
    window.removeEventListener('touchend', this.onActivity);
    window.removeEventListener('orientationchange', this.onActivity);

    if ('DeviceMotionEvent' in window) {
      window.removeEventListener('devicemotion', this.handleDeviceMotion);
    }
  }

  private readonly handleDeviceMotion = (event: DeviceMotionEvent): void => {
    const acceleration = event.acceleration;

    if (acceleration) {
      const totalAcceleration =
        Math.abs(acceleration.x ?? 0) + Math.abs(acceleration.y ?? 0) + Math.abs(acceleration.z ?? 0);

      if (totalAcceleration > this.motionThreshold) {
        this.onActivity();
      }
    }
  };
}
