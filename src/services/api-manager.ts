import { isValidUrl } from '../utils/validations';
import { StateManager } from './state-manager';

export class ApiManager extends StateManager {
  set(id: string): void {
    this.setState('apiUrl', this.getUrl(id));
  }

  private getUrl(id: string): string {
    const url = new URL(window.location.href);
    const host = url.hostname;
    const parts = host.split('.');

    if (parts.length === 0) {
      throw new Error('Invalid URL');
    }

    const cleanDomain = parts.slice(-2).join('.');
    const apiUrl = `https://${id}.${cleanDomain}`;
    const isValid = isValidUrl(apiUrl);

    if (!isValid) {
      throw new Error('Invalid URL');
    }

    return apiUrl;
  }
}
