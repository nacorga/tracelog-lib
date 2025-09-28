import { DEFAULT_API_CONFIG, DEFAULT_CONFIG, REQUEST_TIMEOUT_MS } from '../constants';
import { ApiConfig, AppConfig, Config, Mode, SpecialProjectId } from '../types';
import { sanitizeApiConfig, fetchWithTimeout } from '../utils';
import { debugLog } from '../utils/logging';

/**
 * Configuration manager responsible for loading and merging application configuration.
 *
 * Handles three configuration sources:
 * 1. Default configuration (fallback values)
 * 2. API configuration (server-side settings)
 * 3. App configuration (client initialization settings)
 *
 * Supports special project IDs for development and testing:
 * - 'skip': Bypasses all network calls, uses defaults
 * - 'localhost:PORT': Loads config from local development server
 */
export class ConfigManager {
  private static readonly LOCALHOST_PATTERN = /^localhost:\d{1,5}$/;
  private static readonly PRODUCTION_DOMAINS = [/^https:\/\/.*\.tracelog\.app$/, /^https:\/\/.*\.tracelog\.dev$/];

  /**
   * Gets complete configuration by merging default, API, and app configurations.
   *
   * @param apiUrl - Base URL for the configuration API
   * @param appConfig - Client-side configuration from init()
   * @returns Promise<Config> - Merged configuration object
   */
  async get(apiUrl: string, appConfig: AppConfig): Promise<Config> {
    // Handle skip mode - no network calls
    if (appConfig.id === SpecialProjectId.Skip) {
      return this.createDefaultConfig(appConfig);
    }

    const config = await this.loadFromApi(apiUrl, appConfig);

    debugLog.info('ConfigManager', 'Configuration loaded', {
      projectId: appConfig.id,
      mode: config.mode,
      hasTags: !!config.tags?.length,
      hasExclusions: !!config.excludedUrlPaths?.length,
    });

    return config;
  }

  /**
   * Loads configuration from API and merges with app config.
   */
  private async loadFromApi(apiUrl: string, appConfig: AppConfig): Promise<Config> {
    try {
      const configUrl = this.buildConfigUrl(apiUrl, appConfig);
      const headers = this.buildHeaders(appConfig);

      const response = await fetchWithTimeout(configUrl, {
        method: 'GET',
        headers,
        timeout: REQUEST_TIMEOUT_MS,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const rawData = await this.parseJsonResponse(response);
      return this.mergeConfigurations(rawData, appConfig);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      debugLog.error('ConfigManager', 'Failed to load configuration', {
        error: errorMessage,
        apiUrl,
        projectId: appConfig.id,
      });
      throw new Error(`Configuration load failed: ${errorMessage}`);
    }
  }

  /**
   * Builds the configuration URL based on project type and QA mode.
   */
  private buildConfigUrl(apiUrl: string, appConfig: AppConfig): string {
    const isLocalhost = appConfig.id.startsWith(SpecialProjectId.Localhost);

    if (isLocalhost) {
      this.validateLocalhostProjectId(appConfig.id);
      return `http://${appConfig.id}/config`;
    }

    const baseUrl = `${apiUrl}/config`;
    const isQaMode = this.isQaModeEnabled();

    return isQaMode ? `${baseUrl}?qaMode=true` : baseUrl;
  }

  /**
   * Builds request headers based on project configuration.
   */
  private buildHeaders(appConfig: AppConfig): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (appConfig.id.startsWith(SpecialProjectId.Localhost)) {
      headers['X-TraceLog-Project'] = appConfig.id;
    }

    return headers;
  }

  /**
   * Parses and validates JSON response from config API.
   */
  private async parseJsonResponse(response: Response): Promise<Record<string, unknown>> {
    const contentType = response.headers.get('content-type');

    if (!contentType?.includes('application/json')) {
      throw new Error('Invalid response content-type, expected JSON');
    }

    const rawData = await response.json();

    if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
      throw new Error('Invalid response format, expected object');
    }

    return rawData;
  }

  /**
   * Validates localhost project ID format and port range.
   */
  private validateLocalhostProjectId(projectId: string): void {
    if (!ConfigManager.LOCALHOST_PATTERN.test(projectId)) {
      throw new Error(`Invalid localhost format. Expected 'localhost:PORT', got '${projectId}'`);
    }

    const port = parseInt(projectId.split(':')[1], 10);

    if (port < 1 || port > 65535) {
      throw new Error(`Port must be between 1 and 65535, got ${port}`);
    }
  }

  /**
   * Checks if QA mode is enabled via URL parameter.
   */
  private isQaModeEnabled(): boolean {
    const params = new URLSearchParams(window.location.search);
    return params.get('qaMode') === 'true';
  }

  /**
   * Merges API configuration with app configuration and applies mode-specific settings.
   */
  private mergeConfigurations(rawApiConfig: Record<string, unknown>, appConfig: AppConfig): Config {
    const safeApiConfig = sanitizeApiConfig(rawApiConfig);
    const apiConfig: ApiConfig = { ...DEFAULT_API_CONFIG, ...safeApiConfig };
    const mergedConfig: Config = { ...appConfig, ...apiConfig };

    // Apply QA mode if enabled via URL parameter
    if (this.isQaModeEnabled() && !mergedConfig.mode) {
      mergedConfig.mode = Mode.QA;
      debugLog.info('ConfigManager', 'QA mode enabled via URL parameter');
    }

    // Set error sampling based on mode
    const errorSampling = Object.values(Mode).includes(mergedConfig.mode as Mode)
      ? 1 // Full sampling for debug/qa modes
      : (mergedConfig.errorSampling ?? 0.1); // Default sampling for production

    return { ...mergedConfig, errorSampling };
  }

  /**
   * Creates default configuration for skip mode and fallback scenarios.
   */
  private createDefaultConfig(appConfig: AppConfig): Config {
    return DEFAULT_CONFIG({
      ...appConfig,
      errorSampling: 1,
      ...(appConfig.id === SpecialProjectId.Skip && { mode: Mode.DEBUG }),
    });
  }
}
