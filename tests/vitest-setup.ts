// Global Vitest setup - runs once before all test files
// This file patches browser APIs that are incomplete in jsdom

import { vi } from 'vitest';

// Mock web-vitals entirely to avoid PerformanceObserver.takeRecords errors
// jsdom's PerformanceObserver doesn't have takeRecords method
vi.mock('web-vitals', () => ({
  onLCP: vi.fn(),
  onCLS: vi.fn(),
  onFCP: vi.fn(),
  onTTFB: vi.fn(),
  onINP: vi.fn(),
  onFID: vi.fn(),
}));
