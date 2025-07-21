Welcome to **TraceLog**, a web analytics platform that combines user behavior tracking with AI to provide deeper insights than traditional tools.

This quick-start guide covers everything you need to integrate TraceLog into your project in minutes.

## 🔑 Before you begin

To fully leverage TraceLog, ensure you have:

* ✅ An account at [tracelog.io](https://tracelog.io) to access your dashboard and manage data.
* ✅ Your unique TraceLog ID, available in your account after registration.

## 📦 Installation

Add the TraceLog client to your project using your favorite package manager:

```bash
npm install @tracelog/client

# or

yarn add @tracelog/client

# or

pnpm add @tracelog/client
```

## 🌐 Subdomain Setup (Important!)

Modern browsers and ad blockers (Safari, Brave, uBlock, etc.) might restrict cross-origin tracking scripts. To avoid these issues, **set up your own dedicated subdomain using your TraceLog ID**.

### 🔧 DNS Configuration

Create a `CNAME` record in your DNS settings:

| Host               | Type  | Value             |
| ------------------ | ----- | ----------------- |
| `YOUR_TRACELOG_ID` | CNAME | `mdw.tracelog.io` |

Replace `YOUR_TRACELOG_ID` with your actual ID from your TraceLog account.
This ensures seamless tracking across browsers.

## 🔀 Send events to your own server

If you prefer to store analytics data on your infrastructure, provide a custom
endpoint when initializing TraceLog:

```javascript
TraceLog.init('your-tracking-id', {
  customApiUrl: 'https://analytics.example.com/tracelog',
  // When using a custom URL, supply your own API config
  apiConfig: {
    samplingRate: 1,
    qaMode: false,
  },
  // Optionally fetch API config from your backend
  customApiConfigUrl: 'https://analytics.example.com/tracelog/config',
});
```

All events will be POSTed directly to this URL instead of TraceLog's servers.
If `customApiConfigUrl` is supplied, TraceLog will load API configuration from
that endpoint so you can change settings dynamically. Otherwise, remote
configuration is skipped and you must manage `apiConfig` values yourself.


## 🎯 Quick Integration Example

Initialize TraceLog in your app and start tracking immediately:

```javascript
import { TraceLog } from '@tracelog/client';

// Initialize tracking
TraceLog.init('your-tracking-id', {
  sessionTimeout: 300000, // Session timeout (e.g., 5 minutes)
  globalMetadata: {
    version: '1.0.0',
    environment: 'production'
  }
});

// Send your first custom event
TraceLog.event('button_click', {
  buttonId: 'subscribe-btn',
  section: 'hero'
});
```

That's it! 🎉 You're now tracking events in your application.


## 📖 What's Next?

Dive deeper into TraceLog:

* [Detailed API Reference](https://www.tracelog.io/docs?guide=api)
* [Advanced Configuration](https://www.tracelog.io/docs?guide=advanced-configuration)
* [Best Practices](https://www.tracelog.io/docs?guide=best-practices)
