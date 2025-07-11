import { TracelogAppConfig, TracelogApiConfig, TracelogConfig } from '@/types';
import { DEFAULT_TRACKING_API_CONFIG, DEFAULT_TRACKING_APP_CONFIG } from '@/constants';
import { sanitizeApiConfig, isValidUrl } from '@/utils';
import packageJson from '../../package.json';

interface ErrorReporter {
  reportError(error: { message: string; context?: string; severity?: 'low' | 'medium' | 'high' }): void;
}

interface ConfigLoadResult {
  config: TracelogConfig;
  errors: string[];
  warnings: string[];
}

export class ConfigManager {
  private readonly config: TracelogConfig = { ...DEFAULT_TRACKING_API_CONFIG, ...DEFAULT_TRACKING_APP_CONFIG };
  private readonly errorReporter: ErrorReporter;
  private readonly maxFetchAttempts = 3;

  private id = '';
  private lastFetchAttempt = 0;
  private fetchAttempts = 0;

  constructor(private readonly catchError: (error: { message: string; api_key?: string }) => Promise<void>) {
    this.errorReporter = {
      reportError: (error) => {
        this.catchError({
          message: `[ConfigManager] ${error.message}`,
          ...(this.id && { api_key: this.id }),
        }).catch(() => {
          // Silently handle error reporting failures
        });
      },
    };
  }

  async loadConfig(id: string, config: TracelogAppConfig): Promise<TracelogConfig> {
    this.id = id;
    const result = await this.loadConfigWithValidation(id, config);

    // Log warnings and errors for debugging
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

    return result.config;
  }

  private async loadConfigWithValidation(id: string, config: TracelogAppConfig): Promise<ConfigLoadResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let finalConfig: TracelogConfig = { ...DEFAULT_TRACKING_API_CONFIG, ...config };

    // Validate basic configuration
    try {
      const validationResult = this.validateAppConfig(config);
      errors.push(...validationResult.errors);
      warnings.push(...validationResult.warnings);
    } catch (error) {
      errors.push(`Failed to validate app config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Attempt to fetch remote configuration
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

    // Final validation
    try {
      const finalValidation = this.validateFinalConfig(finalConfig);
      errors.push(...finalValidation.errors);
      warnings.push(...finalValidation.warnings);

      // Apply corrections if needed
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

  private validateAppConfig(config: TracelogAppConfig): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Session timeout validation
    if (config.sessionTimeout !== undefined) {
      if (typeof config.sessionTimeout !== 'number') {
        errors.push('sessionTimeout must be a number');
      } else if (config.sessionTimeout < 30_000) {
        errors.push('sessionTimeout must be at least 30 seconds (30000ms)');
      } else if (config.sessionTimeout > 24 * 60 * 60 * 1000) {
        warnings.push('sessionTimeout is very long (>24 hours), consider reducing it');
      }
    }

    // Global metadata validation
    if (config.globalMetadata !== undefined) {
      if (typeof config.globalMetadata !== 'object' || config.globalMetadata === null) {
        errors.push('globalMetadata must be an object');
      } else {
        const metadataSize = JSON.stringify(config.globalMetadata).length;
        if (metadataSize > 10_240) {
          // 10KB
          errors.push('globalMetadata is too large (max 10KB)');
        }

        if (Object.keys(config.globalMetadata).length > 12) {
          errors.push('globalMetadata has too many keys (max 12)');
        }
      }
    }

    return { errors, warnings };
  }

  private validateFinalConfig(config: TracelogConfig): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Sampling rate validation
    if (config.samplingRate !== undefined) {
      if (typeof config.samplingRate !== 'number') {
        errors.push('samplingRate must be a number');
      } else if (config.samplingRate < 0 || config.samplingRate > 1) {
        errors.push('samplingRate must be between 0 and 1');
      }
    }

    // Excluded URL paths validation
    if (config.excludedUrlPaths !== undefined) {
      if (Array.isArray(config.excludedUrlPaths)) {
        for (const [index, path] of config.excludedUrlPaths.entries()) {
          if (typeof path === 'string') {
            try {
              new RegExp(path);
            } catch {
              errors.push(`excludedUrlPaths[${index}] is not a valid regex pattern`);
            }
          } else {
            errors.push(`excludedUrlPaths[${index}] must be a string`);
          }
        }
      } else {
        errors.push('excludedUrlPaths must be an array');
      }
    }

    return { errors, warnings };
  }

  private applyConfigCorrections(config: TracelogConfig): TracelogConfig {
    const correctedConfig = { ...config };

    // Apply default values for invalid configs
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
      correctedConfig.sessionTimeout = 15 * 60 * 1000; // 15 minutes
    }

    return correctedConfig;
  }

  private async fetchConfigWithRetry(config: TracelogAppConfig): Promise<TracelogApiConfig | null> {
    const now = Date.now();

    // Rate limiting (5 seconds)
    if (now - this.lastFetchAttempt < 5000) {
      return null;
    }

    this.lastFetchAttempt = now;
    this.fetchAttempts++;

    if (this.fetchAttempts > this.maxFetchAttempts) {
      this.errorReporter.reportError({
        message: `Max fetch attempts exceeded (${this.maxFetchAttempts})`,
        severity: 'high',
      });

      return null;
    }

    return this.fetchConfig(config);
  }

  private async fetchConfig(_config: TracelogAppConfig): Promise<TracelogApiConfig | null> {
    try {
      const configUrl = this.getConfigUrl();

      if (!configUrl) {
        throw new Error('Config URL is not valid or not allowed');
      }

      // Validate URL before making request
      if (!isValidUrl(configUrl, 'tracelog.io')) {
        throw new Error('Config URL failed security validation');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10_000); // 10 second timeout

      const response = await fetch(configUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `TraceLog-Client/${packageJson.version}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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
      const apiConfig = { ...DEFAULT_TRACKING_API_CONFIG, ...(safeData as TracelogApiConfig) };

      // Reset fetch attempts on success
      this.fetchAttempts = 0;

      return apiConfig;
    } catch (error) {
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

  private getConfigUrl(): string | null {
    if (!this.id) {
      return null;
    }

    try {
      const configUrl = `https://${this.id}.tracelog.io/config`;

      // Additional validation
      if (!isValidUrl(configUrl, 'tracelog.io')) {
        return null;
      }

      return configUrl;
    } catch {
      return null;
    }
  }

  getApiUrl(): string | null {
    if (!this.id) {
      return null;
    }

    try {
      const apiUrl = `https://${this.id}.tracelog.io/api`;

      // Additional validation
      if (!isValidUrl(apiUrl, 'tracelog.io')) {
        return null;
      }

      return apiUrl;
    } catch {
      return null;
    }
  }

  getConfig(): TracelogConfig {
    return { ...this.config };
  }

  // Health check methods
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
