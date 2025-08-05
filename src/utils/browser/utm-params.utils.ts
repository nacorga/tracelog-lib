import { UTM_PARAMS } from '../../constants';
import { UTM } from '../../types/event.types';

/**
 * Extracts UTM parameters from the current URL
 * @returns UTM parameters object or undefined if none found
 */
export const getUTMParameters = (): UTM | undefined => {
  const urlParams = new URLSearchParams(window.location.search);
  const utmParams: Partial<Record<keyof UTM, string>> = {};

  UTM_PARAMS.forEach((param) => {
    const value = urlParams.get(param);

    if (value) {
      const key = param.split('utm_')[1] as keyof UTM;

      utmParams[key] = value;
    }
  });

  return Object.keys(utmParams).length ? utmParams : undefined;
};
