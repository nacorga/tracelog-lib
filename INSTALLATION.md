# Installation Guide

Complete installation and setup guide for the TraceLog client.

## Table of Contents

- [Package Installation](#package-installation)
- [Framework Setup](#framework-setup)
- [Build Configuration](#build-configuration)
- [Environment Setup](#environment-setup)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

## Package Installation

### npm

```bash
npm install @tracelog/client
```

### Yarn

```bash
yarn add @tracelog/client
```

### pnpm

```bash
pnpm add @tracelog/client
```

### CDN (Browser)

```html
<!-- ES Modules -->
<script type="module">
  import { startTracking, sendCustomEvent } from 'https://cdn.jsdelivr.net/npm/@tracelog/client@latest/dist/esm/public-api.js';
  
  startTracking('your-tracking-id');
</script>

<!-- UMD (Legacy browsers) -->
<script src="https://cdn.jsdelivr.net/npm/@tracelog/client@latest/dist/cjs/public-api.js"></script>
<script>
  const { startTracking, sendCustomEvent } = TraceLog;
  startTracking('your-tracking-id');
</script>
```

## Framework Setup

### React

#### Basic Setup

```bash
npm install @tracelog/client
```

```jsx
// src/tracking.js
import { startTracking } from '@tracelog/client';

export const initializeTracking = () => {
  startTracking('your-tracking-id', {
    globalMetadata: {
      framework: 'react',
      version: process.env.REACT_APP_VERSION
    }
  });
};

// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializeTracking } from './tracking';

// Initialize tracking early
initializeTracking();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```

#### With Create React App

Create React App supports ES modules out of the box:

```jsx
// src/hooks/useTracking.js
import { useState, useEffect } from 'react';
import { startTracking, sendCustomEvent } from '@tracelog/client';

export const useTracking = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      startTracking(process.env.REACT_APP_TRACKING_ID, {
        globalMetadata: {
          environment: process.env.NODE_ENV
        }
      });
      setIsInitialized(true);
    }
  }, [isInitialized]);

  return {
    trackEvent: sendCustomEvent,
    isInitialized
  };
};
```

### Vue.js

#### Vue 3

```bash
npm install @tracelog/client
```

```javascript
// src/plugins/tracking.js
import { startTracking, sendCustomEvent } from '@tracelog/client';

export default {
  install(app, options) {
    const { trackingId, config = {} } = options;
    
    startTracking(trackingId, {
      ...config,
      globalMetadata: {
        framework: 'vue',
        version: '3',
        ...config.globalMetadata
      }
    });

    app.config.globalProperties.$track = sendCustomEvent;
    app.provide('tracking', {
      track: sendCustomEvent
    });
  }
};

// src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import trackingPlugin from './plugins/tracking';

const app = createApp(App);

app.use(trackingPlugin, {
  trackingId: import.meta.env.VITE_TRACKING_ID,
  config: {
    globalMetadata: {
      environment: import.meta.env.MODE
    }
  }
});

app.mount('#app');
```

#### Vue 2

```javascript
// src/plugins/tracking.js
import Vue from 'vue';
import { startTracking, sendCustomEvent } from '@tracelog/client';

const TrackingPlugin = {
  install(Vue, options) {
    startTracking(options.trackingId, options.config);
    
    Vue.prototype.$track = sendCustomEvent;
  }
};

Vue.use(TrackingPlugin, {
  trackingId: process.env.VUE_APP_TRACKING_ID
});

export default TrackingPlugin;
```

### Angular

#### Installation

```bash
npm install @tracelog/client
```

#### Service Setup

```typescript
// src/app/services/tracking.service.ts
import { Injectable } from '@angular/core';
import { startTracking, sendCustomEvent } from '@tracelog/client';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TrackingService {
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (!this.initialized && typeof window !== 'undefined') {
      startTracking(environment.trackingId, {
        globalMetadata: {
          framework: 'angular',
          environment: environment.production ? 'production' : 'development'
        }
      });
      this.initialized = true;
    }
  }

  track(eventName: string, metadata?: Record<string, any>): void {
    sendCustomEvent(eventName, metadata);
  }
}

// src/environments/environment.ts
export const environment = {
  production: false,
  trackingId: 'your-dev-tracking-id'
};

// src/environments/environment.prod.ts
export const environment = {
  production: true,
  trackingId: 'your-prod-tracking-id'
};
```

#### App Module

```typescript
// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { TrackingService } from './services/tracking.service';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  providers: [TrackingService],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(private tracking: TrackingService) {
    // Service initializes automatically
  }
}
```

### Svelte

```bash
npm install @tracelog/client
```

```javascript
// src/lib/tracking.js
import { startTracking, sendCustomEvent } from '@tracelog/client';
import { browser } from '$app/environment';

export const initTracking = () => {
  if (browser) {
    startTracking(import.meta.env.VITE_TRACKING_ID, {
      globalMetadata: {
        framework: 'svelte'
      }
    });
  }
};

export const track = sendCustomEvent;

// src/app.html or src/hooks.client.js
import { initTracking } from '$lib/tracking';

initTracking();
```

### Next.js

#### App Directory (Next.js 13+)

```bash
npm install @tracelog/client
```

```tsx
// app/providers.tsx
'use client';

import { useEffect } from 'react';
import { startTracking } from '@tracelog/client';

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    startTracking(process.env.NEXT_PUBLIC_TRACKING_ID!, {
      globalMetadata: {
        framework: 'nextjs',
        environment: process.env.NODE_ENV
      }
    });
  }, []);

  return <>{children}</>;
}

// app/layout.tsx
import { TrackingProvider } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TrackingProvider>
          {children}
        </TrackingProvider>
      </body>
    </html>
  );
}
```

#### Pages Directory

```tsx
// pages/_app.tsx
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { startTracking } from '@tracelog/client';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    startTracking(process.env.NEXT_PUBLIC_TRACKING_ID!, {
      globalMetadata: {
        framework: 'nextjs'
      }
    });
  }, []);

  return <Component {...pageProps} />;
}
```

### Nuxt.js

```bash
npm install @tracelog/client
```

```javascript
// plugins/tracking.client.js
import { startTracking } from '@tracelog/client';

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  
  startTracking(config.public.trackingId, {
    globalMetadata: {
      framework: 'nuxt',
      environment: process.env.NODE_ENV
    }
  });
});

// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      trackingId: process.env.NUXT_PUBLIC_TRACKING_ID
    }
  }
});
```

## Build Configuration

### Webpack

The TraceLog client supports tree-shaking out of the box. No special configuration needed.

```javascript
// webpack.config.js
module.exports = {
  // ... your config
  optimization: {
    usedExports: true,
    sideEffects: false
  }
};
```

### Rollup

```javascript
// rollup.config.js
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

export default {
  // ... your config
  plugins: [
    nodeResolve(),
    terser() // Will tree-shake unused code
  ]
};
```

### Vite

Vite handles the TraceLog client automatically:

```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  // ... your config
  build: {
    rollupOptions: {
      // The client will be tree-shaken automatically
    }
  }
});
```

### TypeScript

If using TypeScript, the TraceLog client includes type definitions:

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

## Environment Setup

### Environment Variables

Create appropriate environment variables for your setup:

#### React (.env)

```bash
REACT_APP_TRACKING_ID=your-tracking-id-here
REACT_APP_TRACKING_ENV=development
```

#### Vue (.env)

```bash
VITE_TRACKING_ID=your-tracking-id-here
VITE_TRACKING_ENV=development
```

#### Angular (environment.ts)

```typescript
export const environment = {
  production: false,
  trackingId: 'your-dev-tracking-id'
};
```

#### Next.js (.env.local)

```bash
NEXT_PUBLIC_TRACKING_ID=your-tracking-id-here
```

### Production vs Development

Different tracking IDs for different environments:

```javascript
const trackingId = process.env.NODE_ENV === 'production' 
  ? 'prod-tracking-id' 
  : 'dev-tracking-id';

startTracking(trackingId, {
  globalMetadata: {
    environment: process.env.NODE_ENV
  }
});
```

## Verification

### Check Installation

Verify the TraceLog client is installed correctly:

```bash
npm list @tracelog/client
```

### Basic Test

Create a simple test to verify functionality:

```javascript
// test-tracking.js
import { startTracking, sendCustomEvent } from '@tracelog/client';

// Initialize
startTracking('test-id');

// Send test event
sendCustomEvent('test_event', {
  test: true,
  timestamp: Date.now()
});

console.log('TraceLog client test completed');
```

### Development Console

In development, events are logged to console:

```javascript
startTracking('your-id', {
  // Events will appear in browser console in development
});

sendCustomEvent('test', { data: 'value' });
// Console output: [TraceLog] custom event: { name: 'test', metadata: { data: 'value' } }
```

## Troubleshooting

### Common Issues

#### Module Not Found

```bash
Error: Cannot find module '@tracelog/client'
```

**Solution**: Ensure the package is installed:
```bash
npm install @tracelog/client
```

#### TypeScript Errors

```typescript
// Cannot find module '@tracelog/client' or its corresponding type declarations
```

**Solution**: The TraceLog client includes TypeScript definitions. If you're still getting errors:

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Build Errors in SSR

```bash
ReferenceError: window is not defined
```

**Solution**: Ensure tracking only runs on the client:

```javascript
// React/Next.js
useEffect(() => {
  startTracking('your-id');
}, []);

// Vue/Nuxt
if (process.client) {
  startTracking('your-id');
}

// Generic
if (typeof window !== 'undefined') {
  startTracking('your-id');
}
```

#### Bundle Size Issues

If the TraceLog client seems too large:

1. Check tree-shaking is enabled
2. Import only what you need:
   ```javascript
   import { startTracking, sendCustomEvent } from '@tracelog/client';
   ```
3. Verify your bundler configuration

#### Events Not Appearing

1. Check tracking ID is correct
2. Verify network requests in DevTools
3. Ensure `sendCustomEvent` is called after `startTracking`
4. Check browser console for errors

### Getting Help

If you encounter issues:

1. Check the [API documentation](./API.md)
2. Review [examples](./EXAMPLES.md)
3. Open an issue on [GitHub](https://github.com/nacorga/tracelog-script/issues)

### Performance Optimization

For optimal performance:

```javascript
// Initialize early but don't block rendering
setTimeout(() => {
  startTracking('your-id');
}, 0);

// Or use requestIdleCallback if available
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => startTracking('your-id'));
} else {
  setTimeout(() => startTracking('your-id'), 0);
}
``` 