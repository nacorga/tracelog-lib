import { HTML_DATA_ATTR_PREFIX } from '../constants';
import { ClickCoordinates, ClickTrackingElementData, EventClickData } from '../types';

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
    const relativeX = rect.width > 0 ? Math.max(0, Math.min(1, Number(((x - rect.left) / rect.width).toFixed(3)))) : 0;
    const relativeY = rect.height > 0 ? Math.max(0, Math.min(1, Number(((y - rect.top) / rect.height).toFixed(3)))) : 0;

    return { x, y, relativeX, relativeY };
  },

  extractTrackingData(trackingElement: HTMLElement): ClickTrackingElementData {
    const name = trackingElement.getAttribute(`${HTML_DATA_ATTR_PREFIX}-name`);
    const value = trackingElement.getAttribute(`${HTML_DATA_ATTR_PREFIX}-value`);

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
    const MAX_TEXT_LENGTH = 255;
    const LARGE_CONTAINER_TAGS = ['main', 'section', 'article', 'body', 'html', 'header', 'footer', 'aside', 'nav'];
    const clickedText = clickedElement.textContent?.trim() || '';
    const relevantText = relevantElement.textContent?.trim() || '';

    // If no text, return empty
    if (!clickedText && !relevantText) {
      return '';
    }

    // Strategy 1: If clicked element has reasonable text, use it
    if (clickedText && clickedText.length <= MAX_TEXT_LENGTH) {
      return clickedText;
    }

    // Strategy 2: For large containers with excessive text, avoid using container text
    const isLargeContainer = LARGE_CONTAINER_TAGS.includes(relevantElement.tagName.toLowerCase());
    const hasExcessiveText = relevantText.length > MAX_TEXT_LENGTH * 2; // 510 chars

    if (isLargeContainer && hasExcessiveText) {
      // Use clicked element text if available and reasonable, otherwise empty
      return clickedText && clickedText.length <= MAX_TEXT_LENGTH ? clickedText : '';
    }

    // Strategy 3: Use relevant text but truncate if needed
    if (relevantText.length <= MAX_TEXT_LENGTH) {
      return relevantText;
    }

    // Strategy 4: If clicked text is much shorter than relevant text, prefer clicked text
    if (clickedText && clickedText.length < relevantText.length * 0.1) {
      return clickedText.length <= MAX_TEXT_LENGTH ? clickedText : clickedText.slice(0, MAX_TEXT_LENGTH) + '...';
    }

    // Fallback: truncate relevant text
    return relevantText.slice(0, MAX_TEXT_LENGTH) + '...';
  },

  extractElementAttributes(element: HTMLElement): Record<string, string> {
    if (element.attributes.length === 0) {
      return {};
    }

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
  ): EventClickData {
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

  createCustomEventData(trackingData: ClickTrackingElementData): { name: string; value?: string } {
    return {
      name: trackingData.name,
      ...(trackingData.value && { value: trackingData.value }),
    };
  },
};
