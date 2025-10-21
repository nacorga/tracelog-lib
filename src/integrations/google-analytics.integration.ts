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

    const googleConfig = this.get('config').integrations?.google;
    const userId = this.get('userId');

    if (!googleConfig || !userId?.trim()) {
      return;
    }

    const { measurementId, containerId } = googleConfig;

    if (!measurementId?.trim() && !containerId?.trim()) {
      return;
    }

    try {
      if (typeof window.gtag === 'function' && Array.isArray(window.dataLayer)) {
        log('info', 'Google Analytics/GTM already loaded by external service, reusing existing script', {
          showToClient: true,
        });

        this.isInitialized = true;

        return;
      }

      if (this.isScriptAlreadyLoaded()) {
        this.isInitialized = true;

        return;
      }

      const scriptId = containerId?.trim() || measurementId?.trim();

      if (scriptId) {
        await this.loadScript(scriptId);
        this.configureGtag(scriptId, userId);
      }

      this.isInitialized = true;
    } catch (error) {
      log('error', 'Google Analytics/GTM initialization failed', { error });
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
    if (typeof window.gtag === 'function' && Array.isArray(window.dataLayer)) {
      return true;
    }

    if (document.getElementById('tracelog-ga-script')) {
      return true;
    }

    const existingScript = document.querySelector(
      'script[src*="googletagmanager.com/gtag/js"], script[src*="googletagmanager.com/gtm.js"]',
    );

    return !!existingScript;
  }

  private async loadScript(measurementId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.id = 'tracelog-ga-script';
      script.async = true;

      if (measurementId.startsWith('GTM-')) {
        script.src = `https://www.googletagmanager.com/gtm.js?id=${measurementId}`;
      } else {
        script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      }

      script.onload = () => {
        resolve();
      };
      script.onerror = () => {
        const type = measurementId.startsWith('GTM-') ? 'GTM' : 'Google Analytics';
        reject(new Error(`Failed to load ${type} script`));
      };

      document.head.appendChild(script);
    });
  }

  private configureGtag(measurementId: string, userId: string): void {
    const gaScriptConfig = document.createElement('script');

    if (measurementId.startsWith('GTM-')) {
      gaScriptConfig.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
      `;
    } else {
      gaScriptConfig.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${measurementId}', {
          'user_id': '${userId}'
        });
      `;
    }

    document.head.appendChild(gaScriptConfig);
  }
}
