import { getApiUrl, isValidUrl } from '../utils';
import { SpecialProjectId } from '../types';

export class ApiManager {
  getUrl(id: string, allowHttp = false): string {
    if (id.startsWith(SpecialProjectId.Localhost)) {
      const url = `http://${id}`;

      if (!isValidUrl(url, true)) {
        throw new Error('Invalid URL');
      }

      return url;
    }

    const url = getApiUrl(id, allowHttp);

    if (!isValidUrl(url, allowHttp)) {
      throw new Error('Invalid URL');
    }

    return url;
  }
}
