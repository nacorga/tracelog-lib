import { StateManager } from '../managers/state.manager';
import { log } from '../utils';

const SHOPIFY_SESSION_ATTR = 'tracelog_session_id';
const SHOPIFY_USER_ATTR = 'tracelog_user_id';

/**
 * Writes TraceLog identifiers to Shopify cart attributes via the storefront AJAX API.
 *
 * Two attributes are propagated:
 * - `tracelog_session_id`: surfaces in the `orders/paid` webhook `note_attributes`,
 *   letting the API attribute revenue to the original session's UTM data.
 * - `tracelog_user_id`: surfaces in Customer Events `event.data.checkout.attributes`
 *   (cart_viewed / checkout_started / checkout_completed), letting the Web Pixel
 *   Extension carry the same user_id used on the storefront into the checkout sandbox.
 *
 * Without `tracelog_user_id` propagation, checkout-funnel events would derive a
 * different user_id from Shopify's per-visitor `clientId`, splitting one buyer
 * into two TraceLog users (pre-checkout and post-checkout) and breaking funnel
 * conversion / repeat-purchase metrics.
 */
export class ShopifyCartLinker extends StateManager {
  private visibilityHandler: (() => void) | null = null;
  private pageshowHandler: ((event: PageTransitionEvent) => void) | null = null;
  private lastSyncedKey: string | null = null;

  activate(): void {
    this.cleanupListeners();
    this.syncCartAttribute();
    this.setupListeners();
  }

  deactivate(): void {
    this.cleanupListeners();
    this.lastSyncedKey = null;
  }

  /** Re-syncs cart attributes when session rotates (called by App on SESSION_START). */
  onSessionChange(): void {
    this.syncCartAttribute();
  }

  private syncCartAttribute(): void {
    const sessionId = this.get('sessionId');
    if (!sessionId) return;

    const rawUserId = this.get('userId');
    const userId = typeof rawUserId === 'string' && rawUserId.length > 0 ? rawUserId : '';
    const dedupKey = `${sessionId}|${userId}`;
    if (dedupKey === this.lastSyncedKey) return;

    this.lastSyncedKey = dedupKey;
    this.postCartUpdate(sessionId, userId);
  }

  private postCartUpdate(sessionId: string, userId: string): void {
    const attributes: Record<string, string> = { [SHOPIFY_SESSION_ATTR]: sessionId };
    if (userId.length > 0) attributes[SHOPIFY_USER_ATTR] = userId;

    try {
      fetch('/cart/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attributes }),
        credentials: 'same-origin',
      })
        .then((response) => {
          if (!response.ok) {
            this.lastSyncedKey = null;
            log('debug', 'Shopify cart attribute update failed', { data: { status: response.status } });
          }
        })
        .catch(() => {
          this.lastSyncedKey = null;
          log('debug', 'Shopify cart attribute update failed');
        });
    } catch {
      this.lastSyncedKey = null;
      log('debug', 'Shopify cart attribute update failed');
    }
  }

  /**
   * Sync triggers (theme-agnostic):
   *  - `visibilitychange`: catches tab refocus (long sessions, OAuth round-trips).
   *  - `pageshow` with `event.persisted === true`: catches bfcache restore so a
   *    user returning from an external checkout / Shop Pay window picks up the
   *    current sessionId before any further interaction.
   *
   * Both triggers go through `syncCartAttribute()` which dedupes by
   * `sessionId|userId`, so spurious calls cost nothing.
   */
  private setupListeners(): void {
    this.visibilityHandler = (): void => {
      if (!document.hidden) {
        this.syncCartAttribute();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);

    this.pageshowHandler = (event: PageTransitionEvent): void => {
      if (event.persisted) this.syncCartAttribute();
    };
    window.addEventListener('pageshow', this.pageshowHandler);
  }

  private cleanupListeners(): void {
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
    if (this.pageshowHandler) {
      window.removeEventListener('pageshow', this.pageshowHandler);
      this.pageshowHandler = null;
    }
  }
}
