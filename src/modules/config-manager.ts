import { AppConfig, Config } from '../types';
import { DEFAULT_TRACKING_API_CONFIG, DEFAULT_TRACKING_APP_CONFIG } from '../constants';
import { isValidUrl } from '../utils';
import { ConfigValidator, RateLimiter, ConfigFetcher, ConfigLoaderFactory, IErrorReporter } from '../config';

export class ConfigManager {
  private readonly errorReporter: IErrorReporter;
  private readonly validator: ConfigValidator;
  private readonly rateLimiter: RateLimiter;
  private readonly fetcher: ConfigFetcher;
  private readonly loaderFactory: ConfigLoaderFactory;

  private config: Config = { ...DEFAULT_TRACKING_API_CONFIG, ...DEFAULT_TRACKING_APP_CONFIG };
  private id = '';

  constructor(private readonly catchError: (message: string) => void) {
    this.errorReporter = {
      reportError: (error: Error | string): void => {
        this.catchError(typeof error === 'string' ? error : error.message);
      },
    };

    this.validator = new ConfigValidator();
    this.rateLimiter = new RateLimiter();
    this.fetcher = new ConfigFetcher(this.errorReporter, this.rateLimiter);
    this.loaderFactory = new ConfigLoaderFactory(this.validator, this.fetcher, this.errorReporter);
  }

  async loadConfig(id: string, config: AppConfig): Promise<Config> {
    this.id = id;

    const loader = this.loaderFactory.createLoader(id, config);
    this.config = await loader.load(id, config);

    if (this.config.qaMode === true) {
      console.log('[TraceLog] set config:', JSON.stringify(this.config));
    }

    return this.config;
  }

  getApiUrl(): string | undefined {
    if (this.config.customApiUrl) {
      try {
        const url = new URL(this.config.customApiUrl);
        const sanitized = url.href.replace(/\/$/, '');

        if (isValidUrl(sanitized, url.hostname, this.config.allowHttp)) {
          return sanitized;
        }

        return undefined;
      } catch {
        return undefined;
      }
    }

    if (!this.id || this.isDemoMode()) {
      return undefined;
    }

    try {
      const apiUrl = this.buildDynamicApiUrl(this.id);

      if (!apiUrl) {
        return undefined;
      }

      const allowedDomain = new URL(apiUrl).hostname;

      if (!isValidUrl(apiUrl, allowedDomain)) {
        return undefined;
      }

      return apiUrl;
    } catch {
      return undefined;
    }
  }

  private buildDynamicApiUrl(id: string): string | undefined {
    try {
      const url = new URL(window.location.href);
      const host = url.hostname;

      if (!host) {
        return undefined;
      }

      const parts = host.split('.');

      if (parts.length < 2) {
        return undefined;
      }

      const tld = parts.slice(-2).join('.');
      const multiTlds = new Set(['co.uk', 'com.au', 'co.jp', 'co.in', 'com.br', 'com.mx']);

      const cleanDomain = multiTlds.has(tld) && parts.length >= 3 ? parts.slice(-3).join('.') : tld;
      const apiUrl = `https://${id}.${cleanDomain}`;

      if (!this.validateApiUrl(apiUrl)) {
        return undefined;
      }

      return apiUrl;
    } catch {
      return undefined;
    }
  }

  private validateApiUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  getConfig(): Config {
    return { ...this.config };
  }

  isDemoMode(): boolean {
    return this.id === 'demo';
  }

  isHealthy(): boolean {
    return (
      !this.rateLimiter.hasExceededMaxAttempts() && this.config !== null && typeof this.config.samplingRate === 'number'
    );
  }

  getHealthStatus(): { healthy: boolean; issues: string[] } {
    const issues: string[] = [];

    if (this.rateLimiter.hasExceededMaxAttempts()) {
      issues.push('Max fetch attempts exceeded');
    }

    if (!this.id) {
      issues.push('Missing configuration ID');
    }

    if (!this.config) {
      issues.push('Configuration not loaded');
    }

    return {
      healthy: issues.length === 0,
      issues,
    };
  }
}
