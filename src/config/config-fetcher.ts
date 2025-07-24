import { Config, ApiConfig } from '../types';
import { sanitizeApiConfig, isValidUrl, buildDynamicApiUrl, isValidConfigApiResponse } from '../utils';
import { DEFAULT_API_CONFIG, FETCH_TIMEOUT_MS, MAX_FETCH_ATTEMPTS } from '../constants';
import { VERSION } from '../version';
import { IRateLimiter } from './rate-limiter';
import { Base } from '../base';

export interface IConfigFetcher {
  fetch(config: Config): Promise<ApiConfig | undefined>;
}

export class ConfigFetcher extends Base implements IConfigFetcher {
  constructor(private readonly rateLimiter: IRateLimiter) {
    super();
  }

  async fetch(config: Config): Promise<ApiConfig | undefined> {
    if (!this.rateLimiter.canFetch()) {
      if (this.rateLimiter.hasExceededMaxAttempts()) {
        this.log('error', `Max fetch attempts exceeded (${MAX_FETCH_ATTEMPTS})`);
      }

      return undefined;
    }

    this.rateLimiter.recordAttempt();

    try {
      return await this.performFetch(config);
    } catch (error) {
      this.handleFetchError(error);
      throw error;
    }
  }

  private async performFetch(config: Config): Promise<ApiConfig | undefined> {
    const configUrl = this.buildConfigUrl(config);

    if (!configUrl) {
      throw new Error('Config URL is not valid or not allowed');
    }

    if (!this.isUrlSecure(configUrl, config.allowHttp)) {
      throw new Error('Config URL failed security validation');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

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

  private buildConfigUrl(config: Config): string | undefined {
    // Handle remote config URL
    if (config.remoteConfigApiUrl) {
      try {
        const url = new URL(config.remoteConfigApiUrl);
        return url.href.replace(/\/$/, '');
      } catch {
        return undefined;
      }
    }

    // Handle custom API URL (derive config URL from it)
    if (config.apiUrl) {
      try {
        const url = new URL(config.apiUrl);
        return `${url.origin}${url.pathname.replace(/\/$/, '')}/config`;
      } catch {
        return undefined;
      }
    }

    // Handle standard case: build dynamic URL based on current domain and ID
    if (config.id) {
      try {
        const urlParameters = new URLSearchParams(window.location.search);
        const isQaMode = urlParameters.get('qaMode') === 'true';
        const baseUrl = buildDynamicApiUrl(config.id);

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
    const isValid = isValidConfigApiResponse(json);

    if (!isValid) {
      throw new Error('Invalid Config API response');
    }

    const safeData = sanitizeApiConfig(json);

    return { ...DEFAULT_API_CONFIG, ...(safeData as ApiConfig) };
  }

  private handleFetchError(error: unknown): void {
    this.log('error', `Config fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
