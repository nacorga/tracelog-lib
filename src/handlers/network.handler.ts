import { EventManager } from '../managers/event.manager';
import { StateManager } from '../managers/state.manager';
import { ErrorType, EventType } from '../types';
import { normalizeUrl } from '../utils';
import { debugLog } from '../utils/logging';

interface ExtendedXHR extends XMLHttpRequest {
  _tracelogStartTime?: number;
  _tracelogMethod?: string;
  _tracelogUrl?: string;
}

export class NetworkHandler extends StateManager {
  private readonly eventManager: EventManager;
  private readonly originalXHROpen: typeof XMLHttpRequest.prototype.open;
  private readonly originalXHRSend: typeof XMLHttpRequest.prototype.send;

  constructor(eventManager: EventManager) {
    super();

    this.eventManager = eventManager;

    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;
  }

  startTracking(): void {
    debugLog.debug('NetworkHandler', 'Starting network error tracking');

    this.interceptXHR();
  }

  stopTracking(): void {
    debugLog.debug('NetworkHandler', 'Stopping network error tracking');

    XMLHttpRequest.prototype.open = this.originalXHROpen;
    XMLHttpRequest.prototype.send = this.originalXHRSend;
  }

  private interceptXHR(): void {
    const trackNetworkError = this.trackNetworkError.bind(this);
    const normalizeUrlForTracking = this.normalizeUrlForTracking.bind(this);
    const originalXHROpen = this.originalXHROpen;
    const originalXHRSend = this.originalXHRSend;

    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      async?: boolean,
      user?: string | null,
      password?: string | null,
    ): void {
      const asyncMode = async ?? true;
      const extendedThis = this as ExtendedXHR;

      extendedThis._tracelogStartTime = Date.now();
      extendedThis._tracelogMethod = method.toUpperCase();
      extendedThis._tracelogUrl = url.toString();

      return originalXHROpen.call(this, method, url, asyncMode, user, password);
    };

    XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null): void {
      const xhr = this as ExtendedXHR;
      const startTime = xhr._tracelogStartTime ?? Date.now();
      const method = xhr._tracelogMethod ?? 'GET';
      const url = xhr._tracelogUrl ?? '';

      const originalOnReadyStateChange = xhr.onreadystatechange;

      xhr.onreadystatechange = (ev: Event): void => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          const duration = Date.now() - startTime;

          // Don't track errors for the analytics collection endpoint to avoid infinite loops
          const isCollectEndpoint = url.includes('/collect') || url.includes('/config');

          if ((xhr.status === 0 || xhr.status >= 400) && !isCollectEndpoint) {
            const statusText = xhr.statusText || 'Request Failed';
            debugLog.debug('NetworkHandler', 'XHR error detected', {
              method,
              url: normalizeUrlForTracking(url),
              status: xhr.status,
              statusText,
            });
            trackNetworkError(method, normalizeUrlForTracking(url), xhr.status, statusText, duration);
          }
        }

        if (originalOnReadyStateChange) {
          return originalOnReadyStateChange.call(xhr, ev);
        }
      };

      return originalXHRSend.call(this, body);
    };
  }

  private trackNetworkError(
    method: string,
    url: string,
    status: number | undefined,
    statusText: string,
    duration: number,
  ): void {
    const config = this.get('config');

    if (!this.shouldSample(config?.errorSampling ?? 0.1)) {
      debugLog.debug(
        'NetworkHandler',
        `Network error not sampled, skipping (errorSampling: ${config?.errorSampling}, method: ${method}, url: ${url})`,
        {
          errorSampling: config?.errorSampling,
          method,
          url,
        },
      );
      return;
    }

    debugLog.warn(
      'NetworkHandler',
      `Network error tracked: ${method} ${url} (status: ${status}, statusText: ${statusText}, duration: ${duration}ms)`,
      { method, url, status, statusText, duration },
    );

    this.eventManager.track({
      type: EventType.ERROR,
      error_data: {
        type: ErrorType.NETWORK_ERROR,
        message: statusText,
        method,
        url,
        status,
        statusText,
        duration,
      },
    });
  }

  private normalizeUrlForTracking(url: string): string {
    try {
      const config = this.get('config');

      return normalizeUrl(url, config?.sensitiveQueryParams);
    } catch {
      return url;
    }
  }

  private shouldSample(rate: number): boolean {
    return Math.random() < rate;
  }
}
