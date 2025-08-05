import { DEFAULT_API_CONFIG, DEFAULT_CONFIG, DEFAULT_DEMO_CONFIG, DEFAULT_TEST_CONFIG } from '../constants';
import { ApiConfig, AppConfig, Config } from '../types';
import { isValidUrl, sanitizeApiConfig } from '../utils';

export class ConfigManager {
  async get(apiUrl: string, appConfig: AppConfig): Promise<Config> {
    const config = ['demo', 'test'].includes(appConfig.id)
      ? this.getDefaultConfig(appConfig.id)
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

      const data: ApiConfig = await response.json();

      if (data === undefined || data === null) {
        throw new Error('Invalid config API response');
      }

      const safeApiConfig = sanitizeApiConfig(data);
      const apiConfig = { ...DEFAULT_API_CONFIG, ...safeApiConfig };

      return { ...apiConfig, ...appConfig };
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

  private getDefaultConfig(id: string): Config {
    const configRecords: Record<string, Config> = {
      ['demo']: DEFAULT_DEMO_CONFIG,
      ['test']: DEFAULT_TEST_CONFIG,
    };

    return configRecords[id] ?? DEFAULT_CONFIG;
  }
}
