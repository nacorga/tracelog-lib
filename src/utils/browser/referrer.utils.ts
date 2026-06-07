import { log } from '../logging.utils';
import { normalizeUrl } from '../network/url.utils';

/**
 * List of compound TLDs that require special handling for root domain extraction.
 * Keep in sync with tracelog-api/src/utils/common/utils.ts
 */
const COMPOUND_TLDS = [
  'co.uk',
  'org.uk',
  'com.au',
  'net.au',
  'com.br',
  'co.nz',
  'co.jp',
  'com.mx',
  'co.in',
  'com.cn',
  'co.za',
];

/**
 * Extracts the root (registrable) domain from a hostname.
 * Handles both standard TLDs (.com, .org) and compound TLDs (.co.uk, .com.br).
 *
 * @example
 * getRootDomain('www.example.com') // 'example.com'
 * getRootDomain('app.blog.example.com') // 'example.com'
 * getRootDomain('shop.example.co.uk') // 'example.co.uk'
 */
const getRootDomain = (hostname: string): string => {
  const parts = hostname.toLowerCase().split('.');
  if (parts.length <= 2) {
    return hostname.toLowerCase();
  }
  const lastTwo = parts.slice(-2).join('.');
  if (COMPOUND_TLDS.includes(lastTwo)) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
};

/**
 * Checks if two hostnames belong to the same domain (including subdomains).
 * Extracts root domain and compares to handle cross-subdomain navigation.
 *
 * @example
 * isSameDomain('www.example.com', 'example.com') // true
 * isSameDomain('app.example.com', 'www.example.com') // true
 * isSameDomain('example.co.uk', 'app.example.co.uk') // true
 *
 * @param hostname1 - First hostname (e.g., 'www.example.com')
 * @param hostname2 - Second hostname (e.g., 'app.example.com')
 * @returns true if same root domain
 */
const isSameDomain = (hostname1: string, hostname2: string): boolean => {
  if (hostname1 === hostname2) {
    return true;
  }
  return getRootDomain(hostname1) === getRootDomain(hostname2);
};

/**
 * Returns the referrer if it's external, or 'Direct' if internal/empty.
 *
 * **Purpose**: Filter out internal referrers (same domain) to ensure
 * accurate traffic source attribution. Internal referrers occur when:
 * - Session expires and user navigates within the same site
 * - User opens new tab from an internal link
 * - Page refresh after session timeout
 *
 * **Logic**:
 * - Empty referrer → 'Direct'
 * - Referrer from same domain or subdomain → 'Direct' (internal navigation)
 * - External referrer → Returns original referrer
 *
 * **Subdomain Detection**:
 * - `www.example.com` → `example.com` ✓ (internal)
 * - `blog.example.com` → `example.com` ✓ (internal)
 * - `example.com` → `www.example.com` ✓ (internal)
 *
 * @param sensitiveQueryParams - Custom sensitive params to strip from the referrer (merged with defaults)
 * @returns External referrer URL (sensitive query params removed) or 'Direct'
 */
export const getExternalReferrer = (sensitiveQueryParams: string[] = []): string => {
  const referrer = document.referrer;
  if (!referrer) {
    return 'Direct';
  }
  try {
    const referrerHostname = new URL(referrer).hostname.toLowerCase();
    const currentHostname = window.location.hostname.toLowerCase();
    if (isSameDomain(referrerHostname, currentHostname)) {
      return 'Direct';
    }
    // Referrers can carry tokens (e.g. magic-link landing pages) — scrub like page_url
    return normalizeUrl(referrer, sensitiveQueryParams);
  } catch (error) {
    log('debug', 'Failed to parse referrer URL, using raw value', { error, data: { referrer } });
    return referrer;
  }
};
