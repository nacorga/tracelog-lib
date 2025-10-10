import { HTML_DATA_ATTR_PREFIX, MAX_TEXT_LENGTH, INTERACTIVE_SELECTORS, PII_PATTERNS } from '../constants';
import { ClickCoordinates, ClickData, ClickTrackingElementData, EventType } from '../types';
import { EventManager } from '../managers/event.manager';
import { StateManager } from '../managers/state.manager';
import { log } from '../utils';

export class ClickHandler extends StateManager {
  private readonly eventManager: EventManager;

  private clickHandler?: (event: Event) => void;

  constructor(eventManager: EventManager) {
    super();

    this.eventManager = eventManager;
  }

  startTracking(): void {
    if (this.clickHandler) {
      return;
    }

    this.clickHandler = (event: Event): void => {
      const mouseEvent = event as MouseEvent;
      const target = mouseEvent.target;
      const clickedElement =
        typeof HTMLElement !== 'undefined' && target instanceof HTMLElement
          ? target
          : typeof HTMLElement !== 'undefined' && target instanceof Node && target.parentElement instanceof HTMLElement
            ? target.parentElement
            : null;

      if (!clickedElement) {
        log('warn', 'Click target not found or not an element');
        return;
      }

      if (this.shouldIgnoreElement(clickedElement)) {
        return;
      }

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

  private shouldIgnoreElement(element: HTMLElement): boolean {
    if (element.hasAttribute(`${HTML_DATA_ATTR_PREFIX}-ignore`)) {
      return true;
    }

    const parent = element.closest(`[${HTML_DATA_ATTR_PREFIX}-ignore]`);

    return parent !== null;
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

        const parent = element.closest(selector) as HTMLElement;
        if (parent) {
          return parent;
        }
      } catch (error) {
        log('warn', 'Invalid selector in element search', { error, data: { selector } });
        continue;
      }
    }

    return element;
  }

  private clamp(value: number): number {
    return Math.max(0, Math.min(1, Number(value.toFixed(3))));
  }

  private calculateClickCoordinates(event: MouseEvent, element: HTMLElement): ClickCoordinates {
    const rect = element.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    const relativeX = rect.width > 0 ? this.clamp((x - rect.left) / rect.width) : 0;
    const relativeY = rect.height > 0 ? this.clamp((y - rect.top) / rect.height) : 0;

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

    return {
      x,
      y,
      relativeX,
      relativeY,
      tag: relevantElement.tagName.toLowerCase(),
      ...(relevantElement.id && { id: relevantElement.id }),
      ...(relevantElement.className && { class: relevantElement.className }),
      ...(text && { text }),
      ...(attributes.href && { href: attributes.href }),
      ...(attributes.title && { title: attributes.title }),
      ...(attributes.alt && { alt: attributes.alt }),
      ...(attributes.role && { role: attributes.role }),
      ...(attributes['aria-label'] && { ariaLabel: attributes['aria-label'] }),
      ...(Object.keys(attributes).length > 0 && { dataAttributes: attributes }),
    };
  }

  private sanitizeText(text: string): string {
    let sanitized = text;

    // Remove PII patterns (email, phone, credit card, etc.)
    for (const pattern of PII_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      sanitized = sanitized.replace(regex, '[REDACTED]');
    }

    return sanitized;
  }

  private getRelevantText(clickedElement: HTMLElement, relevantElement: HTMLElement): string {
    const clickedText = clickedElement.textContent?.trim() ?? '';
    const relevantText = relevantElement.textContent?.trim() ?? '';

    if (!clickedText && !relevantText) {
      return '';
    }

    let finalText = '';

    if (clickedText && clickedText.length <= MAX_TEXT_LENGTH) {
      finalText = clickedText;
    } else if (relevantText.length <= MAX_TEXT_LENGTH) {
      finalText = relevantText;
    } else {
      finalText = relevantText.slice(0, MAX_TEXT_LENGTH - 3) + '...';
    }

    // Sanitize PII before returning
    return this.sanitizeText(finalText);
  }

  private extractElementAttributes(element: HTMLElement): Record<string, string> {
    const commonAttributes = [
      'id',
      'class',
      'data-testid',
      'aria-label',
      'title',
      'href',
      'type',
      'name',
      'alt',
      'role',
    ];
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
