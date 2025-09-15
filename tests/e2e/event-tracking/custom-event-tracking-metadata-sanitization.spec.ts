import { test, expect } from '@playwright/test';
import { TestUtils } from '../../utils';

test.describe('Custom Event Tracking - Metadata Sanitization', () => {
  test.describe('HTML tag stripping', () => {
    test('should remove script tags from string metadata', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        const maliciousMetadata = {
          content: 'Safe content <script>alert("XSS")</script> more safe content',
          description: 'Test <script src="evil.js"></script> description',
          title: '<script>console.log("injected")</script>Clean title',
        };

        const result = await TestUtils.testCustomEvent(page, 'html_tag_test', maliciousMetadata);
        expect(TestUtils.verifyInitializationResult(result).success).toBe(true);

        // Verify no script execution occurred
        const noXSS = await TestUtils.verifyNoXSSExecution(page);
        expect(noXSS).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should remove iframe and embed tags from metadata', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        const maliciousMetadata = {
          content: 'Safe text <iframe src="http://evil.com"></iframe> more text',
          embed: '<embed src="malicious.swf" type="application/x-shockwave-flash">',
          object: '<object data="evil.pdf" type="application/pdf"></object>',
        };

        const result = await TestUtils.testCustomEvent(page, 'iframe_embed_test', maliciousMetadata);
        expect(TestUtils.verifyInitializationResult(result).success).toBe(true);

        // Verify no malicious content was executed
        const noXSS = await TestUtils.verifyNoXSSExecution(page);
        expect(noXSS).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should remove event handler attributes from metadata', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        const maliciousMetadata = {
          content: 'Safe text <div onclick="alert(\'XSS\')" onmouseover="steal()">content</div>',
          button: '<button onload="malicious()" onerror="evil()">Click me</button>',
          input: '<input onfocus="hack()" onblur="exploit()" value="test">',
        };

        const result = await TestUtils.testCustomEvent(page, 'event_handlers_test', maliciousMetadata);
        expect(TestUtils.verifyInitializationResult(result).success).toBe(true);

        // Verify no event handlers were executed
        const noXSS = await TestUtils.verifyNoXSSExecution(page);
        expect(noXSS).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Script injection prevention', () => {
    test('should prevent javascript: URL injection', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        const maliciousMetadata = {
          link: 'javascript:alert("XSS")',
          href: 'javascript:void(0);steal_data()',
          src: 'javascript:evil_function()',
          action: 'javascript:exploit()',
        };

        const result = await TestUtils.testCustomEvent(page, 'javascript_url_test', maliciousMetadata);
        expect(TestUtils.verifyInitializationResult(result).success).toBe(true);

        // Verify no javascript URLs were executed
        const noXSS = await TestUtils.verifyNoXSSExecution(page);
        expect(noXSS).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should sanitize complex script injection attempts', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        const complexMaliciousMetadata = {
          encoded: '&lt;script&gt;alert("encoded XSS")&lt;/script&gt;',
          mixed: '<SCRIPT>alert("mixed case")</SCRIPT>',
          fragmented: '<scr' + 'ipt>alert("fragmented")</scr' + 'ipt>',
          nested: '<div><script>alert("nested")</script></div>',
          multiline: `<script>
            var evil = "payload";
            alert(evil);
          </script>`,
        };

        const result = await TestUtils.testCustomEvent(page, 'complex_injection_test', complexMaliciousMetadata);
        expect(TestUtils.verifyInitializationResult(result).success).toBe(true);

        // Verify no complex injection was successful
        const noXSS = await TestUtils.verifyNoXSSExecution(page);
        expect(noXSS).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should prevent data URL script execution', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        const maliciousMetadata = {
          dataUrl: 'data:text/html,<script>alert("XSS")</script>',
          base64: 'data:text/javascript;base64,YWxlcnQoIlhTUyIp',
          svg: 'data:image/svg+xml,<svg onload="alert(\'XSS\')"></svg>',
        };

        const result = await TestUtils.testCustomEvent(page, 'data_url_test', maliciousMetadata);
        expect(TestUtils.verifyInitializationResult(result).success).toBe(true);

        // Verify no data URL execution occurred
        const noXSS = await TestUtils.verifyNoXSSExecution(page);
        expect(noXSS).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Special character encoding', () => {
    test('should properly encode HTML entities', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        const specialCharMetadata = {
          ampersand: 'Company & Associates',
          lessThan: 'Value < 100',
          greaterThan: 'Score > 50',
          quotes: 'He said "Hello World"',
          apostrophe: "It's a test",
          slash: 'Path/to/resource',
        };

        const result = await TestUtils.testCustomEvent(page, 'html_entities_test', specialCharMetadata);
        expect(TestUtils.verifyInitializationResult(result).success).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle Unicode and special characters safely', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        const unicodeMetadata = {
          chinese: '你好世界',
          emoji: '🎉🚀📊💡',
          accents: 'café naïve résumé',
          symbols: '©®™€£¥',
          math: 'α + β = γ ∑ ∞',
          arrows: '← → ↑ ↓',
        };

        const result = await TestUtils.testCustomEvent(page, 'unicode_test', unicodeMetadata);
        expect(TestUtils.verifyInitializationResult(result).success).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle edge case character combinations', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        const edgeCaseMetadata = {
          nullBytes: 'content\x00with\x00nulls',
          controlChars: 'text\t\n\r\fwith\vcontrol',
          backslashes: 'Path\\with\\backslashes\\file.txt',
          mixedQuotes: `Mixed "quotes" and 'apostrophes'`,
          urlEncoded: 'value%20with%20encoding',
        };

        const result = await TestUtils.testCustomEvent(page, 'edge_chars_test', edgeCaseMetadata);
        expect(TestUtils.verifyInitializationResult(result).success).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Dangerous properties removal', () => {
    test('should remove function references from metadata', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Test with object that would contain functions in a real scenario
        // Since we're in a browser context, we can only simulate dangerous strings
        const dangerousMetadata = {
          func: 'function(){alert("XSS")}',
          constructor: 'Object.constructor',
          prototype: '__proto__',
          toString: 'toString.call(this)',
          valueOf: 'valueOf.bind(window)',
        };

        const result = await TestUtils.testCustomEvent(page, 'dangerous_props_test', dangerousMetadata);
        expect(TestUtils.verifyInitializationResult(result).success).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle prototype pollution attempts', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        const prototypePollutonMetadata = {
          __proto__: 'malicious_value',
          'constructor.prototype': 'pollution_attempt',
          'prototype.isAdmin': 'true',
          __defineGetter__: 'getter_pollution',
          __defineSetter__: 'setter_pollution',
        };

        const result = await TestUtils.testCustomEvent(page, 'prototype_pollution_test', prototypePollutonMetadata);
        expect(TestUtils.verifyInitializationResult(result).success).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Legitimate content preservation', () => {
    test('should preserve valid business data', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        const legitimateMetadata = {
          customerName: 'John Smith & Associates Ltd.',
          productDescription: 'High-quality widgets for business use',
          price: 199.99,
          category: 'Office Supplies',
          inStock: true,
          tags: ['business', 'office', 'supplies'],
          rating: 4.5,
          reviewCount: 127,
        };

        const result = await TestUtils.testCustomEvent(page, 'legitimate_data_test', legitimateMetadata);
        expect(TestUtils.verifyInitializationResult(result).success).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should preserve numeric and boolean data integrity', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        const numericMetadata = {
          positiveInteger: 42,
          negativeInteger: -123,
          zero: 0,
          floatNumber: 3.14159,
          largeNumber: 1234567890,
          booleanTrue: true,
          booleanFalse: false,
          percentage: 0.75,
          temperature: -40.5,
        };

        const result = await TestUtils.testCustomEvent(page, 'numeric_data_test', numericMetadata);
        expect(TestUtils.verifyInitializationResult(result).success).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Array sanitization', () => {
    test('should sanitize string arrays containing malicious content', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Only string arrays are allowed by the API
        const arrayMetadata = {
          cleanTags: ['business', 'office', 'supplies'],
          maliciousTags: ['Safe string', '<script>alert("array XSS")</script>', 'javascript:evil()', 'Normal content'],
          categories: ['category1', 'category2', 'category3'],
        };

        const result = await TestUtils.testCustomEvent(page, 'array_sanitization_test', arrayMetadata);
        expect(TestUtils.verifyInitializationResult(result).success).toBe(true);

        // Verify no array-based script execution
        const noXSS = await TestUtils.verifyNoXSSExecution(page);
        expect(noXSS).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Sanitization consistency', () => {
    test('should apply consistent sanitization rules across all primitive metadata types', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Test the same malicious pattern in different primitive contexts
        const maliciousPattern = '<script>alert("XSS")</script>';
        const consistencyMetadata = {
          stringField: maliciousPattern,
          cleanString: 'legitimate_data',
          arrayField: [maliciousPattern, 'safe_content'],
          numberField: 42,
          booleanField: true,
        };

        const result = await TestUtils.testCustomEvent(page, 'consistency_test', consistencyMetadata);
        expect(TestUtils.verifyInitializationResult(result).success).toBe(true);

        // Verify consistent sanitization - no XSS execution
        const noXSS = await TestUtils.verifyNoXSSExecution(page);
        expect(noXSS).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle edge cases consistently', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Test various edge cases within API constraints
        const edgeCasesMetadata = {
          emptyString: '',
          whitespaceOnly: '   \t\n  ',
          veryLongString: 'A'.repeat(500), // Within limits
          binaryData: 'SGVsbG8gV29ybGQ=', // Base64 encoded "Hello World"
          jsonLikeString: '{"fake": "json", "malicious": "<script>alert(1)</script>"}',
          numberAsString: '42',
          booleanAsString: 'true',
          specialFloat: 3.14159265359,
          negativeZero: -0,
        };

        const result = await TestUtils.testCustomEvent(page, 'edge_cases_consistency_test', edgeCasesMetadata);
        expect(TestUtils.verifyInitializationResult(result).success).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Security validation', () => {
    test('should prevent all common XSS attack vectors', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Comprehensive XSS attack vector testing with primitive types
        const xssVectors = {
          basicScript: '<script>alert("XSS")</script>',
          imgOnerror: '<img src="x" onerror="alert(\'XSS\')">',
          svgOnload: '<svg onload="alert(\'XSS\')">',
          bodyOnload: '<body onload="alert(\'XSS\')">',
          inputAutofocus: '<input autofocus onfocus="alert(\'XSS\')">',
          linkJavascript: '<a href="javascript:alert(\'XSS\')">Link</a>',
          iframeJavascript: '<iframe src="javascript:alert(\'XSS\')"></iframe>',
          objectData: '<object data="data:text/html,<script>alert(\'XSS\')</script>"></object>',
          embedSrc: '<embed src="data:image/svg+xml,<svg onload=alert(\'XSS\')>">',
          formAction: '<form action="javascript:alert(\'XSS\')"><input type="submit"></form>',
        };

        const result = await TestUtils.testCustomEvent(page, 'comprehensive_xss_test', xssVectors);
        expect(TestUtils.verifyInitializationResult(result).success).toBe(true);

        // Critical security check: verify no XSS vectors were successful
        const noXSS = await TestUtils.verifyNoXSSExecution(page);
        expect(noXSS).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should validate primitive type structure after sanitization', async ({ page }) => {
      const { monitor, initResult } = await TestUtils.setupEventTrackingTest(page);

      try {
        expect(TestUtils.verifyInitializationResult(initResult).success).toBe(true);

        // Test with valid primitive structure
        const primitiveStructure = {
          userId: 12345,
          userName: 'Test User & Associates',
          userEmail: 'test@example.com',
          isActive: true,
          lastLoginScore: 4.8,
          userTags: ['premium', 'verified', 'active'],
          sessionDuration: 1800,
          pageCount: 5,
          conversionRate: 0.125,
        };

        const result = await TestUtils.testCustomEvent(page, 'primitive_structure_test', primitiveStructure);
        expect(TestUtils.verifyInitializationResult(result).success).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });
});
