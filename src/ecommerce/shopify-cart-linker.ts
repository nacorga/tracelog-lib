import { StateManager } from '../managers/state.manager';
import { log } from '../utils';

const SHOPIFY_SESSION_ATTR = 'tracelog_session_id';

/**
 * Writes the TraceLog session ID to Shopify cart attributes via the storefront AJAX API.
 *
 * When the Shopify webhook fires (orders/paid), the session ID arrives in
 * `note_attributes` allowing the API to look up the original session's UTM data
 * and attribute revenue to the correct campaign.
 */
export class ShopifyCartLinker extends StateManager {
  private visibilityHandler: (() => void) | null = null;
  private lastSyncedSessionId: string | null = null;

  activate(): void {
    this.cleanupVisibilityListener();
    this.syncCartAttribute();
    this.setupVisibilityListener();
  }

  deactivate(): void {
    this.cleanupVisibilityListener();
    this.lastSyncedSessionId = null;
  }

  /** Re-syncs the cart attribute when session rotates (called by App on SESSION_START). */
  onSessionChange(): void {
    this.syncCartAttribute();
  }

  private syncCartAttribute(): void {
    const sessionId = this.get('sessionId');
    if (!sessionId || sessionId === this.lastSyncedSessionId) return;

    this.lastSyncedSessionId = sessionId;
    this.postCartUpdate(sessionId);
  }

  private postCartUpdate(sessionId: string): void {
    try {
      fetch('/cart/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attributes: { [SHOPIFY_SESSION_ATTR]: sessionId } }),
        credentials: 'same-origin',
      })
        .then((response) => {
          if (!response.ok) {
            this.lastSyncedSessionId = null;
            log('debug', 'Shopify cart attribute update failed', { data: { status: response.status } });
          }
        })
        .catch(() => {
          this.lastSyncedSessionId = null;
          log('debug', 'Shopify cart attribute update failed');
        });
    } catch {
      this.lastSyncedSessionId = null;
      log('debug', 'Shopify cart attribute update failed');
    }
  }

  private setupVisibilityListener(): void {
    this.visibilityHandler = (): void => {
      if (!document.hidden) {
        this.syncCartAttribute();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  private cleanupVisibilityListener(): void {
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }
}
