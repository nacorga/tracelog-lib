import { HTML_DATA_ATTR_PREFIX, MAX_TEXT_LENGTH, INTERACTIVE_SELECTORS } from '../constants';
import { ClickCoordinates, ClickData, ClickTrackingElementData, EventType } from '../types';
import { EventManager } from '../managers/event.manager';
import { StateManager } from '../managers/state.manager';
import { debugLog } from '../utils/logging';

export class ClickHandler extends StateManager {
  private readonly eventManager: EventManager;

  private clickHandler?: (event: Event) => void;

  constructor(eventManager: EventManager) {
    super();

    this.eventManager = eventManager;
  }

  startTracking(): void {
    if (this.clickHandler) {
      debugLog.debug('ClickHandler', 'Click tracking already active');
      return;
    }

    debugLog.debug('ClickHandler', 'Starting click tracking');

    this.clickHandler = (event: Event): void => {
      const mouseEvent = event as MouseEvent;
      const target = mouseEvent.target as EventTarget | null;
      const clickedElement =
        target instanceof HTMLElement
          ? target
          : target instanceof Node && target.parentElement instanceof HTMLElement
            ? target.parentElement
            : null;

      if (!clickedElement) {
        debugLog.warn('ClickHandler', 'Click target not found or not an element');
        return;
      }

      debugLog.info('ClickHandler', '🖱️ Click detected on element', {
        tagName: clickedElement.tagName,
        className: clickedElement.className || 'none',
        textContent: clickedElement.textContent?.slice(0, 50) ?? 'empty',
      });

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
        click_data: clickData,
      });
    };

    window.addEventListener('click', this.clickHandler, true);
  }

  stopTracking(): void {
    if (this.clickHandler) {
      window.removeEventListener('click', this.clickHandler, true);
      this.clickHandler = undefined;
    }
  }

  private findTrackingElement(element: HTMLElement): HTMLElement | undefined {
    if (element.hasAttribute(`${HTML_DATA_ATTR_PREFIX}-name`)) {
      return element;
    }

    const closest = element.closest(`[${HTML_DATA_ATTR_PREFIX}-name]`) as HTMLElement;

    return closest || undefined;
  }

  private getRelevantClickElement(element: HTMLElement): HTMLElement {
    for (const selector of INTERACTIVE_SELECTORS) {
      try {
        if (element.matches(selector)) {
          return element;
        }
      } catch (error) {
        debugLog.warn('ClickHandler', 'Invalid selector in interactive elements check', {
          selector,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        continue;
      }
    }

    for (const selector of INTERACTIVE_SELECTORS) {
      try {
        const parent = element.closest(selector) as HTMLElement;

        if (parent) {
          return parent;
        }
      } catch (error) {
        debugLog.warn('ClickHandler', 'Invalid selector in parent element search', {
          selector,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        continue;
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
    const className =
      typeof relevantElement.className === 'string' ? relevantElement.className : String(relevantElement.className);

    return {
      x,
      y,
      relativeX,
      relativeY,
      tag: relevantElement.tagName.toLowerCase(),
      ...(relevantElement.id && { id: relevantElement.id }),
      ...(relevantElement.className && { class: className }),
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
      return clickedText.length <= MAX_TEXT_LENGTH ? clickedText : clickedText.slice(0, MAX_TEXT_LENGTH - 3) + '...';
    }

    // Fallback: truncate relevant text to exactly MAX_TEXT_LENGTH including ellipsis
    return relevantText.slice(0, MAX_TEXT_LENGTH - 3) + '...';
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
