import { GoogleConsentCategories, GoogleConsentType } from '../../types';

/**
 * Validates Google Consent Mode categories configuration.
 *
 * @param categories - Categories to validate
 * @returns true if valid, false otherwise
 */
export function isValidGoogleConsentCategories(categories: unknown): categories is GoogleConsentCategories {
  if (categories === 'all') {
    return true;
  }

  if (typeof categories !== 'object' || categories === null || Array.isArray(categories)) {
    return false;
  }

  const validKeys: GoogleConsentType[] = [
    'analytics_storage',
    'ad_storage',
    'ad_user_data',
    'ad_personalization',
    'personalization_storage',
  ];

  const categoriesObj = categories as Record<string, unknown>;

  for (const key of Object.keys(categoriesObj)) {
    if (!validKeys.includes(key as GoogleConsentType)) {
      return false;
    }

    if (typeof categoriesObj[key] !== 'boolean') {
      return false;
    }
  }

  return true;
}
