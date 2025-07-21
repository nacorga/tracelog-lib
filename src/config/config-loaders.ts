import { AppConfig, Config } from '../types';
import { DEFAULT_TRACKING_API_CONFIG, SESSION_TIMEOUT_DEFAULT_MS, SESSION_TIMEOUT_MIN_MS } from '../constants';
import { IConfigValidator } from './config-validator';
import { IConfigFetcher, IErrorReporter } from './config-fetcher';

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

export class CustomApiConfigLoader extends ConfigLoader {
  constructor(
    private readonly validator: IConfigValidator,
    private readonly fetcher: IConfigFetcher,
    private readonly errorReporter: IErrorReporter,
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
        this.errorReporter.reportError(
          `Custom config fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    return this.applyCorrections(merged);
  }

  private async validateAndReport(config: AppConfig): Promise<void> {
    const result = this.validator.validate(config);

    if (result.errors.length > 0) {
      this.errorReporter.reportError(`Configuration errors: ${result.errors.join('; ')}`);
    }

    if (result.warnings.length > 0) {
      console.warn('[TraceLog] Configuration warnings:', result.warnings);
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
        corrected.customApiUrl = url.href.replace(/\/$/, '');
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

export class StandardConfigLoader extends ConfigLoader {
  constructor(
    private readonly validator: IConfigValidator,
    private readonly fetcher: IConfigFetcher,
    private readonly errorReporter: IErrorReporter,
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

    // Validate app config
    try {
      const validationResult = this.validator.validate(config);
      errors.push(...validationResult.errors);
      warnings.push(...validationResult.warnings);
    } catch (error) {
      errors.push(`Failed to validate app config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Fetch remote config - NOW PASSING THE ID for dynamic URL building
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

    // Report errors and warnings
    if (warnings.length > 0) {
      console.warn('[TraceLog] Configuration warnings:', warnings);
    }

    if (errors.length > 0) {
      this.errorReporter.reportError(`Configuration errors: ${errors.join('; ')}`);
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

export class ConfigLoaderFactory {
  constructor(
    private readonly validator: IConfigValidator,
    private readonly fetcher: IConfigFetcher,
    private readonly errorReporter: IErrorReporter,
  ) {}

  createLoader(id: string, config: AppConfig): ConfigLoader {
    if (id === 'demo') {
      return new DemoConfigLoader();
    }

    if (config.customApiUrl) {
      return new CustomApiConfigLoader(this.validator, this.fetcher, this.errorReporter);
    }

    return new StandardConfigLoader(this.validator, this.fetcher, this.errorReporter);
  }
}
