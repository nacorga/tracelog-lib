import { Config } from '../../types';
import { DEFAULT_SENSITIVE_QUERY_PARAMS } from '../../constants';
import { log } from '../logging.utils';

/**
 * Validates if a URL is valid and optionally allows HTTP URLs
 * @param url - The URL to validate
 * @param allowHttp - Whether to allow HTTP URLs (default: false)
 * @returns True if the URL is valid, false otherwise
 */
const isValidUrl = (url: string, allowHttp = false): boolean => {
  try {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const isHttp = parsed.protocol === 'http:';

    return isHttps || (allowHttp && isHttp);
  } catch {
    return false;
  }
};

/**
 * Generates API URLs for all configured integrations
 * @param config - The configuration object
 * @returns Object containing URLs for each integration (empty string if not configured)
 */
export const getCollectApiUrls = (config: Config): { saas: string; custom: string } => {
  const result = {
    saas: '',
    custom: '',
  };

  // TraceLog SaaS URL generation
  if (config.integrations?.tracelog?.projectId) {
    try {
      const url = new URL(window.location.href);
      const host = url.hostname;

      if (!host || typeof host !== 'string') {
        throw new Error('Invalid hostname');
      }

      const parts = host.split('.');

      if (!parts || !Array.isArray(parts) || parts.length === 0 || (parts.length === 1 && parts[0] === '')) {
        throw new Error('Invalid hostname structure');
      }

      const projectId = config.integrations.tracelog.projectId;
      const cleanDomain = parts.slice(-2).join('.');

      if (!cleanDomain) {
        throw new Error('Invalid domain');
      }

      const saasUrl = `https://${projectId}.${cleanDomain}/collect`;
      const isValid = isValidUrl(saasUrl);

      if (!isValid) {
        throw new Error('Invalid TraceLog SaaS URL');
      }

      result.saas = saasUrl;
    } catch (error) {
      log('error', 'Failed to generate TraceLog SaaS URL', {
        error,
        data: { projectId: config.integrations.tracelog.projectId },
      });

      result.saas = '';
    }
  }

  if (config.integrations?.custom?.collectApiUrl) {
    const customUrl = config.integrations.custom.collectApiUrl;
    const allowHttp = config.integrations.custom.allowHttp ?? false;
    const isValid = isValidUrl(customUrl, allowHttp);

    if (!isValid) {
      log('error', 'Invalid custom collectApiUrl', { data: { url: customUrl } });
      result.custom = '';
    } else {
      result.custom = customUrl;
    }
  }

  return result;
};

/**
 * Normalizes a URL by removing sensitive query parameters
 * Combines default sensitive parameters with custom ones provided by user
 * @param url - The URL to normalize
 * @param sensitiveQueryParams - Array of parameter names to remove (merged with defaults)
 * @returns The normalized URL
 */
export const normalizeUrl = (url: string, sensitiveQueryParams: string[] = []): string => {
  if (!url || typeof url !== 'string') {
    log('warn', 'Invalid URL provided to normalizeUrl', { data: { url: String(url) } });
    return url || '';
  }

  try {
    const urlObject = new URL(url);
    const searchParams = urlObject.searchParams;

    // Merge default sensitive params with user-provided ones (deduped via Set)
    const allSensitiveParams = [...new Set([...DEFAULT_SENSITIVE_QUERY_PARAMS, ...sensitiveQueryParams])];

    let hasChanged = false;
    const removedParams: string[] = [];

    allSensitiveParams.forEach((param) => {
      if (searchParams.has(param)) {
        searchParams.delete(param);
        hasChanged = true;
        removedParams.push(param);
      }
    });

    if (!hasChanged && url.includes('?')) {
      return url;
    }

    urlObject.search = searchParams.toString();
    const result = urlObject.toString();

    return result;
  } catch (error) {
    const urlPreview = url && typeof url === 'string' ? url.slice(0, 100) : String(url);
    log('warn', 'URL normalization failed, returning original', { error, data: { url: urlPreview } });

    return url;
  }
};
