import { DEFAULT_API_CONFIG, DEFAULT_CONFIG } from '../constants';
import { ApiConfig, AppConfig, Config } from '../types';
import { isValidUrl, sanitizeApiConfig } from '../utils';

export class ConfigManager {
  async get(apiUrl: string, appConfig: AppConfig): Promise<Config> {
    const config = ['demo', 'test'].includes(appConfig.id)
      ? this.getDefaultConfig(appConfig)
      : await this.load(apiUrl, appConfig);

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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const rawData = await response.json();

      if (rawData === undefined || rawData === null || typeof rawData !== 'object' || Array.isArray(rawData)) {
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
      }

      const errorSampling =
        mergedConfig.mode === 'qa' || mergedConfig.mode === 'debug' ? 1 : (mergedConfig.errorSampling ?? 0.1);
      const finalConfig: Config = { ...mergedConfig, errorSampling };

      return finalConfig;
    } catch (error) {
      throw new Error(`Failed to load config: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new Error('Config URL is not valid or not allowed');
    }

    return configUrl;
  }

  private getDefaultConfig(appConfig: AppConfig): Config {
    const defaultConfig: Config = DEFAULT_CONFIG({
      ...appConfig,
      mode: 'qa',
      errorSampling: 1,
    });

    const configRecords: Record<string, Config> = {
      ['demo']: defaultConfig,
      ['test']: defaultConfig,
    };

    return configRecords[appConfig.id] ?? DEFAULT_CONFIG(appConfig);
  }
}
