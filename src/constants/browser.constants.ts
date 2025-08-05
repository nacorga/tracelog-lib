// Click tracking constants
export const HTML_DATA_ATTR_PREFIX = 'data-tl';

// Interactive element selectors for click tracking
export const INTERACTIVE_SELECTORS = [
  'button',
  'a',
  'input[type="button"]',
  'input[type="submit"]',
  'input[type="reset"]',
  'input[type="checkbox"]',
  'input[type="radio"]',
  'select',
  'textarea',
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[routerLink]',
  '[ng-click]',
  '[data-action]',
  '[data-click]',
  '[data-navigate]',
  '[data-toggle]',
  '[onclick]',
  '.btn',
  '.button',
  '.clickable',
  '.nav-link',
  '.menu-item',
  '[data-testid]',
  '[tabindex="0"]',
] as const;

// UTM parameters for tracking
export const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
