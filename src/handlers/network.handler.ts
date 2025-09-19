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
  private readonly originalFetch: typeof fetch;
  private readonly originalXHROpen: typeof XMLHttpRequest.prototype.open;
  private readonly originalXHRSend: typeof XMLHttpRequest.prototype.send;

  constructor(eventManager: EventManager) {
    super();

    this.eventManager = eventManager;

    this.originalFetch = window.fetch;
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;
  }

  startTracking(): void {
    debugLog.debug('NetworkHandler', 'Starting network error tracking');

    this.interceptFetch();
    this.interceptXHR();
  }

  stopTracking(): void {
    debugLog.debug('NetworkHandler', 'Stopping network error tracking');

    window.fetch = this.originalFetch;
    XMLHttpRequest.prototype.open = this.originalXHROpen;
    XMLHttpRequest.prototype.send = this.originalXHRSend;
  }

  private interceptFetch(): void {
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const startTime = Date.now();
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method ?? 'GET';

      try {
        const response = await this.originalFetch(input, init);
        const duration = Date.now() - startTime;

        if (!response.ok) {
          debugLog.debug('NetworkHandler', 'Fetch error detected', {
            method,
            url: this.normalizeUrlForTracking(url),
            status: response.status,
            statusText: response.statusText,
          });
          this.trackNetworkError(
            method.toUpperCase(),
            this.normalizeUrlForTracking(url),
            response.status,
            response.statusText,
            duration,
          );
        }

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Network Error';

        debugLog.debug('NetworkHandler', 'Fetch exception caught', {
          method,
          url: this.normalizeUrlForTracking(url),
          error: errorMessage,
        });

        this.trackNetworkError(
          method.toUpperCase(),
          this.normalizeUrlForTracking(url),
          undefined,
          errorMessage,
          duration,
        );

        throw error;
      }
    };
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

          if (xhr.status === 0 || xhr.status >= 400) {
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
