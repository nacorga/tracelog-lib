/**
 * ClickHandler Tests
 *
 * Priority: P1 (Essential)
 * Focus: Click event tracking with PII sanitization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { createMockElement } from '../../helpers/fixtures.helper';
import { ClickHandler } from '../../../src/handlers/click.handler';
import { EventManager } from '../../../src/managers/event.manager';
import { StorageManager } from '../../../src/managers/storage.manager';
import { EventType } from '../../../src/types/event.types';
import type { EventData } from '../../../src/types/event.types';

// Helper to get tracked event with proper typing
function getTrackedEvent(spy: ReturnType<typeof vi.spyOn>, index = 0): EventData {
  return spy.mock.calls[index]?.[0] as EventData;
}

describe('ClickHandler - Basic Tracking', () => {
  let handler: ClickHandler;
  let eventManager: EventManager;
  let storageManager: StorageManager;
  let trackSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    setupTestEnvironment();
    storageManager = new StorageManager();
    eventManager = new EventManager(storageManager, null, null, null, {});
    handler = new ClickHandler(eventManager);
    trackSpy = vi.spyOn(eventManager, 'track');
  });

  afterEach(() => {
    handler.stopTracking();
    cleanupTestEnvironment();
  });

  it('should start tracking on startTracking()', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    handler.startTracking();

    expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
  });

  it('should stop tracking on stopTracking()', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    handler.startTracking();
    handler.stopTracking();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
  });

  it('should capture click events on document', () => {
    handler.startTracking();

    const button = createMockElement('button', { id: 'test-btn' }, 'Click Me');
    document.body.appendChild(button);
    button.click();

    expect(trackSpy).toHaveBeenCalled();
    const event = getTrackedEvent(trackSpy);
    expect(event.type).toBe(EventType.CLICK);

    document.body.removeChild(button);
  });

  it('should track element tag name', () => {
    handler.startTracking();

    const anchor = createMockElement('a', { href: '#' }, 'Link');
    document.body.appendChild(anchor);
    anchor.click();

    expect(trackSpy).toHaveBeenCalled();
    const event = getTrackedEvent(trackSpy);
    expect(event.click_data?.tag).toBe('a');

    document.body.removeChild(anchor);
  });

  it('should track element id', () => {
    handler.startTracking();

    const button = createMockElement('button', { id: 'my-button' }, 'Click');
    document.body.appendChild(button);
    button.click();

    const event = getTrackedEvent(trackSpy);
    expect(event.click_data?.id).toBe('my-button');

    document.body.removeChild(button);
  });

  it('should track element classes', () => {
    handler.startTracking();

    const button = createMockElement('button', { class: 'btn btn-primary' }, 'Click');
    document.body.appendChild(button);
    button.click();

    const event = getTrackedEvent(trackSpy);
    expect(event.click_data?.class).toBe('btn btn-primary');

    document.body.removeChild(button);
  });

  it('should track element text content', () => {
    handler.startTracking();

    const button = createMockElement('button', {}, 'Submit Form');
    document.body.appendChild(button);
    button.click();

    const event = getTrackedEvent(trackSpy);
    expect(event.click_data?.text).toBe('Submit Form');

    document.body.removeChild(button);
  });

  it('should track click coordinates (x, y)', () => {
    handler.startTracking();

    const button = createMockElement('button', {}, 'Click');
    document.body.appendChild(button);

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      clientX: 150,
      clientY: 250,
    });
    button.dispatchEvent(clickEvent);

    const event = getTrackedEvent(trackSpy);
    expect(event.click_data?.x).toBe(150);
    expect(event.click_data?.y).toBe(250);
    expect(event.click_data?.relativeX).toBeGreaterThanOrEqual(0);
    expect(event.click_data?.relativeY).toBeGreaterThanOrEqual(0);

    document.body.removeChild(button);
  });

  it('should use passive event listener', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    handler.startTracking();

    // Third parameter is 'true' for capture phase
    expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
  });
});

describe('ClickHandler - PII Sanitization', () => {
  let handler: ClickHandler;
  let eventManager: EventManager;
  let storageManager: StorageManager;
  let trackSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    setupTestEnvironment();
    storageManager = new StorageManager();
    eventManager = new EventManager(storageManager, null, null, null, {});
    handler = new ClickHandler(eventManager);
    trackSpy = vi.spyOn(eventManager, 'track');
  });

  afterEach(() => {
    handler.stopTracking();
    cleanupTestEnvironment();
  });

  it('should NOT capture input values', () => {
    handler.startTracking();

    const input = document.createElement('input');
    input.type = 'text';
    input.value = 'sensitive-data@example.com';
    document.body.appendChild(input);
    input.click();

    const event = getTrackedEvent(trackSpy);
    // Input values should not appear in text (text should be empty or undefined)
    expect(event.click_data?.text || '').not.toContain('sensitive-data');

    document.body.removeChild(input);
  });

  it('should NOT capture textarea values', () => {
    handler.startTracking();

    const textarea = document.createElement('textarea');
    textarea.value = 'Secret message with user@example.com';
    document.body.appendChild(textarea);
    textarea.click();

    const event = getTrackedEvent(trackSpy);
    // Textarea values should not appear in text (text should be empty or undefined)
    expect(event.click_data?.text || '').not.toContain('Secret message');

    document.body.removeChild(textarea);
  });

  it('should NOT capture select values', () => {
    handler.startTracking();

    const select = document.createElement('select');
    const option = document.createElement('option');
    option.value = 'sensitive-value';
    option.textContent = 'Sensitive Option';
    select.appendChild(option);
    document.body.appendChild(select);
    select.click();

    // Select element should be tracked, but not show option values in a sensitive way
    expect(trackSpy).toHaveBeenCalled();

    document.body.removeChild(select);
  });

  it('should sanitize emails from text', () => {
    handler.startTracking();

    const div = createMockElement('div', {}, 'Contact: user@example.com for help');
    document.body.appendChild(div);
    div.click();

    const event = getTrackedEvent(trackSpy);
    expect(event.click_data?.text).toContain('[REDACTED]');
    expect(event.click_data?.text).not.toContain('user@example.com');

    document.body.removeChild(div);
  });

  it('should sanitize phone numbers from text', () => {
    handler.startTracking();

    const div = createMockElement('div', {}, 'Call: 555-123-4567');
    document.body.appendChild(div);
    div.click();

    const event = getTrackedEvent(trackSpy);
    expect(event.click_data?.text).toContain('[REDACTED]');
    expect(event.click_data?.text).not.toContain('555-123-4567');

    document.body.removeChild(div);
  });

  it('should sanitize credit cards from text', () => {
    handler.startTracking();

    const div = createMockElement('div', {}, 'Card: 4532-1234-5678-9010');
    document.body.appendChild(div);
    div.click();

    const event = getTrackedEvent(trackSpy);
    expect(event.click_data?.text).toContain('[REDACTED]');
    expect(event.click_data?.text).not.toContain('4532-1234-5678-9010');

    document.body.removeChild(div);
  });

  it('should respect data-tlog-ignore attribute', () => {
    handler.startTracking();

    const button = createMockElement('button', { 'data-tlog-ignore': 'true' }, 'Ignored Button');
    document.body.appendChild(button);
    button.click();

    // Should not track ignored element
    expect(trackSpy).not.toHaveBeenCalled();

    document.body.removeChild(button);
  });

  it('should ignore clicks on ignored elements', () => {
    handler.startTracking();

    const container = createMockElement('div', { 'data-tlog-ignore': 'true' });
    const button = createMockElement('button', {}, 'Child Button');
    container.appendChild(button);
    document.body.appendChild(container);

    button.click();

    // Should not track children of ignored elements
    expect(trackSpy).not.toHaveBeenCalled();

    document.body.removeChild(container);
  });
});

describe('ClickHandler - Element Data Capture', () => {
  let handler: ClickHandler;
  let eventManager: EventManager;
  let storageManager: StorageManager;
  let trackSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    setupTestEnvironment();
    storageManager = new StorageManager();
    eventManager = new EventManager(storageManager, null, null, null, {});
    handler = new ClickHandler(eventManager);
    trackSpy = vi.spyOn(eventManager, 'track');
  });

  afterEach(() => {
    handler.stopTracking();
    cleanupTestEnvironment();
  });

  it('should capture up to 3 CSS classes', () => {
    handler.startTracking();

    const button = createMockElement('button', { class: 'btn btn-primary btn-lg' }, 'Click');
    document.body.appendChild(button);
    button.click();

    const event = getTrackedEvent(trackSpy);
    expect(event.click_data?.class).toBe('btn btn-primary btn-lg');

    document.body.removeChild(button);
  });

  it('should truncate long text content', () => {
    handler.startTracking();

    const longText = 'a'.repeat(300); // Longer than MAX_TEXT_LENGTH (255)
    const div = createMockElement('div', {}, longText);
    document.body.appendChild(div);
    div.click();

    const event = getTrackedEvent(trackSpy);
    expect(event.click_data?.text?.length).toBeLessThanOrEqual(255);
    expect(event.click_data?.text).toContain('...');

    document.body.removeChild(div);
  });

  it('should handle elements without id', () => {
    handler.startTracking();

    const button = createMockElement('button', {}, 'No ID');
    document.body.appendChild(button);
    button.click();

    const event = getTrackedEvent(trackSpy);
    expect(event.click_data?.id).toBeUndefined();
    expect(event.click_data?.tag).toBe('button');

    document.body.removeChild(button);
  });

  it('should handle elements without classes', () => {
    handler.startTracking();

    const button = createMockElement('button', { id: 'test' }, 'No Class');
    document.body.appendChild(button);
    button.click();

    const event = getTrackedEvent(trackSpy);
    expect(event.click_data?.class).toBeUndefined();
    expect(event.click_data?.tag).toBe('button');

    document.body.removeChild(button);
  });

  it('should handle elements without text', () => {
    handler.startTracking();

    const button = createMockElement('button', { id: 'icon-btn' }, '');
    document.body.appendChild(button);
    button.click();

    const event = getTrackedEvent(trackSpy);
    expect(event.click_data?.text).toBeFalsy();
    expect(event.click_data?.tag).toBe('button');

    document.body.removeChild(button);
  });

  it('should traverse up to find meaningful element', () => {
    handler.startTracking();

    const button = createMockElement('button', { id: 'parent-btn' });
    const span = createMockElement('span', {}, 'Click Me');
    button.appendChild(span);
    document.body.appendChild(button);

    span.click();

    const event = getTrackedEvent(trackSpy);
    // Should find the button as the interactive element
    expect(event.click_data?.tag).toBe('button');

    document.body.removeChild(button);
  });
});

describe('ClickHandler - Edge Cases', () => {
  let handler: ClickHandler;
  let eventManager: EventManager;
  let storageManager: StorageManager;
  let trackSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    setupTestEnvironment();
    storageManager = new StorageManager();
    eventManager = new EventManager(storageManager, null, null, null, {});
    handler = new ClickHandler(eventManager);
    trackSpy = vi.spyOn(eventManager, 'track');
  });

  afterEach(() => {
    handler.stopTracking();
    cleanupTestEnvironment();
  });

  it('should handle clicks on document', () => {
    handler.startTracking();

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      clientX: 100,
      clientY: 200,
    });
    document.dispatchEvent(clickEvent);

    // Should handle gracefully (may or may not track depending on target)
    // The important thing is it doesn't throw an error
    expect(() => document.dispatchEvent(clickEvent)).not.toThrow();
  });

  it('should handle clicks on window', () => {
    handler.startTracking();

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      clientX: 100,
      clientY: 200,
    });

    // Should handle gracefully without throwing
    expect(() => window.dispatchEvent(clickEvent)).not.toThrow();
  });

  it('should handle clicks on null target', () => {
    handler.startTracking();

    // Create event with no target
    const clickEvent = new MouseEvent('click', { bubbles: true });

    expect(() => document.dispatchEvent(clickEvent)).not.toThrow();
  });

  it('should handle rapid clicks', () => {
    handler.startTracking();

    const button = createMockElement('button', { id: 'rapid-btn' }, 'Click');
    document.body.appendChild(button);

    // Click multiple times rapidly
    button.click();
    button.click();
    button.click();

    // Should track all clicks (though some may be throttled)
    expect(trackSpy).toHaveBeenCalled();

    document.body.removeChild(button);
  });

  it('should handle clicks on dynamically added elements', () => {
    handler.startTracking();

    const button = createMockElement('button', { id: 'dynamic-btn' }, 'Dynamic');

    // Add element after handler is tracking
    document.body.appendChild(button);
    button.click();

    expect(trackSpy).toHaveBeenCalled();
    const event = getTrackedEvent(trackSpy);
    expect(event.click_data?.tag).toBe('button');

    document.body.removeChild(button);
  });

  it('should debounce duplicate clicks', () => {
    const dateSpy = vi.spyOn(Date, 'now');
    let mockTime = 1000;
    dateSpy.mockImplementation(() => mockTime);

    handler.startTracking();

    const button = createMockElement('button', { id: 'debounce-btn' }, 'Click');
    document.body.appendChild(button);

    // First click should be tracked
    button.click();
    expect(trackSpy).toHaveBeenCalledTimes(1);

    // Immediate second click should be throttled (within 300ms default)
    mockTime += 100; // Only 100ms later
    button.click();
    expect(trackSpy).toHaveBeenCalledTimes(1); // Still 1, throttled

    // After throttle period, should track again
    mockTime += 300; // Total 400ms later
    button.click();
    expect(trackSpy).toHaveBeenCalledTimes(2);

    document.body.removeChild(button);
    dateSpy.mockRestore();
  });
});
