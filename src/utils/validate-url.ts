export const validateUrl = (url: string, allowedDomain: string): boolean => {
  try {
    const parsed = new URL(url);
    const isHttpsOrLocalhost =
      parsed.protocol === 'https:' ||
      (parsed.protocol === 'http:' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'));

    // Secure subdomain validation: ensure it's exactly the domain or a proper subdomain
    const hostname = parsed.hostname;
    const isAllowedDomain =
      hostname === allowedDomain || (hostname.endsWith('.' + allowedDomain) && hostname !== allowedDomain);

    return isHttpsOrLocalhost && isAllowedDomain;
  } catch {
    return false;
  }
};
