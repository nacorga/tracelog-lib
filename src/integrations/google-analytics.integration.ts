import { MetadataType } from '../types';
import { log } from '../utils';
import { StateManager } from '../managers/state.manager';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export class GoogleAnalyticsIntegration extends StateManager {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const measurementId = this.get('config').integrations?.googleAnalytics?.measurementId;
    const userId = this.get('userId');

    if (!measurementId?.trim() || !userId?.trim()) {
      return;
    }

    try {
      if (this.isScriptAlreadyLoaded()) {
        this.isInitialized = true;
        return;
      }

      await this.loadScript(measurementId);
      this.configureGtag(measurementId, userId);
      this.isInitialized = true;
    } catch (error) {
      log('error', 'Google Analytics initialization failed', { error });
    }
  }

  trackEvent(eventName: string, metadata: Record<string, MetadataType> | Record<string, MetadataType>[]): void {
    if (!eventName?.trim() || !this.isInitialized || typeof window.gtag !== 'function') {
      return;
    }

    try {
      const normalizedMetadata = Array.isArray(metadata) ? { items: metadata } : metadata;
      window.gtag('event', eventName, normalizedMetadata);
    } catch (error) {
      log('error', 'Google Analytics event tracking failed', { error });
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
    // Check if we already loaded the script
    if (document.getElementById('tracelog-ga-script')) {
      return true;
    }

    // Check if GA is already loaded by another source
    const existingGAScript = document.querySelector('script[src*="googletagmanager.com/gtag/js"]');
    return !!existingGAScript;
  }

  private async loadScript(measurementId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.id = 'tracelog-ga-script';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;

      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Analytics script'));

      document.head.appendChild(script);
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
