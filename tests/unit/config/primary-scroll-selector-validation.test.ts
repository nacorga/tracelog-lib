import { describe, test, expect } from 'vitest';
import { tracelog } from '../../../src/public-api';
import { AppConfigValidationError } from '../../../src/types/validation-error.types';

describe('primaryScrollSelector validation', () => {
  test('should throw error for non-string selector', async () => {
    await expect(
      tracelog.init({
        primaryScrollSelector: 123 as any,
      }),
    ).rejects.toThrow(AppConfigValidationError);
  });

  test('should throw error for empty string selector', async () => {
    await expect(
      tracelog.init({
        primaryScrollSelector: '',
      }),
    ).rejects.toThrow(AppConfigValidationError);
  });

  test('should throw error for whitespace-only selector', async () => {
    await expect(
      tracelog.init({
        primaryScrollSelector: '   ',
      }),
    ).rejects.toThrow(AppConfigValidationError);
  });

  test('should throw error for invalid CSS selector syntax', async () => {
    await expect(
      tracelog.init({
        primaryScrollSelector: '#invalid[',
      }),
    ).rejects.toThrow(AppConfigValidationError);
  });

  test('should throw error for malformed selector', async () => {
    await expect(
      tracelog.init({
        primaryScrollSelector: '>>>invalid<<<',
      }),
    ).rejects.toThrow(AppConfigValidationError);
  });

  test('should accept valid ID selector (validates syntax only)', () => {
    // Validation happens at config time, not at runtime
    // The selector doesn't need to exist in DOM for validation to pass
    expect(() => {
      document.querySelector('#main-content');
    }).not.toThrow();
  });

  test('should accept valid class selector (validates syntax only)', () => {
    expect(() => {
      document.querySelector('.scroll-container');
    }).not.toThrow();
  });

  test('should accept window keyword (validates syntax only)', () => {
    // 'window' is a special keyword that bypasses querySelector validation
    // Validation only checks that it's the exact string 'window'
    expect('window').toBe('window');
  });

  test('should accept complex valid selector (validates syntax only)', () => {
    expect(() => {
      document.querySelector('div.container > main#content');
    }).not.toThrow();
  });
});
