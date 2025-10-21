import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GoogleAnalyticsIntegration } from '../../src/integrations/google-analytics.integration';

describe('Google Analytics Integration', () => {
  let gaIntegration: GoogleAnalyticsIntegration;
  let mockGtag: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Clean up DOM
    document.head.innerHTML = '';
    document.body.innerHTML = '';

    // Mock window.gtag
    mockGtag = vi.fn();
    window.gtag = mockGtag;
    window.dataLayer = [];

    gaIntegration = new GoogleAnalyticsIntegration();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    gaIntegration.cleanup();
    delete window.gtag;
    delete window.dataLayer;
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  describe('initialize()', () => {
    describe('Successful Initialization', () => {
      it('should initialize when valid config and userId are provided', async () => {
        // Clear window.gtag and dataLayer for this test
        delete window.gtag;
        delete window.dataLayer;

        const mockState = {
          config: {
            id: 'test-project',
            integrations: {
              google: { measurementId: 'G-XXXXXXXXXX' },
            },
          },
          userId: 'user-123',
        };

        vi.spyOn(gaIntegration as any, 'get').mockImplementation(((key: any) => {
          if (key === 'config') return mockState.config;
          if (key === 'userId') return mockState.userId;
          return undefined;
        }) as any);

        await gaIntegration.initialize();

        const script = document.getElementById('tracelog-ga-script');
        expect(script).toBeDefined();
        expect(script?.getAttribute('src')).toContain('googletagmanager.com/gtag/js');
        expect(script?.getAttribute('src')).toContain('G-XXXXXXXXXX');
      });

      it('should set isInitialized flag to true after successful init', async () => {
        const mockState = {
          config: {
            id: 'test-project',
            integrations: {
              google: { measurementId: 'G-XXXXXXXXXX' },
            },
          },
          userId: 'user-123',
        };

        vi.spyOn(gaIntegration as any, 'get').mockImplementation(((key: any) => {
          if (key === 'config') return mockState.config;
          if (key === 'userId') return mockState.userId;
          return undefined;
        }) as any);

        await gaIntegration.initialize();
        expect((gaIntegration as any).isInitialized).toBe(true);
      });

      it('should inject configuration script with userId', async () => {
        // Clear window.gtag and dataLayer for this test
        delete window.gtag;
        delete window.dataLayer;

        const mockState = {
          config: {
            id: 'test-project',
            integrations: {
              google: { measurementId: 'G-TEST123' },
            },
          },
          userId: 'user-456',
        };

        vi.spyOn(gaIntegration as any, 'get').mockImplementation(((key: any) => {
          if (key === 'config') return mockState.config;
          if (key === 'userId') return mockState.userId;
          return undefined;
        }) as any);

        await gaIntegration.initialize();

        const scripts = document.head.querySelectorAll('script');
        const configScript = Array.from(scripts).find((s) => s.innerHTML.includes('gtag'));

        expect(configScript).toBeDefined();
        expect(configScript?.innerHTML).toContain('G-TEST123');
        expect(configScript?.innerHTML).toContain('user-456');
      });

      it('should create gtag function and dataLayer', async () => {
        // Clear window.gtag and dataLayer for this test
        delete window.gtag;
        delete window.dataLayer;

        const mockState = {
          config: {
            id: 'test-project',
            integrations: {
              google: { measurementId: 'G-XXXXXXXXXX' },
            },
          },
          userId: 'user-123',
        };

        vi.spyOn(gaIntegration as any, 'get').mockImplementation(((key: any) => {
          if (key === 'config') return mockState.config;
          if (key === 'userId') return mockState.userId;
          return undefined;
        }) as any);

        await gaIntegration.initialize();

        const scripts = document.head.querySelectorAll('script');
        const configScript = Array.from(scripts).find((s) => s.innerHTML.includes('dataLayer'));

        expect(configScript).toBeDefined();
        expect(configScript?.innerHTML).toContain('window.dataLayer');
        expect(configScript?.innerHTML).toContain('function gtag()');
      });
    });

    describe('Skipped Initialization', () => {
      it('should skip initialization if already initialized', async () => {
        const mockState = {
          config: {
            id: 'test-project',
            integrations: {
              google: { measurementId: 'G-XXXXXXXXXX' },
            },
          },
          userId: 'user-123',
        };

        vi.spyOn(gaIntegration as any, 'get').mockImplementation(((key: any) => {
          if (key === 'config') return mockState.config;
          if (key === 'userId') return mockState.userId;
          return undefined;
        }) as any);

        await gaIntegration.initialize();
        const scriptCount = document.head.querySelectorAll('script').length;

        await gaIntegration.initialize();
        const scriptCountAfter = document.head.querySelectorAll('script').length;

        expect(scriptCount).toBe(scriptCountAfter);
      });

      it('should skip if measurementId is missing', async () => {
        const mockState = {
          config: {
            id: 'test-project',
            integrations: {
              google: { measurementId: '' },
            },
          },
          userId: 'user-123',
        };

        vi.spyOn(gaIntegration as any, 'get').mockImplementation(((key: any) => {
          if (key === 'config') return mockState.config;
          if (key === 'userId') return mockState.userId;
          return undefined;
        }) as any);

        await gaIntegration.initialize();

        const script = document.getElementById('tracelog-ga-script');
        expect(script).toBeNull();
        expect((gaIntegration as any).isInitialized).toBe(false);
      });

      it('should skip if measurementId is whitespace-only', async () => {
        const mockState = {
          config: {
            id: 'test-project',
            integrations: {
              google: { measurementId: '   ' },
            },
          },
          userId: 'user-123',
        };

        vi.spyOn(gaIntegration as any, 'get').mockImplementation(((key: any) => {
          if (key === 'config') return mockState.config;
          if (key === 'userId') return mockState.userId;
          return undefined;
        }) as any);

        await gaIntegration.initialize();

        expect((gaIntegration as any).isInitialized).toBe(false);
      });

      it('should skip if userId is missing', async () => {
        const mockState = {
          config: {
            id: 'test-project',
            integrations: {
              google: { measurementId: 'G-XXXXXXXXXX' },
            },
          },
          userId: '',
        };

        vi.spyOn(gaIntegration as any, 'get').mockImplementation(((key: any) => {
          if (key === 'config') return mockState.config;
          if (key === 'userId') return mockState.userId;
          return undefined;
        }) as any);

        await gaIntegration.initialize();

        const script = document.getElementById('tracelog-ga-script');
        expect(script).toBeNull();
        expect((gaIntegration as any).isInitialized).toBe(false);
      });

      it('should skip if userId is whitespace-only', async () => {
        const mockState = {
          config: {
            id: 'test-project',
            integrations: {
              google: { measurementId: 'G-XXXXXXXXXX' },
            },
          },
          userId: '   ',
        };

        vi.spyOn(gaIntegration as any, 'get').mockImplementation(((key: any) => {
          if (key === 'config') return mockState.config;
          if (key === 'userId') return mockState.userId;
          return undefined;
        }) as any);

        await gaIntegration.initialize();

        expect((gaIntegration as any).isInitialized).toBe(false);
      });

      it('should skip if integrations config is missing', async () => {
        const mockState = {
          config: {
            id: 'test-project',
          },
          userId: 'user-123',
        };

        vi.spyOn(gaIntegration as any, 'get').mockImplementation(((key: any) => {
          if (key === 'config') return mockState.config;
          if (key === 'userId') return mockState.userId;
          return undefined;
        }) as any);

        await gaIntegration.initialize();

        expect((gaIntegration as any).isInitialized).toBe(false);
      });

      it('should detect existing GA script and mark as initialized', async () => {
        // Pre-load a GA script
        const existingScript = document.createElement('script');
        existingScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-EXISTING';
        document.head.appendChild(existingScript);

        const mockState = {
          config: {
            id: 'test-project',
            integrations: {
              google: { measurementId: 'G-XXXXXXXXXX' },
            },
          },
          userId: 'user-123',
        };

        vi.spyOn(gaIntegration as any, 'get').mockImplementation(((key: any) => {
          if (key === 'config') return mockState.config;
          if (key === 'userId') return mockState.userId;
          return undefined;
        }) as any);

        await gaIntegration.initialize();

        expect((gaIntegration as any).isInitialized).toBe(true);
        expect(document.getElementById('tracelog-ga-script')).toBeNull();
      });
    });

    describe('Error Handling', () => {
      it('should handle script loading failure gracefully', async () => {
        // Clear window.gtag and dataLayer for this test
        delete window.gtag;
        delete window.dataLayer;

        const mockState = {
          config: {
            id: 'test-project',
            integrations: {
              google: { measurementId: 'G-XXXXXXXXXX' },
            },
          },
          userId: 'user-123',
        };

        vi.spyOn(gaIntegration as any, 'get').mockImplementation(((key: any) => {
          if (key === 'config') return mockState.config;
          if (key === 'userId') return mockState.userId;
          return undefined;
        }) as any);

        // Mock script loading to fail
        vi.spyOn(gaIntegration as any, 'loadScript').mockRejectedValue(new Error('Script load failed'));

        await gaIntegration.initialize();

        expect((gaIntegration as any).isInitialized).toBe(false);
      });

      it('should not throw when initialization fails', async () => {
        const mockState = {
          config: {
            id: 'test-project',
            integrations: {
              google: { measurementId: 'G-XXXXXXXXXX' },
            },
          },
          userId: 'user-123',
        };

        vi.spyOn(gaIntegration as any, 'get').mockImplementation(((key: any) => {
          if (key === 'config') return mockState.config;
          if (key === 'userId') return mockState.userId;
          return undefined;
        }) as any);

        vi.spyOn(gaIntegration as any, 'loadScript').mockRejectedValue(new Error('Network error'));

        await expect(gaIntegration.initialize()).resolves.not.toThrow();
      });
    });
  });

  describe('trackEvent()', () => {
    beforeEach(async () => {
      const mockState = {
        config: {
          id: 'test-project',
          integrations: {
            google: { measurementId: 'G-XXXXXXXXXX' },
          },
        },
        userId: 'user-123',
      };

      vi.spyOn(gaIntegration as any, 'get').mockImplementation(((key: any) => {
        if (key === 'config') return mockState.config;
        if (key === 'userId') return mockState.userId;
        return undefined;
      }) as any);

      await gaIntegration.initialize();
    });

    describe('Successful Event Tracking', () => {
      it('should track event with object metadata', () => {
        const metadata = { category: 'test', value: 42 };
        gaIntegration.trackEvent('test_event', metadata);

        expect(mockGtag).toHaveBeenCalledWith('event', 'test_event', metadata);
      });

      it('should track event with array metadata wrapped in items', () => {
        const metadata = [{ id: 1 }, { id: 2 }];
        gaIntegration.trackEvent('test_event', metadata);

        expect(mockGtag).toHaveBeenCalledWith('event', 'test_event', { items: metadata });
      });

      it('should track event with empty object metadata', () => {
        gaIntegration.trackEvent('test_event', {});

        expect(mockGtag).toHaveBeenCalledWith('event', 'test_event', {});
      });

      it('should track multiple events sequentially', () => {
        gaIntegration.trackEvent('event_one', { value: 1 });
        gaIntegration.trackEvent('event_two', { value: 2 });

        expect(mockGtag).toHaveBeenCalledTimes(2);
        expect(mockGtag).toHaveBeenNthCalledWith(1, 'event', 'event_one', { value: 1 });
        expect(mockGtag).toHaveBeenNthCalledWith(2, 'event', 'event_two', { value: 2 });
      });

      it('should track event with complex metadata', () => {
        const metadata = {
          category: 'ecommerce',
          action: 'purchase',
          value: 99.99,
          items: ['item1', 'item2'],
        };
        gaIntegration.trackEvent('purchase', metadata);

        expect(mockGtag).toHaveBeenCalledWith('event', 'purchase', metadata);
      });
    });

    describe('Skipped Event Tracking', () => {
      it('should skip if event name is empty', () => {
        gaIntegration.trackEvent('', { value: 1 });
        expect(mockGtag).not.toHaveBeenCalled();
      });

      it('should skip if event name is whitespace-only', () => {
        gaIntegration.trackEvent('   ', { value: 1 });
        expect(mockGtag).not.toHaveBeenCalled();
      });

      it('should skip if not initialized', () => {
        const uninitializedGA = new GoogleAnalyticsIntegration();
        uninitializedGA.trackEvent('test_event', { value: 1 });
        expect(mockGtag).not.toHaveBeenCalled();
      });

      it('should skip if gtag function is not available', () => {
        delete window.gtag;
        gaIntegration.trackEvent('test_event', { value: 1 });
        expect(mockGtag).not.toHaveBeenCalled();
      });

      it('should skip if gtag is not a function', () => {
        window.gtag = 'not-a-function' as any;
        gaIntegration.trackEvent('test_event', { value: 1 });
        expect(mockGtag).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('should handle gtag throwing errors gracefully', () => {
        mockGtag.mockImplementation(() => {
          throw new Error('gtag error');
        });

        expect(() => {
          gaIntegration.trackEvent('test_event', { value: 1 });
        }).not.toThrow();
      });

      it('should not throw when metadata processing fails', () => {
        const circularMetadata: any = { a: 1 };
        circularMetadata.self = circularMetadata;

        expect(() => {
          gaIntegration.trackEvent('test_event', circularMetadata);
        }).not.toThrow();
      });
    });
  });

  describe('cleanup()', () => {
    it('should remove tracelog GA script from DOM', async () => {
      const mockState = {
        config: {
          id: 'test-project',
          integrations: {
            google: { measurementId: 'G-XXXXXXXXXX' },
          },
        },
        userId: 'user-123',
      };

      vi.spyOn(gaIntegration as any, 'get').mockImplementation(((key: any) => {
        if (key === 'config') return mockState.config;
        if (key === 'userId') return mockState.userId;
        return undefined;
      }) as any);

      await gaIntegration.initialize();

      expect(document.getElementById('tracelog-ga-script')).toBeDefined();

      gaIntegration.cleanup();

      expect(document.getElementById('tracelog-ga-script')).toBeNull();
    });

    it('should reset isInitialized flag', async () => {
      const mockState = {
        config: {
          id: 'test-project',
          integrations: {
            google: { measurementId: 'G-XXXXXXXXXX' },
          },
        },
        userId: 'user-123',
      };

      vi.spyOn(gaIntegration as any, 'get').mockImplementation(((key: any) => {
        if (key === 'config') return mockState.config;
        if (key === 'userId') return mockState.userId;
        return undefined;
      }) as any);

      await gaIntegration.initialize();
      expect((gaIntegration as any).isInitialized).toBe(true);

      gaIntegration.cleanup();
      expect((gaIntegration as any).isInitialized).toBe(false);
    });

    it('should not throw when called without initialization', () => {
      expect(() => {
        gaIntegration.cleanup();
      }).not.toThrow();
    });

    it('should be idempotent', async () => {
      const mockState = {
        config: {
          id: 'test-project',
          integrations: {
            google: { measurementId: 'G-XXXXXXXXXX' },
          },
        },
        userId: 'user-123',
      };

      vi.spyOn(gaIntegration as any, 'get').mockImplementation(((key: any) => {
        if (key === 'config') return mockState.config;
        if (key === 'userId') return mockState.userId;
        return undefined;
      }) as any);

      await gaIntegration.initialize();

      gaIntegration.cleanup();
      gaIntegration.cleanup();
      gaIntegration.cleanup();

      expect(document.getElementById('tracelog-ga-script')).toBeNull();
      expect((gaIntegration as any).isInitialized).toBe(false);
    });

    it('should allow re-initialization after cleanup', async () => {
      const mockState = {
        config: {
          id: 'test-project',
          integrations: {
            google: { measurementId: 'G-XXXXXXXXXX' },
          },
        },
        userId: 'user-123',
      };

      vi.spyOn(gaIntegration as any, 'get').mockImplementation(((key: any) => {
        if (key === 'config') return mockState.config;
        if (key === 'userId') return mockState.userId;
        return undefined;
      }) as any);

      await gaIntegration.initialize();
      gaIntegration.cleanup();

      await gaIntegration.initialize();

      expect((gaIntegration as any).isInitialized).toBe(true);
      expect(document.getElementById('tracelog-ga-script')).toBeDefined();
    });
  });

  describe('isScriptAlreadyLoaded() private method', () => {
    it('should detect tracelog GA script', () => {
      const script = document.createElement('script');
      script.id = 'tracelog-ga-script';
      document.head.appendChild(script);

      const result = (gaIntegration as any).isScriptAlreadyLoaded();
      expect(result).toBe(true);
    });

    it('should detect existing GA script from other source', () => {
      const script = document.createElement('script');
      script.src = 'https://www.googletagmanager.com/gtag/js?id=G-EXTERNAL';
      document.head.appendChild(script);

      const result = (gaIntegration as any).isScriptAlreadyLoaded();
      expect(result).toBe(true);
    });

    it('should return false when no GA script is loaded', () => {
      // Clear window.gtag and dataLayer for this test
      delete window.gtag;
      delete window.dataLayer;

      const result = (gaIntegration as any).isScriptAlreadyLoaded();
      expect(result).toBe(false);
    });
  });

  describe('loadScript() private method', () => {
    it('should create script element with correct attributes', async () => {
      const loadPromise = (gaIntegration as any).loadScript('G-TEST123');

      const script = document.getElementById('tracelog-ga-script') as HTMLScriptElement;
      expect(script).toBeDefined();
      expect(script.async).toBe(true);
      expect(script.src).toContain('googletagmanager.com/gtag/js');
      expect(script.src).toContain('G-TEST123');

      // Simulate successful load
      script.dispatchEvent(new Event('load'));
      await loadPromise;
    });

    it('should reject on script load error', async () => {
      const loadPromise = (gaIntegration as any).loadScript('G-TEST123');

      const script = document.getElementById('tracelog-ga-script') as HTMLScriptElement;

      // Simulate error
      script.dispatchEvent(new Event('error'));

      await expect(loadPromise).rejects.toThrow('Failed to load Google Analytics script');
    });

    it('should append script to document head', async () => {
      const initialScriptCount = document.head.querySelectorAll('script').length;

      const loadPromise = (gaIntegration as any).loadScript('G-TEST123');

      expect(document.head.querySelectorAll('script').length).toBe(initialScriptCount + 1);

      const script = document.getElementById('tracelog-ga-script') as HTMLScriptElement;
      script.dispatchEvent(new Event('load'));
      await loadPromise;
    });
  });

  describe('configureGtag() private method', () => {
    it('should inject configuration script into head', () => {
      (gaIntegration as any).configureGtag('G-CONFIG123', 'user-789');

      const scripts = document.head.querySelectorAll('script');
      const configScript = Array.from(scripts).find((s) => s.innerHTML.includes('gtag'));

      expect(configScript).toBeDefined();
    });

    it('should include measurementId in config', () => {
      (gaIntegration as any).configureGtag('G-MEASURE456', 'user-789');

      const scripts = document.head.querySelectorAll('script');
      const configScript = Array.from(scripts).find((s) => s.innerHTML.includes('gtag'));

      expect(configScript?.innerHTML).toContain('G-MEASURE456');
    });

    it('should include userId in config', () => {
      (gaIntegration as any).configureGtag('G-CONFIG123', 'user-custom-id');

      const scripts = document.head.querySelectorAll('script');
      const configScript = Array.from(scripts).find((s) => s.innerHTML.includes('gtag'));

      expect(configScript?.innerHTML).toContain('user-custom-id');
    });

    it('should initialize dataLayer', () => {
      (gaIntegration as any).configureGtag('G-CONFIG123', 'user-789');

      const scripts = document.head.querySelectorAll('script');
      const configScript = Array.from(scripts).find((s) => s.innerHTML.includes('dataLayer'));

      expect(configScript?.innerHTML).toContain('window.dataLayer');
      expect(configScript?.innerHTML).toContain('dataLayer.push');
    });
  });
});
