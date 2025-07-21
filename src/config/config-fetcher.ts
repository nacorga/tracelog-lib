import { AppConfig, ApiConfig } from '../types';
import { DEFAULT_TRACKING_API_CONFIG } from '../constants';
import { sanitizeApiConfig, isValidUrl, buildDynamicApiUrl } from '../utils';
import { VERSION } from '../version';
import { CONFIG_CONSTANTS } from './config-constants';
import { IRateLimiter } from './rate-limiter';

export interface IErrorReporter {
  reportError(error: { message: string; context?: string; severity?: 'low' | 'medium' | 'high' }): void;
}

export interface IConfigFetcher {
  fetch(config: AppConfig, id?: string): Promise<ApiConfig | undefined>;
}

export class ConfigFetcher implements IConfigFetcher {
  constructor(
    private readonly errorReporter: IErrorReporter,
    private readonly rateLimiter: IRateLimiter,
  ) {}

  async fetch(config: AppConfig, id?: string): Promise<ApiConfig | undefined> {
    if (!this.rateLimiter.canFetch()) {
      if (this.rateLimiter.hasExceededMaxAttempts()) {
        this.errorReporter.reportError({
          message: `Max fetch attempts exceeded (${CONFIG_CONSTANTS.MAX_FETCH_ATTEMPTS})`,
          context: 'ConfigFetcher',
          severity: 'high',
        });
      }
      return undefined;
    }

    this.rateLimiter.recordAttempt();

    try {
      return await this.performFetch(config, id);
    } catch (error) {
      this.handleFetchError(error);
      throw error;
    }
  }

  private async performFetch(config: AppConfig, id?: string): Promise<ApiConfig | undefined> {
    const configUrl = this.buildConfigUrl(config, id);

    if (!configUrl) {
      throw new Error('Config URL is not valid or not allowed');
    }

    if (!this.isUrlSecure(configUrl, config.allowHttp)) {
      throw new Error('Config URL failed security validation');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG_CONSTANTS.FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(configUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `TraceLog-Client/${VERSION}`,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      const apiConfig = this.parseApiResponse(json);

      // Reset attempts on successful fetch
      this.rateLimiter.reset();

      return apiConfig;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Config fetch timed out');
      }

      throw error;
    }
  }

  private buildConfigUrl(config: AppConfig, id?: string): string | undefined {
    // Handle custom API config URL
    if (config.customApiConfigUrl) {
      try {
        const url = new URL(config.customApiConfigUrl);
        return url.href.replace(/\/$/, '');
      } catch {
        return undefined;
      }
    }

    // Handle custom API URL (derive config URL from it)
    if (config.customApiUrl) {
      try {
        const url = new URL(config.customApiUrl);
        return `${url.origin}${url.pathname.replace(/\/$/, '')}/config`;
      } catch {
        return undefined;
      }
    }

    // Handle standard case: build dynamic URL based on current domain and ID
    if (id) {
      try {
        const urlParameters = new URLSearchParams(window.location.search);
        const isQaMode = urlParameters.get('qaMode') === 'true';
        const baseUrl = buildDynamicApiUrl(id);

        if (!baseUrl) {
          return undefined;
        }

        let configUrl = `${baseUrl}/config`;

        if (isQaMode) {
          configUrl += '?qaMode=true';
        }

        const allowedDomain = new URL(baseUrl).hostname;

        if (!isValidUrl(configUrl, allowedDomain)) {
          return undefined;
        }

        return configUrl;
      } catch {
        return undefined;
      }
    }

    return undefined;
  }

  private isUrlSecure(url: string, allowHttp = false): boolean {
    try {
      const allowedDomain = new URL(url).hostname;
      return isValidUrl(url, allowedDomain, allowHttp);
    } catch {
      return false;
    }
  }

  private parseApiResponse(json: any): ApiConfig {
    const { statusCode, data } = json;

    if (data === undefined || data === null || typeof statusCode !== 'number') {
      throw new Error('Config API response missing required properties');
    }

    if (statusCode !== 200) {
      throw new Error(`Invalid Config API response status code: ${statusCode}`);
    }

    const safeData = sanitizeApiConfig(data);
    return { ...DEFAULT_TRACKING_API_CONFIG, ...(safeData as ApiConfig) };
  }

  private handleFetchError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    this.errorReporter.reportError({
      message: `Config fetch failed: ${errorMessage}`,
      context: 'ConfigFetcher',
      severity: 'medium',
    });
  }
}
