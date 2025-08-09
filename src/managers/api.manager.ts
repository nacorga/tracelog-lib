import { getApiUrl, isValidUrl } from '../utils';

export class ApiManager {
  getUrl(id: string, allowHttp = false): string {
    const url = getApiUrl(id, allowHttp);

    if (!isValidUrl(url, allowHttp)) {
      throw new Error('Invalid URL');
    }

    return url;
  }
}
