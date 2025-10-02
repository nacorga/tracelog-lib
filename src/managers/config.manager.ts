import { DEFAULT_API_CONFIG, REQUEST_TIMEOUT_MS } from '../constants';
import { ApiConfig, AppConfig, Config, Mode, SpecialProjectId } from '../types';
import { sanitizeApiConfig, fetchWithTimeout } from '../utils';
import { debugLog } from '../utils/logging';
import { ConfigBuilder } from './config.builder';

/**
 * Configuration manager responsible for loading and merging application configuration.
 *
 * Handles configuration from two sources:
 * 1. API configuration (server-side settings)
 * 2. App configuration (client initialization settings)
 *
 * Uses ConfigBuilder for centralized merge logic.
 *
 * Supports special project IDs for development and testing:
 * - 'skip': Bypasses all network calls, uses defaults
 * - 'localhost:8080': Loads config from local development server
 */
export class ConfigManager {
  private static readonly PRODUCTION_DOMAINS = [/^https:\/\/.*\.tracelog\.app$/, /^https:\/\/.*\.tracelog\.dev$/];

  /**
   * Gets complete configuration by loading API config and building final config.
   *
   * @param apiUrl - Base URL for the configuration API
   * @param appConfig - Client-side configuration from init()
   * @returns Promise<Config> - Merged configuration object
   */
  async get(apiUrl: string, appConfig: AppConfig): Promise<Config> {
    // Handle skip mode - no network calls for config
    // Support 'skip' or any ID starting with 'skip-' (e.g., 'skip-1', 'skip-2')
    // Also handle 'fail' mode (SpecialProjectId.Fail) - skip config but fail event sends
    if (
      appConfig.id === SpecialProjectId.Skip ||
      appConfig.id === SpecialProjectId.Fail ||
      appConfig.id.toLowerCase().startsWith('skip-')
    ) {
      return this.createDefaultConfig(appConfig);
    }

    const apiConfig = await this.loadFromApi(apiUrl, appConfig);

    // Apply QA mode from URL parameter if set
    const finalApiConfig = this.applyQaModeIfEnabled(apiConfig);

    const config = ConfigBuilder.build(appConfig, finalApiConfig);

    debugLog.info('ConfigManager', 'Configuration loaded', {
      projectId: config.id,
      mode: config.mode,
      hasTags: !!config.tags?.length,
      hasExclusions: !!config.excludedUrlPaths?.length,
    });

    return config;
  }

  /**
   * Loads configuration from API and returns sanitized API config.
   * Only returns values explicitly provided by the API.
   */
  private async loadFromApi(apiUrl: string, appConfig: AppConfig): Promise<ApiConfig> {
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
      const apiConfig = sanitizeApiConfig(rawData);

      // Only merge defaults for fields that are arrays (to ensure they're never undefined)
      return {
        ...apiConfig,
        excludedUrlPaths: apiConfig.excludedUrlPaths ?? DEFAULT_API_CONFIG.excludedUrlPaths,
        tags: apiConfig.tags ?? DEFAULT_API_CONFIG.tags,
      };
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
    const isLocalhost = appConfig.id === SpecialProjectId.Localhost || appConfig.id === SpecialProjectId.Fail;

    if (isLocalhost) {
      return `http://${appConfig.id}/config`;
    }

    const baseUrl = `${apiUrl}/config`;
    const isQaMode = this.isQaModeEnabled();

    return isQaMode ? `${baseUrl}?qaMode=true` : baseUrl;
  }

  /**
   * Builds request headers based on project configuration.
   * Always includes X-TraceLog-Project header for consistent identification.
   */
  private buildHeaders(appConfig: AppConfig): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-TraceLog-Project': appConfig.id,
    };
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
   * Checks if QA mode is enabled via URL parameter.
   */
  private isQaModeEnabled(): boolean {
    const params = new URLSearchParams(window.location.search);
    return params.get('qaMode') === 'true';
  }

  /**
   * Applies QA mode to API config if enabled via URL parameter.
   */
  private applyQaModeIfEnabled(apiConfig: ApiConfig): ApiConfig {
    if (this.isQaModeEnabled() && !apiConfig.mode) {
      debugLog.info('ConfigManager', 'QA mode enabled via URL parameter');
      return { ...apiConfig, mode: Mode.QA };
    }

    return apiConfig;
  }

  /**
   * Creates default configuration for skip mode and fallback scenarios.
   * Only uses API defaults for fields not provided by the app config.
   */
  private createDefaultConfig(appConfig: AppConfig): Config {
    // Only use DEFAULT_API_CONFIG for fields not provided in appConfig
    const apiConfig: ApiConfig = {
      // Only use defaults if app config doesn't provide these values
      tags: DEFAULT_API_CONFIG.tags,
      ipExcluded: DEFAULT_API_CONFIG.ipExcluded,
      ...(appConfig.samplingRate === undefined && { samplingRate: DEFAULT_API_CONFIG.samplingRate }),
      // Don't override excludedUrlPaths if provided by app config
      // ConfigBuilder will handle the fallback to [] if both are undefined
    };

    return ConfigBuilder.build(appConfig, apiConfig);
  }
}
