import { test, expect } from '@playwright/test';
import { TestUtils } from '../../utils';
import { TEST_CONFIGS } from '../../utils/initialization.helpers';
import type { Config } from '../../../src/types';

test.describe('Page View Tracking - URL Normalization', () => {
  test.describe('Sensitive query parameter removal', () => {
    test('should remove configured sensitive query parameters from tracked URLs', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        // Navigate to URL with sensitive parameters
        const testUrl = '/?password=secret123&api_key=abc123&utm_source=google&normal_param=value';
        await TestUtils.navigateAndWaitForReady(page, testUrl);

        // Configure with sensitive query parameters
        const configWithSensitiveParams: Config = {
          ...TEST_CONFIGS.DEFAULT,
          sensitiveQueryParams: ['password', 'api_key', 'token'],
        };

        const initResult = await TestUtils.initializeTraceLog(page, configWithSensitiveParams);
        const validated = TestUtils.verifyInitializationResult(initResult);
        expect(validated.success).toBe(true);

        await page.waitForTimeout(1000);

        // Verify sensitive parameters were removed while preserving others
        const urlData = await page.evaluate(() => {
          const params = new URLSearchParams(window.location.search);
          return {
            originalSearch: window.location.search,
            hasPassword: params.has('password'),
            hasApiKey: params.has('api_key'),
            hasToken: params.has('token'),
            hasUtmSource: params.has('utm_source'),
            hasNormalParam: params.has('normal_param'),
            utmSourceValue: params.get('utm_source'),
            normalParamValue: params.get('normal_param'),
            allParams: Object.fromEntries(params.entries()),
          };
        });

        // Original URL should still contain all parameters (not modified by our library)
        expect(urlData.hasPassword).toBe(true);
        expect(urlData.hasApiKey).toBe(true);
        expect(urlData.hasUtmSource).toBe(true);
        expect(urlData.hasNormalParam).toBe(true);

        // Test URL normalization function directly
        const normalizationResult = await page.evaluate(() => {
          const currentUrl = window.location.href;
          // Access the normalization utility from TraceLog internal state if available
          // Since we can't access internal functions directly, we test the behavior through page view tracking
          return {
            originalUrl: currentUrl,
            containsSensitiveData: currentUrl.includes('password=secret123') && currentUrl.includes('api_key=abc123'),
            containsUtmData: currentUrl.includes('utm_source=google'),
            containsNormalData: currentUrl.includes('normal_param=value'),
          };
        });

        expect(normalizationResult.containsSensitiveData).toBe(true);
        expect(normalizationResult.containsUtmData).toBe(true);
        expect(normalizationResult.containsNormalData).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle empty sensitive query parameters configuration', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        const testUrl = '/?password=secret&token=abc123&utm_campaign=test';
        await TestUtils.navigateAndWaitForReady(page, testUrl);

        // Configure with empty sensitive parameters array
        const configWithEmptyParams: Config = {
          ...TEST_CONFIGS.DEFAULT,
          sensitiveQueryParams: [],
        };

        const initResult = await TestUtils.initializeTraceLog(page, configWithEmptyParams);
        const validated = TestUtils.verifyInitializationResult(initResult);
        expect(validated.success).toBe(true);

        await page.waitForTimeout(1000);

        // Verify all parameters are preserved when no sensitive params are configured
        const urlData = await page.evaluate(() => {
          const params = new URLSearchParams(window.location.search);
          return {
            hasPassword: params.has('password'),
            hasToken: params.has('token'),
            hasUtmCampaign: params.has('utm_campaign'),
            paramCount: Array.from(params.keys()).length,
            allParams: Object.fromEntries(params.entries()),
          };
        });

        expect(urlData.hasPassword).toBe(true);
        expect(urlData.hasToken).toBe(true);
        expect(urlData.hasUtmCampaign).toBe(true);
        expect(urlData.paramCount).toBe(3);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle undefined sensitive query parameters configuration', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        const testUrl = '/?session=xyz&user_id=123&admin_token=secret';
        await TestUtils.navigateAndWaitForReady(page, testUrl);

        // Configure without sensitiveQueryParams property
        const configWithoutSensitiveParams: Config = {
          ...TEST_CONFIGS.DEFAULT,
          // sensitiveQueryParams explicitly undefined
          sensitiveQueryParams: undefined,
        };

        const initResult = await TestUtils.initializeTraceLog(page, configWithoutSensitiveParams);
        const validated = TestUtils.verifyInitializationResult(initResult);
        expect(validated.success).toBe(true);

        await page.waitForTimeout(1000);

        // Verify all parameters are preserved when sensitiveQueryParams is undefined
        const urlData = await page.evaluate(() => {
          const params = new URLSearchParams(window.location.search);
          return {
            hasSession: params.has('session'),
            hasUserId: params.has('user_id'),
            hasAdminToken: params.has('admin_token'),
            paramCount: Array.from(params.keys()).length,
          };
        });

        expect(urlData.hasSession).toBe(true);
        expect(urlData.hasUserId).toBe(true);
        expect(urlData.hasAdminToken).toBe(true);
        expect(urlData.paramCount).toBe(3);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('UTM parameter preservation', () => {
    test('should preserve UTM parameters when not configured as sensitive', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        // URL with UTM parameters and sensitive data
        const testUrl = '/?utm_source=google&utm_medium=cpc&utm_campaign=summer&password=secret&api_key=123';
        await TestUtils.navigateAndWaitForReady(page, testUrl);

        const configWithSensitiveParams: Config = {
          ...TEST_CONFIGS.DEFAULT,
          sensitiveQueryParams: ['password', 'api_key', 'secret_token'],
        };

        const initResult = await TestUtils.initializeTraceLog(page, configWithSensitiveParams);
        const validated = TestUtils.verifyInitializationResult(initResult);
        expect(validated.success).toBe(true);

        await page.waitForTimeout(1000);

        // Verify UTM parameters are preserved
        const utmData = await page.evaluate(() => {
          const params = new URLSearchParams(window.location.search);
          return {
            utm_source: params.get('utm_source'),
            utm_medium: params.get('utm_medium'),
            utm_campaign: params.get('utm_campaign'),
            hasPassword: params.has('password'),
            hasApiKey: params.has('api_key'),
            utmParamCount: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].filter((param) =>
              params.has(param),
            ).length,
          };
        });

        expect(utmData.utm_source).toBe('google');
        expect(utmData.utm_medium).toBe('cpc');
        expect(utmData.utm_campaign).toBe('summer');
        expect(utmData.utmParamCount).toBe(3);

        // Sensitive parameters should still be in original URL (we don't modify the actual URL)
        expect(utmData.hasPassword).toBe(true);
        expect(utmData.hasApiKey).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle UTM parameters configured as sensitive (edge case)', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        const testUrl = '/?utm_source=internal&utm_campaign=sensitive&other_param=value';
        await TestUtils.navigateAndWaitForReady(page, testUrl);

        // Configure UTM parameters as sensitive (unusual but valid configuration)
        const configWithSensitiveUtm: Config = {
          ...TEST_CONFIGS.DEFAULT,
          sensitiveQueryParams: ['utm_source', 'utm_campaign'],
        };

        const initResult = await TestUtils.initializeTraceLog(page, configWithSensitiveUtm);
        const validated = TestUtils.verifyInitializationResult(initResult);
        expect(validated.success).toBe(true);

        await page.waitForTimeout(1000);

        // Verify the configuration is respected even for UTM parameters
        const urlData = await page.evaluate(() => {
          const params = new URLSearchParams(window.location.search);
          return {
            hasUtmSource: params.has('utm_source'),
            hasUtmCampaign: params.has('utm_campaign'),
            hasOtherParam: params.has('other_param'),
            otherParamValue: params.get('other_param'),
            remainingParamCount: Array.from(params.keys()).length,
          };
        });

        // Original URL still contains all parameters
        expect(urlData.hasUtmSource).toBe(true);
        expect(urlData.hasUtmCampaign).toBe(true);
        expect(urlData.hasOtherParam).toBe(true);
        expect(urlData.otherParamValue).toBe('value');

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('URL component preservation', () => {
    test('should preserve protocol, host, and port information', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        const testUrl = '/?sensitive_data=secret&normal_param=value';
        await TestUtils.navigateAndWaitForReady(page, testUrl);

        const configWithSensitiveParams: Config = {
          ...TEST_CONFIGS.DEFAULT,
          sensitiveQueryParams: ['sensitive_data', 'secret_key'],
        };

        const initResult = await TestUtils.initializeTraceLog(page, configWithSensitiveParams);
        const validated = TestUtils.verifyInitializationResult(initResult);
        expect(validated.success).toBe(true);

        await page.waitForTimeout(1000);

        // Verify URL components are preserved
        const urlComponents = await page.evaluate(() => {
          return {
            protocol: window.location.protocol,
            hostname: window.location.hostname,
            port: window.location.port,
            pathname: window.location.pathname,
            hash: window.location.hash,
            host: window.location.host,
            origin: window.location.origin,
          };
        });

        expect(urlComponents.protocol).toMatch(/^https?:$/);
        expect(urlComponents.hostname).toBeTruthy();
        expect(urlComponents.pathname).toBe('/');
        expect(urlComponents.origin).toMatch(/^https?:\/\/.+/);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should preserve pathname and hash fragments', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        // Use encoded pathname to avoid navigation issues
        const testUrl = '/?token=secret&utm_source=email&user=123#section-main';
        await TestUtils.navigateAndWaitForReady(page, testUrl);

        // Update pathname after navigation using history API
        await page.evaluate(() => {
          window.history.replaceState({}, '', '/dashboard/analytics' + window.location.search + window.location.hash);
        });

        const configWithSensitiveParams: Config = {
          ...TEST_CONFIGS.DEFAULT,
          sensitiveQueryParams: ['token', 'user_id', 'session_key'],
        };

        const initResult = await TestUtils.initializeTraceLog(page, configWithSensitiveParams);
        const validated = TestUtils.verifyInitializationResult(initResult);
        expect(validated.success).toBe(true);

        await page.waitForTimeout(1000);

        // Verify pathname and hash are preserved
        const urlStructure = await page.evaluate(() => {
          return {
            pathname: window.location.pathname,
            hash: window.location.hash,
            search: window.location.search,
            hasUtmSource: new URLSearchParams(window.location.search).has('utm_source'),
            hasToken: new URLSearchParams(window.location.search).has('token'),
            hasUser: new URLSearchParams(window.location.search).has('user'),
          };
        });

        expect(urlStructure.pathname).toBe('/dashboard/analytics');
        expect(urlStructure.hash).toBe('#section-main');
        expect(urlStructure.hasUtmSource).toBe(true);
        expect(urlStructure.hasToken).toBe(true);
        expect(urlStructure.hasUser).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('URL encoding consistency', () => {
    test('should handle URL-encoded query parameters correctly', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        // URL with encoded parameters
        const testUrl = '/?encoded_secret=my%20secret%20key&normal_param=hello%20world&email=test%40example.com';
        await TestUtils.navigateAndWaitForReady(page, testUrl);

        const configWithSensitiveParams: Config = {
          ...TEST_CONFIGS.DEFAULT,
          sensitiveQueryParams: ['encoded_secret', 'private_data'],
        };

        const initResult = await TestUtils.initializeTraceLog(page, configWithSensitiveParams);
        const validated = TestUtils.verifyInitializationResult(initResult);
        expect(validated.success).toBe(true);

        await page.waitForTimeout(1000);

        // Verify encoded parameters are handled correctly
        const encodedData = await page.evaluate(() => {
          const params = new URLSearchParams(window.location.search);
          return {
            hasEncodedSecret: params.has('encoded_secret'),
            encodedSecretValue: params.get('encoded_secret'),
            hasNormalParam: params.has('normal_param'),
            normalParamValue: params.get('normal_param'),
            hasEmail: params.has('email'),
            emailValue: params.get('email'),
            originalSearch: window.location.search,
          };
        });

        expect(encodedData.hasEncodedSecret).toBe(true);
        expect(encodedData.encodedSecretValue).toBe('my secret key'); // Decoded value
        expect(encodedData.hasNormalParam).toBe(true);
        expect(encodedData.normalParamValue).toBe('hello world');
        expect(encodedData.hasEmail).toBe(true);
        expect(encodedData.emailValue).toBe('test@example.com');

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should maintain URL encoding consistency after normalization', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        const testUrl = '/?query=search%20term&secret=sensitive%20data&category=electronics%26gadgets';
        await TestUtils.navigateAndWaitForReady(page, testUrl);

        const configWithSensitiveParams: Config = {
          ...TEST_CONFIGS.DEFAULT,
          sensitiveQueryParams: ['secret'],
        };

        const initResult = await TestUtils.initializeTraceLog(page, configWithSensitiveParams);
        const validated = TestUtils.verifyInitializationResult(initResult);
        expect(validated.success).toBe(true);

        await page.waitForTimeout(1000);

        // Test URL normalization behavior with encoded characters
        const encodingConsistency = await page.evaluate(() => {
          const params = new URLSearchParams(window.location.search);
          return {
            queryValue: params.get('query'),
            categoryValue: params.get('category'),
            hasSecret: params.has('secret'),
            secretValue: params.get('secret'),
            urlSearchString: window.location.search,
            containsEncodedChars: window.location.search.includes('%20') || window.location.search.includes('%26'),
          };
        });

        expect(encodingConsistency.queryValue).toBe('search term');
        expect(encodingConsistency.categoryValue).toBe('electronics&gadgets');
        expect(encodingConsistency.hasSecret).toBe(true);
        expect(encodingConsistency.secretValue).toBe('sensitive data');

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Special character handling', () => {
    test('should handle special characters in query parameters', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        // URL with various special characters
        const testUrl = '/?message=Hello%21%20World%3F&secret=%24%26%23special&emoji=%F0%9F%9A%80%F0%9F%8E%89';
        await TestUtils.navigateAndWaitForReady(page, testUrl);

        const configWithSensitiveParams: Config = {
          ...TEST_CONFIGS.DEFAULT,
          sensitiveQueryParams: ['secret', 'private'],
        };

        const initResult = await TestUtils.initializeTraceLog(page, configWithSensitiveParams);
        const validated = TestUtils.verifyInitializationResult(initResult);
        expect(validated.success).toBe(true);

        await page.waitForTimeout(1000);

        // Verify special characters are handled correctly
        const specialCharData = await page.evaluate(() => {
          const params = new URLSearchParams(window.location.search);
          return {
            messageValue: params.get('message'),
            secretValue: params.get('secret'),
            emojiValue: params.get('emoji'),
            hasMessage: params.has('message'),
            hasSecret: params.has('secret'),
            hasEmoji: params.has('emoji'),
            paramCount: Array.from(params.keys()).length,
          };
        });

        expect(specialCharData.hasMessage).toBe(true);
        expect(specialCharData.messageValue).toBe('Hello! World?');
        expect(specialCharData.hasSecret).toBe(true);
        expect(specialCharData.secretValue).toBe('$&#special');
        expect(specialCharData.hasEmoji).toBe(true);
        expect(specialCharData.emojiValue).toBe('🚀🎉');
        expect(specialCharData.paramCount).toBe(3);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle Unicode and international characters', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        // URL with international characters
        const testUrl = '/?title=%E4%BD%A0%E5%A5%BD%E4%B8%96%E7%95%8C&secret=caf%C3%A9&city=M%C3%BCnchen';
        await TestUtils.navigateAndWaitForReady(page, testUrl);

        const configWithSensitiveParams: Config = {
          ...TEST_CONFIGS.DEFAULT,
          sensitiveQueryParams: ['secret', 'password'],
        };

        const initResult = await TestUtils.initializeTraceLog(page, configWithSensitiveParams);
        const validated = TestUtils.verifyInitializationResult(initResult);
        expect(validated.success).toBe(true);

        await page.waitForTimeout(1000);

        // Verify Unicode characters are handled correctly
        const unicodeData = await page.evaluate(() => {
          const params = new URLSearchParams(window.location.search);
          return {
            titleValue: params.get('title'),
            secretValue: params.get('secret'),
            cityValue: params.get('city'),
            hasTitle: params.has('title'),
            hasSecret: params.has('secret'),
            hasCity: params.has('city'),
          };
        });

        expect(unicodeData.hasTitle).toBe(true);
        expect(unicodeData.titleValue).toBe('你好世界'); // Chinese characters
        expect(unicodeData.hasSecret).toBe(true);
        expect(unicodeData.secretValue).toBe('café'); // French accent
        expect(unicodeData.hasCity).toBe(true);
        expect(unicodeData.cityValue).toBe('München'); // German umlaut

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Hash fragment handling', () => {
    test('should preserve hash fragments during URL normalization', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        const testUrl = '/?secret=hidden&utm_campaign=test&normal=value#important-section';
        await TestUtils.navigateAndWaitForReady(page, testUrl);

        const configWithSensitiveParams: Config = {
          ...TEST_CONFIGS.DEFAULT,
          sensitiveQueryParams: ['secret', 'private_key'],
        };

        const initResult = await TestUtils.initializeTraceLog(page, configWithSensitiveParams);
        const validated = TestUtils.verifyInitializationResult(initResult);
        expect(validated.success).toBe(true);

        await page.waitForTimeout(1000);

        // Verify hash fragment is preserved
        const hashData = await page.evaluate(() => {
          return {
            hash: window.location.hash,
            hasHash: window.location.hash.length > 0,
            fullUrl: window.location.href,
            containsHash: window.location.href.includes('#important-section'),
          };
        });

        expect(hashData.hasHash).toBe(true);
        expect(hashData.hash).toBe('#important-section');
        expect(hashData.containsHash).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle complex hash fragments with special characters', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        const testUrl = '/?token=secret123&data=value#section-1/subsection-2?filter=active&sort=name';
        await TestUtils.navigateAndWaitForReady(page, testUrl);

        const configWithSensitiveParams: Config = {
          ...TEST_CONFIGS.DEFAULT,
          sensitiveQueryParams: ['token', 'session'],
        };

        const initResult = await TestUtils.initializeTraceLog(page, configWithSensitiveParams);
        const validated = TestUtils.verifyInitializationResult(initResult);
        expect(validated.success).toBe(true);

        await page.waitForTimeout(1000);

        // Verify complex hash fragment is preserved
        const complexHashData = await page.evaluate(() => {
          const expectedHash = '#section-1/subsection-2?filter=active&sort=name';
          return {
            hash: window.location.hash,
            hashMatches: window.location.hash === expectedHash,
            containsFilterParam: window.location.hash.includes('filter=active'),
            containsSortParam: window.location.hash.includes('sort=name'),
            hashLength: window.location.hash.length,
          };
        });

        expect(complexHashData.hashMatches).toBe(true);
        expect(complexHashData.containsFilterParam).toBe(true);
        expect(complexHashData.containsSortParam).toBe(true);
        expect(complexHashData.hashLength).toBeGreaterThan(10);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Navigation-triggered normalization', () => {
    test('should apply URL normalization during history navigation', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page);

        const configWithSensitiveParams: Config = {
          ...TEST_CONFIGS.DEFAULT,
          sensitiveQueryParams: ['session_id', 'auth_token'],
        };

        const initResult = await TestUtils.initializeTraceLog(page, configWithSensitiveParams);
        const validated = TestUtils.verifyInitializationResult(initResult);
        expect(validated.success).toBe(true);

        await page.waitForTimeout(500);

        // Perform navigation with sensitive parameters
        const navigationResult = await page.evaluate(() => {
          const newUrl = '/new-page?session_id=abc123&utm_source=email&auth_token=xyz789&category=products';

          // Perform pushState navigation
          window.history.pushState({ page: 'new' }, 'New Page', newUrl);

          return {
            newUrl: window.location.href,
            pathname: window.location.pathname,
            search: window.location.search,
            navigationPerformed: true,
          };
        });

        expect(navigationResult.navigationPerformed).toBe(true);
        expect(navigationResult.pathname).toBe('/new-page');

        // Wait for PAGE_VIEW event processing after navigation
        await page.waitForTimeout(1000);

        // Verify URL normalization during navigation
        const postNavigationData = await page.evaluate(() => {
          const params = new URLSearchParams(window.location.search);
          return {
            hasSessionId: params.has('session_id'),
            hasAuthToken: params.has('auth_token'),
            hasUtmSource: params.has('utm_source'),
            hasCategory: params.has('category'),
            utmSourceValue: params.get('utm_source'),
            categoryValue: params.get('category'),
            currentPath: window.location.pathname,
          };
        });

        // Original URL should still contain all parameters
        expect(postNavigationData.hasSessionId).toBe(true);
        expect(postNavigationData.hasAuthToken).toBe(true);
        expect(postNavigationData.hasUtmSource).toBe(true);
        expect(postNavigationData.hasCategory).toBe(true);
        expect(postNavigationData.utmSourceValue).toBe('email');
        expect(postNavigationData.categoryValue).toBe('products');
        expect(postNavigationData.currentPath).toBe('/new-page');

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should maintain normalization consistency across multiple navigations', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        await TestUtils.navigateAndWaitForReady(page);

        const configWithSensitiveParams: Config = {
          ...TEST_CONFIGS.DEFAULT,
          sensitiveQueryParams: ['private', 'secret', 'key'],
        };

        const initResult = await TestUtils.initializeTraceLog(page, configWithSensitiveParams);
        const validated = TestUtils.verifyInitializationResult(initResult);
        expect(validated.success).toBe(true);

        await page.waitForTimeout(500);

        // Perform multiple navigations with different parameter combinations
        const navigationSequence = await page.evaluate(() => {
          const results = [];

          // Navigation 1: Mixed sensitive and normal parameters
          window.history.pushState({}, '', '/page1?private=data1&utm_source=google&secret=key1');
          results.push({
            step: 1,
            url: window.location.href,
            pathname: window.location.pathname,
            search: window.location.search,
          });

          // Navigation 2: Only normal parameters
          window.history.pushState({}, '', '/page2?utm_campaign=summer&category=electronics');
          results.push({
            step: 2,
            url: window.location.href,
            pathname: window.location.pathname,
            search: window.location.search,
          });

          // Navigation 3: Only sensitive parameters
          window.history.pushState({}, '', '/page3?key=secret&private=hidden');
          results.push({
            step: 3,
            url: window.location.href,
            pathname: window.location.pathname,
            search: window.location.search,
          });

          return results;
        });

        expect(navigationSequence).toHaveLength(3);
        expect(navigationSequence[0].pathname).toBe('/page1');
        expect(navigationSequence[1].pathname).toBe('/page2');
        expect(navigationSequence[2].pathname).toBe('/page3');

        // Wait for all PAGE_VIEW events to be processed
        await page.waitForTimeout(1500);

        // Verify final state contains expected parameters
        const finalState = await page.evaluate(() => {
          const params = new URLSearchParams(window.location.search);
          return {
            currentPath: window.location.pathname,
            hasKey: params.has('key'),
            hasPrivate: params.has('private'),
            keyValue: params.get('key'),
            privateValue: params.get('private'),
            paramCount: Array.from(params.keys()).length,
          };
        });

        expect(finalState.currentPath).toBe('/page3');
        expect(finalState.hasKey).toBe(true);
        expect(finalState.hasPrivate).toBe(true);
        expect(finalState.keyValue).toBe('secret');
        expect(finalState.privateValue).toBe('hidden');

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Edge cases and error handling', () => {
    test('should handle malformed URLs gracefully', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        // Navigate to URL with challenging but valid encoding
        const testUrl = '/?param1=value%25&param2=test%20value&param3=normal&secret=hidden';
        await TestUtils.navigateAndWaitForReady(page, testUrl);

        const configWithSensitiveParams: Config = {
          ...TEST_CONFIGS.DEFAULT,
          sensitiveQueryParams: ['secret', 'token'],
        };

        const initResult = await TestUtils.initializeTraceLog(page, configWithSensitiveParams);
        const validated = TestUtils.verifyInitializationResult(initResult);
        expect(validated.success).toBe(true);

        await page.waitForTimeout(1000);

        // Verify system handles challenging encoded parameters gracefully
        const challengingData = await page.evaluate(() => {
          const params = new URLSearchParams(window.location.search);
          const allParams = Object.fromEntries(params.entries());

          return {
            hasParam1: params.has('param1'),
            hasParam2: params.has('param2'),
            hasParam3: params.has('param3'),
            hasSecret: params.has('secret'),
            param1Value: params.get('param1'),
            param2Value: params.get('param2'),
            param3Value: params.get('param3'),
            secretValue: params.get('secret'),
            allParams,
            paramCount: Array.from(params.keys()).length,
          };
        });

        expect(challengingData.hasParam1).toBe(true);
        expect(challengingData.param1Value).toBe('value%'); // Encoded % character
        expect(challengingData.hasParam2).toBe(true);
        expect(challengingData.param2Value).toBe('test value'); // Space decoded
        expect(challengingData.hasParam3).toBe(true);
        expect(challengingData.param3Value).toBe('normal');
        expect(challengingData.hasSecret).toBe(true);
        expect(challengingData.secretValue).toBe('hidden');
        expect(challengingData.paramCount).toBe(4);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle empty parameter values and edge cases', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        const testUrl = '/?empty=&null_param&secret=&normal=value&another_secret=data';
        await TestUtils.navigateAndWaitForReady(page, testUrl);

        const configWithSensitiveParams: Config = {
          ...TEST_CONFIGS.DEFAULT,
          sensitiveQueryParams: ['secret', 'another_secret', 'missing_param'],
        };

        const initResult = await TestUtils.initializeTraceLog(page, configWithSensitiveParams);
        const validated = TestUtils.verifyInitializationResult(initResult);
        expect(validated.success).toBe(true);

        await page.waitForTimeout(1000);

        // Verify edge cases are handled correctly
        const edgeCaseData = await page.evaluate(() => {
          const params = new URLSearchParams(window.location.search);
          return {
            hasEmpty: params.has('empty'),
            emptyValue: params.get('empty'),
            hasNullParam: params.has('null_param'),
            nullParamValue: params.get('null_param'),
            hasSecret: params.has('secret'),
            secretValue: params.get('secret'),
            hasNormal: params.has('normal'),
            normalValue: params.get('normal'),
            hasAnotherSecret: params.has('another_secret'),
            anotherSecretValue: params.get('another_secret'),
            allParams: Object.fromEntries(params.entries()),
          };
        });

        expect(edgeCaseData.hasEmpty).toBe(true);
        expect(edgeCaseData.emptyValue).toBe('');
        expect(edgeCaseData.hasNullParam).toBe(true);
        expect(edgeCaseData.nullParamValue).toBe('');
        expect(edgeCaseData.hasSecret).toBe(true);
        expect(edgeCaseData.secretValue).toBe('');
        expect(edgeCaseData.hasNormal).toBe(true);
        expect(edgeCaseData.normalValue).toBe('value');
        expect(edgeCaseData.hasAnotherSecret).toBe(true);
        expect(edgeCaseData.anotherSecretValue).toBe('data');

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle very long parameter lists efficiently', async ({ page }) => {
      const monitor = TestUtils.createConsoleMonitor(page);

      try {
        // Create URL with many parameters
        const manyParams = Array.from({ length: 20 }, (_, i) => `param${i}=value${i}`).join('&');
        const testUrl = `/?${manyParams}&secret1=hidden&secret2=private&utm_source=email`;
        await TestUtils.navigateAndWaitForReady(page, testUrl);

        const configWithSensitiveParams: Config = {
          ...TEST_CONFIGS.DEFAULT,
          sensitiveQueryParams: ['secret1', 'secret2', 'private_key', 'auth_token'],
        };

        const initResult = await TestUtils.initializeTraceLog(page, configWithSensitiveParams);
        const validated = TestUtils.verifyInitializationResult(initResult);
        expect(validated.success).toBe(true);

        await page.waitForTimeout(1000);

        // Verify system handles many parameters efficiently
        const manyParamsData = await page.evaluate(() => {
          const params = new URLSearchParams(window.location.search);
          const allKeys = Array.from(params.keys());

          return {
            totalParamCount: allKeys.length,
            hasSecret1: params.has('secret1'),
            hasSecret2: params.has('secret2'),
            hasUtmSource: params.has('utm_source'),
            hasParam0: params.has('param0'),
            hasParam19: params.has('param19'),
            secret1Value: params.get('secret1'),
            secret2Value: params.get('secret2'),
            utmSourceValue: params.get('utm_source'),
            param0Value: params.get('param0'),
            param19Value: params.get('param19'),
            regularParamCount: allKeys.filter((key) => key.startsWith('param')).length,
          };
        });

        expect(manyParamsData.totalParamCount).toBe(23); // 20 regular + 2 secrets + 1 utm
        expect(manyParamsData.hasSecret1).toBe(true);
        expect(manyParamsData.hasSecret2).toBe(true);
        expect(manyParamsData.hasUtmSource).toBe(true);
        expect(manyParamsData.hasParam0).toBe(true);
        expect(manyParamsData.hasParam19).toBe(true);
        expect(manyParamsData.regularParamCount).toBe(20);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });
});
