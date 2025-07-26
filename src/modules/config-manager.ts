import { Config } from '../types';
import { DEFAULT_API_CONFIG, DEFAULT_CONFIG } from '../constants';
import { isValidUrl, buildDynamicApiUrl } from '../utils';
import { ConfigValidator, RateLimiter, ConfigFetcher, ConfigLoaderFactory } from '../config';
import { Base } from '../base';

export class ConfigManager extends Base {
  private readonly validator: ConfigValidator;
  private readonly rateLimiter: RateLimiter;
  private readonly fetcher: ConfigFetcher;
  private readonly loaderFactory: ConfigLoaderFactory;

  private config: Config = { ...DEFAULT_API_CONFIG, ...DEFAULT_CONFIG };
  private id = '';

  constructor() {
    super();

    this.validator = new ConfigValidator();
    this.rateLimiter = new RateLimiter();
    this.fetcher = new ConfigFetcher(this.rateLimiter);
    this.loaderFactory = new ConfigLoaderFactory(this.validator, this.fetcher);
  }

  async loadConfig(config: Config): Promise<Config> {
    this.id = config.id ?? '';

    const loader = this.loaderFactory.createLoader(config);

    this.config = await loader.load(config);

    if (this.config.qaMode === true) {
      this.log('info', `set config: ${JSON.stringify(this.config)}`);
    }

    return this.config;
  }

  getApiUrl(): string | undefined {
    if (!this.id || this.isDemoMode()) {
      return undefined;
    }

    try {
      const apiUrl = buildDynamicApiUrl(this.id);

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
