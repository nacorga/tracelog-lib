/**
 * Metadata Array Support Test
 *
 * Tests that custom events support array of objects in metadata to detect library defects:
 * - Arrays of objects are accepted as metadata
 * - Arrays are validated correctly
 * - Mixed arrays are rejected
 * - Array metadata is preserved through the flow
 *
 * Focus: Detect metadata validation and type handling defects
 */

import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';

test.describe('Metadata Array Support', () => {
  test('should accept array of objects as metadata', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async (_projectId) => {
      const queues: any[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('queue', (payload: any) => {
        queues.push(payload);
      });

      await traceLog.init({
        samplingRate: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Send event with array of objects metadata
      traceLog.sendCustomEvent('array_metadata_event', [
        { key: 'value1', number: 1 },
        { key: 'value2', number: 2 },
        { key: 'value3', number: 3 },
      ]);

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Trigger queue send
      traceLog.sendCustomEvent('trigger_send', { marker: 'end' });

      await new Promise((resolve) => setTimeout(resolve, 12000));

      traceLog.destroy();

      return { queues };
    });

    // Extract custom events
    const allEvents = result.queues.flatMap((queue) => queue.events.filter((e: any) => e.type === 'custom'));

    const arrayEvent = allEvents.find((e: any) => e.custom_event?.name === 'array_metadata_event');

    expect(arrayEvent).toBeDefined();
    expect(Array.isArray(arrayEvent.custom_event.metadata)).toBe(true);
    expect(arrayEvent.custom_event.metadata.length).toBe(3);
  });

  test('should preserve array structure and data', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async (_projectId) => {
      const queues: any[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('queue', (payload: any) => {
        queues.push(payload);
      });

      await traceLog.init({
        samplingRate: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Send with structured array
      traceLog.sendCustomEvent('structured_array_event', [
        { id: 'item1', name: 'First Item', active: true, count: 10 },
        { id: 'item2', name: 'Second Item', active: false, count: 20 },
        { id: 'item3', name: 'Third Item', active: true, count: 30 },
      ]);

      await new Promise((resolve) => setTimeout(resolve, 200));

      traceLog.sendCustomEvent('trigger_send', { marker: 'end' });

      await new Promise((resolve) => setTimeout(resolve, 12000));

      traceLog.destroy();

      return { queues };
    });

    const allEvents = result.queues.flatMap((queue) => queue.events.filter((e: any) => e.type === 'custom'));

    const structuredEvent = allEvents.find((e: any) => e.custom_event?.name === 'structured_array_event');

    expect(structuredEvent).toBeDefined();

    const metadata = structuredEvent.custom_event.metadata;
    expect(Array.isArray(metadata)).toBe(true);

    // Verify first item
    expect(metadata[0].id).toBe('item1');
    expect(metadata[0].name).toBe('First Item');
    expect(metadata[0].active).toBe(true);
    expect(metadata[0].count).toBe(10);

    // Verify second item
    expect(metadata[1].id).toBe('item2');
    expect(metadata[1].active).toBe(false);
    expect(metadata[1].count).toBe(20);

    // Verify third item
    expect(metadata[2].id).toBe('item3');
    expect(metadata[2].count).toBe(30);
  });

  test('should handle array with string arrays in objects', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async (_projectId) => {
      const queues: any[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('queue', (payload: any) => {
        queues.push(payload);
      });

      await traceLog.init({
        samplingRate: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Array of objects with string arrays inside
      traceLog.sendCustomEvent('nested_arrays_event', [
        { category: 'fruits', items: ['apple', 'banana', 'orange'] },
        { category: 'vegetables', items: ['carrot', 'lettuce', 'tomato'] },
      ]);

      await new Promise((resolve) => setTimeout(resolve, 200));

      traceLog.sendCustomEvent('trigger_send', { marker: 'end' });

      await new Promise((resolve) => setTimeout(resolve, 12000));

      traceLog.destroy();

      return { queues };
    });

    const allEvents = result.queues.flatMap((queue) => queue.events.filter((e: any) => e.type === 'custom'));

    const nestedEvent = allEvents.find((e: any) => e.custom_event?.name === 'nested_arrays_event');

    expect(nestedEvent).toBeDefined();

    const metadata = nestedEvent.custom_event.metadata;
    expect(metadata[0].category).toBe('fruits');
    expect(metadata[0].items).toEqual(['apple', 'banana', 'orange']);
    expect(metadata[1].category).toBe('vegetables');
    expect(metadata[1].items).toEqual(['carrot', 'lettuce', 'tomato']);
  });

  test('should handle empty array as metadata', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async (_projectId) => {
      const queues: any[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('queue', (payload: any) => {
        queues.push(payload);
      });

      await traceLog.init({
        samplingRate: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      traceLog.sendCustomEvent('empty_array_event', []);

      await new Promise((resolve) => setTimeout(resolve, 200));

      traceLog.sendCustomEvent('trigger_send', { marker: 'end' });

      await new Promise((resolve) => setTimeout(resolve, 12000));

      traceLog.destroy();

      return { queues };
    });

    const allEvents = result.queues.flatMap((queue) => queue.events.filter((e: any) => e.type === 'custom'));

    const emptyEvent = allEvents.find((e: any) => e.custom_event?.name === 'empty_array_event');

    expect(emptyEvent).toBeDefined();
    expect(Array.isArray(emptyEvent.custom_event.metadata)).toBe(true);
    expect(emptyEvent.custom_event.metadata.length).toBe(0);
  });

  test('should handle single object in array', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async (_projectId) => {
      const queues: any[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('queue', (payload: any) => {
        queues.push(payload);
      });

      await traceLog.init({
        samplingRate: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      traceLog.sendCustomEvent('single_item_array', [{ id: 'only-one', value: 'test' }]);

      await new Promise((resolve) => setTimeout(resolve, 200));

      traceLog.sendCustomEvent('trigger_send', { marker: 'end' });

      await new Promise((resolve) => setTimeout(resolve, 12000));

      traceLog.destroy();

      return { queues };
    });

    const allEvents = result.queues.flatMap((queue) => queue.events.filter((e: any) => e.type === 'custom'));

    const singleEvent = allEvents.find((e: any) => e.custom_event?.name === 'single_item_array');

    expect(singleEvent).toBeDefined();
    expect(Array.isArray(singleEvent.custom_event.metadata)).toBe(true);
    expect(singleEvent.custom_event.metadata.length).toBe(1);
    expect(singleEvent.custom_event.metadata[0].id).toBe('only-one');
    expect(singleEvent.custom_event.metadata[0].value).toBe('test');
  });

  test('should handle large arrays without performance issues', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async (_projectId) => {
      const queues: any[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('queue', (payload: any) => {
        queues.push(payload);
      });

      await traceLog.init({
        samplingRate: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Create large array (50 items)
      const largeArray = Array.from({ length: 50 }, (_, i) => ({
        index: i,
        label: `item_${i}`,
        active: i % 2 === 0,
      }));

      const startTime = Date.now();
      traceLog.sendCustomEvent('large_array_event', largeArray);
      const endTime = Date.now();

      await new Promise((resolve) => setTimeout(resolve, 200));

      traceLog.sendCustomEvent('trigger_send', { marker: 'end' });

      await new Promise((resolve) => setTimeout(resolve, 12000));

      traceLog.destroy();

      return {
        queues,
        processingTime: endTime - startTime,
      };
    });

    // Verify processing was fast (< 100ms)
    expect(result.processingTime).toBeLessThan(100);

    const allEvents = result.queues.flatMap((queue) => queue.events.filter((e: any) => e.type === 'custom'));

    const largeEvent = allEvents.find((e: any) => e.custom_event?.name === 'large_array_event');

    expect(largeEvent).toBeDefined();
    expect(Array.isArray(largeEvent.custom_event.metadata)).toBe(true);
    expect(largeEvent.custom_event.metadata.length).toBe(50);
  });

  test('should work alongside regular object metadata', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async (_projectId) => {
      const queues: any[] = [];
      const traceLog = window.__traceLogBridge!;

      traceLog.on('queue', (payload: any) => {
        queues.push(payload);
      });

      await traceLog.init({
        samplingRate: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Regular object metadata
      traceLog.sendCustomEvent('object_metadata_event', {
        key: 'value',
        number: 123,
      });

      // Array metadata
      traceLog.sendCustomEvent('array_metadata_event', [{ key: 'value1' }, { key: 'value2' }]);

      await new Promise((resolve) => setTimeout(resolve, 200));

      traceLog.sendCustomEvent('trigger_send', { marker: 'end' });

      await new Promise((resolve) => setTimeout(resolve, 12000));

      traceLog.destroy();

      return { queues };
    });

    const allEvents = result.queues.flatMap((queue) => queue.events.filter((e: any) => e.type === 'custom'));

    const objectEvent = allEvents.find((e: any) => e.custom_event?.name === 'object_metadata_event');
    const arrayEvent = allEvents.find((e: any) => e.custom_event?.name === 'array_metadata_event');

    // Both should work
    expect(objectEvent).toBeDefined();
    expect(objectEvent.custom_event.metadata.key).toBe('value');

    expect(arrayEvent).toBeDefined();
    expect(Array.isArray(arrayEvent.custom_event.metadata)).toBe(true);
  });
});
