/**
 * SessionHandler Tests
 *
 * Priority: P1 (Essential)
 * Focus: Session handler wrapper
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { SessionHandler } from '../../../src/handlers/session.handler';
import { StorageManager } from '../../../src/managers/storage.manager';
import { EventManager } from '../../../src/managers/event.manager';
import { SessionManager } from '../../../src/managers/session.manager';

describe('SessionHandler - Wrapper', () => {
  let sessionHandler: SessionHandler;
  let mockStorageManager: StorageManager;
  let mockEventManager: EventManager;
  let mockSessionManager: Partial<SessionManager>;

  beforeEach(() => {
    setupTestEnvironment();

    mockStorageManager = new StorageManager();
    mockEventManager = new EventManager(mockStorageManager);

    mockSessionManager = {
      startTracking: vi.fn(),
      stopTracking: vi.fn(),
      destroy: vi.fn(),
    };

    vi.spyOn(SessionManager.prototype, 'startTracking').mockImplementation(mockSessionManager.startTracking as any);
    vi.spyOn(SessionManager.prototype, 'stopTracking').mockImplementation(mockSessionManager.stopTracking as any);
    vi.spyOn(SessionManager.prototype, 'destroy').mockImplementation(mockSessionManager.destroy as any);

    sessionHandler = new SessionHandler(mockStorageManager, mockEventManager);
  });

  afterEach(() => {
    cleanupTestEnvironment();
    vi.restoreAllMocks();
  });

  it('should delegate to SessionManager', () => {
    sessionHandler.startTracking();

    expect(mockSessionManager.startTracking).toHaveBeenCalledOnce();
  });

  it('should call startTracking on SessionManager', () => {
    sessionHandler.startTracking();

    expect(mockSessionManager.startTracking).toHaveBeenCalledOnce();
  });

  it('should call stopTracking on SessionManager', () => {
    sessionHandler.startTracking();
    sessionHandler.stopTracking();

    expect(mockSessionManager.stopTracking).toHaveBeenCalledOnce();
    expect(mockSessionManager.destroy).toHaveBeenCalledOnce();
  });

  it('should expose SessionManager methods', () => {
    const boundStartTracking = sessionHandler.startTracking.bind(sessionHandler);
    const boundStopTracking = sessionHandler.stopTracking.bind(sessionHandler);
    const boundDestroy = sessionHandler.destroy.bind(sessionHandler);

    expect(boundStartTracking).toBeDefined();
    expect(boundStopTracking).toBeDefined();
    expect(boundDestroy).toBeDefined();
    expect(typeof boundStartTracking).toBe('function');
    expect(typeof boundStopTracking).toBe('function');
    expect(typeof boundDestroy).toBe('function');
  });
});
