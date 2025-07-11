import { TracelogConfig, EventType, TracelogEventScrollData } from '../types';
import { ClickHandler } from '../events/click-handler';
import { ScrollHandler, ScrollConfig } from '../events/scroll-handler';
import { InactivityHandler, InactivityConfig, InactivityData } from '../events/inactivity-handler';

export class TrackingManager {
  private readonly scrollHandler: ScrollHandler;
  private readonly inactivityHandler: InactivityHandler;

  constructor(
    private readonly config: TracelogConfig,
    private readonly handleEvent: (event: any) => void,
    private readonly handleInactivity: (isInactive: boolean) => void,
  ) {
    // Initialize scroll handler
    const scrollConfig: ScrollConfig = {
      containerSelectors: this.config.scrollContainerSelectors,
    };

    this.scrollHandler = new ScrollHandler(scrollConfig, (scrollData: TracelogEventScrollData) => {
      this.handleEvent({
        evType: EventType.SCROLL,
        scrollData,
      });
    });

    // Initialize inactivity handler
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
    const handleClick = (event: Event) => {
      const mouseEvent = event as MouseEvent;
      const clickedElement = mouseEvent.target as HTMLElement;

      if (!clickedElement) return;

      const trackingElement = ClickHandler.findTrackingElement(clickedElement);
      const relevantClickElement = ClickHandler.getRelevantClickElement(clickedElement);
      const coordinates = ClickHandler.calculateClickCoordinates(mouseEvent, clickedElement);

      // Handle custom tracking attributes
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

      // Handle regular click tracking
      const clickData = ClickHandler.generateClickData(clickedElement, relevantClickElement, coordinates);

      this.handleEvent({
        evType: EventType.CLICK,
        url: window.location.href,
        clickData,
      });
    };

    window.addEventListener('click', handleClick, true);
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
    this.scrollHandler?.cleanup();
    this.inactivityHandler?.cleanup();
  }
}
