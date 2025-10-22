import { MetadataType } from '../types';
import { log } from '../utils';
import { StateManager } from '../managers/state.manager';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Google Analytics 4 / Google Tag Manager integration for TraceLog.
 *
 * **Supported Services**:
 * - Google Analytics 4 (GA4): `G-XXXXXXXXXX`
 * - Google Ads: `AW-XXXXXXXXXX`
 * - Universal Analytics (legacy): `UA-XXXXXXXXXX`
 * - Google Tag Manager (GTM): `GTM-XXXXXXX`
 *
 * **Key Features**:
 * - Auto-detection: Reuses existing gtag/GTM if already loaded on the page
 * - Priority: GTM container ID takes priority over measurement ID if both provided
 * - User tracking: Automatically sets `user_id` in GA4 config
 * - Selective forwarding: Only custom events (`tracelog.event()`) are sent to Google
 * - Automatic events: Clicks, scrolls, page views are NOT forwarded (handled locally)
 *
 * **Consent Integration**:
 * - Respects consent settings from ConsentManager
 * - Initialization deferred until consent granted for 'google' integration
 * - Script not loaded until consent obtained
 *
 * @see API_REFERENCE.md (lines 972-1056) for configuration details
 * @see README.md (lines 144-147) for usage examples
 *
 * @example
 * ```typescript
 * // GA4 only
 * await tracelog.init({
 *   integrations: {
 *     google: { measurementId: 'G-XXXXXXXXXX' }
 *   }
 * });
 *
 * // GTM only
 * await tracelog.init({
 *   integrations: {
 *     google: { containerId: 'GTM-XXXXXXX' }
 *   }
 * });
 *
 * // Both (GTM takes priority for script loading)
 * await tracelog.init({
 *   integrations: {
 *     google: {
 *       measurementId: 'G-XXXXXXXXXX',
 *       containerId: 'GTM-XXXXXXX'
 *     }
 *   }
 * });
 * ```
 */
export class GoogleAnalyticsIntegration extends StateManager {
  private readonly scriptId = 'tracelog-ga-script';
  private readonly configScriptId = 'tracelog-ga-config-script';

  private isInitialized = false;

  /**
   * Initializes Google Analytics/GTM integration.
   *
   * **Initialization Flow**:
   * 1. Validates configuration (measurementId or containerId required)
   * 2. Checks for existing gtag instance (auto-detection)
   * 3. Checks if script already loaded (avoids duplicate loading)
   * 4. Loads appropriate script (GTM or gtag.js)
   * 5. Configures gtag with user_id
   *
   * **Script Priority**:
   * - If `containerId` provided: Loads GTM script (`gtm.js`)
   * - Otherwise: Loads GA4 script (`gtag/js`)
   *
   * **Auto-detection**:
   * - Reuses existing gtag/dataLayer if found
   * - Logs info message when reusing external scripts
   *
   * **Error Handling**:
   * - Initialization failures are logged but don't throw
   * - Safe to call multiple times (idempotent)
   *
   * @returns Promise that resolves when initialization completes
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const googleConfig = this.get('config').integrations?.google;
    const userId = this.get('userId');

    if (!googleConfig || !userId?.trim()) {
      return;
    }

    const { measurementId, containerId } = googleConfig;

    if (!measurementId?.trim() && !containerId?.trim()) {
      return;
    }

    try {
      if (this.hasExistingGtagInstance()) {
        log('info', 'Google Analytics/GTM already loaded by external service, reusing existing script', {
          showToClient: true,
        });

        this.isInitialized = true;

        return;
      }

      if (this.isScriptAlreadyLoaded()) {
        this.isInitialized = true;

        return;
      }

      const scriptId = containerId?.trim() || measurementId?.trim();

      if (scriptId) {
        await this.loadScript(scriptId);
        this.configureGtag(scriptId, userId);
      }

      this.isInitialized = true;
    } catch (error) {
      log('error', 'Google Analytics/GTM initialization failed', { error });
    }
  }

  /**
   * Sends a custom event to Google Analytics/GTM via gtag.
   *
   * **Event Flow**:
   * - Called by EventManager when custom event (`tracelog.event()`) is tracked
   * - Only custom events are forwarded (automatic events like clicks are NOT sent)
   * - Events pushed to dataLayer via `gtag('event', eventName, metadata)`
   *
   * **Metadata Handling**:
   * - Arrays are wrapped in `{ items: [...] }` for GA4 compatibility
   * - Objects passed directly to gtag
   *
   * **Requirements**:
   * - Integration must be initialized (`initialize()` called successfully)
   * - `window.gtag` function must exist
   * - Event name must be non-empty string
   *
   * **Error Handling**:
   * - Silent failures (logs error but doesn't throw)
   * - Safe to call before initialization (no-op)
   *
   * @param eventName - Event name (e.g., 'button_click', 'purchase_completed')
   * @param metadata - Event metadata (flat key-value object or array of objects)
   *
   * @example
   * ```typescript
   * // Object metadata
   * trackEvent('button_click', { button_id: 'cta', page: 'home' });
   * // → gtag('event', 'button_click', { button_id: 'cta', page: 'home' })
   *
   * // Array metadata (wrapped for GA4 e-commerce)
   * trackEvent('purchase', [{ id: '123', name: 'Product', price: 99 }]);
   * // → gtag('event', 'purchase', { items: [{ id: '123', name: 'Product', price: 99 }] })
   * ```
   */
  trackEvent(eventName: string, metadata: Record<string, MetadataType> | Record<string, MetadataType>[]): void {
    if (!eventName?.trim() || !this.isInitialized || typeof window.gtag !== 'function') {
      return;
    }

    try {
      const normalizedMetadata = Array.isArray(metadata) ? { items: metadata } : metadata;
      window.gtag('event', eventName, normalizedMetadata);
    } catch (error) {
      log('error', 'Google Analytics event tracking failed', { error });
    }
  }

  /**
   * Cleans up Google Analytics integration resources.
   *
   * **Cleanup Actions**:
   * - Resets initialization flag
   * - Removes TraceLog-injected script elements (main + config)
   * - Does NOT remove externally loaded gtag/GTM scripts
   *
   * **Note**: gtag function and dataLayer remain in window even after cleanup.
   * This is intentional to avoid breaking external scripts that may depend on them.
   *
   * Called by:
   * - `App.destroy()` - When destroying entire TraceLog instance
   * - Error scenarios during initialization
   */
  cleanup(): void {
    this.isInitialized = false;

    const script = document.getElementById(this.scriptId);

    if (script) {
      script.remove();
    }

    const configScript = document.getElementById(this.configScriptId);

    if (configScript) {
      configScript.remove();
    }
  }

  /**
   * Checks if gtag is already loaded by external service.
   *
   * Auto-detection prevents duplicate script loading when GA/GTM
   * is already present (e.g., loaded by Consent Management Platform).
   */
  private hasExistingGtagInstance(): boolean {
    return typeof window.gtag === 'function' && Array.isArray(window.dataLayer);
  }

  private getScriptType(measurementId: string): 'GTM' | 'GA4' {
    return measurementId.startsWith('GTM-') && measurementId.length > 4 ? 'GTM' : 'GA4';
  }

  /**
   * Checks if Google Analytics/GTM script is already loaded.
   *
   * Three-tier detection strategy prevents duplicate script injection:
   * 1. Checks for existing gtag instance + dataLayer (runtime detection)
   * 2. Checks for TraceLog-injected script (#tracelog-ga-script)
   * 3. Checks for external GA/GTM scripts by src pattern
   *
   * @returns True if any GA/GTM script detected, false otherwise
   */
  private isScriptAlreadyLoaded(): boolean {
    if (this.hasExistingGtagInstance()) {
      return true;
    }

    if (document.getElementById(this.scriptId)) {
      return true;
    }

    const existingScript = document.querySelector(
      'script[src*="googletagmanager.com/gtag/js"], script[src*="googletagmanager.com/gtm.js"]',
    );

    return !!existingScript;
  }

  /**
   * Dynamically loads Google Analytics/GTM script into page.
   *
   * Script URLs:
   * - GTM: https://www.googletagmanager.com/gtm.js?id=GTM-XXXXXXX
   * - GA4/Ads/UA: https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX
   *
   * @param measurementId - GA4/GTM/Ads/UA ID
   * @returns Promise that resolves when script loads successfully
   * @throws Error if script fails to load
   */
  private async loadScript(measurementId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.id = 'tracelog-ga-script';
      script.async = true;

      const scriptType = this.getScriptType(measurementId);

      if (scriptType === 'GTM') {
        script.src = `https://www.googletagmanager.com/gtm.js?id=${measurementId}`;
      } else {
        script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      }

      script.onload = (): void => {
        resolve();
      };
      script.onerror = (): void => {
        const type = scriptType === 'GTM' ? 'GTM' : 'Google Analytics';
        reject(new Error(`Failed to load ${type} script`));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Configures gtag function and dataLayer.
   *
   * **GTM Configuration**:
   * - Only initializes gtag function and dataLayer
   * - No config call (tags configured in GTM UI)
   * - User tracking: Configure user_id in GTM using dataLayer variables
   * - Allows GTM container to manage all tag configuration
   *
   * **GA4/Ads/UA Configuration**:
   * - Initializes gtag function and dataLayer
   * - Calls `gtag('config')` with measurement ID
   * - Sets `user_id` for cross-device tracking
   *
   * @param measurementId - GA4/GTM/Ads/UA ID
   * @param userId - TraceLog user ID for user tracking
   */
  private configureGtag(measurementId: string, userId: string): void {
    const gaScriptConfig = document.createElement('script');
    gaScriptConfig.id = this.configScriptId;
    gaScriptConfig.type = 'text/javascript';

    if (measurementId.startsWith('GTM-')) {
      gaScriptConfig.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
      `;
    } else {
      gaScriptConfig.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${measurementId}', {
          'user_id': '${userId}'
        });
      `;
    }

    document.head.appendChild(gaScriptConfig);
  }
}
