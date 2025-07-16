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
import { TraceLog } from '@tracelog/client';

// Initialize tracking
TraceLog.init('your-tracking-id', {
  sessionTimeout: 300000, // 5 minutes
  globalMetadata: {
    version: '1.0.0',
    environment: 'production'
  }
});

// Send custom events
TraceLog.event('button_click', {
  buttonId: 'subscribe-btn',
  section: 'hero',
  timestamp: Date.now()
});
```

## API Reference

### Core Methods

#### `TraceLog.init(id: string, config?: TracelogAppConfig): void`

Initializes the tracking system with the provided configuration.

**Parameters:**
- `id` (string): Your unique tracking identifier
- `config` (TracelogAppConfig, optional): Configuration options

#### `TraceLog.event(name: string, metadata?: Record<string, MetadataType>): void`

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

### Core Metrics
- **Bundle Size**: ~15KB minified and gzipped
- **Initialization**: 0.80ms startup time

### Advanced Performance  
- **Event Throughput**: 1,000,000+ events/second
- **Storage Operations**: 100,000+ ops/second
- **Event Latency**: 0.005ms average per event

### Network Optimization
- **Batched requests** with automatic optimization
- **Queue management** with intelligent retry logic
- **Compression** and payload optimization

## Privacy & Security

- **No PII Collection**: Does not collect personally identifiable information by default
- **Data Minimization**: Only collects essential interaction data
- **Secure Transmission**: All data encrypted in transit
- **Configurable**: Full control over what data is collected
- **GDPR Compliant**: Built with privacy regulations in mind

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Performance Verification

All performance metrics are automatically verified through comprehensive benchmarking:

```bash
# Run complete performance analysis
npm run benchmark

# Test only specific aspects
npm run benchmark:size          # Bundle size analysis  
npm run benchmark:performance   # Runtime performance tests
```

### Benchmark Features

- **📦 Bundle Analysis**: Multi-format size measurement (ESM, CJS, Browser)
- **⚡ Performance Testing**: Real browser automation with Puppeteer  
- **🧠 Memory Profiling**: Heap usage analysis and leak detection
- **💾 Storage Benchmarks**: LocalStorage I/O performance measurement
- **🚀 Throughput Testing**: Burst event handling and scalability
- **📊 Detailed Reports**: Automated markdown reports with historical data

Results are saved to `BENCHMARK.md` and `benchmark-results.json` for tracking performance over time.

---

## Support

- **Documentation**: [Full Documentation](./API.md)
- **Issues**: [GitHub Issues](https://github.com/nacorga/tracelog-script/issues)
- **Discussions**: [GitHub Discussions](https://github.com/nacorga/tracelog-script/discussions)
