import { DEFAULT_API_CONFIG, DEFAULT_CONFIG } from '../constants';
import { ApiConfig, AppConfig, Config, Mode, SpecialProjectId } from '../types';
import { isValidUrl, sanitizeApiConfig, fetchWithTimeout } from '../utils';
import { debugLog } from '../utils/logging';

export class ConfigManager {
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
      const configUrl = useLocalServer ? `${window.location.origin}/config` : this.getUrl(apiUrl);

      if (!configUrl) {
        throw new Error('Config URL is not valid or not allowed');
      }

      const response = await fetchWithTimeout(configUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
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

  private getDefaultConfig(appConfig: AppConfig): Config {
    return DEFAULT_CONFIG({
      ...appConfig,
      errorSampling: 1,
      ...(Object.values(SpecialProjectId).includes(appConfig.id as SpecialProjectId) && { mode: Mode.DEBUG }),
    });
  }
}
