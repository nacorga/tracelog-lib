/**
 * Configuration for viewport visibility tracking
 */
export interface ViewportConfig {
  /**
   * CSS selectors for elements to track
   * @example ['.hero', '.cta-button', '#pricing']
   */
  selectors: string[];

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
   * Actual time (ms) element was visible before event fired
   */
  dwellTime: number;

  /**
   * Actual visibility ratio when event fired (0-1)
   */
  visibilityRatio: number;
}
