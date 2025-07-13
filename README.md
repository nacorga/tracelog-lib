# TraceLog client

TraceLog is a powerful analytics library for tracking user interactions across your web applications.

## Important Note

To use TraceLog properly, you need to have an account created at [tracelog.io](https://tracelog.io). The account is required to access the dashboard and manage your tracking data.

## Features

- **🚀 Lightweight**: Minimal bundle size with tree-shaking support
- **🔒 Privacy-First**: Built with user privacy and GDPR compliance in mind
- **⚡ High Performance**: Optimized for speed with minimal overhead
- **🛡️ Type Safe**: Full TypeScript support with comprehensive type definitions
- **📱 Cross-Platform**: Works on all modern browsers and devices
- **🎯 Simple API**: Easy-to-use interface with just two main methods
- **⚙️ Configurable**: Flexible configuration options for different use cases
- **🔄 Automatic Tracking**: Built-in session management and activity detection
- **📊 Rich Data**: Comprehensive event data with metadata support

## Getting Started

### 1. Installation

```bash
# Using npm
npm install @tracelog/client

# Using yarn
yarn add @tracelog/client

# Using pnpm
pnpm add @tracelog/client
```

### 2. Subdomain Configuration

To ensure the tracking system works correctly and avoid blocks from browsers (Brave, Safari, etc.) or extensions (uBlock, AdBlock), **each client must create their own subdomain based on an unique TraceLog ID** from which to load the script and send events to the middleware. The subdomain must be part of the same domain where the application is hosted and where events are being collected.

#### DNS Configuration
Create a CNAME DNS record with the following configuration:

```bash
Host:    YOUR_TRACELOG_ID
Type:    CNAME
Value:   mdw.tracelog.io
```

This will create the subdomain that points to our middleware service.

## Quick Start

```javascript
import { startTracking, sendCustomEvent } from '@tracelog/client';

// Initialize tracking
startTracking('your-tracking-id', {
  sessionTimeout: 300000, // 5 minutes
  globalMetadata: {
    version: '1.0.0',
    environment: 'production'
  }
});

// Send custom events
sendCustomEvent('button_click', {
  buttonId: 'subscribe-btn',
  section: 'hero',
  timestamp: Date.now()
});
```

## API Reference

### Core Methods

#### `startTracking(id: string, config?: TracelogAppConfig): void`

Initializes the tracking system with the provided configuration.

**Parameters:**
- `id` (string): Your unique tracking identifier
- `config` (TracelogAppConfig, optional): Configuration options

#### `sendCustomEvent(name: string, metadata?: Record<string, MetadataType>): void`

Sends a custom event with optional metadata.

**Parameters:**
- `name` (string): Event name identifier
- `metadata` (Record<string, MetadataType>, optional): Additional event data

For detailed API documentation, see [API.md](./API.md).

## Configuration

```typescript
interface TracelogAppConfig {
  sessionTimeout?: number;                    // Session timeout in milliseconds (default: 15 minutes)
  globalMetadata?: Record<string, MetadataType>; // Global metadata for all events
  scrollContainerSelectors?: string | string[]; // Custom scroll containers
}
```

## Browser Compatibility

The TraceLog client supports all modern browsers:

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Performance

- **Bundle Size**: ~15KB minified and gzipped
- **Memory Usage**: < 1MB RAM overhead
- **CPU Impact**: < 0.1% on average devices
- **Network**: Batched requests with automatic optimization

## Privacy & Security

- **No PII Collection**: Does not collect personally identifiable information by default
- **Data Minimization**: Only collects essential interaction data
- **Secure Transmission**: All data encrypted in transit
- **Configurable**: Full control over what data is collected
- **GDPR Compliant**: Built with privacy regulations in mind

## Examples

For comprehensive examples and use cases, see [EXAMPLES.md](./EXAMPLES.md).

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

## Support

- **Documentation**: [Full Documentation](./API.md)
- **Issues**: [GitHub Issues](https://github.com/nacorga/tracelog-script/issues)
- **Discussions**: [GitHub Discussions](https://github.com/nacorga/tracelog-script/discussions)
