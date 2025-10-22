import { PerformanceHandler } from '../handlers/performance.handler';
import { EventManager } from '../managers/event.manager';
import { Config } from './config.types';
import { State } from './state.types';

/**
 * Testing bridge interface for E2E tests
 * Only available when NODE_ENV=development
 *
 * Provides minimal test-specific helpers while inheriting core App functionality.
 * Methods delegate to parent App class where possible to avoid code duplication.
 */
export interface TraceLogTestBridge {
  // Core App methods
  readonly initialized: boolean;
  init(config?: Config): Promise<void>;
  destroy(): void;

  // Core event methods (inherited from App)
  sendCustomEvent(name: string, data?: Record<string, unknown> | Record<string, unknown>[]): void;

  // Convenience alias for sendCustomEvent (used in E2E tests)
  event(name: string, metadata?: Record<string, unknown> | Record<string, unknown>[]): void;

  // Event subscription methods (inherited from App)
  on(event: string, callback: (data: any) => void): void;
  off(event: string, callback: (data: any) => void): void;

  // State access for testing
  get<T extends keyof State>(key: T): State[T];

  // Test inspection methods
  getSessionData(): Record<string, unknown> | null;
  getQueueLength(): number;
  getConsentBufferLength(): number;

  // Consent management (for E2E testing)
  setConsent(integration: 'google' | 'custom' | 'tracelog' | 'all', granted: boolean): Promise<void>;
  hasConsent(integration: 'google' | 'custom' | 'tracelog' | 'all'): boolean;
  getConsentState(): { google: boolean; custom: boolean; tracelog: boolean };

  // QA mode for testing
  setQaMode(enabled: boolean): void;

  // Handler accessors used in E2E tests
  getEventManager(): EventManager | undefined;
  getPerformanceHandler(): PerformanceHandler | null;
}
