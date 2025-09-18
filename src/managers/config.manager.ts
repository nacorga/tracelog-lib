import { DEFAULT_API_CONFIG, DEFAULT_CONFIG } from '../constants';
import { ApiConfig, AppConfig, Config } from '../types';
import { isValidUrl, sanitizeApiConfig } from '../utils';
import { debugLog } from '../utils/logging';

export class ConfigManager {
  async get(apiUrl: string, appConfig: AppConfig): Promise<Config> {
    const isTestMode = ['demo', 'test'].includes(appConfig.id);

    if (isTestMode) {
      debugLog.debug('ConfigManager', 'Using default config for test mode', { projectId: appConfig.id });
      return this.getDefaultConfig(appConfig);
    }

    debugLog.debug('ConfigManager', 'Loading config from API', { apiUrl, projectId: appConfig.id });
    const config = await this.load(apiUrl, appConfig);

    debugLog.info('ConfigManager', 'Config loaded successfully', {
      projectId: appConfig.id,
      mode: config.mode,
      hasExcludedPaths: !!config.excludedUrlPaths?.length,
      hasGlobalMetadata: !!config.globalMetadata,
    });

    return config;
  }

  private async load(apiUrl: string, appConfig: AppConfig): Promise<Config> {
    try {
      const configUrl = this.getUrl(apiUrl);

      if (!configUrl) {
        throw new Error('Config URL is not valid or not allowed');
      }

      const response = await fetch(configUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
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
        mergedConfig.mode = 'qa';
        debugLog.info('ConfigManager', 'QA mode enabled via URL parameter');
      }

      const errorSampling =
        mergedConfig.mode === 'qa' || mergedConfig.mode === 'debug' ? 1 : (mergedConfig.errorSampling ?? 0.1);
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

  private getDefaultConfig(appConfig: AppConfig): Config {
    const defaultConfig: Config = DEFAULT_CONFIG({
      ...appConfig,
      errorSampling: 1,
    });

    const configRecords: Record<string, Config> = {
      ['demo']: { ...defaultConfig, mode: 'qa' },
      ['test']: { ...defaultConfig, mode: 'debug' },
    };

    return configRecords[appConfig.id] ?? DEFAULT_CONFIG(appConfig);
  }
}
