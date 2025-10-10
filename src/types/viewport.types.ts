/**
 * Element configuration for viewport tracking with optional identifiers
 */
export interface ViewportElement {
  /**
   * CSS selector for the element
   * @example '.hero' | '.cta-button' | '#pricing'
   */
  selector: string;

  /**
   * Optional unique identifier for analytics
   * Used to distinguish between multiple elements with the same selector
   * @example 'homepage-hero' | 'pricing-cta' | 'customer-testimonials'
   */
  id?: string;

  /**
   * Optional human-readable name for dashboards and reports
   * @example 'Homepage Hero Banner' | 'Pricing Page CTA' | 'Customer Testimonials Section'
   */
  name?: string;
}

/**
 * Configuration for viewport visibility tracking
 */
export interface ViewportConfig {
  /**
   * Elements to track with optional identifiers
   * Provides analytics support with business identifiers
   * @example [{ selector: '.hero', id: 'homepage-hero', name: 'Homepage Hero Banner' }]
   */
  elements: ViewportElement[];

  /**
   * Minimum percentage of element that must be visible (0-1)
   * @default 0.5 (50%)
   */
  threshold?: number;

  /**
   * Minimum time (ms) element must be visible to count as a view
   * @default 1000 (1 second)
   */
  minDwellTime?: number;

  /**
   * Cooldown period (ms) before same element can fire visibility event again
   * Prevents repeated events from carousels, sticky headers, and scrolling patterns
   * @default 60000 (60 seconds)
   */
  cooldownPeriod?: number;
}

/**
 * Data captured when element becomes visible
 */
export interface ViewportEventData {
  /**
   * CSS selector that matched the element
   */
  selector: string;

  /**
   * Optional unique identifier for analytics (if configured)
   * Helps distinguish between multiple elements with the same selector
   */
  id?: string;

  /**
   * Optional human-readable name (if configured)
   * Useful for dashboards and reports
   */
  name?: string;

  /**
   * Actual time (ms) element was visible before event fired
   */
  dwellTime: number;

  /**
   * Actual visibility ratio when event fired (0-1)
   */
  visibilityRatio: number;
}
