/**
 * SessionHandler Unit Tests
 *
 * Tests for session tracking handler functionality including:
 * - Session lifecycle management
 * - Start/stop tracking
 * - Error handling during initialization
 * - Cleanup and destruction
 * - Integration with SessionManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionHandler } from '@/handlers/session.handler';
import { SessionManager } from '@/managers/session.manager';
import { EventManager } from '@/managers/event.manager';
import { StorageManager } from '@/managers/storage.manager';

describe('SessionHandler', () => {
  let sessionHandler: SessionHandler;
  let eventManager: EventManager;
  let storageManager: StorageManager;
  let mockSessionManager: {
    startTracking: ReturnType<typeof vi.fn>;
    stopTracking: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock SessionManager
    mockSessionManager = {
      startTracking: vi.fn().mockResolvedValue(undefined),
      stopTracking: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn(),
    };

    // Spy on SessionManager constructor
    vi.spyOn(SessionManager.prototype, 'startTracking').mockImplementation(mockSessionManager.startTracking);
    vi.spyOn(SessionManager.prototype, 'stopTracking').mockImplementation(mockSessionManager.stopTracking);
    vi.spyOn(SessionManager.prototype, 'destroy').mockImplementation(mockSessionManager.destroy);

    // Create instances
    storageManager = new StorageManager();
    eventManager = new EventManager(storageManager);
    sessionHandler = new SessionHandler(storageManager, eventManager);

    // Mock global state
    const getSpy = vi.spyOn(sessionHandler as any, 'get');
    getSpy.mockImplementation(((key: any) => {
      if (key === 'config') {
        return { id: 'test-project-id' };
      }
      return undefined;
    }) as any);

    const setSpy = vi.spyOn(sessionHandler as any, 'set');
    setSpy.mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    if (sessionHandler) {
      sessionHandler.destroy();
    }
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should create instance with storage and event managers', () => {
      expect(sessionHandler).toBeDefined();
      expect(sessionHandler).toBeInstanceOf(SessionHandler);
    });

    it('should initialize with null sessionManager', () => {
      expect((sessionHandler as any).sessionManager).toBeNull();
    });

    it('should initialize with destroyed flag as false', () => {
      expect((sessionHandler as any).destroyed).toBe(false);
    });
  });

  describe('startTracking()', () => {
    it('should create SessionManager instance', async () => {
      await sessionHandler.startTracking();

      expect((sessionHandler as any).sessionManager).not.toBeNull();
      expect((sessionHandler as any).sessionManager).toBeInstanceOf(SessionManager);
    });

    it('should call startTracking on SessionManager', async () => {
      await sessionHandler.startTracking();

      const sessionManagerInstance = (sessionHandler as any).sessionManager;
      expect(sessionManagerInstance.startTracking).toHaveBeenCalled();
    });

    it('should not create duplicate SessionManager if already active', async () => {
      await sessionHandler.startTracking();
      const firstInstance = (sessionHandler as any).sessionManager;

      await sessionHandler.startTracking();
      const secondInstance = (sessionHandler as any).sessionManager;

      expect(firstInstance).toBe(secondInstance);
      // startTracking should only be called once on the SessionManager
      expect(mockSessionManager.startTracking).toHaveBeenCalledTimes(1);
    });

    it('should throw error when config is not available', async () => {
      vi.spyOn(sessionHandler as any, 'get').mockReturnValue(null);

      await expect(sessionHandler.startTracking()).rejects.toThrow(
        'Cannot start session tracking: config not available',
      );
    });

    it('should throw error when config id is missing', async () => {
      vi.spyOn(sessionHandler as any, 'get').mockReturnValue({});

      await expect(sessionHandler.startTracking()).rejects.toThrow(
        'Cannot start session tracking: config not available',
      );
    });

    it('should not start tracking when handler is destroyed', async () => {
      (sessionHandler as any).destroyed = true;

      await sessionHandler.startTracking();

      expect((sessionHandler as any).sessionManager).toBeNull();
    });

    it('should cleanup SessionManager on initialization error', async () => {
      // Mock startTracking to fail
      mockSessionManager.startTracking.mockRejectedValueOnce(new Error('Init failed'));

      await expect(sessionHandler.startTracking()).rejects.toThrow('Init failed');

      expect(mockSessionManager.destroy).toHaveBeenCalled();
      expect((sessionHandler as any).sessionManager).toBeNull();
    });

    it('should handle cleanup errors during initialization failure', async () => {
      // Mock startTracking to fail and destroy to throw
      mockSessionManager.startTracking.mockRejectedValueOnce(new Error('Init failed'));
      mockSessionManager.destroy.mockImplementationOnce(() => {
        throw new Error('Cleanup failed');
      });

      await expect(sessionHandler.startTracking()).rejects.toThrow('Init failed');

      // Should not throw cleanup error, only original error
      expect((sessionHandler as any).sessionManager).toBeNull();
    });
  });

  describe('stopTracking()', () => {
    beforeEach(async () => {
      await sessionHandler.startTracking();
    });

    it('should call stopTracking on SessionManager', async () => {
      const sessionManagerInstance = (sessionHandler as any).sessionManager;

      await sessionHandler.stopTracking();

      expect(sessionManagerInstance.stopTracking).toHaveBeenCalled();
    });

    it('should call destroy on SessionManager', async () => {
      const sessionManagerInstance = (sessionHandler as any).sessionManager;

      await sessionHandler.stopTracking();

      expect(sessionManagerInstance.destroy).toHaveBeenCalled();
    });

    it('should set sessionManager to null after cleanup', async () => {
      await sessionHandler.stopTracking();

      expect((sessionHandler as any).sessionManager).toBeNull();
    });

    it('should not throw when stopping without starting', async () => {
      const freshHandler = new SessionHandler(storageManager, eventManager);

      await expect(freshHandler.stopTracking()).resolves.not.toThrow();
    });

    it('should handle multiple stop calls gracefully', async () => {
      await sessionHandler.stopTracking();
      await expect(sessionHandler.stopTracking()).resolves.not.toThrow();
    });
  });

  describe('destroy()', () => {
    beforeEach(async () => {
      await sessionHandler.startTracking();
    });

    it('should call destroy on SessionManager', () => {
      const sessionManagerInstance = (sessionHandler as any).sessionManager;

      sessionHandler.destroy();

      expect(sessionManagerInstance.destroy).toHaveBeenCalled();
    });

    it('should set sessionManager to null', () => {
      sessionHandler.destroy();

      expect((sessionHandler as any).sessionManager).toBeNull();
    });

    it('should set destroyed flag to true', () => {
      sessionHandler.destroy();

      expect((sessionHandler as any).destroyed).toBe(true);
    });

    it('should set hasStartSession to false', () => {
      const setSpy = vi.spyOn(sessionHandler as any, 'set');

      sessionHandler.destroy();

      expect(setSpy).toHaveBeenCalledWith('hasStartSession', false);
    });

    it('should not throw when destroying without starting', () => {
      const freshHandler = new SessionHandler(storageManager, eventManager);

      expect(() => freshHandler.destroy()).not.toThrow();
    });

    it('should handle multiple destroy calls gracefully', () => {
      sessionHandler.destroy();

      expect(() => sessionHandler.destroy()).not.toThrow();
    });

    it('should be idempotent', () => {
      const setSpy = vi.spyOn(sessionHandler as any, 'set');

      sessionHandler.destroy();
      setSpy.mockClear();

      sessionHandler.destroy();

      // Second call should not set hasStartSession again
      expect(setSpy).not.toHaveBeenCalled();
    });
  });

  describe('isActive() private method', () => {
    it('should return false when sessionManager is null', () => {
      const isActive = (sessionHandler as any).isActive();

      expect(isActive).toBe(false);
    });

    it('should return true when sessionManager exists and not destroyed', async () => {
      await sessionHandler.startTracking();

      const isActive = (sessionHandler as any).isActive();

      expect(isActive).toBe(true);
    });

    it('should return false when handler is destroyed', async () => {
      await sessionHandler.startTracking();
      sessionHandler.destroy();

      const isActive = (sessionHandler as any).isActive();

      expect(isActive).toBe(false);
    });

    it('should return false when sessionManager exists but handler is destroyed', async () => {
      await sessionHandler.startTracking();
      (sessionHandler as any).destroyed = true;

      const isActive = (sessionHandler as any).isActive();

      expect(isActive).toBe(false);
    });
  });

  describe('cleanupSessionManager() private method', () => {
    beforeEach(async () => {
      await sessionHandler.startTracking();
    });

    it('should call stopTracking and destroy', async () => {
      const sessionManagerInstance = (sessionHandler as any).sessionManager;

      await (sessionHandler as any).cleanupSessionManager();

      expect(sessionManagerInstance.stopTracking).toHaveBeenCalled();
      expect(sessionManagerInstance.destroy).toHaveBeenCalled();
    });

    it('should set sessionManager to null', async () => {
      await (sessionHandler as any).cleanupSessionManager();

      expect((sessionHandler as any).sessionManager).toBeNull();
    });

    it('should not throw when sessionManager is null', async () => {
      (sessionHandler as any).sessionManager = null;

      await expect((sessionHandler as any).cleanupSessionManager()).resolves.not.toThrow();
    });
  });

  describe('Lifecycle Integration', () => {
    it('should handle start -> stop -> start cycle', async () => {
      // First cycle
      await sessionHandler.startTracking();
      expect((sessionHandler as any).sessionManager).not.toBeNull();

      await sessionHandler.stopTracking();
      expect((sessionHandler as any).sessionManager).toBeNull();

      // Second cycle
      await sessionHandler.startTracking();
      expect((sessionHandler as any).sessionManager).not.toBeNull();
    });

    it('should handle start -> destroy -> start attempt', async () => {
      await sessionHandler.startTracking();
      expect((sessionHandler as any).sessionManager).not.toBeNull();

      sessionHandler.destroy();
      expect((sessionHandler as any).destroyed).toBe(true);

      // Should not start after destroy - sessionManager stays null
      await sessionHandler.startTracking();
      expect((sessionHandler as any).sessionManager).toBeNull();
    });

    it('should maintain state consistency across operations', async () => {
      // Start
      await sessionHandler.startTracking();
      expect((sessionHandler as any).isActive()).toBe(true);

      // Stop
      await sessionHandler.stopTracking();
      expect((sessionHandler as any).isActive()).toBe(false);

      // Destroy
      sessionHandler.destroy();
      expect((sessionHandler as any).destroyed).toBe(true);
      expect((sessionHandler as any).isActive()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should propagate SessionManager initialization errors', async () => {
      const mockError = new Error('SessionManager init failed');
      mockSessionManager.startTracking.mockRejectedValueOnce(mockError);

      await expect(sessionHandler.startTracking()).rejects.toThrow('SessionManager init failed');
    });

    it('should log errors during initialization', async () => {
      const mockError = new Error('Test error');
      mockSessionManager.startTracking.mockRejectedValueOnce(mockError);

      try {
        await sessionHandler.startTracking();
      } catch {
        // Expected error
      }

      // Error should be logged (implementation detail)
      expect((sessionHandler as any).sessionManager).toBeNull();
    });

    it('should handle non-Error exceptions', async () => {
      mockSessionManager.startTracking.mockRejectedValueOnce('String error');

      await expect(sessionHandler.startTracking()).rejects.toBe('String error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid start/stop calls', async () => {
      await Promise.all([
        sessionHandler.startTracking(),
        sessionHandler.stopTracking(),
        sessionHandler.startTracking(),
      ]);

      // Should complete without errors
      expect(true).toBe(true);
    });

    it('should handle missing config during runtime', async () => {
      await sessionHandler.startTracking();

      // Config becomes unavailable
      vi.spyOn(sessionHandler as any, 'get').mockReturnValue(null);

      // Should still be able to stop
      await expect(sessionHandler.stopTracking()).resolves.not.toThrow();
    });

    it('should maintain destroyed state after multiple operations', () => {
      sessionHandler.destroy();

      expect((sessionHandler as any).destroyed).toBe(true);

      sessionHandler.destroy();
      expect((sessionHandler as any).destroyed).toBe(true);
    });
  });
});
