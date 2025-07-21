import { AppConfig, ApiConfig, Config } from '../types';
import { DEFAULT_TRACKING_API_CONFIG, DEFAULT_TRACKING_APP_CONFIG } from '../constants';
import { sanitizeApiConfig, isValidUrl, validateFinalConfig, validateAppConfig } from '../utils';
import { VERSION } from '../version';

interface ErrorReporter {
  reportError(error: { message: string; context?: string; severity?: 'low' | 'medium' | 'high' }): void;
}

interface ConfigLoadResult {
  config: Config;
  errors: string[];
  warnings: string[];
}

export class ConfigManager {
  private readonly errorReporter: ErrorReporter;
  private readonly maxFetchAttempts = 3;

  private config: Config = { ...DEFAULT_TRACKING_API_CONFIG, ...DEFAULT_TRACKING_APP_CONFIG };

  private id = '';
  private lastFetchAttempt = 0;
  private fetchAttempts = 0;

  constructor(private readonly catchError: (error: { message: string }) => Promise<void>) {
    this.errorReporter = {
      reportError: (error) => {
        this.catchError({
          message: `[ConfigManager] ${error.message}`,
        }).catch(() => {
          // Silently handle error reporting failures
        });
      },
    };
  }

  async loadConfig(id: string, config: AppConfig): Promise<Config> {
    this.id = id;

    if (id === 'demo') {
      const demoConfig: Config = {
        ...DEFAULT_TRACKING_API_CONFIG,
        ...config,
        qaMode: true,
        samplingRate: 1,
        tags: [],
        excludedUrlPaths: [],
      };

      this.config = demoConfig;

      return this.config;
    }

    if (config.customApiUrl) {
      const { apiConfig = {}, customApiConfigUrl, ...rest } = config;

      let merged: Config = {
        ...DEFAULT_TRACKING_API_CONFIG,
        ...apiConfig,
        ...rest,
      };

      if (customApiConfigUrl) {
        try {
          const remote = await this.fetchConfigWithRetry(config);

          if (remote) {
            merged = { ...merged, ...remote };
          }
        } catch (error) {
          console.error('[TraceLog] Custom config fetch failed:', error);

          this.errorReporter.reportError({
            message: `Custom config fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'medium',
          });
        }
      }

      this.config = this.applyConfigCorrections(merged);

      return this.config;
    }

    const result = await this.loadConfigWithValidation(id, config);

    if (result.warnings.length > 0) {
      console.warn('[TraceLog] Configuration warnings:', result.warnings);
    }

    if (result.errors.length > 0) {
      console.error('[TraceLog] Configuration errors:', result.errors);

      this.errorReporter.reportError({
        message: `Configuration errors: ${result.errors.join('; ')}`,
        severity: 'medium',
      });
    }

    this.config = result.config;

    return this.config;
  }

  private async loadConfigWithValidation(id: string, config: AppConfig): Promise<ConfigLoadResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const { apiConfig = {}, ...rest } = config;
    let finalConfig: Config = {
      ...DEFAULT_TRACKING_API_CONFIG,
      ...apiConfig,
      ...rest,
    };

    try {
      const validationResult = validateAppConfig(config);

      errors.push(...validationResult.errors);
      warnings.push(...validationResult.warnings);
    } catch (error) {
      errors.push(`Failed to validate app config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      const remoteConfig = await this.fetchConfigWithRetry(config);

      if (remoteConfig) {
        finalConfig = { ...finalConfig, ...remoteConfig };
      } else {
        warnings.push('Failed to load remote configuration, using defaults');
      }
    } catch (error) {
      errors.push(`Remote config fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      const finalValidation = validateFinalConfig(finalConfig);

      errors.push(...finalValidation.errors);
      warnings.push(...finalValidation.warnings);

      finalConfig = this.applyConfigCorrections(finalConfig);
    } catch (error) {
      errors.push(`Final config validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      config: finalConfig,
      errors,
      warnings,
    };
  }

  private applyConfigCorrections(config: Config): Config {
    const correctedConfig = { ...config };

    if (
      typeof correctedConfig.samplingRate !== 'number' ||
      correctedConfig.samplingRate < 0 ||
      correctedConfig.samplingRate > 1
    ) {
      correctedConfig.samplingRate = 1;
    }

    if (!Array.isArray(correctedConfig.excludedUrlPaths)) {
      correctedConfig.excludedUrlPaths = [];
    }

    if (typeof correctedConfig.sessionTimeout !== 'number' || correctedConfig.sessionTimeout < 30_000) {
      correctedConfig.sessionTimeout = 15 * 60 * 1000;
    }

    if (correctedConfig.customApiUrl) {
      try {
        const url = new URL(correctedConfig.customApiUrl);
        correctedConfig.customApiUrl = url.href.replace(/\/$/, '');
      } catch {
        correctedConfig.customApiUrl = undefined;
      }
    }

    if (correctedConfig.customApiConfigUrl) {
      try {
        const url = new URL(correctedConfig.customApiConfigUrl);
        correctedConfig.customApiConfigUrl = url.href.replace(/\/$/, '');
      } catch {
        correctedConfig.customApiConfigUrl = undefined;
      }
    }

    return correctedConfig;
  }

  private async fetchConfigWithRetry(config: AppConfig): Promise<ApiConfig | undefined> {
    if (!config.customApiConfigUrl && config.customApiUrl) {
      return undefined;
    }

    const now = Date.now();

    // Rate limiting (5 seconds)
    if (now - this.lastFetchAttempt < 5000) {
      return undefined;
    }

    this.lastFetchAttempt = now;
    this.fetchAttempts++;

    if (this.fetchAttempts > this.maxFetchAttempts) {
      this.errorReporter.reportError({
        message: `Max fetch attempts exceeded (${this.maxFetchAttempts})`,
        severity: 'high',
      });

      return undefined;
    }

    return this.fetchConfig(config);
  }

  private async fetchConfig(config: AppConfig): Promise<ApiConfig | undefined> {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      const configUrl = this.getConfigUrl(config.customApiConfigUrl, config.customApiUrl);

      if (!configUrl) {
        throw new Error('Config URL is not valid or not allowed');
      }

      const allowedDomain = new URL(configUrl).hostname;
      const allowHttp = config.allowHttp === true;

      if (!isValidUrl(configUrl, allowedDomain, allowHttp)) {
        throw new Error('Config URL failed security validation');
      }

      const controller = new AbortController();

      timeoutId = setTimeout(() => controller.abort(), 10_000);

      const response = await fetch(configUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `TraceLog-Client/${VERSION}`,
        },
      });

      clearTimeout(timeoutId);
      timeoutId = null;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      const { statusCode, data } = json;

      if (data === undefined || data === null || typeof statusCode !== 'number') {
        throw new Error('Config API response missing required properties');
      }

      if (statusCode !== 200) {
        throw new Error(`Invalid Config API response status code: ${statusCode}`);
      }

      const safeData = sanitizeApiConfig(data);
      const apiConfig = { ...DEFAULT_TRACKING_API_CONFIG, ...(safeData as ApiConfig) };

      this.fetchAttempts = 0;

      return apiConfig;
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.errorReporter.reportError({
        message: `Config fetch failed: ${errorMessage}`,
        context: 'fetchConfig',
        severity: 'medium',
      });

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Config fetch timed out');
      }

      throw error;
    }
  }

  private getConfigUrl(customApiConfigUrl?: string, customApiUrl?: string): string | undefined {
    if (customApiConfigUrl) {
      try {
        const url = new URL(customApiConfigUrl);
        return url.href.replace(/\/$/, '');
      } catch {
        return undefined;
      }
    }

    if (customApiUrl) {
      try {
        const url = new URL(customApiUrl);
        return `${url.origin}${url.pathname.replace(/\/$/, '')}/config`;
      } catch {
        return undefined;
      }
    }

    if (!this.id) {
      return undefined;
    }

    try {
      const urlParameters = new URLSearchParams(window.location.search);
      const isQaMode = urlParameters.get('qaMode') === 'true';
      const baseUrl = this.buildDynamicApiUrl(this.id);

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

  getApiUrl(): string | undefined {
    if (this.config.customApiUrl) {
      try {
        new URL(this.config.customApiUrl);
        return this.config.customApiUrl;
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
      this.fetchAttempts < this.maxFetchAttempts && this.config !== null && typeof this.config.samplingRate === 'number'
    );
  }

  getHealthStatus(): { healthy: boolean; issues: string[] } {
    const issues: string[] = [];

    if (this.fetchAttempts >= this.maxFetchAttempts) {
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
