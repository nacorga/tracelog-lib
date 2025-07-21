import { AppConfig, Config } from '../types';
import { DEFAULT_TRACKING_API_CONFIG, SESSION_TIMEOUT_DEFAULT_MS, SESSION_TIMEOUT_MIN_MS } from '../constants';
import { IConfigValidator } from './config-validator';
import { IConfigFetcher } from './config-fetcher';
import { isValidUrl } from '../utils';
import { Base } from '../base';

export abstract class ConfigLoader {
  abstract load(id: string, config: AppConfig): Promise<Config>;
}

export class DemoConfigLoader extends ConfigLoader {
  async load(id: string, config: AppConfig): Promise<Config> {
    const { apiConfig = {}, ...rest } = config;

    return {
      ...DEFAULT_TRACKING_API_CONFIG,
      ...apiConfig,
      ...rest,
      qaMode: true,
      samplingRate: 1,
      tags: [],
      excludedUrlPaths: [],
    };
  }
}

export class CustomApiConfigLoader extends Base implements ConfigLoader {
  constructor(
    private readonly validator: IConfigValidator,
    private readonly fetcher: IConfigFetcher,
  ) {
    super();
  }

  async load(id: string, config: AppConfig): Promise<Config> {
    const { apiConfig = {}, customApiConfigUrl, ...rest } = config;

    let merged: Config = {
      ...DEFAULT_TRACKING_API_CONFIG,
      ...apiConfig,
      ...rest,
    };

    await this.validateAndReport(config);

    if (customApiConfigUrl) {
      try {
        const remote = await this.fetcher.fetch(config, id);

        if (remote) {
          merged = { ...merged, ...remote };
        }
      } catch (error) {
        this.log('error', `Custom config fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return this.applyCorrections(merged);
  }

  private async validateAndReport(config: AppConfig): Promise<void> {
    const result = this.validator.validate(config);

    if (result.errors.length > 0) {
      this.log('error', `Configuration errors: ${result.errors.join('; ')}`);
    }

    if (result.warnings.length > 0) {
      this.log('warning', `Configuration warnings: ${result.warnings.join('; ')}`);
    }
  }

  private applyCorrections(config: Config): Config {
    const corrected = { ...config };

    if (typeof corrected.samplingRate !== 'number' || corrected.samplingRate < 0 || corrected.samplingRate > 1) {
      corrected.samplingRate = 1;
    }

    if (!Array.isArray(corrected.excludedUrlPaths)) {
      corrected.excludedUrlPaths = [];
    }

    if (typeof corrected.sessionTimeout !== 'number' || corrected.sessionTimeout < SESSION_TIMEOUT_MIN_MS) {
      corrected.sessionTimeout = SESSION_TIMEOUT_DEFAULT_MS;
    }

    if (corrected.customApiUrl) {
      try {
        const url = new URL(corrected.customApiUrl);
        const sanitized = url.href.replace(/\/$/, '');

        corrected.customApiUrl = isValidUrl(sanitized, url.hostname, corrected.allowHttp) ? sanitized : undefined;
      } catch {
        corrected.customApiUrl = undefined;
      }
    }

    if (corrected.customApiConfigUrl) {
      try {
        const url = new URL(corrected.customApiConfigUrl);
        corrected.customApiConfigUrl = url.href.replace(/\/$/, '');
      } catch {
        corrected.customApiConfigUrl = undefined;
      }
    }

    return corrected;
  }
}

export class StandardConfigLoader extends Base implements ConfigLoader {
  constructor(
    private readonly validator: IConfigValidator,
    private readonly fetcher: IConfigFetcher,
  ) {
    super();
  }

  async load(id: string, config: AppConfig): Promise<Config> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const { apiConfig = {}, ...rest } = config;
    let finalConfig: Config = {
      ...DEFAULT_TRACKING_API_CONFIG,
      ...apiConfig,
      ...rest,
    };

    try {
      const validationResult = this.validator.validate(config);

      errors.push(...validationResult.errors);
      warnings.push(...validationResult.warnings);
    } catch (error) {
      errors.push(`Failed to validate app config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      const remoteConfig = await this.fetcher.fetch(config, id);

      if (remoteConfig) {
        finalConfig = { ...finalConfig, ...remoteConfig };
      } else {
        warnings.push('Failed to load remote configuration, using defaults');
      }
    } catch (error) {
      errors.push(`Remote config fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (warnings.length > 0) {
      this.log('warning', `Configuration warnings: ${warnings.join('; ')}`);
    }

    if (errors.length > 0) {
      this.log('error', `Configuration errors: ${errors.join('; ')}`);
    }

    return this.applyCorrections(finalConfig);
  }

  private applyCorrections(config: Config): Config {
    const corrected = { ...config };

    if (typeof corrected.samplingRate !== 'number' || corrected.samplingRate < 0 || corrected.samplingRate > 1) {
      corrected.samplingRate = 1;
    }

    if (!Array.isArray(corrected.excludedUrlPaths)) {
      corrected.excludedUrlPaths = [];
    }

    if (typeof corrected.sessionTimeout !== 'number' || corrected.sessionTimeout < SESSION_TIMEOUT_MIN_MS) {
      corrected.sessionTimeout = SESSION_TIMEOUT_DEFAULT_MS;
    }

    return corrected;
  }
}

export class ConfigLoaderFactory extends Base {
  constructor(
    private readonly validator: IConfigValidator,
    private readonly fetcher: IConfigFetcher,
  ) {
    super();
  }

  createLoader(id: string, config: AppConfig): ConfigLoader {
    if (id === 'demo') {
      return new DemoConfigLoader();
    }

    if (config.customApiUrl) {
      return new CustomApiConfigLoader(this.validator, this.fetcher);
    }

    return new StandardConfigLoader(this.validator, this.fetcher);
  }
}
