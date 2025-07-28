export const buildDynamicApiUrl = (id: string): string | undefined => {
  try {
    const url = new URL(window.location.href);
    const host = url.hostname;

    if (!host) {
      return undefined;
    }

    const parts = host.split('.');

    if (parts.length < 2) {
      return undefined;
    }

    const tld = parts.slice(-2).join('.');
    const multiTlds = new Set(['co.uk', 'com.au', 'co.jp', 'co.in', 'com.br', 'com.mx']);

    const cleanDomain = multiTlds.has(tld) && parts.length >= 3 ? parts.slice(-3).join('.') : tld;
    const apiUrl = `https://${id}.${cleanDomain}`;

    try {
      const parsed = new URL(apiUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return undefined;
      }
    } catch {
      return undefined;
    }

    return apiUrl;
  } catch {
    return undefined;
  }
};
