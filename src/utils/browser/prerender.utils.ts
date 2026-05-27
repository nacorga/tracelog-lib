/**
 * Returns `true` while the current document is being pre-rendered or prefetched
 * via the Speculation Rules API (e.g. Shopify themes prerendering a PDP on hover).
 *
 * Tracking must stay fully dormant during this phase: a page that is pre-rendered
 * but never activated must emit **zero** events so it never creates a server-side
 * session. Emission resumes on the `prerenderingchange` event (activation).
 *
 * SSR-safe and degrades gracefully: on browsers without the API,
 * `document.prerendering` is `undefined` (falsy) → treated as "not pre-rendering",
 * so the normal tracking path runs unchanged. `=== true` is the correct idiom.
 */
export const isPrerendering = (): boolean => typeof document !== 'undefined' && document.prerendering === true;
