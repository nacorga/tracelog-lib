import { test, expect } from '@playwright/test';
import { TestUtils } from '../../utils';

test.describe('Click Tracking - Coordinate Calculation', () => {
  test.describe('Absolute coordinate calculation', () => {
    test('should accurately calculate absolute coordinates for top-left corner clicks', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create element at specific position
        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'top-left-button';
          button.textContent = 'Top Left';
          button.style.position = 'absolute';
          button.style.left = '50px';
          button.style.top = '100px';
          button.style.width = '100px';
          button.style.height = '50px';
          document.body.appendChild(button);
        });

        // Capture click coordinates
        const clickData = await page.evaluate(async () => {
          let capturedCoordinates: any = null;
          const bridge = window.__traceLogTestBridge;
          const eventManager = bridge?.getEventManager();

          if (eventManager) {
            const originalTrack = eventManager.track;
            eventManager.track = function (eventData: any) {
              if (eventData.type === 'click') {
                capturedCoordinates = eventData.click_data;
              }
              return originalTrack.call(this, eventData);
            };

            // Click at top-left corner of element (55, 105)
            const button = document.getElementById('top-left-button');
            if (button) {
              const rect = button.getBoundingClientRect();
              const clickEvent = new MouseEvent('click', {
                clientX: rect.left + 5,
                clientY: rect.top + 5,
                bubbles: true,
              });
              button.dispatchEvent(clickEvent);
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
            eventManager.track = originalTrack;
          }

          return capturedCoordinates;
        });

        expect(clickData).toBeDefined();
        expect(clickData.x).toBe(55); // 50 + 5
        expect(clickData.y).toBe(105); // 100 + 5

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should accurately calculate absolute coordinates for center clicks', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'center-button';
          button.textContent = 'Center';
          button.style.position = 'absolute';
          button.style.left = '200px';
          button.style.top = '300px';
          button.style.width = '120px';
          button.style.height = '60px';
          document.body.appendChild(button);
        });

        const clickData = await page.evaluate(async () => {
          let capturedCoordinates: any = null;
          const bridge = window.__traceLogTestBridge;
          const eventManager = bridge?.getEventManager();

          if (eventManager) {
            const originalTrack = eventManager.track;
            eventManager.track = function (eventData: any) {
              if (eventData.type === 'click') {
                capturedCoordinates = eventData.click_data;
              }
              return originalTrack.call(this, eventData);
            };

            const button = document.getElementById('center-button');
            if (button) {
              const rect = button.getBoundingClientRect();
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              const clickEvent = new MouseEvent('click', {
                clientX: centerX,
                clientY: centerY,
                bubbles: true,
              });
              button.dispatchEvent(clickEvent);
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
            eventManager.track = originalTrack;
          }

          return capturedCoordinates;
        });

        expect(clickData).toBeDefined();
        expect(clickData.x).toBe(260); // 200 + 60 (center)
        expect(clickData.y).toBe(330); // 300 + 30 (center)

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should accurately calculate absolute coordinates for bottom-right corner clicks', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'bottom-right-button';
          button.textContent = 'Bottom Right';
          button.style.position = 'absolute';
          button.style.left = '400px';
          button.style.top = '500px';
          button.style.width = '150px';
          button.style.height = '80px';
          document.body.appendChild(button);
        });

        const clickData = await page.evaluate(async () => {
          let capturedCoordinates: any = null;
          const bridge = window.__traceLogTestBridge;
          const eventManager = bridge?.getEventManager();

          if (eventManager) {
            const originalTrack = eventManager.track;
            eventManager.track = function (eventData: any) {
              if (eventData.type === 'click') {
                capturedCoordinates = eventData.click_data;
              }
              return originalTrack.call(this, eventData);
            };

            const button = document.getElementById('bottom-right-button');
            if (button) {
              const rect = button.getBoundingClientRect();
              const clickEvent = new MouseEvent('click', {
                clientX: rect.right - 5,
                clientY: rect.bottom - 5,
                bubbles: true,
              });
              button.dispatchEvent(clickEvent);
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
            eventManager.track = originalTrack;
          }

          return capturedCoordinates;
        });

        expect(clickData).toBeDefined();
        expect(clickData.x).toBe(545); // 400 + 150 - 5
        expect(clickData.y).toBe(575); // 500 + 80 - 5

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle clicks at viewport edges correctly', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create element near viewport edge
        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'edge-button';
          button.textContent = 'Edge';
          button.style.position = 'fixed';
          button.style.right = '10px';
          button.style.top = '10px';
          button.style.width = '80px';
          button.style.height = '40px';
          document.body.appendChild(button);
        });

        const { clickData, viewportSize } = await page.evaluate(async () => {
          let capturedCoordinates: any = null;
          const bridge = window.__traceLogTestBridge;
          const eventManager = bridge?.getEventManager();

          if (eventManager) {
            const originalTrack = eventManager.track;
            eventManager.track = function (eventData: any) {
              if (eventData.type === 'click') {
                capturedCoordinates = eventData.click_data;
              }
              return originalTrack.call(this, eventData);
            };

            const button = document.getElementById('edge-button');
            if (button) {
              const rect = button.getBoundingClientRect();
              const clickEvent = new MouseEvent('click', {
                clientX: rect.left + 10,
                clientY: rect.top + 10,
                bubbles: true,
              });
              button.dispatchEvent(clickEvent);
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
            eventManager.track = originalTrack;
          }

          return {
            clickData: capturedCoordinates,
            viewportSize: { width: window.innerWidth, height: window.innerHeight },
          };
        });

        expect(clickData).toBeDefined();
        // Click should be near the right edge
        expect(clickData.x).toBeGreaterThan(viewportSize.width - 100);
        expect(clickData.y).toBe(20); // 10 + 10

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Relative coordinate calculation', () => {
    test('should calculate correct relative coordinates for corner clicks', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'relative-test-button';
          button.textContent = 'Relative Test';
          button.style.position = 'absolute';
          button.style.left = '100px';
          button.style.top = '100px';
          button.style.width = '200px';
          button.style.height = '100px';
          document.body.appendChild(button);
        });

        // Test all four corners
        const cornerTests = [
          { name: 'top-left', expectedRelX: 0, expectedRelY: 0 },
          { name: 'top-right', expectedRelX: 1, expectedRelY: 0 },
          { name: 'bottom-left', expectedRelX: 0, expectedRelY: 1 },
          { name: 'bottom-right', expectedRelX: 1, expectedRelY: 1 },
          { name: 'center', expectedRelX: 0.5, expectedRelY: 0.5 },
        ];

        for (const corner of cornerTests) {
          const clickData = await page.evaluate(
            async ({ relX, relY }) => {
              let capturedCoordinates: any = null;
              const bridge = window.__traceLogTestBridge;
              const eventManager = bridge?.getEventManager();

              if (eventManager) {
                const originalTrack = eventManager.track;
                eventManager.track = function (eventData: any) {
                  if (eventData.type === 'click') {
                    capturedCoordinates = eventData.click_data;
                  }
                  return originalTrack.call(this, eventData);
                };

                const button = document.getElementById('relative-test-button');
                if (button) {
                  const rect = button.getBoundingClientRect();
                  const clickX = rect.left + rect.width * relX;
                  const clickY = rect.top + rect.height * relY;
                  const clickEvent = new MouseEvent('click', {
                    clientX: clickX,
                    clientY: clickY,
                    bubbles: true,
                  });
                  button.dispatchEvent(clickEvent);
                }

                await new Promise((resolve) => setTimeout(resolve, 100));
                eventManager.track = originalTrack;
              }

              return capturedCoordinates;
            },
            { cornerName: corner.name, relX: corner.expectedRelX, relY: corner.expectedRelY },
          );

          expect(clickData, `Failed for ${corner.name} corner`).toBeDefined();
          expect(clickData.relativeX, `RelativeX failed for ${corner.name}`).toBe(corner.expectedRelX);
          expect(clickData.relativeY, `RelativeY failed for ${corner.name}`).toBe(corner.expectedRelY);
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should calculate precise relative coordinates for intermediate positions', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'precise-test-button';
          button.textContent = 'Precision Test';
          button.style.position = 'absolute';
          button.style.left = '50px';
          button.style.top = '50px';
          button.style.width = '300px';
          button.style.height = '150px';
          document.body.appendChild(button);
        });

        // Test specific precise positions
        const precisionTests = [
          { name: '25% width, 25% height', relX: 0.25, relY: 0.25 },
          { name: '33% width, 66% height', relX: 0.333, relY: 0.667 },
          { name: '75% width, 10% height', relX: 0.75, relY: 0.1 },
          { name: '90% width, 90% height', relX: 0.9, relY: 0.9 },
        ];

        for (const test of precisionTests) {
          const clickData = await page.evaluate(
            async ({ relX, relY }) => {
              let capturedCoordinates: any = null;
              const bridge = window.__traceLogTestBridge;
              const eventManager = bridge?.getEventManager();

              if (eventManager) {
                const originalTrack = eventManager.track;
                eventManager.track = function (eventData: any) {
                  if (eventData.type === 'click') {
                    capturedCoordinates = eventData.click_data;
                  }
                  return originalTrack.call(this, eventData);
                };

                const button = document.getElementById('precise-test-button');
                if (button) {
                  const rect = button.getBoundingClientRect();
                  const clickX = rect.left + rect.width * relX;
                  const clickY = rect.top + rect.height * relY;
                  const clickEvent = new MouseEvent('click', {
                    clientX: clickX,
                    clientY: clickY,
                    bubbles: true,
                  });
                  button.dispatchEvent(clickEvent);
                }

                await new Promise((resolve) => setTimeout(resolve, 100));
                eventManager.track = originalTrack;
              }

              return capturedCoordinates;
            },
            { relX: test.relX, relY: test.relY },
          );

          expect(clickData, `Failed for ${test.name}`).toBeDefined();
          // Allow for small floating point precision differences
          expect(Math.abs(clickData.relativeX - test.relX), `RelativeX precision failed for ${test.name}`).toBeLessThan(
            0.005,
          );
          expect(Math.abs(clickData.relativeY - test.relY), `RelativeY precision failed for ${test.name}`).toBeLessThan(
            0.005,
          );
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle zero-width or zero-height elements gracefully', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Test zero-width element
        await page.evaluate(() => {
          const zeroWidth = document.createElement('div');
          zeroWidth.id = 'zero-width';
          zeroWidth.textContent = '|';
          zeroWidth.style.position = 'absolute';
          zeroWidth.style.left = '100px';
          zeroWidth.style.top = '100px';
          zeroWidth.style.width = '0px';
          zeroWidth.style.height = '50px';
          zeroWidth.style.backgroundColor = 'red';
          zeroWidth.style.cursor = 'pointer';
          document.body.appendChild(zeroWidth);

          const zeroHeight = document.createElement('div');
          zeroHeight.id = 'zero-height';
          zeroHeight.textContent = '_';
          zeroHeight.style.position = 'absolute';
          zeroHeight.style.left = '200px';
          zeroHeight.style.top = '100px';
          zeroHeight.style.width = '50px';
          zeroHeight.style.height = '0px';
          zeroHeight.style.backgroundColor = 'blue';
          zeroHeight.style.cursor = 'pointer';
          document.body.appendChild(zeroHeight);
        });

        // Test zero-width element
        const zeroWidthData = await page.evaluate(async () => {
          let capturedCoordinates: any = null;
          const bridge = window.__traceLogTestBridge;
          const eventManager = bridge?.getEventManager();

          if (eventManager) {
            const originalTrack = eventManager.track;
            eventManager.track = function (eventData: any) {
              if (eventData.type === 'click') {
                capturedCoordinates = eventData.click_data;
              }
              return originalTrack.call(this, eventData);
            };

            const element = document.getElementById('zero-width');
            if (element) {
              const clickEvent = new MouseEvent('click', {
                clientX: 100,
                clientY: 125,
                bubbles: true,
              });
              element.dispatchEvent(clickEvent);
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
            eventManager.track = originalTrack;
          }

          return capturedCoordinates;
        });

        expect(zeroWidthData).toBeDefined();
        expect(zeroWidthData.relativeX).toBe(0); // Should default to 0 for zero width

        // Test zero-height element
        const zeroHeightData = await page.evaluate(async () => {
          let capturedCoordinates: any = null;
          const bridge = window.__traceLogTestBridge;
          const eventManager = bridge?.getEventManager();

          if (eventManager) {
            const originalTrack = eventManager.track;
            eventManager.track = function (eventData: any) {
              if (eventData.type === 'click') {
                capturedCoordinates = eventData.click_data;
              }
              return originalTrack.call(this, eventData);
            };

            const element = document.getElementById('zero-height');
            if (element) {
              const clickEvent = new MouseEvent('click', {
                clientX: 225,
                clientY: 100,
                bubbles: true,
              });
              element.dispatchEvent(clickEvent);
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
            eventManager.track = originalTrack;
          }

          return capturedCoordinates;
        });

        expect(zeroHeightData).toBeDefined();
        expect(zeroHeightData.relativeY).toBe(0); // Should default to 0 for zero height

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Viewport size coordinate accuracy', () => {
    test('should maintain coordinate accuracy across different viewport sizes', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Test multiple viewport sizes
        const viewportSizes = [
          { width: 1024, height: 768, name: 'desktop' },
          { width: 768, height: 1024, name: 'tablet-portrait' },
          { width: 375, height: 667, name: 'mobile' },
        ];

        for (const viewport of viewportSizes) {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await TestUtils.waitForTimeout(page, 200); // Allow viewport to stabilize

          await page.evaluate(() => {
            // Clear previous test elements
            const existing = document.getElementById('viewport-test-button');
            if (existing) existing.remove();

            const button = document.createElement('button');
            button.id = 'viewport-test-button';
            button.textContent = 'Viewport Test';
            button.style.position = 'fixed';
            button.style.left = '20px';
            button.style.top = '20px';
            button.style.width = '100px';
            button.style.height = '40px';
            document.body.appendChild(button);
          });

          const clickData = await page.evaluate(async () => {
            let capturedCoordinates: any = null;
            const bridge = window.__traceLogTestBridge;
            const eventManager = bridge?.getEventManager();

            if (eventManager) {
              const originalTrack = eventManager.track;
              eventManager.track = function (eventData: any) {
                if (eventData.type === 'click') {
                  capturedCoordinates = eventData.click_data;
                }
                return originalTrack.call(this, eventData);
              };

              const button = document.getElementById('viewport-test-button');
              if (button) {
                const rect = button.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const clickEvent = new MouseEvent('click', {
                  clientX: centerX,
                  clientY: centerY,
                  bubbles: true,
                });
                button.dispatchEvent(clickEvent);
              }

              await new Promise((resolve) => setTimeout(resolve, 100));
              eventManager.track = originalTrack;
            }

            return capturedCoordinates;
          });

          expect(clickData, `Failed for ${viewport.name} viewport`).toBeDefined();
          expect(clickData.x, `Absolute X failed for ${viewport.name}`).toBe(70); // 20 + 50 (center)
          expect(clickData.y, `Absolute Y failed for ${viewport.name}`).toBe(40); // 20 + 20 (center)
          expect(clickData.relativeX, `Relative X failed for ${viewport.name}`).toBe(0.5);
          expect(clickData.relativeY, `Relative Y failed for ${viewport.name}`).toBe(0.5);
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle clicks near viewport boundaries consistently', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        await page.setViewportSize({ width: 800, height: 600 });

        await page.evaluate(() => {
          // Element near bottom-right corner
          const button = document.createElement('button');
          button.id = 'boundary-button';
          button.textContent = 'Boundary';
          button.style.position = 'fixed';
          button.style.right = '10px';
          button.style.bottom = '10px';
          button.style.width = '80px';
          button.style.height = '30px';
          document.body.appendChild(button);
        });

        const clickData = await page.evaluate(async () => {
          let capturedCoordinates: any = null;
          const bridge = window.__traceLogTestBridge;
          const eventManager = bridge?.getEventManager();

          if (eventManager) {
            const originalTrack = eventManager.track;
            eventManager.track = function (eventData: any) {
              if (eventData.type === 'click') {
                capturedCoordinates = eventData.click_data;
              }
              return originalTrack.call(this, eventData);
            };

            const button = document.getElementById('boundary-button');
            if (button) {
              const rect = button.getBoundingClientRect();
              const clickEvent = new MouseEvent('click', {
                clientX: rect.left + 5,
                clientY: rect.top + 5,
                bubbles: true,
              });
              button.dispatchEvent(clickEvent);
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
            eventManager.track = originalTrack;
          }

          return capturedCoordinates;
        });

        expect(clickData).toBeDefined();
        // Should be near the right edge (800 - 10 - 80 + 5 = 715)
        expect(clickData.x).toBe(715);
        // Should be near the bottom (600 - 10 - 30 + 5 = 565)
        expect(clickData.y).toBe(565);
        // Relative coordinates should be precise
        expect(Math.abs(clickData.relativeX - 0.063)).toBeLessThan(0.01); // 5/80 ≈ 0.063
        expect(Math.abs(clickData.relativeY - 0.167)).toBeLessThan(0.01); // 5/30 ≈ 0.167

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Scrolled page coordinate calculation', () => {
    test('should maintain accurate coordinates when page is vertically scrolled', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create tall page content to enable scrolling
        await page.evaluate(() => {
          // Add tall content
          const content = document.createElement('div');
          content.style.height = '2000px';
          content.style.width = '100%';
          content.style.backgroundColor = 'lightgray';
          document.body.appendChild(content);

          // Add button that will be scrolled into view
          const button = document.createElement('button');
          button.id = 'scrolled-button';
          button.textContent = 'Scrolled Button';
          button.style.position = 'absolute';
          button.style.left = '100px';
          button.style.top = '1500px'; // Far down the page
          button.style.width = '150px';
          button.style.height = '50px';
          document.body.appendChild(button);
        });

        // Scroll to bring the button into view
        await page.evaluate(() => {
          window.scrollTo(0, 1400);
        });
        await TestUtils.waitForTimeout(page, 300);

        const clickData = await page.evaluate(async () => {
          let capturedCoordinates: any = null;
          const bridge = window.__traceLogTestBridge;
          const eventManager = bridge?.getEventManager();

          if (eventManager) {
            const originalTrack = eventManager.track;
            eventManager.track = function (eventData: any) {
              if (eventData.type === 'click') {
                capturedCoordinates = eventData.click_data;
              }
              return originalTrack.call(this, eventData);
            };

            const button = document.getElementById('scrolled-button');
            if (button) {
              const rect = button.getBoundingClientRect();
              // Click center of button as it appears in viewport
              const clickEvent = new MouseEvent('click', {
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2,
                bubbles: true,
              });
              button.dispatchEvent(clickEvent);
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
            eventManager.track = originalTrack;
          }

          return capturedCoordinates;
        });

        expect(clickData).toBeDefined();
        // Coordinates should be relative to viewport, not absolute page position
        expect(clickData.x).toBe(175); // 100 + 75 (center)
        expect(clickData.y).toBe(125); // 1500 - 1400 (scroll) + 25 (center)
        expect(clickData.relativeX).toBe(0.5);
        expect(clickData.relativeY).toBe(0.5);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should maintain accurate coordinates when page is horizontally scrolled', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create button at a moderate horizontal position that's easier to scroll to
        const { buttonPosition } = await page.evaluate(() => {
          // Ensure body can scroll horizontally
          document.body.style.overflowX = 'auto';
          document.body.style.minWidth = '100%';
          document.documentElement.style.overflowX = 'auto';

          // Add wide content that forces horizontal scroll
          const content = document.createElement('div');
          content.style.width = '2000px'; // Much wider to ensure scroll
          content.style.height = '400px';
          content.style.backgroundColor = 'lightblue';
          content.style.position = 'absolute';
          content.style.top = '0';
          content.style.left = '0';
          document.body.appendChild(content);

          // Add button at moderate position
          const button = document.createElement('button');
          button.id = 'h-scrolled-button';
          button.textContent = 'H-Scrolled';
          button.style.position = 'absolute';
          button.style.left = '1200px'; // Position it further right
          button.style.top = '150px';
          button.style.width = '120px';
          button.style.height = '40px';
          button.style.zIndex = '1000';
          document.body.appendChild(button);

          return {
            buttonPosition: { left: 1200, top: 150 },
          };
        });

        // Scroll to bring button into view
        const scrollResult = await page.evaluate(() => {
          // Calculate optimal scroll position to center the button
          const targetScrollX = Math.max(0, 1200 - window.innerWidth / 2); // Center button in viewport
          window.scrollTo(targetScrollX, 0);

          return {
            scrollX: window.scrollX,
            scrollY: window.scrollY,
            targetScrollX: targetScrollX,
            maxScrollX: document.documentElement.scrollWidth - window.innerWidth,
            maxScrollY: document.documentElement.scrollHeight - window.innerHeight,
            viewportWidth: window.innerWidth,
            documentWidth: document.documentElement.scrollWidth,
          };
        });
        await TestUtils.waitForTimeout(page, 500);

        // Verify scroll actually happened and get current scroll position
        const { clickData, scrollPosition } = await page.evaluate(async () => {
          let capturedCoordinates: any = null;
          const bridge = window.__traceLogTestBridge;
          const eventManager = bridge?.getEventManager();
          const currentScroll = { x: window.scrollX, y: window.scrollY };

          if (eventManager) {
            const originalTrack = eventManager.track;
            eventManager.track = function (eventData: any) {
              if (eventData.type === 'click') {
                capturedCoordinates = eventData.click_data;
              }
              return originalTrack.call(this, eventData);
            };

            const button = document.getElementById('h-scrolled-button');
            if (button) {
              const rect = button.getBoundingClientRect();
              // Only click if button is actually visible in viewport
              if (rect.width > 0 && rect.height > 0 && rect.left >= 0) {
                const clickEvent = new MouseEvent('click', {
                  clientX: rect.left + rect.width / 2,
                  clientY: rect.top + rect.height / 2,
                  bubbles: true,
                });
                button.dispatchEvent(clickEvent);
              }
            }

            await new Promise((resolve) => setTimeout(resolve, 150));
            eventManager.track = originalTrack;
          }

          return {
            scrollPosition: currentScroll,
            clickData: capturedCoordinates,
          };
        });

        // Verify scroll capabilities and actual scroll results
        expect(scrollResult).toBeDefined();
        expect(scrollResult.documentWidth).toBeGreaterThan(scrollResult.viewportWidth); // Document should be wider than viewport
        expect(scrollResult.maxScrollX).toBeGreaterThan(0); // Page should be scrollable horizontally

        // Verify scroll actually occurred (should be at least some scroll)
        expect(scrollResult.scrollX).toBeGreaterThanOrEqual(0);
        if (scrollResult.targetScrollX > 0) {
          expect(scrollResult.scrollX).toBeGreaterThan(0); // Should have scrolled if target was > 0
        }

        // Verify scroll information and handle cases where scroll might not work as expected
        expect(scrollPosition).toBeDefined();
        expect(typeof scrollPosition.x).toBe('number');
        expect(typeof scrollPosition.y).toBe('number');

        // Ensure scroll position is consistent between measurements
        expect(scrollPosition.x).toBe(scrollResult.scrollX);

        expect(clickData).toBeDefined();

        // Test absolute coordinates: should account for scroll offset
        // If scroll worked: Expected X = buttonPosition.left - scrollPosition.x + buttonWidth/2
        // If scroll didn't work: Expected X = buttonPosition.left + buttonWidth/2
        const buttonWidth = 120;
        const buttonHeight = 40;
        const expectedAbsoluteX = buttonPosition.left - scrollPosition.x + buttonWidth / 2;
        const expectedAbsoluteY = buttonPosition.top + buttonHeight / 2;

        expect(typeof clickData.x).toBe('number');
        expect(typeof clickData.y).toBe('number');
        expect(clickData.x).toBeCloseTo(expectedAbsoluteX, 5); // More tolerance for scroll variations
        expect(clickData.y).toBeCloseTo(expectedAbsoluteY, 5);

        // Test relative coordinates: should always be 0.5 for center click
        expect(clickData.relativeX).toBe(0.5);
        expect(clickData.relativeY).toBe(0.5);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle coordinates correctly with both horizontal and vertical scroll', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Create moderate-sized scrollable content
        await page.evaluate(() => {
          const content = document.createElement('div');
          content.style.width = '1500px';
          content.style.height = '1500px';
          content.style.backgroundColor = 'lightcyan';
          document.body.appendChild(content);

          const button = document.createElement('button');
          button.id = 'dual-scroll-button';
          button.textContent = 'Dual Scroll';
          button.style.position = 'absolute';
          button.style.left = '800px';
          button.style.top = '800px';
          button.style.width = '100px';
          button.style.height = '60px';
          document.body.appendChild(button);
        });

        // Scroll both directions with moderate amounts
        await page.evaluate(() => {
          window.scrollTo(600, 600);
        });
        await TestUtils.waitForTimeout(page, 500);

        const { clickData } = await page.evaluate(async () => {
          let capturedCoordinates: any = null;
          const bridge = window.__traceLogTestBridge;
          const eventManager = bridge?.getEventManager();
          const scrollInfo = { x: window.scrollX, y: window.scrollY };

          if (eventManager) {
            const originalTrack = eventManager.track;
            eventManager.track = function (eventData: any) {
              if (eventData.type === 'click') {
                capturedCoordinates = eventData.click_data;
              }
              return originalTrack.call(this, eventData);
            };

            const button = document.getElementById('dual-scroll-button');
            if (button) {
              const rect = button.getBoundingClientRect();
              // Ensure button is visible before clicking
              if (rect.width > 0 && rect.height > 0 && rect.left >= 0 && rect.top >= 0) {
                const clickEvent = new MouseEvent('click', {
                  clientX: rect.left + 25, // 25px from left edge
                  clientY: rect.top + 15, // 15px from top edge
                  bubbles: true,
                });
                button.dispatchEvent(clickEvent);
              }
            }

            await new Promise((resolve) => setTimeout(resolve, 150));
            eventManager.track = originalTrack;
          }

          return { scrollInfo, clickData: capturedCoordinates };
        });

        expect(clickData).toBeDefined();

        // Test coordinate calculation - the key validation is relative coordinates
        expect(typeof clickData.x).toBe('number');
        expect(typeof clickData.y).toBe('number');
        expect(clickData.x).toBeGreaterThan(0); // Should be a positive coordinate
        expect(clickData.y).toBeGreaterThan(0); // Should be a positive coordinate
        expect(clickData.relativeX).toBe(0.25); // 25/100 - this is the important test
        expect(clickData.relativeY).toBe(0.25); // 15/60 - this is the important test

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Transformed element coordinates', () => {
    test('should calculate coordinates correctly for CSS transformed elements', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'transformed-button';
          button.textContent = 'Transformed';
          button.style.position = 'absolute';
          button.style.left = '200px';
          button.style.top = '200px';
          button.style.width = '120px';
          button.style.height = '60px';
          button.style.transform = 'rotate(45deg)';
          button.style.transformOrigin = 'center center';
          document.body.appendChild(button);
        });

        const clickData = await page.evaluate(async () => {
          let capturedCoordinates: any = null;
          const bridge = window.__traceLogTestBridge;
          const eventManager = bridge?.getEventManager();

          if (eventManager) {
            const originalTrack = eventManager.track;
            eventManager.track = function (eventData: any) {
              if (eventData.type === 'click') {
                capturedCoordinates = eventData.click_data;
              }
              return originalTrack.call(this, eventData);
            };

            const button = document.getElementById('transformed-button');
            if (button) {
              // getBoundingClientRect should return the transformed coordinates
              const rect = button.getBoundingClientRect();
              const clickEvent = new MouseEvent('click', {
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2,
                bubbles: true,
              });
              button.dispatchEvent(clickEvent);
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
            eventManager.track = originalTrack;
          }

          return capturedCoordinates;
        });

        expect(clickData).toBeDefined();
        // getBoundingClientRect accounts for transforms, so coordinates should be accurate
        expect(typeof clickData.x).toBe('number');
        expect(typeof clickData.y).toBe('number');
        expect(clickData.relativeX).toBe(0.5); // Should still be center
        expect(clickData.relativeY).toBe(0.5); // Should still be center

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle scaled elements correctly', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'scaled-button';
          button.textContent = 'Scaled';
          button.style.position = 'absolute';
          button.style.left = '100px';
          button.style.top = '100px';
          button.style.width = '100px';
          button.style.height = '50px';
          button.style.transform = 'scale(2)';
          button.style.transformOrigin = 'top left';
          document.body.appendChild(button);
        });

        const clickData = await page.evaluate(async () => {
          let capturedCoordinates: any = null;
          const bridge = window.__traceLogTestBridge;
          const eventManager = bridge?.getEventManager();

          if (eventManager) {
            const originalTrack = eventManager.track;
            eventManager.track = function (eventData: any) {
              if (eventData.type === 'click') {
                capturedCoordinates = eventData.click_data;
              }
              return originalTrack.call(this, eventData);
            };

            const button = document.getElementById('scaled-button');
            if (button) {
              const rect = button.getBoundingClientRect();
              // Click at what should be 25% and 25% of the visual element
              const clickEvent = new MouseEvent('click', {
                clientX: rect.left + rect.width * 0.25,
                clientY: rect.top + rect.height * 0.25,
                bubbles: true,
              });
              button.dispatchEvent(clickEvent);
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
            eventManager.track = originalTrack;
          }

          return capturedCoordinates;
        });

        expect(clickData).toBeDefined();
        expect(clickData.relativeX).toBe(0.25);
        expect(clickData.relativeY).toBe(0.25);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle elements with multiple transforms', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'multi-transform-button';
          button.textContent = 'Multi Transform';
          button.style.position = 'absolute';
          button.style.left = '150px';
          button.style.top = '150px';
          button.style.width = '160px';
          button.style.height = '80px';
          button.style.transform = 'translate(50px, 30px) rotate(30deg) scale(1.2)';
          button.style.transformOrigin = 'center center';
          document.body.appendChild(button);
        });

        const clickData = await page.evaluate(async () => {
          let capturedCoordinates: any = null;
          const bridge = window.__traceLogTestBridge;
          const eventManager = bridge?.getEventManager();

          if (eventManager) {
            const originalTrack = eventManager.track;
            eventManager.track = function (eventData: any) {
              if (eventData.type === 'click') {
                capturedCoordinates = eventData.click_data;
              }
              return originalTrack.call(this, eventData);
            };

            const button = document.getElementById('multi-transform-button');
            if (button) {
              const rect = button.getBoundingClientRect();
              const clickEvent = new MouseEvent('click', {
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2,
                bubbles: true,
              });
              button.dispatchEvent(clickEvent);
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
            eventManager.track = originalTrack;
          }

          return capturedCoordinates;
        });

        expect(clickData).toBeDefined();
        // Center click should always be 0.5, 0.5 regardless of transforms
        // Allow for small browser differences in transform handling
        expect(Math.abs(clickData.relativeX - 0.5)).toBeLessThan(0.05);
        expect(Math.abs(clickData.relativeY - 0.5)).toBeLessThan(0.05);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle elements with different positioning methods', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        await page.evaluate(() => {
          // Fixed position element
          const fixedButton = document.createElement('button');
          fixedButton.id = 'fixed-button';
          fixedButton.textContent = 'Fixed';
          fixedButton.style.position = 'fixed';
          fixedButton.style.top = '20px';
          fixedButton.style.right = '20px';
          fixedButton.style.width = '80px';
          fixedButton.style.height = '40px';
          document.body.appendChild(fixedButton);

          // Relative position element
          const relativeButton = document.createElement('button');
          relativeButton.id = 'relative-button';
          relativeButton.textContent = 'Relative';
          relativeButton.style.position = 'relative';
          relativeButton.style.left = '50px';
          relativeButton.style.top = '100px';
          relativeButton.style.width = '90px';
          relativeButton.style.height = '45px';
          document.body.appendChild(relativeButton);

          // Static position element
          const staticButton = document.createElement('button');
          staticButton.id = 'static-button';
          staticButton.textContent = 'Static';
          staticButton.style.marginTop = '20px';
          staticButton.style.marginLeft = '30px';
          staticButton.style.width = '100px';
          staticButton.style.height = '50px';
          document.body.appendChild(staticButton);
        });

        // Test each positioning method with more flexible expectations
        const positionTests = [
          { id: 'fixed-button', name: 'fixed position' },
          { id: 'relative-button', name: 'relative position' },
          { id: 'static-button', name: 'static position' },
        ];

        for (const test of positionTests) {
          const clickData = await page.evaluate(async (buttonId) => {
            let capturedCoordinates: any = null;
            const bridge = window.__traceLogTestBridge;
            const eventManager = bridge?.getEventManager();

            if (eventManager) {
              const originalTrack = eventManager.track;
              eventManager.track = function (eventData: any) {
                if (eventData.type === 'click') {
                  capturedCoordinates = eventData.click_data;
                }
                return originalTrack.call(this, eventData);
              };

              const button = document.getElementById(buttonId);
              if (button) {
                const rect = button.getBoundingClientRect();
                // Ensure element is visible and clickable
                if (rect.width > 0 && rect.height > 0) {
                  const clickEvent = new MouseEvent('click', {
                    clientX: rect.left + rect.width / 2,
                    clientY: rect.top + rect.height / 2,
                    bubbles: true,
                  });
                  button.dispatchEvent(clickEvent);
                }
              }

              await new Promise((resolve) => setTimeout(resolve, 150));
              eventManager.track = originalTrack;
            }

            return capturedCoordinates;
          }, test.id);

          expect(clickData, `Failed for ${test.name}`).toBeDefined();
          // Allow for small browser differences in positioning
          expect(Math.abs(clickData.relativeX - 0.5), `RelativeX failed for ${test.name}`).toBeLessThan(0.05);
          expect(Math.abs(clickData.relativeY - 0.5), `RelativeY failed for ${test.name}`).toBeLessThan(0.05);
          expect(typeof clickData.x, `AbsoluteX type failed for ${test.name}`).toBe('number');
          expect(typeof clickData.y, `AbsoluteY type failed for ${test.name}`).toBe('number');
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Coordinate precision consistency', () => {
    test('should maintain consistent precision in relative coordinates', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'precision-test';
          button.textContent = 'Precision Test';
          button.style.position = 'absolute';
          button.style.left = '100px';
          button.style.top = '100px';
          button.style.width = '333px'; // Width that would create repeating decimals
          button.style.height = '111px';
          document.body.appendChild(button);
        });

        // Test multiple clicks to ensure consistency
        const clicks = [
          { x: 0.333, y: 0.5 },
          { x: 0.667, y: 0.25 },
          { x: 0.1, y: 0.9 },
          { x: 0.999, y: 0.001 },
        ];

        for (let i = 0; i < clicks.length; i++) {
          const targetClick = clicks[i];
          const clickData = await page.evaluate(
            async ({ targetX, targetY }) => {
              let capturedCoordinates: any = null;
              const bridge = window.__traceLogTestBridge;
              const eventManager = bridge?.getEventManager();

              if (eventManager) {
                const originalTrack = eventManager.track;
                eventManager.track = function (eventData: any) {
                  if (eventData.type === 'click') {
                    capturedCoordinates = eventData.click_data;
                  }
                  return originalTrack.call(this, eventData);
                };

                const button = document.getElementById('precision-test');
                if (button) {
                  const rect = button.getBoundingClientRect();
                  const clickEvent = new MouseEvent('click', {
                    clientX: rect.left + rect.width * targetX,
                    clientY: rect.top + rect.height * targetY,
                    bubbles: true,
                  });
                  button.dispatchEvent(clickEvent);
                }

                await new Promise((resolve) => setTimeout(resolve, 100));
                eventManager.track = originalTrack;
              }

              return capturedCoordinates;
            },
            { targetX: targetClick.x, targetY: targetClick.y },
          );

          expect(clickData, `Click ${i} failed`).toBeDefined();

          // Verify precision is limited to 3 decimal places (as per implementation)
          const relXStr = clickData.relativeX.toString();
          const relYStr = clickData.relativeY.toString();

          const xDecimalPlaces = relXStr.includes('.') ? relXStr.split('.')[1].length : 0;
          const yDecimalPlaces = relYStr.includes('.') ? relYStr.split('.')[1].length : 0;

          expect(xDecimalPlaces, `X precision exceeded for click ${i}`).toBeLessThanOrEqual(3);
          expect(yDecimalPlaces, `Y precision exceeded for click ${i}`).toBeLessThanOrEqual(3);

          // Verify values are within expected ranges and reasonably close to targets
          expect(Math.abs(clickData.relativeX - targetClick.x), `X accuracy failed for click ${i}`).toBeLessThan(0.01);
          expect(Math.abs(clickData.relativeY - targetClick.y), `Y accuracy failed for click ${i}`).toBeLessThan(0.01);
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle boundary conditions correctly', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'boundary-precision-test';
          button.textContent = 'Boundary';
          button.style.position = 'absolute';
          button.style.left = '100px';
          button.style.top = '100px';
          button.style.width = '200px';
          button.style.height = '100px';
          document.body.appendChild(button);
        });

        // Test boundary conditions - clicks outside element boundaries should be clamped
        const boundaryTests = [
          { name: 'beyond-left', clientX: 95, expectedRelX: 0, clientY: 150 },
          { name: 'beyond-right', clientX: 305, expectedRelX: 1, clientY: 150 },
          { name: 'beyond-top', clientX: 200, clientY: 95, expectedRelY: 0 },
          { name: 'beyond-bottom', clientX: 200, clientY: 205, expectedRelY: 1 },
        ];

        for (const test of boundaryTests) {
          const clickData = await page.evaluate(
            async ({ clientX, clientY }) => {
              let capturedCoordinates: any = null;
              const bridge = window.__traceLogTestBridge;
              const eventManager = bridge?.getEventManager();

              if (eventManager) {
                const originalTrack = eventManager.track;
                eventManager.track = function (eventData: any) {
                  if (eventData.type === 'click') {
                    capturedCoordinates = eventData.click_data;
                  }
                  return originalTrack.call(this, eventData);
                };

                const button = document.getElementById('boundary-precision-test');
                if (button) {
                  const clickEvent = new MouseEvent('click', {
                    clientX: clientX || 150,
                    clientY: clientY || 150,
                    bubbles: true,
                  });
                  button.dispatchEvent(clickEvent);
                }

                await new Promise((resolve) => setTimeout(resolve, 100));
                eventManager.track = originalTrack;
              }

              return capturedCoordinates;
            },
            { testName: test.name, clientX: test.clientX, clientY: test.clientY },
          );

          expect(clickData, `Failed for ${test.name}`).toBeDefined();

          // Check boundary clamping with tolerance for browser differences
          if ('expectedRelX' in test) {
            expect(
              Math.abs(clickData.relativeX - (test.expectedRelX as number)),
              `RelativeX boundary failed for ${test.name}`,
            ).toBeLessThan(0.05);
          }
          if ('expectedRelY' in test) {
            expect(
              Math.abs(clickData.relativeY - (test.expectedRelY as number)),
              `RelativeY boundary failed for ${test.name}`,
            ).toBeLessThan(0.05);
          }
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should provide consistent coordinate values across multiple clicks', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'consistency-test';
          button.textContent = 'Consistency';
          button.style.position = 'absolute';
          button.style.left = '150px';
          button.style.top = '150px';
          button.style.width = '100px';
          button.style.height = '60px';
          document.body.appendChild(button);
        });

        // Click the same position multiple times
        const repeatClicks = 5;
        const allClickData = [];

        for (let i = 0; i < repeatClicks; i++) {
          const clickData = await page.evaluate(async () => {
            let capturedCoordinates: any = null;
            const bridge = window.__traceLogTestBridge;
            const eventManager = bridge?.getEventManager();

            if (eventManager) {
              const originalTrack = eventManager.track;
              eventManager.track = function (eventData: any) {
                if (eventData.type === 'click') {
                  capturedCoordinates = eventData.click_data;
                }
                return originalTrack.call(this, eventData);
              };

              const button = document.getElementById('consistency-test');
              if (button) {
                // Always click at the same position: center
                const rect = button.getBoundingClientRect();
                const clickEvent = new MouseEvent('click', {
                  clientX: rect.left + rect.width / 2,
                  clientY: rect.top + rect.height / 2,
                  bubbles: true,
                });
                button.dispatchEvent(clickEvent);
              }

              await new Promise((resolve) => setTimeout(resolve, 100));
              eventManager.track = originalTrack;
            }

            return capturedCoordinates;
          });

          expect(clickData, `Click ${i + 1} failed`).toBeDefined();
          allClickData.push(clickData);
        }

        // Verify all clicks produced identical coordinates
        const firstClick = allClickData[0];
        for (let i = 1; i < allClickData.length; i++) {
          const currentClick = allClickData[i];
          expect(currentClick.x, `Absolute X inconsistent at click ${i + 1}`).toBe(firstClick.x);
          expect(currentClick.y, `Absolute Y inconsistent at click ${i + 1}`).toBe(firstClick.y);
          expect(currentClick.relativeX, `Relative X inconsistent at click ${i + 1}`).toBe(firstClick.relativeX);
          expect(currentClick.relativeY, `Relative Y inconsistent at click ${i + 1}`).toBe(firstClick.relativeY);
        }

        // Verify values are as expected (center should be 0.5, 0.5)
        expect(firstClick.relativeX).toBe(0.5);
        expect(firstClick.relativeY).toBe(0.5);
        expect(firstClick.x).toBe(200); // 150 + 50
        expect(firstClick.y).toBe(180); // 150 + 30

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle floating point edge cases without precision loss', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        await page.evaluate(() => {
          const button = document.createElement('button');
          button.id = 'float-precision-test';
          button.textContent = 'Float Precision';
          button.style.position = 'absolute';
          button.style.left = '100px';
          button.style.top = '100px';
          button.style.width = '300px';
          button.style.height = '200px';
          document.body.appendChild(button);
        });

        // Test floating point precision edge cases
        const precisionTests = [
          { x: 1 / 3, y: 1 / 3, name: '1/3 fractions' }, // Should be 0.333, 0.333
          { x: 2 / 3, y: 2 / 3, name: '2/3 fractions' }, // Should be 0.667, 0.667
          { x: 1 / 6, y: 5 / 6, name: '1/6 and 5/6' }, // Should be 0.167, 0.833
          { x: 7 / 9, y: 1 / 7, name: '7/9 and 1/7' }, // Should be 0.778, 0.143
        ];

        for (const test of precisionTests) {
          const clickData = await page.evaluate(
            async ({ relX, relY }) => {
              let capturedCoordinates: any = null;
              const bridge = window.__traceLogTestBridge;
              const eventManager = bridge?.getEventManager();

              if (eventManager) {
                const originalTrack = eventManager.track;
                eventManager.track = function (eventData: any) {
                  if (eventData.type === 'click') {
                    capturedCoordinates = eventData.click_data;
                  }
                  return originalTrack.call(this, eventData);
                };

                const button = document.getElementById('float-precision-test');
                if (button) {
                  const rect = button.getBoundingClientRect();
                  const clickEvent = new MouseEvent('click', {
                    clientX: rect.left + rect.width * relX,
                    clientY: rect.top + rect.height * relY,
                    bubbles: true,
                  });
                  button.dispatchEvent(clickEvent);
                }

                await new Promise((resolve) => setTimeout(resolve, 100));
                eventManager.track = originalTrack;
              }

              return capturedCoordinates;
            },
            { relX: test.x, relY: test.y },
          );

          expect(clickData, `Failed for ${test.name}`).toBeDefined();

          // Verify values are bounded correctly (0 <= value <= 1)
          expect(clickData.relativeX, `RelativeX out of bounds for ${test.name}`).toBeGreaterThanOrEqual(0);
          expect(clickData.relativeX, `RelativeX out of bounds for ${test.name}`).toBeLessThanOrEqual(1);
          expect(clickData.relativeY, `RelativeY out of bounds for ${test.name}`).toBeGreaterThanOrEqual(0);
          expect(clickData.relativeY, `RelativeY out of bounds for ${test.name}`).toBeLessThanOrEqual(1);

          // Verify precision is maintained (close to target values)
          expect(Math.abs(clickData.relativeX - test.x), `RelativeX precision lost for ${test.name}`).toBeLessThan(
            0.005,
          );
          expect(Math.abs(clickData.relativeY - test.y), `RelativeY precision lost for ${test.name}`).toBeLessThan(
            0.005,
          );

          // Verify decimal precision constraint (max 3 decimal places)
          const relXStr = clickData.relativeX.toString();
          const relYStr = clickData.relativeY.toString();
          const xDecimals = relXStr.includes('.') ? relXStr.split('.')[1].length : 0;
          const yDecimals = relYStr.includes('.') ? relYStr.split('.')[1].length : 0;

          expect(xDecimals, `X decimal precision exceeded for ${test.name}`).toBeLessThanOrEqual(3);
          expect(yDecimals, `Y decimal precision exceeded for ${test.name}`).toBeLessThanOrEqual(3);
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });
});
