/**
 * ClickHandler - Synthetic Click Tests
 *
 * Verifies that clicks with invalid coordinates (programmatic clicks, headless
 * browser drivers, malformed MouseEvents) are NOT emitted as CLICK events.
 * `element.click()` and MouseEvents constructed without `clientX/Y` default to
 * (0, 0); real users do not click the viewport's top-left pixel, so the
 * heuristic is safe and avoids polluting analytics with bogus coordinates.
 *
 * CUSTOM events from `data-tlog-name` must still fire — they don't depend on
 * coordinates and are legitimate even when triggered programmatically.
 */

import { describe, it, expect, beforeEach, afterEach, vi, type MockInstance } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { createMockElement } from '../../helpers/fixtures.helper';
import { ClickHandler } from '../../../src/handlers/click.handler';
import { EventManager } from '../../../src/managers/event.manager';
import { StorageManager } from '../../../src/managers/storage.manager';
import { EventType } from '../../../src/types/event.types';
import type { EventData } from '../../../src/types/event.types';

function getTrackedEvent(spy: ReturnType<typeof vi.spyOn>, index = 0): EventData {
  return spy.mock.calls[index]?.[0] as EventData;
}

describe('ClickHandler - Synthetic clicks', () => {
  let handler: ClickHandler;
  let eventManager: EventManager;
  let storageManager: StorageManager;
  let trackSpy: MockInstance<EventManager['track']>;

  beforeEach(() => {
    setupTestEnvironment();
    storageManager = new StorageManager();
    eventManager = new EventManager(storageManager, null);
    handler = new ClickHandler(eventManager);
    trackSpy = vi.spyOn(eventManager, 'track');
  });

  afterEach(() => {
    handler.stopTracking();
    cleanupTestEnvironment();
  });

  it('should NOT emit CLICK when coordinates are (0, 0)', () => {
    handler.startTracking();

    const button = createMockElement('button', { id: 'no-coords' }, 'Click');
    document.body.appendChild(button);

    const event = new MouseEvent('click', { bubbles: true, clientX: 0, clientY: 0 });
    button.dispatchEvent(event);

    const clickCalls = trackSpy.mock.calls.filter((call) => (call[0] as EventData).type === EventType.CLICK);
    expect(clickCalls).toHaveLength(0);

    document.body.removeChild(button);
  });

  it('should still emit CUSTOM event for synthetic click on data-tlog-name element', () => {
    handler.startTracking();

    const button = createMockElement('button', { 'data-tlog-name': 'cta_signup' }, 'Sign up');
    document.body.appendChild(button);

    const event = new MouseEvent('click', { bubbles: true, clientX: 0, clientY: 0 });
    button.dispatchEvent(event);

    const customCalls = trackSpy.mock.calls.filter((call) => (call[0] as EventData).type === EventType.CUSTOM);
    const clickCalls = trackSpy.mock.calls.filter((call) => (call[0] as EventData).type === EventType.CLICK);

    expect(customCalls).toHaveLength(1);
    expect((customCalls[0]?.[0] as EventData).custom_event?.name).toBe('cta_signup');
    expect(clickCalls).toHaveLength(0);

    document.body.removeChild(button);
  });

  it('should emit CLICK for real click with positive coordinates', () => {
    handler.startTracking();

    const button = createMockElement('button', {}, 'Real click');
    document.body.appendChild(button);

    const event = new MouseEvent('click', { bubbles: true, clientX: 120, clientY: 240 });
    button.dispatchEvent(event);

    const tracked = getTrackedEvent(trackSpy);
    expect(tracked.type).toBe(EventType.CLICK);
    expect(tracked.click_data?.x).toBe(120);
    expect(tracked.click_data?.y).toBe(240);

    document.body.removeChild(button);
  });

  it('should NOT emit CLICK when coordinates are NaN', () => {
    handler.startTracking();

    const button = createMockElement('button', {}, 'NaN coords');
    document.body.appendChild(button);

    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'clientX', { value: Number.NaN, configurable: true });
    Object.defineProperty(event, 'clientY', { value: Number.NaN, configurable: true });
    button.dispatchEvent(event);

    const clickCalls = trackSpy.mock.calls.filter((call) => (call[0] as EventData).type === EventType.CLICK);
    expect(clickCalls).toHaveLength(0);

    document.body.removeChild(button);
  });

  it('accepts (0, 0) coordinates when the event is user-generated (isTrusted)', () => {
    // Real users clicking the very top-left pixel produce isTrusted === true.
    // The (0, 0) heuristic is gated on !isTrusted so legitimate corner clicks
    // are preserved. jsdom does not allow overriding isTrusted on a dispatched
    // MouseEvent, so we exercise `calculateClickCoordinates` directly.
    const button = createMockElement('button', {}, 'Corner click');
    document.body.appendChild(button);

    const trustedEvent = { clientX: 0, clientY: 0, isTrusted: true } as MouseEvent;
    const coords = handler['calculateClickCoordinates'](trustedEvent);
    expect(coords).not.toBeNull();
    expect(coords?.x).toBe(0);
    expect(coords?.y).toBe(0);

    const syntheticEvent = { clientX: 0, clientY: 0, isTrusted: false } as MouseEvent;
    expect(handler['calculateClickCoordinates'](syntheticEvent)).toBeNull();

    document.body.removeChild(button);
  });
});
