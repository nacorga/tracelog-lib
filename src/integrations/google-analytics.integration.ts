import { MetadataType } from '../types';
import { debugLog } from '../utils/logging';
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
      debugLog.clientWarn('GoogleAnalytics', 'Google Analytics integration disabled - measurementId not configured', {
        hasIntegrations: !!this.get('config').integrations,
        hasGoogleAnalytics: !!this.get('config').integrations?.googleAnalytics,
      });
      return;
    }

    const userId = this.get('userId');

    if (!userId?.trim()) {
      debugLog.warn('GoogleAnalytics', 'Google Analytics initialization delayed - userId not available', {
        measurementId: measurementId.substring(0, 8) + '...',
      });
      return;
    }

    try {
      if (this.isScriptAlreadyLoaded()) {
        debugLog.info('GoogleAnalytics', 'Google Analytics script already loaded', { measurementId });
        this.isInitialized = true;
        return;
      }

      await this.loadScript(measurementId);

      this.configureGtag(measurementId, userId);

      this.isInitialized = true;
      debugLog.info('GoogleAnalytics', 'Google Analytics integration initialized successfully', {
        measurementId,
        userId,
      });
    } catch (error) {
      debugLog.error('GoogleAnalytics', 'Google Analytics initialization failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        measurementId,
        userId,
      });
    }
  }

  trackEvent(eventName: string, metadata: Record<string, MetadataType>): void {
    if (!eventName?.trim()) {
      debugLog.clientWarn('GoogleAnalytics', 'Event tracking skipped - invalid event name provided', {
        eventName,
        hasMetadata: !!metadata && Object.keys(metadata).length > 0,
      });
      return;
    }

    if (!this.isInitialized) {
      return;
    }

    if (typeof window.gtag !== 'function') {
      debugLog.warn('GoogleAnalytics', 'Event tracking failed - gtag function not available', {
        eventName,
        hasGtag: typeof window.gtag,
        hasDataLayer: Array.isArray(window.dataLayer),
      });
      return;
    }

    try {
      window.gtag('event', eventName, metadata);
    } catch (error) {
      debugLog.error('GoogleAnalytics', 'Event tracking failed', {
        eventName,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadataKeys: Object.keys(metadata || {}),
      });
    }
  }

  cleanup(): void {
    this.isInitialized = false;

    const script = document.getElementById('tracelog-ga-script');

    if (script) {
      script.remove();
    }

    debugLog.info('GoogleAnalytics', 'Google Analytics integration cleanup completed');
  }

  private isScriptAlreadyLoaded(): boolean {
    const tracelogScript = document.getElementById('tracelog-ga-script');
    if (tracelogScript) {
      return true;
    }

    const existingGAScript = document.querySelector('script[src*="googletagmanager.com/gtag/js"]');

    if (existingGAScript) {
      debugLog.clientWarn('GoogleAnalytics', 'Google Analytics script already loaded from external source', {
        scriptSrc: existingGAScript.getAttribute('src'),
        hasGtag: typeof window.gtag === 'function',
      });
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
          const error = new Error('Failed to load Google Analytics script');
          debugLog.error('GoogleAnalytics', 'Google Analytics script load failed', {
            measurementId,
            error: error.message,
            scriptSrc: script.src,
          });
          reject(error);
        };

        document.head.appendChild(script);
      } catch (error) {
        const errorMsg = error instanceof Error ? error : new Error(String(error));
        debugLog.error('GoogleAnalytics', 'Error creating Google Analytics script', {
          measurementId,
          error: errorMsg.message,
        });
        reject(errorMsg);
      }
    });
  }

  private configureGtag(measurementId: string, userId: string): void {
    try {
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
    } catch (error) {
      debugLog.error('GoogleAnalytics', 'Failed to configure Google Analytics', {
        measurementId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
