import { Config, EventType, EventScrollData, InactivityConfig, InactivityData } from '../types';
import { ClickHandler, ScrollHandler, ScrollConfig, InactivityHandler } from '../events';
import { CLICK_DEBOUNCE_TIME } from '../constants';

export class TrackingManager {
  private readonly scrollHandler: ScrollHandler;
  private readonly inactivityHandler: InactivityHandler;

  private clickHandler?: (event: Event) => void;
  private clickDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly config: Config,
    private readonly handleEvent: (event: any) => void,
    private readonly handleInactivity: (isInactive: boolean) => void,
  ) {
    const scrollConfig: ScrollConfig = {
      containerSelectors: this.config.scrollContainerSelectors,
    };

    this.scrollHandler = new ScrollHandler(scrollConfig, (scrollData: EventScrollData) => {
      this.handleEvent({
        evType: EventType.SCROLL,
        scrollData,
      });
    });

    const inactivityConfig: InactivityConfig = {
      timeout: this.config.sessionTimeout || 300_000, // Default 5 minutes
    };

    this.inactivityHandler = new InactivityHandler(inactivityConfig, this.handleInactivityChange.bind(this));
  }

  initScrollTracking(): void {
    this.scrollHandler.init();
  }

  initInactivityTracking(): void {
    this.inactivityHandler.init();
  }

  initClickTracking(): void {
    if (this.clickHandler) {
      // Prevent accumulating duplicate listeners
      window.removeEventListener('click', this.clickHandler, true);
    }

    this.clickHandler = (event: Event) => {
      if (this.clickDebounceTimer) {
        clearTimeout(this.clickDebounceTimer);
      }

      this.clickDebounceTimer = setTimeout(() => {
        const mouseEvent = event as MouseEvent;
        const clickedElement = mouseEvent.target as HTMLElement;

        if (!clickedElement) return;

        const trackingElement = ClickHandler.findTrackingElement(clickedElement);
        const relevantClickElement = ClickHandler.getRelevantClickElement(clickedElement);
        const coordinates = ClickHandler.calculateClickCoordinates(mouseEvent, clickedElement);

        if (trackingElement) {
          const trackingData = ClickHandler.extractTrackingData(trackingElement);
          const attributeData = ClickHandler.createCustomEventData(trackingData);

          this.handleEvent({
            evType: EventType.CUSTOM,
            customEvent: {
              name: attributeData.name,
              ...(attributeData.value && { metadata: { value: attributeData.value } }),
            },
          });
        }

        const clickData = ClickHandler.generateClickData(clickedElement, relevantClickElement, coordinates);

        this.handleEvent({
          evType: EventType.CLICK,
          url: window.location.href,
          clickData,
        });

        this.clickDebounceTimer = null;
      }, CLICK_DEBOUNCE_TIME);
    };

    window.addEventListener('click', this.clickHandler, true);
  }

  suppressNextScrollEvent(): void {
    this.scrollHandler.suppressNextEvent();
  }

  forceInactive(): void {
    this.inactivityHandler.forceInactive();
  }

  forceActive(): void {
    this.inactivityHandler.forceActive();
  }

  getInactivityState(): InactivityData {
    return this.inactivityHandler.getInactivityState();
  }

  updateInactivityTimeout(timeoutMs: number): void {
    this.inactivityHandler.updateTimeout(timeoutMs);
  }

  private handleInactivityChange(data: InactivityData): void {
    this.handleInactivity(data.isInactive);
  }

  cleanup(): void {
    if (this.clickHandler) {
      window.removeEventListener('click', this.clickHandler, true);
      this.clickHandler = undefined;
    }

    if (this.clickDebounceTimer) {
      clearTimeout(this.clickDebounceTimer);
      this.clickDebounceTimer = null;
    }

    this.scrollHandler?.cleanup();
    this.inactivityHandler?.cleanup();
  }
}
