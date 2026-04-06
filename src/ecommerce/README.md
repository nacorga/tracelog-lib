# Ecommerce Integrations

Optional integrations that link TraceLog sessions with ecommerce platforms for revenue attribution.

## ShopifyCartLinker

Writes the TraceLog `sessionId` to Shopify cart attributes via the storefront AJAX API (`/cart/update.js`). When a Shopify webhook fires (`orders/paid`), the session ID arrives in `note_attributes`, allowing the API to look up the original session's UTM data and attribute revenue to the correct campaign.

### Activation

Enabled via config under the `tracelog` integration (requires `projectId` — only meaningful with TraceLog SaaS backend):

```typescript
await tracelog.init({
  integrations: {
    tracelog: {
      projectId: 'proj-123',
      shopify: true,
    },
  },
});
```

### Lifecycle

| Event | Action |
|-------|--------|
| `activate()` | Syncs current `sessionId` to cart, registers `visibilitychange` listener |
| `SESSION_START` emitted | Re-syncs new `sessionId` (handles session rotation after idle timeout) |
| Tab becomes visible | Re-syncs if `sessionId` changed while tab was hidden |
| `deactivate()` (via `destroy()`) | Removes listener, resets dedup state |

### Design Decisions

- **Fire-and-forget**: `/cart/update.js` is same-origin and highly reliable. No retry — session rotation naturally re-attempts via `SESSION_START`.
- **Dedup via `lastSyncedSessionId`**: Prevents redundant POSTs when multiple triggers fire for the same session.
- **Not exported in public API**: Internal to `App` lifecycle. No user-facing surface.
- **TraceLog SaaS only**: The cart attribute is only consumed by the TraceLog webhook handler in `tracelog-api`. Without `projectId`, there's no backend to process it.
