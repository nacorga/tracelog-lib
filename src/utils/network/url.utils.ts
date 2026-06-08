import { Config } from '../../types';
import { DEFAULT_SENSITIVE_QUERY_PARAMS, INGEST_HOST } from '../../constants';
import { log } from '../logging.utils';

/**
 * Validates if a URL is valid HTTPS
 */
const isValidUrl = (url: string): boolean => {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Generates the hosted, zero-DNS collect URL for a project.
 *
 * This is the DEFAULT transport: a CORS endpoint that works the instant the snippet is
 * pasted, with no merchant DNS setup. Unlike {@link generateFirstPartyApiUrl} it does
 * NOT depend on the page's domain, so it is valid on any host (including localhost).
 * @param projectId - The TraceLog project identifier.
 * @returns `${INGEST_HOST}/p/{projectId}/collect`.
 */
const generateHostedApiUrl = (projectId: string): string => {
  return `${INGEST_HOST}/p/${encodeURIComponent(projectId)}/collect`;
};

/**
 * Generates a first-party SaaS API URL ("Accuracy mode") from the project ID and the
 * current browser domain (`https://{projectId}.{rootDomain}/collect`, a CNAME → middleware).
 *
 * Opt-in only (`integrations.tracelog.firstParty: true`). Requires a real domain hostname,
 * so it rejects on localhost / raw IPs — for local development omit `integrations.tracelog`
 * (standalone mode) or use the hosted default.
 * @param projectId - The project ID to use as a subdomain.
 * @returns The generated first-party SaaS API URL.
 */
const generateFirstPartyApiUrl = (projectId: string): string => {
  try {
    const url = new URL(window.location.href);
    const host = url.hostname;

    if (!host || typeof host !== 'string') {
      throw new Error('Invalid hostname');
    }

    if (host === 'localhost' || host === '127.0.0.1' || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
      throw new Error(
        'SaaS integration requires a domain hostname; localhost and IP addresses are not supported. ' +
          'For local development, omit `integrations.tracelog` to run in standalone mode (events emitted locally, ' +
          'no network requests), or test against a staging domain that resolves to your dev machine via /etc/hosts.',
      );
    }

    const parts = host.split('.');

    if (!parts || !Array.isArray(parts) || parts.length === 0 || (parts.length === 1 && parts[0] === '')) {
      throw new Error('Invalid hostname structure');
    }

    if (parts.length === 1) {
      throw new Error('Single-part domain not supported for SaaS integration');
    }

    const cleanDomain = parts.length === 2 ? parts.join('.') : parts.slice(-2).join('.');

    if (!cleanDomain || cleanDomain.split('.').length < 2) {
      throw new Error('Invalid domain structure for SaaS');
    }

    const collectApiUrl = `https://${projectId}.${cleanDomain}/collect`;

    if (!isValidUrl(collectApiUrl)) {
      throw new Error('Generated URL failed validation');
    }

    return collectApiUrl;
  } catch (error) {
    throw new Error(`Invalid SaaS URL configuration: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Generates collection API URLs for the configured TraceLog SaaS integration.
 *
 * Defaults to the hosted, zero-DNS endpoint so the snippet works the moment it is pasted
 * (this kills the silent zero-event activation failure caused by an unconfigured CNAME).
 * Only when the merchant explicitly opts into Accuracy mode (`integrations.tracelog.firstParty`)
 * does it derive the first-party subdomain URL from the page domain.
 * @param config - The TraceLog configuration
 * @returns Object containing the SaaS API URL (if a projectId is configured)
 */
export const getCollectApiUrls = (config: Config): { saas?: string } => {
  const urls: { saas?: string } = {};
  const tracelog = config.integrations?.tracelog;

  if (tracelog?.projectId) {
    urls.saas = tracelog.firstParty
      ? generateFirstPartyApiUrl(tracelog.projectId)
      : generateHostedApiUrl(tracelog.projectId);
  }

  return urls;
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
    log('warn', 'Invalid URL provided to normalizeUrl', { data: { type: typeof url } });
    return url || '';
  }

  try {
    let urlObject: URL;
    let isRelative = false;

    try {
      urlObject = new URL(url);
    } catch {
      // Relative URL (e.g. click hrefs like "/checkout?token=x") — resolve against
      // the current page so sensitive params can still be stripped.
      urlObject = new URL(url, window.location.href);
      isRelative = true;
    }

    const searchParams = urlObject.searchParams;

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

    if (!hasChanged && (isRelative || url.includes('?'))) {
      return url;
    }

    urlObject.search = searchParams.toString();

    // Preserve the relative form — returning the resolved absolute URL would
    // change the captured data shape (e.g. click hrefs) for no privacy gain.
    return isRelative ? `${urlObject.pathname}${urlObject.search}${urlObject.hash}` : urlObject.toString();
  } catch (error) {
    log('warn', 'URL normalization failed, returning original', { error, data: { urlLength: url?.length } });
    return url;
  }
};
