/**
 * Google Consent Mode v2 consent types.
 * @see https://developers.google.com/tag-platform/security/guides/consent
 */
export type GoogleConsentType =
  | 'analytics_storage'
  | 'ad_storage'
  | 'ad_user_data'
  | 'ad_personalization'
  | 'personalization_storage';

/**
 * Google Consent Mode state values.
 */
export type GoogleConsentState = 'granted' | 'denied';

/**
 * Google Consent Mode v2 categories configuration.
 * Defines which categories to grant when consent is given.
 *
 * - 'all': Grant all 5 Google Consent Mode categories
 * - Object: Granular control per category
 *   - true: Grant this category when consent is given
 *   - false: Deny this category even when consent is given
 *   - undefined: Don't manage this category (respects external CMP)
 *
 * @example
 * ```typescript
 * // Grant all categories
 * consentCategories: 'all'
 *
 * // GDPR typical: Analytics YES, Ads NO
 * consentCategories: {
 *   analytics_storage: true,
 *   ad_storage: false,
 *   ad_user_data: false,
 *   ad_personalization: false
 * }
 * ```
 */
export type GoogleConsentCategories = 'all' | Partial<Record<GoogleConsentType, boolean>>;
