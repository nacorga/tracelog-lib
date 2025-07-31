import { StateManager } from '../managers/state.manager';
import { MetadataType } from '../types';
import { log } from '../utils';

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

    this.loadScript(measurementId);
    this.configureGtag(measurementId, userId);
    this.isInitialized = true;
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
      log(
        'warning',
        `Error tracking Google Analytics event (${eventName}): ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  cleanup(): void {
    this.isInitialized = false;

    const script = document.getElementById('tracelog-ga-script');

    if (script) {
      script.remove();
    }
  }

  private loadScript(measurementId: string): void {
    if (document.getElementById('tracelog-ga-script')) {
      return;
    }

    try {
      const script = document.createElement('script');

      script.id = 'tracelog-ga-script';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;

      script.onerror = (): void => {
        log('warning', 'Failed to load Google Analytics script');
      };

      document.head.appendChild(script);
    } catch (error) {
      log('warning', `Error loading Google Analytics script: ${error instanceof Error ? error.message : error}`);
    }
  }

  private configureGtag(measurementId: string, userId: string): void {
    window.gtag =
      window.gtag ??
      function (...args: unknown[]): void {
        (window.dataLayer = window.dataLayer ?? []).push(args);
      };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      user_id: userId,
    });
  }
}
