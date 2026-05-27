import { ClickIds } from '../../types/event.types';

/**
 * Ad-network click identifiers auto-appended to landing URLs: Google Ads
 * (`gclid`, plus the iOS-privacy variants `gbraid`/`wbraid`), Meta (`fbclid`),
 * and TikTok (`ttclid`). Param name and `ClickIds` key are identical, so no
 * prefix transformation is needed (unlike UTM).
 */
const CLICK_ID_PARAMS = ['gclid', 'gbraid', 'wbraid', 'fbclid', 'ttclid'] as const;

/**
 * Extracts ad-network click identifiers from the current URL.
 * @returns ClickIds object or undefined if none are present
 */
export const getClickIds = (): ClickIds | undefined => {
  const urlParams = new URLSearchParams(window.location.search);
  const clickIds: ClickIds = {};

  CLICK_ID_PARAMS.forEach((param) => {
    const value = urlParams.get(param);

    if (value) {
      clickIds[param] = value;
    }
  });

  const result = Object.keys(clickIds).length ? clickIds : undefined;

  return result;
};
