# TraceLog Client

**TraceLog** is a web analytics platform that combines user behavior tracking with AI to provide deeper insights than traditional tools.

This guide will help you integrate TraceLog into your project in just a few minutes.

## 📦 Installation

```bash
npm install @tracelog/client
```

## 🚀 Quick Start

### 1. Sign Up and Get Your Project ID
- Sign up at [tracelog.io](https://tracelog.io)
- Get your Project ID from the dashboard

### 2. Set Up Your Custom Subdomain
Create a CNAME record in your DNS settings:

| Host               | Type  | Value             |
| ------------------ | ----- | ----------------- |
| `YOUR_TRACELOG_ID` | CNAME | `mdw.tracelog.io` |

Replace `YOUR_TRACELOG_ID` with your actual Project ID.

### 3. Initialize TraceLog

**Basic setup:**
```javascript
import { TraceLog } from '@tracelog/client';

await TraceLog.init({
  id: 'your-project-id'
});

// Send custom events
TraceLog.event('button_click', { buttonId: 'subscribe-btn' });
```

## ⚙️ Configuration Options

```javascript
await TraceLog.init({
  id: 'your-project-id',
  
  // Session timeout (default: 15 minutes)
  sessionTimeout: 900000,
  
  // Data added to every event
  globalMetadata: {
    version: '1.2.0',
    environment: 'production'
  },
  
  // Track scrolling in specific containers
  scrollContainerSelectors: ['.main-content', '#sidebar'],
  
  // Remove sensitive data from URLs
  sensitiveQueryParams: ['token', 'password'],
  
  // Third-party integration
  integrations: {
    googleAnalytics: {
      measurementId: 'G-XXXXXXXXXX'
    }
  }
});
```

## 📊 Automatic Tracking

TraceLog automatically captures:
- **Page visits** - Navigation between pages
- **Clicks** - Button and link interactions  
- **Scrolling** - Scroll depth and engagement
- **Sessions** - User session start/end

## 🎯 Custom Events

```javascript
// Simple event
TraceLog.event('user_signup');

// Event with data
TraceLog.event('purchase', {
  product: 'premium_plan',
  price: 29.99,
  currency: 'USD'
});
```

## 🧹 Cleanup

```javascript
// Clean up when done (e.g., user logout)
TraceLog.destroy();
```

## 📖 Documentation

* [API Reference](https://www.tracelog.io/docs/api)
* [Advanced Configuration](https://www.tracelog.io/docs/advanced-configuration)  
* [Best Practices](https://www.tracelog.io/docs/best-practices)