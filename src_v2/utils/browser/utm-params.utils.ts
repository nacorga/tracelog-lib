import { UTM_PARAMS } from '../../constants';
import { UTM } from '../../types/event.types';
import { debugLog } from '../logging';

/**
 * Extracts UTM parameters from the current URL
 * @returns UTM parameters object or undefined if none found
 */
export const getUTMParameters = (): UTM | undefined => {
  debugLog.debug('UTMParams', 'Extracting UTM parameters from URL', {
    url: window.location.href,
    search: window.location.search,
  });

  const urlParams = new URLSearchParams(window.location.search);
  const utmParams: Partial<Record<keyof UTM, string>> = {};

  UTM_PARAMS.forEach((param) => {
    const value = urlParams.get(param);

    if (value) {
      const key = param.split('utm_')[1] as keyof UTM;
      utmParams[key] = value;
      debugLog.debug('UTMParams', 'Found UTM parameter', { param, key, value });
    }
  });

  const result = Object.keys(utmParams).length ? utmParams : undefined;

  if (result) {
    debugLog.debug('UTMParams', 'UTM parameters extracted successfully', {
      parameterCount: Object.keys(result).length,
      parameters: Object.keys(result),
    });
  } else {
    debugLog.debug('UTMParams', 'No UTM parameters found in URL');
  }

  return result;
};
