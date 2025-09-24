import { DEFAULT_API_CONFIG, DEFAULT_CONFIG } from '../constants';
import { ApiConfig, AppConfig, Config, Mode, SpecialProjectId } from '../types';
import { isValidUrl, sanitizeApiConfig, fetchWithTimeout } from '../utils';
import { debugLog } from '../utils/logging';

export class ConfigManager {
  // Allowed origins for local development and production
  private readonly ALLOWED_ORIGINS = [
    // Development origins
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:8080',
  ];

  private readonly ALLOWED_ORIGIN_PATTERNS = [/^https:\/\/.*\.tracelog\.app$/, /^https:\/\/.*\.tracelog\.dev$/];

  async get(apiUrl: string, appConfig: AppConfig): Promise<Config> {
    if (appConfig.id === SpecialProjectId.HttpSkip) {
      debugLog.debug('ConfigManager', 'Using special project id');

      return this.getDefaultConfig(appConfig);
    }

    debugLog.debug('ConfigManager', 'Loading config from API', { apiUrl, projectId: appConfig.id });

    const config = await this.load(apiUrl, appConfig, appConfig.id === SpecialProjectId.HttpLocal);

    debugLog.info('ConfigManager', 'Config loaded successfully', {
      projectId: appConfig.id,
      mode: config.mode,
      hasExcludedPaths: !!config.excludedUrlPaths?.length,
      hasGlobalMetadata: !!config.globalMetadata,
    });

    return config;
  }

  private async load(apiUrl: string, appConfig: AppConfig, useLocalServer?: boolean): Promise<Config> {
    try {
      let configUrl: string;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      if (useLocalServer) {
        const currentOrigin = window.location.origin;

        // Validate origin before using it
        if (!this.isAllowedOrigin(currentOrigin, appConfig.id)) {
          debugLog.clientError('ConfigManager', 'Untrusted origin detected', {
            origin: currentOrigin,
            projectId: appConfig.id,
          });

          throw new Error(
            `Security: Origin '${currentOrigin}' is not allowed to load configuration. Please use an authorized domain.`,
          );
        }

        configUrl = `${currentOrigin}/config`;
        // Add security header for local server validation
        headers['X-TraceLog-Project'] = appConfig.id;

        debugLog.debug('ConfigManager', 'Using local server with validated origin', {
          origin: currentOrigin,
          projectId: appConfig.id,
        });
      } else {
        configUrl = this.getUrl(apiUrl);
      }

      if (!configUrl) {
        throw new Error('Config URL is not valid or not allowed');
      }

      const response = await fetchWithTimeout(configUrl, {
        method: 'GET',
        headers,
        timeout: 10000, // 10 segundos timeout
      });

      if (!response.ok) {
        const error = `HTTP ${response.status}: ${response.statusText}`;

        debugLog.error('ConfigManager', 'Config API request failed', {
          status: response.status,
          statusText: response.statusText,
          configUrl,
        });

        throw new Error(error);
      }

      // Validate response content-type for security
      const contentType = response.headers.get('content-type');

      if (!contentType?.includes('application/json')) {
        debugLog.clientError('ConfigManager', 'Invalid response content-type', {
          contentType,
          configUrl,
        });

        throw new Error(`Security: Invalid response content-type. Expected application/json, got ${contentType}`);
      }

      const rawData = await response.json();

      if (rawData === undefined || rawData === null || typeof rawData !== 'object' || Array.isArray(rawData)) {
        debugLog.error('ConfigManager', 'Invalid config API response format', {
          responseType: typeof rawData,
          isArray: Array.isArray(rawData),
        });

        throw new Error('Invalid config API response: expected object');
      }

      const safeApiConfig = sanitizeApiConfig(rawData);
      const apiConfig: ApiConfig = { ...DEFAULT_API_CONFIG, ...safeApiConfig };
      const mergedConfig: Config = { ...apiConfig, ...appConfig };

      // Check if qaMode=true is in URL and automatically set mode to 'qa'
      const urlParameters = new URLSearchParams(window.location.search);
      const isQaMode = urlParameters.get('qaMode') === 'true';

      if (isQaMode && !mergedConfig.mode) {
        mergedConfig.mode = Mode.QA;
        debugLog.info('ConfigManager', 'QA mode enabled via URL parameter');
      }

      const errorSampling = Object.values(Mode).includes(mergedConfig.mode as Mode)
        ? 1
        : (mergedConfig.errorSampling ?? 0.1);

      const finalConfig: Config = { ...mergedConfig, errorSampling };

      return finalConfig;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      debugLog.error('ConfigManager', 'Failed to load config', { error: errorMessage, apiUrl });
      throw new Error(`Failed to load config: ${errorMessage}`);
    }
  }

  private getUrl(apiUrl: string): string {
    const urlParameters = new URLSearchParams(window.location.search);
    const isQaMode = urlParameters.get('qaMode') === 'true';

    let configUrl = `${apiUrl}/config`;

    if (isQaMode) {
      configUrl += '?qaMode=true';
    }

    if (!isValidUrl(configUrl)) {
      debugLog.clientError('ConfigManager', 'Invalid config URL provided', { configUrl });
      throw new Error('Config URL is not valid or not allowed');
    }

    return configUrl;
  }

  /**
   * Validates if an origin is allowed to load configuration
   * @param origin - The origin to validate (e.g., 'http://localhost:3000')
   * @param projectId - The project ID for logging purposes
   * @returns True if the origin is allowed, false otherwise
   */
  private isAllowedOrigin(origin: string, projectId: string): boolean {
    // Check exact match in allowed origins list
    if (this.ALLOWED_ORIGINS.includes(origin)) {
      debugLog.debug('ConfigManager', 'Origin validated via exact match', { origin, projectId });

      return true;
    }

    // Check pattern match for production domains
    const matchesPattern = this.ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));

    if (matchesPattern) {
      debugLog.debug('ConfigManager', 'Origin validated via pattern match', { origin, projectId });

      return true;
    }

    // Origin not allowed
    debugLog.clientError('ConfigManager', 'Origin validation failed', {
      origin,
      projectId,
      allowedOrigins: this.ALLOWED_ORIGINS,
    });

    return false;
  }

  private getDefaultConfig(appConfig: AppConfig): Config {
    return DEFAULT_CONFIG({
      ...appConfig,
      errorSampling: 1,
      ...(Object.values(SpecialProjectId).includes(appConfig.id as SpecialProjectId) && { mode: Mode.DEBUG }),
    });
  }
}
