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

If you prefer to store analytics data on your own infrastructure, you can configure TraceLog to send events to a custom endpoint.

```javascript
TraceLog.init('your-tracking-id', {
  customApiUrl: 'https://analytics.example.com/tracelog',
  // Optionally load tracking config from your backend
  customApiConfigUrl: 'https://analytics.example.com/tracelog/config',
  // Or provide config manually
  apiConfig: {
    samplingRate: 1,
    qaMode: false,
    excludedUrlPaths: ['/admin', '/debug'],
  }
});
```

### How It Works
- All events will be POSTed directly to `customApiUrl` instead of TraceLog’s servers.
- If `customApiConfigUrl` is provided, the SDK will fetch configuration from that URL once on initialization.
- If `customApiConfigUrl` is omitted, the SDK will use the static apiConfig provided.

### Limitations in Custom Mode
- Configuration options managed from the TraceLog platform — such as tags, dashboards, or AI reports — are not available in this mode.
- You are fully responsible for handling data, applying config, and managing downstream processing on your server.

### Notes
- When using this mode, TraceLog does not store or process any data.
- If no valid config is provided, the SDK falls back to safe defaults: `samplingRate = 1`, `qaMode = false`, and no `excludedUrlPaths`.
- If you provide endpoints with the `http` protocol, set `allowHttp: true` to explicitly permit them. This helps avoid accidental insecure traffic in production environments.

### Common Issues When Using Custom APIs
- **CORS errors** – If your custom endpoints are on a different domain, make sure they send the proper `Access-Control-Allow-Origin` headers so browsers allow the requests.
- **Invalid or unreachable URLs** – Double-check that `customApiUrl` and `customApiConfigUrl` are correct and that your server is running.
- **Insecure protocol blocked** – When your site uses HTTPS, requests to an `http` endpoint will fail unless `allowHttp: true` is set.
- **Malformed config** – Ensure `customApiConfigUrl` returns valid JSON; otherwise the SDK falls back to defaults.

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
