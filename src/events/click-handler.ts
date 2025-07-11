import { HTML_DATA_ATTR_PREFIX } from '../constants';
import { TracelogEventClickData } from '../types';

export interface ClickCoordinates {
  x: number;
  y: number;
  relativeX: number;
  relativeY: number;
}

export interface TrackingElementData {
  element: HTMLElement;
  name: string;
  value?: string;
}

// Move interactive selectors to class level to avoid recreation
const INTERACTIVE_SELECTORS = [
  'button',
  'a',
  'input[type="button"]',
  'input[type="submit"]',
  'input[type="reset"]',
  '[role="button"]',
  '[onclick]',
  '[data-testid]',
  '[tabindex]',
  '[id]',
] as const;

export const ClickHandler = {
  findTrackingElement(element: HTMLElement): HTMLElement | undefined {
    if (element.hasAttribute(`${HTML_DATA_ATTR_PREFIX}-name`)) {
      return element;
    }

    const closest = element.closest(`[${HTML_DATA_ATTR_PREFIX}-name]`) as HTMLElement;

    return closest || undefined;
  },

  getRelevantClickElement(element: HTMLElement): HTMLElement {
    if (INTERACTIVE_SELECTORS.some((selector) => element.matches(selector))) {
      return element;
    }

    for (const selector of INTERACTIVE_SELECTORS) {
      const parent = element.closest(selector) as HTMLElement;
      if (parent) {
        return parent;
      }
    }

    return element;
  },

  calculateClickCoordinates(event: MouseEvent, element: HTMLElement): ClickCoordinates {
    const rect = element.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;

    // Ensure coordinates are within valid bounds
    const relativeX = rect.width > 0 ? Math.max(0, Math.min(1, Number(((x - rect.left) / rect.width).toFixed(3)))) : 0;
    const relativeY = rect.height > 0 ? Math.max(0, Math.min(1, Number(((y - rect.top) / rect.height).toFixed(3)))) : 0;

    return { x, y, relativeX, relativeY };
  },

  extractTrackingData(trackingElement: HTMLElement): TrackingElementData {
    const name = trackingElement.getAttribute(`${HTML_DATA_ATTR_PREFIX}-name`);
    const value = trackingElement.getAttribute(`${HTML_DATA_ATTR_PREFIX}-value`);

    // Add safety check even though it should always exist
    if (!name) {
      throw new Error('Tracking element missing required name attribute');
    }

    return {
      element: trackingElement,
      name,
      ...(value && { value }),
    };
  },

  getRelevantText(clickedElement: HTMLElement, relevantElement: HTMLElement): string {
    const clickedText = clickedElement.textContent?.trim() || '';
    const relevantText = relevantElement.textContent?.trim() || '';

    // If clicked element has text and relevant doesn't, use clicked text
    if (clickedText && !relevantText) {
      return clickedText;
    }

    // If clicked text is more specific (contained within relevant text), use clicked text
    if (clickedText && relevantText && clickedText !== relevantText && relevantText.includes(clickedText)) {
      return clickedText;
    }

    // Default to relevant element text
    return relevantText;
  },

  extractElementAttributes(element: HTMLElement): Record<string, string> {
    // element.attributes always exists for HTML elements, but check length for early return
    if (element.attributes.length === 0) {
      return {};
    }

    // Only extract common attributes to avoid performance issues
    const commonAttributes = ['id', 'class', 'data-testid', 'aria-label', 'title', 'href', 'type', 'name'];
    const result: Record<string, string> = {};

    for (const attributeName of commonAttributes) {
      const value = element.getAttribute(attributeName);
      if (value) {
        result[attributeName] = value;
      }
    }

    return result;
  },

  generateClickData(
    clickedElement: HTMLElement,
    relevantElement: HTMLElement,
    coordinates: ClickCoordinates,
  ): TracelogEventClickData {
    const { x, y, relativeX, relativeY } = coordinates;
    const text = this.getRelevantText(clickedElement, relevantElement);
    const attributes = this.extractElementAttributes(relevantElement);

    const href = relevantElement.getAttribute('href');
    const title = relevantElement.getAttribute('title');
    const alt = relevantElement.getAttribute('alt');
    const role = relevantElement.getAttribute('role');
    const ariaLabel = relevantElement.getAttribute('aria-label');

    return {
      x,
      y,
      relativeX,
      relativeY,
      elementTag: relevantElement.tagName.toLowerCase(),
      ...(relevantElement.id && { elementId: relevantElement.id }),
      ...(relevantElement.className && { elementClass: relevantElement.className }),
      ...(text && { elementText: text }),
      ...(href && { elementHref: href }),
      ...(title && { elementTitle: title }),
      ...(alt && { elementAlt: alt }),
      ...(role && { elementRole: role }),
      ...(ariaLabel && { elementAriaLabel: ariaLabel }),
      ...(Object.keys(attributes).length > 0 && { elementDataAttributes: attributes }),
    };
  },

  createCustomEventData(trackingData: TrackingElementData): { name: string; value?: string } {
    return {
      name: trackingData.name,
      ...(trackingData.value && { value: trackingData.value }),
    };
  },
};
