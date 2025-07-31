import { EventManager } from '../services/event-manager';
import { StateManager } from '../services/state-manager';
import { ClickCoordinates, ClickData, ClickTrackingElementData, EventType } from '../types/event.types';

const HTML_DATA_ATTR_PREFIX = 'data-tl';
const CLICK_DEBOUNCE_TIME = 500;
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
];

export class ClickHandler extends StateManager {
  private readonly eventManager: EventManager;

  private clickHandler?: (event: Event) => void;
  private clickDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(eventManager: EventManager) {
    super();

    this.eventManager = eventManager;
  }

  startTracking(): void {
    if (this.clickHandler) {
      return;
    }

    this.clickHandler = (event: Event): void => {
      if (this.clickDebounceTimer) {
        clearTimeout(this.clickDebounceTimer);
      }

      this.clickDebounceTimer = setTimeout(() => {
        const mouseEvent = event as MouseEvent;
        const clickedElement = mouseEvent.target as HTMLElement;

        if (!clickedElement) return;

        const trackingElement = this.findTrackingElement(clickedElement);
        const relevantClickElement = this.getRelevantClickElement(clickedElement);
        const coordinates = this.calculateClickCoordinates(mouseEvent, clickedElement);

        if (trackingElement) {
          const trackingData = this.extractTrackingData(trackingElement);

          if (trackingData) {
            const attributeData = this.createCustomEventData(trackingData);

            this.eventManager.track({
              type: EventType.CUSTOM,
              custom_event: {
                name: attributeData.name,
                ...(attributeData.value && { metadata: { value: attributeData.value } }),
              },
            });
          }
        }

        const clickData = this.generateClickData(clickedElement, relevantClickElement, coordinates);

        this.eventManager.track({
          type: EventType.CLICK,
          page_url: window.location.href,
          click_data: clickData,
        });

        this.clickDebounceTimer = null;
      }, CLICK_DEBOUNCE_TIME);
    };

    window.addEventListener('click', this.clickHandler, true);
  }

  private findTrackingElement(element: HTMLElement): HTMLElement | undefined {
    if (element.hasAttribute(`${HTML_DATA_ATTR_PREFIX}-name`)) {
      return element;
    }

    const closest = element.closest(`[${HTML_DATA_ATTR_PREFIX}-name]`) as HTMLElement;

    return closest || undefined;
  }

  private getRelevantClickElement(element: HTMLElement): HTMLElement {
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
  }

  private calculateClickCoordinates(event: MouseEvent, element: HTMLElement): ClickCoordinates {
    const rect = element.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    const relativeX = rect.width > 0 ? Math.max(0, Math.min(1, Number(((x - rect.left) / rect.width).toFixed(3)))) : 0;
    const relativeY = rect.height > 0 ? Math.max(0, Math.min(1, Number(((y - rect.top) / rect.height).toFixed(3)))) : 0;

    return { x, y, relativeX, relativeY };
  }

  private extractTrackingData(trackingElement: HTMLElement): ClickTrackingElementData | undefined {
    const name = trackingElement.getAttribute(`${HTML_DATA_ATTR_PREFIX}-name`);
    const value = trackingElement.getAttribute(`${HTML_DATA_ATTR_PREFIX}-value`);

    if (!name) {
      return undefined;
    }

    return {
      element: trackingElement,
      name,
      ...(value && { value }),
    };
  }

  private generateClickData(
    clickedElement: HTMLElement,
    relevantElement: HTMLElement,
    coordinates: ClickCoordinates,
  ): ClickData {
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
      tag: relevantElement.tagName.toLowerCase(),
      ...(relevantElement.id && { id: relevantElement.id }),
      ...(relevantElement.className && { class: relevantElement.className }),
      ...(text && { text }),
      ...(href && { href }),
      ...(title && { title }),
      ...(alt && { alt }),
      ...(role && { role }),
      ...(ariaLabel && { ariaLabel }),
      ...(Object.keys(attributes).length > 0 && { dataAttributes: attributes }),
    };
  }

  private getRelevantText(clickedElement: HTMLElement, relevantElement: HTMLElement): string {
    const MAX_TEXT_LENGTH = 255;
    const LARGE_CONTAINER_TAGS = ['main', 'section', 'article', 'body', 'html', 'header', 'footer', 'aside', 'nav'];
    const clickedText = clickedElement.textContent?.trim() ?? '';
    const relevantText = relevantElement.textContent?.trim() ?? '';

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
  }

  private extractElementAttributes(element: HTMLElement): Record<string, string> {
    const commonAttributes = ['id', 'class', 'data-testid', 'aria-label', 'title', 'href', 'type', 'name'];
    const result: Record<string, string> = {};

    for (const attributeName of commonAttributes) {
      const value = element.getAttribute(attributeName);

      if (value) {
        result[attributeName] = value;
      }
    }

    return result;
  }

  private createCustomEventData(trackingData: ClickTrackingElementData): { name: string; value?: string } {
    return {
      name: trackingData.name,
      ...(trackingData.value && { value: trackingData.value }),
    };
  }
}
