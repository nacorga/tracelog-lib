Welcome to **TraceLog**, a web analytics platform that combines user behavior tracking with AI to provide deeper insights than traditional tools.

This quick-start guide covers everything you need to integrate TraceLog into your project in minutes.

## 🔀 Choose Your Setup Mode

### 🌐 **Option A: Managed** (Recommended)
Dashboard, AI insights, easy setup. Data processed by TraceLog.

## 📦 Installation

```bash
npm install @tracelog/client
```

## 🌐 Option A: Managed

1. Sign up at [tracelog.io](https://tracelog.io)
2. Get your Project ID from your dashboard

```javascript
import { TraceLog } from '@tracelog/client';

TraceLog.init({
  id: 'your-project-id' // Your Project ID from tracelog.io
});

TraceLog.event('button_click', { buttonId: 'subscribe-btn' });
```

### Optional: Set Up a Custom Subdomain for Browser Compatibility

To prevent browser restrictions, it’s highly recommended to create a CNAME record in your DNS settings:

| Host               | Type  | Value             |
| ------------------ | ----- | ----------------- |
| `YOUR_TRACELOG_ID` | CNAME | `mdw.tracelog.io` |

Replace `YOUR_TRACELOG_ID` with the ID provided in your TraceLog account. This setup helps ensure reliable event tracking across all browsers.


---

## 📖 Documentation

* [API Reference](https://www.tracelog.io/docs/api)
* [Advanced Configuration](https://www.tracelog.io/docs/advanced-configuration)  
* [Best Practices](https://www.tracelog.io/docs/best-practices)
