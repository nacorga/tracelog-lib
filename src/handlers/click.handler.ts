import {
  HTML_DATA_ATTR_PREFIX,
  MAX_TEXT_LENGTH,
  INTERACTIVE_SELECTORS,
  PII_PATTERNS,
  DEFAULT_CLICK_THROTTLE_MS,
} from '../constants';
import { ClickCoordinates, ClickData, ClickTrackingElementData, EventType } from '../types';
import { EventManager } from '../managers/event.manager';
import { StateManager } from '../managers/state.manager';
import { log } from '../utils';

export class ClickHandler extends StateManager {
  private readonly eventManager: EventManager;

  private clickHandler?: (event: Event) => void;
  private readonly lastClickTimes: Map<string, number> = new Map();

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

      // Throttle clicks per element to prevent double-clicks and spam
      const clickThrottleMs = this.get('config')?.clickThrottleMs ?? DEFAULT_CLICK_THROTTLE_MS;
      if (clickThrottleMs > 0 && !this.checkClickThrottle(clickedElement, clickThrottleMs)) {
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
    this.lastClickTimes.clear();
  }

  private shouldIgnoreElement(element: HTMLElement): boolean {
    if (element.hasAttribute(`${HTML_DATA_ATTR_PREFIX}-ignore`)) {
      return true;
    }

    const parent = element.closest(`[${HTML_DATA_ATTR_PREFIX}-ignore]`);

    return parent !== null;
  }

  /**
   * Checks per-element click throttling to prevent double-clicks and rapid spam
   * Returns true if the click should be tracked, false if throttled
   */
  private checkClickThrottle(element: HTMLElement, throttleMs: number): boolean {
    const signature = this.getElementSignature(element);
    const now = Date.now();
    const lastClickTime = this.lastClickTimes.get(signature);

    if (lastClickTime !== undefined && now - lastClickTime < throttleMs) {
      log('debug', 'ClickHandler: Click suppressed by throttle', {
        data: {
          signature,
          throttleRemaining: throttleMs - (now - lastClickTime),
        },
      });
      return false;
    }

    this.lastClickTimes.set(signature, now);
    return true;
  }

  /**
   * Creates a stable signature for an element to track throttling
   * Priority: id > data-testid > data-tlog-name > DOM path
   */
  private getElementSignature(element: HTMLElement): string {
    // Priority 1: Element ID (most stable)
    if (element.id) {
      return `#${element.id}`;
    }

    // Priority 2: data-testid (common in tests)
    const testId = element.getAttribute('data-testid');
    if (testId) {
      return `[data-testid="${testId}"]`;
    }

    // Priority 3: data-tlog-name (our own tracking attribute)
    const tlogName = element.getAttribute(`${HTML_DATA_ATTR_PREFIX}-name`);
    if (tlogName) {
      return `[${HTML_DATA_ATTR_PREFIX}-name="${tlogName}"]`;
    }

    // Priority 4: Generate DOM path as fallback
    return this.getElementPath(element);
  }

  /**
   * Generates a DOM path for an element (e.g., "body>div>button")
   */
  private getElementPath(element: HTMLElement): string {
    const path: string[] = [];
    let current: HTMLElement | null = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      // Add class if available (first class only for brevity)
      if (current.className) {
        const firstClass = current.className.split(' ')[0];
        if (firstClass) {
          selector += `.${firstClass}`;
        }
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join('>') || 'unknown';
  }

  private findTrackingElement(element: HTMLElement): HTMLElement | undefined {
    if (element.hasAttribute(`${HTML_DATA_ATTR_PREFIX}-name`)) {
      return element;
    }

    const closest = element.closest(`[${HTML_DATA_ATTR_PREFIX}-name]`) as HTMLElement;

    return closest;
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
