/**
 * Event types that can be disabled from auto-tracking
 * Core events (PAGE_VIEW, CLICK, SESSION_*) cannot be disabled as they are essential for analytics
 */
export const DISABLEABLE_EVENT_TYPES = ['scroll', 'web_vitals', 'error'] as const;

export type DisabledEventType = (typeof DISABLEABLE_EVENT_TYPES)[number];
