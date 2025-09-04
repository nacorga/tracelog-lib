import { MetadataType } from '../types';
import { log, logUnknownError } from '../utils';
import { StateManager } from '../managers/state.manager';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export class GoogleAnalyticsIntegration extends StateManager {
  private isInitialized = false;

  constructor() {
    super();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const measurementId = this.get('config').integrations?.googleAnalytics?.measurementId;

    if (!measurementId?.trim()) {
      log('warning', 'Google Analytics initialization skipped: measurementId not configured');

      return;
    }

    const userId = this.get('userId');

    if (!userId?.trim()) {
      log('warning', 'Google Analytics initialization skipped: userId not available');

      return;
    }

    try {
      if (this.isScriptAlreadyLoaded()) {
        return;
      }

      await this.loadScript(measurementId);
      this.configureGtag(measurementId, userId);
      this.isInitialized = true;
    } catch (error) {
      logUnknownError('Google Analytics initialization failed', error);
    }
  }

  trackEvent(eventName: string, metadata: Record<string, MetadataType>): void {
    if (!eventName?.trim()) {
      log('warning', 'Google Analytics event tracking skipped: invalid eventName');

      return;
    }

    if (!this.isInitialized || typeof window.gtag !== 'function') {
      return;
    }

    try {
      window.gtag('event', eventName, metadata);
    } catch (error) {
      logUnknownError(`Error tracking Google Analytics event (${eventName})`, error);
    }
  }

  cleanup(): void {
    this.isInitialized = false;

    const script = document.getElementById('tracelog-ga-script');

    if (script) {
      script.remove();
    }
  }

  private isScriptAlreadyLoaded(): boolean {
    if (document.getElementById('tracelog-ga-script')) {
      return true;
    }

    const existingGAScript = document.querySelector('script[src*="googletagmanager.com/gtag/js"]');

    if (existingGAScript) {
      log('warning', 'Google Analytics script already loaded from external source');

      return true;
    }

    return false;
  }

  private async loadScript(measurementId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const script = document.createElement('script');

        script.id = 'tracelog-ga-script';
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;

        script.onload = (): void => {
          resolve();
        };

        script.onerror = (): void => {
          reject(new Error('Failed to load Google Analytics script'));
        };

        document.head.appendChild(script);
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  private configureGtag(measurementId: string, userId: string): void {
    const gaScriptConfig = document.createElement('script');

    gaScriptConfig.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}', {
        'user_id': '${userId}'
      });
    `;

    document.head.appendChild(gaScriptConfig);
  }
}
