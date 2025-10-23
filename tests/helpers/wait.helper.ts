/**
 * Wait Helper
 *
 * Utilities for waiting for conditions and events in tests
 */

/**
 * Wait for a condition to become true
 *
 * @param condition Function that returns true when condition is met
 * @param timeout Maximum time to wait in milliseconds
 * @param interval Time between checks in milliseconds
 * @returns Promise that resolves when condition is met or rejects on timeout
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100,
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Wait for specific number of milliseconds
 *
 * @param ms Milliseconds to wait
 */
export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait for next tick
 */
export async function waitForNextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Wait for multiple ticks
 *
 * @param ticks Number of ticks to wait
 */
export async function waitForTicks(ticks = 1): Promise<void> {
  for (let i = 0; i < ticks; i++) {
    await waitForNextTick();
  }
}

/**
 * Wait for event to be emitted
 *
 * @param emitter Event emitter instance
 * @param eventName Name of event to wait for
 * @param timeout Maximum time to wait
 * @returns Promise that resolves with event data
 */
export async function waitForEvent<T = any>(emitter: any, eventName: string, timeout = 5000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      emitter.off(eventName, handler);
      reject(new Error(`Timeout waiting for event "${eventName}" after ${timeout}ms`));
    }, timeout);

    const handler = (data: T) => {
      clearTimeout(timeoutId);
      emitter.off(eventName, handler);
      resolve(data);
    };

    emitter.on(eventName, handler);
  });
}

/**
 * Wait for multiple events to be emitted
 *
 * @param emitter Event emitter instance
 * @param eventName Name of event to wait for
 * @param count Number of events to wait for
 * @param timeout Maximum time to wait
 * @returns Promise that resolves with array of event data
 */
export async function waitForEvents<T = any>(
  emitter: any,
  eventName: string,
  count: number,
  timeout = 5000,
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const events: T[] = [];
    const timeoutId = setTimeout(() => {
      emitter.off(eventName, handler);
      reject(
        new Error(`Timeout waiting for ${count} "${eventName}" events (received ${events.length}) after ${timeout}ms`),
      );
    }, timeout);

    const handler = (data: T) => {
      events.push(data);
      if (events.length >= count) {
        clearTimeout(timeoutId);
        emitter.off(eventName, handler);
        resolve(events);
      }
    };

    emitter.on(eventName, handler);
  });
}

/**
 * Wait for queue to flush
 * Default TraceLog queue flushes every 10 seconds
 *
 * @param bufferMs Additional buffer time
 */
export async function waitForQueueFlush(bufferMs = 2000): Promise<void> {
  const flushInterval = 10000; // Default flush interval
  await wait(flushInterval + bufferMs);
}

/**
 * Wait for DOM element to appear
 *
 * @param selector CSS selector
 * @param timeout Maximum time to wait
 * @returns Promise that resolves with element
 */
export async function waitForElement(selector: string, timeout = 5000): Promise<Element> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (element) {
      return element;
    }
    await wait(100);
  }

  throw new Error(`Timeout waiting for element "${selector}" after ${timeout}ms`);
}

/**
 * Wait for DOM element to disappear
 *
 * @param selector CSS selector
 * @param timeout Maximum time to wait
 */
export async function waitForElementRemoved(selector: string, timeout = 5000): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (!element) {
      return;
    }
    await wait(100);
  }

  throw new Error(`Timeout waiting for element "${selector}" to be removed after ${timeout}ms`);
}

/**
 * Wait for function to stop throwing
 * Useful for waiting for async operations to complete
 *
 * @param fn Function to execute
 * @param timeout Maximum time to wait
 * @param interval Time between attempts
 */
export async function waitForNoError(fn: () => void | Promise<void>, timeout = 5000, interval = 100): Promise<void> {
  const startTime = Date.now();
  let lastError: Error | undefined;

  while (Date.now() - startTime < timeout) {
    try {
      await fn();
      return;
    } catch (error) {
      lastError = error as Error;
      await wait(interval);
    }
  }

  throw new Error(`Timeout waiting for function to succeed after ${timeout}ms. Last error: ${lastError?.message}`);
}

/**
 * Wait for localStorage key to have specific value
 *
 * @param key localStorage key
 * @param expectedValue Expected value (compared with JSON.stringify)
 * @param timeout Maximum time to wait
 */
export async function waitForStorageValue(key: string, expectedValue: any, timeout = 5000): Promise<void> {
  await waitForCondition(() => {
    const value = localStorage.getItem(key);
    if (!value) return false;

    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed) === JSON.stringify(expectedValue);
    } catch {
      return value === String(expectedValue);
    }
  }, timeout);
}

/**
 * Wait for localStorage key to exist
 *
 * @param key localStorage key
 * @param timeout Maximum time to wait
 */
export async function waitForStorageKey(key: string, timeout = 5000): Promise<void> {
  await waitForCondition(() => {
    return localStorage.getItem(key) !== null;
  }, timeout);
}

/**
 * Retry function until it succeeds or max attempts reached
 *
 * @param fn Function to retry
 * @param maxAttempts Maximum number of attempts
 * @param delayMs Delay between attempts
 */
export async function retry<T>(fn: () => T | Promise<T>, maxAttempts = 3, delayMs = 1000): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await wait(delayMs);
      }
    }
  }

  throw new Error(`Failed after ${maxAttempts} attempts. Last error: ${lastError?.message}`);
}

/**
 * Poll function until it returns truthy value or timeout
 *
 * @param fn Function to poll
 * @param timeout Maximum time to wait
 * @param interval Time between polls
 * @returns Result of function
 */
export async function poll<T>(fn: () => T | Promise<T>, timeout = 5000, interval = 100): Promise<T> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await fn();
    if (result) {
      return result;
    }
    await wait(interval);
  }

  throw new Error(`Timeout polling function after ${timeout}ms`);
}
