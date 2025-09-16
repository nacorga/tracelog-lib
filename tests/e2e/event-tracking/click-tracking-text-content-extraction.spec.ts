import { test, expect } from '@playwright/test';
import { TestUtils } from '../../utils';

test.describe('Click Tracking - Text Content Extraction', () => {
  test.describe('Text content extraction', () => {
    test('should extract text content from basic elements', async ({ page }) => {
      const monitor = await TestUtils.setupTextExtractionTest(page);

      try {
        const elements = [
          { selector: '[data-testid="simple-button"]', expectedBehavior: 'extract button text' },
          { selector: '[data-testid="simple-link"]', expectedBehavior: 'extract link text' },
          { selector: '[data-testid="simple-span"]', expectedBehavior: 'extract span text' },
          { selector: '[data-testid="simple-paragraph"]', expectedBehavior: 'extract paragraph text' },
        ];

        const results = await TestUtils.testTextExtractionFromElements(page, elements);

        for (const { result } of results) {
          expect(result.success).toBe(true);
          expect(result.text).toBeDefined();
          expect(typeof result.text).toBe('string');
          expect(result.text!.length).toBeGreaterThan(0);
          expect(TestUtils.verifyTextLength(result.text)).toBe(true);
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should extract appropriate text from different element types', async ({ page }) => {
      const monitor = await TestUtils.setupTextExtractionTest(page);

      try {
        const buttonResult = await TestUtils.clickElementAndCaptureData(page, '[data-testid="simple-button"]');
        expect(buttonResult.text).toBe('Click Me');

        const linkResult = await TestUtils.clickElementAndCaptureData(page, '[data-testid="simple-link"]');
        expect(linkResult.text).toBe('Simple Link Text');

        const spanResult = await TestUtils.clickElementAndCaptureData(page, '[data-testid="simple-span"]');
        expect(spanResult.text).toBe('Simple Span Content');

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Nested text content handling', () => {
    test('should properly aggregate nested text content', async ({ page }) => {
      const monitor = await TestUtils.setupTextExtractionTest(page);

      try {
        const nestedResult = await TestUtils.clickElementAndCaptureData(page, '[data-testid="nested-container"]');
        expect(nestedResult.success).toBe(true);
        expect(nestedResult.text).toContain('Outer text');
        expect(nestedResult.text).toContain('bold text');
        expect(nestedResult.text).toContain('italic text');

        const buttonResult = await TestUtils.clickElementAndCaptureData(page, '[data-testid="nested-button"]');
        expect(buttonResult.success).toBe(true);
        expect(buttonResult.text).toContain('Button with nested content');

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle deeply nested content correctly', async ({ page }) => {
      const monitor = await TestUtils.setupTextExtractionTest(page);

      try {
        const deepResult = await TestUtils.clickElementAndCaptureData(page, '[data-testid="deep-target"]');
        expect(deepResult.success).toBe(true);
        expect(deepResult.text).toBe('Level 3 Target');

        const containerResult = await TestUtils.clickElementAndCaptureData(page, '[data-testid="deep-nested"]');
        expect(containerResult.success).toBe(true);
        expect(containerResult.text).toContain('Level 1');
        expect(containerResult.text).toContain('Level 2');
        expect(containerResult.text).toContain('Level 3 Target');

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Long text truncation', () => {
    test('should preserve medium-length text within limits', async ({ page }) => {
      const monitor = await TestUtils.setupTextExtractionTest(page);

      try {
        const originalText = await TestUtils.getElementTextContent(page, '[data-testid="medium-text"]');
        const result = await TestUtils.clickElementAndCaptureData(page, '[data-testid="medium-text"]');

        expect(result.success).toBe(true);
        expect(result.text).toBeDefined();

        const verification = TestUtils.verifyTextTruncation(originalText, result.text);
        expect(verification.isValid).toBe(true);
        expect(TestUtils.verifyTextLength(result.text)).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should truncate excessively long text content', async ({ page }) => {
      const monitor = await TestUtils.setupTextExtractionTest(page);

      try {
        const originalText = await TestUtils.getElementTextContent(page, '[data-testid="long-text"]');
        const result = await TestUtils.clickElementAndCaptureData(page, '[data-testid="long-text"]');

        expect(result.success).toBe(true);
        expect(originalText.length).toBeGreaterThan(255);

        if (result.text) {
          expect(TestUtils.verifyTextLength(result.text, 255)).toBe(true);
          const verification = TestUtils.verifyTextTruncation(originalText, result.text);
          expect(verification.isValid).toBe(true);
        }

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle large containers appropriately', async ({ page }) => {
      const monitor = await TestUtils.setupTextExtractionTest(page);

      try {
        const buttonResult = await TestUtils.clickElementAndCaptureData(
          page,
          '[data-testid="button-in-large-container"]',
        );
        expect(buttonResult.success).toBe(true);
        expect(buttonResult.text).toBe('Action Button');

        const titleResult = await TestUtils.clickElementAndCaptureData(page, '[data-testid="container-title"]');
        expect(titleResult.success).toBe(true);
        expect(titleResult.text).toBe('Large Container Title');

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Text content sanitization', () => {
    test('should sanitize HTML content properly', async ({ page }) => {
      const monitor = await TestUtils.setupTextExtractionTest(page);

      try {
        const result = await TestUtils.clickElementAndCaptureData(page, '[data-testid="html-content"]');
        expect(result.success).toBe(true);

        if (result.text) {
          const sanitizationCheck = TestUtils.verifyTextSanitization(result.text);
          expect(sanitizationCheck.isValid).toBe(true);
        }

        expect(await TestUtils.verifyNoXSSExecution(page)).toBe(true);
        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should normalize whitespace and formatting', async ({ page }) => {
      const monitor = await TestUtils.setupTextExtractionTest(page);

      try {
        const whitespaceResult = await TestUtils.clickElementAndCaptureData(page, '[data-testid="whitespace-text"]');
        expect(whitespaceResult.success).toBe(true);
        expect(whitespaceResult.text).toBe('Text   with   excessive   whitespace');

        const newlinesResult = await TestUtils.clickElementAndCaptureData(page, '[data-testid="newlines-text"]');
        expect(newlinesResult.success).toBe(true);
        expect(newlinesResult.text).toContain('Text');
        expect(newlinesResult.text).toContain('newlines');

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('Special character handling', () => {
    test('should handle quotes and symbols correctly', async ({ page }) => {
      const monitor = await TestUtils.setupTextExtractionTest(page);

      try {
        const result = await TestUtils.clickElementAndCaptureData(page, '[data-testid="special-chars"]');
        expect(result.success).toBe(true);
        expect(result.text).toContain('"quotes"');
        expect(result.text).toContain("'apostrophes'");
        expect(result.text).toContain('&');
        expect(result.text).toContain('symbols!');

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should preserve Unicode characters', async ({ page }) => {
      const monitor = await TestUtils.setupTextExtractionTest(page);

      try {
        const result = await TestUtils.clickElementAndCaptureData(page, '[data-testid="unicode-content"]');
        expect(result.success).toBe(true);
        expect(result.text).toContain('你好世界');
        expect(result.text).toContain('🌍');
        expect(result.text).toContain('café');
        expect(result.text).toContain('naïve');
        expect(result.text).toContain('résumé');

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });

  test.describe('No text content fallback', () => {
    test('should handle elements without text content', async ({ page }) => {
      const monitor = await TestUtils.setupTextExtractionTest(page);

      try {
        const emptyDivResult = await TestUtils.clickElementAndCaptureData(page, '[data-testid="empty-div"]');
        expect(emptyDivResult.success).toBe(true);
        expect(emptyDivResult.text).toBeUndefined();

        const emptyButtonResult = await TestUtils.clickElementAndCaptureData(page, '[data-testid="empty-button"]');
        expect(emptyButtonResult.success).toBe(true);
        expect(emptyButtonResult.text).toBeUndefined();

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle image elements appropriately', async ({ page }) => {
      const monitor = await TestUtils.setupTextExtractionTest(page);

      try {
        const imageResult = await TestUtils.clickElementAndCaptureData(page, '[data-testid="image-element"]');
        expect(imageResult.success).toBe(true);
        expect(imageResult.tag).toBe('img');

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle input elements with values', async ({ page }) => {
      const monitor = await TestUtils.setupTextExtractionTest(page);

      try {
        const inputResult = await TestUtils.clickElementAndCaptureData(page, '[data-testid="input-button"]');
        expect(inputResult.success).toBe(true);
        expect(inputResult.tag).toBe('input');

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should ignore hidden and invisible text', async ({ page }) => {
      const monitor = await TestUtils.setupTextExtractionTest(page);

      try {
        const hiddenResult = await TestUtils.clickElementAndCaptureData(page, '[data-testid="hidden-text"]');
        expect(hiddenResult.success).toBe(true);

        const invisibleResult = await TestUtils.clickElementAndCaptureData(page, '[data-testid="invisible-text"]');
        expect(invisibleResult.success).toBe(true);

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });

    test('should handle mixed content elements', async ({ page }) => {
      const monitor = await TestUtils.setupTextExtractionTest(page);

      try {
        const mixedResult = await TestUtils.clickElementAndCaptureData(page, '[data-testid="mixed-content"]');
        expect(mixedResult.success).toBe(true);
        expect(mixedResult.text).toContain('Text content');
        expect(mixedResult.text).toContain('more text');
        expect(mixedResult.text).toContain('final text');

        const labelResult = await TestUtils.clickElementAndCaptureData(page, '[data-testid="form-label"]');
        expect(labelResult.success).toBe(true);
        expect(labelResult.text).toContain('Label text');
        expect(labelResult.text).toContain('additional label text');

        expect(TestUtils.verifyNoTraceLogErrors(monitor.traceLogErrors)).toBe(true);
      } finally {
        monitor.cleanup();
      }
    });
  });
});
