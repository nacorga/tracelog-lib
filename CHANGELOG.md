# Changelog

All notable changes to the TraceLog client will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Enhanced type safety improvements
- Additional framework integrations
- Performance monitoring features

## [2.0.4] - 2024-07-11

### 🔧 Fixed
- **Memory Leaks**: Resolved memory leaks in event listeners and timers
- **Performance**: Improved performance with optimized debouncing and throttling
- **Security**: Enhanced data validation and XSS prevention
- **Race Conditions**: Fixed race conditions in initialization sequence
- **Storage**: Optimized localStorage usage and error handling
- **Error Handling**: Improved error handling and logging throughout the TraceLog client
- **Type Safety**: Enhanced TypeScript support with better runtime validation
- **Bundle Size**: Optimized bundle size with improved tree-shaking

### 🚀 Added
- Memory management system with automatic cleanup
- Performance optimizations for scroll and event handling
- Enhanced security with input sanitization
- Improved initialization state management
- Better error reporting and debugging tools

### 📦 Changed
- Simplified public API to only include `startTracking` and `sendCustomEvent`
- Improved internal architecture for better maintainability
- Enhanced documentation with comprehensive guides

### 🗑️ Removed
- Deprecated methods and legacy API endpoints
- Unnecessary dependencies and dead code
- Complex tag management system (temporarily disabled)

## [2.0.3] - 2024-03-15

### 🔧 Fixed
- Fixed coordinate precision in click tracking
- Resolved URL validation edge cases
- Improved element attribute extraction

### 🚀 Added
- Support for custom scroll container selectors
- Enhanced click data with accessibility attributes
- Improved error handling in data sanitization

### 📦 Changed
- Updated default session timeout to 15 minutes
- Improved event deduplication algorithm
- Enhanced metadata validation

## [2.0.2] - 2024-02-28

### 🔧 Fixed
- Fixed session management bugs
- Resolved TypeScript definition issues
- Improved browser compatibility

### 🚀 Added
- Global metadata support
- Enhanced device detection
- Improved UTM parameter tracking

### 📦 Changed
- Optimized event queue management
- Improved API error handling
- Enhanced documentation

## [2.0.1] - 2024-02-10

### 🔧 Fixed
- Fixed build configuration issues
- Resolved module resolution problems
- Improved error handling in edge cases

### 📦 Changed
- Updated package configuration
- Improved TypeScript definitions
- Enhanced browser support

## [2.0.0] - 2024-01-25

### 🚀 Major Release

This is a major rewrite of the TraceLog client focusing on simplicity, performance, and privacy.

#### 🎯 New Features
- **Simplified API**: Reduced to just two main methods: `startTracking` and `sendCustomEvent`
- **TypeScript First**: Complete TypeScript rewrite with full type safety
- **Performance Optimized**: Minimal bundle size (~15KB gzipped) with maximum performance
- **Privacy Focused**: Built with GDPR compliance and user privacy in mind
- **Framework Agnostic**: Works with React, Vue, Angular, and vanilla JavaScript

#### 🏗️ Architecture
- **Modular Design**: Clean separation of concerns with modules
- **Event System**: Comprehensive event tracking (clicks, scrolls, sessions)
- **Session Management**: Robust session handling with timeout management
- **Data Validation**: Strong input validation and sanitization
- **Error Handling**: Graceful error handling that never breaks user applications

#### 📊 Tracking Capabilities
- **Automatic Events**: Page views, clicks, scrolls, session events
- **Custom Events**: Flexible custom event tracking with metadata
- **User Sessions**: Intelligent session management and user identification
- **Device Detection**: Automatic device type detection
- **UTM Tracking**: Built-in UTM parameter capture

#### 🔒 Privacy & Security
- **No PII by Default**: Doesn't collect personally identifiable information
- **Data Minimization**: Only collects essential interaction data
- **Input Sanitization**: Comprehensive XSS prevention and data cleaning
- **Secure Transport**: All data encrypted in transit

#### ⚡ Performance
- **Tree Shaking**: Full ES modules support for optimal bundling
- **Lazy Loading**: Components loaded on demand
- **Efficient Batching**: Events batched for optimal network usage
- **Memory Management**: Automatic cleanup and memory leak prevention

### 💔 Breaking Changes
- **API Redesign**: Complete API rewrite - migration guide available
- **Configuration**: New configuration format and options
- **Dependencies**: Removed external dependencies for better security
- **Browser Support**: Minimum browser requirements updated

### 📚 Documentation
- **Complete Rewrite**: Comprehensive documentation with examples
- **Framework Guides**: Specific integration guides for popular frameworks
- **Migration Guide**: Step-by-step migration from v1.x
- **API Reference**: Detailed API documentation with TypeScript definitions

### 🔧 Development
- **Build System**: Modern build pipeline with TypeScript
- **Testing**: Comprehensive testing strategy
- **CI/CD**: Automated testing and deployment
- **Code Quality**: Strict linting and code formatting

## [1.x] - Legacy Versions

### [1.9.x] - Feature Complete Legacy

The 1.x series was the original implementation of the TraceLog client. While functional, it had several limitations that led to the 2.0 rewrite:

#### Issues Addressed in 2.0
- **Bundle Size**: 1.x was significantly larger (~50KB+)
- **Complexity**: Overly complex API with many methods
- **Performance**: Memory leaks and performance issues
- **TypeScript**: Limited TypeScript support
- **Privacy**: Less focus on privacy and data minimization

#### Migration from 1.x

If you're upgrading from 1.x, please see our [Migration Guide](./MIGRATION.md) for detailed instructions.

**Quick Migration Overview:**

```javascript
// 1.x (deprecated)
import TraceLog from '@tracelog/client';

const tracker = new TraceLog('your-id');
tracker.track('event_name', { data: 'value' });
tracker.pageView();
tracker.startSession();

// 2.0+ (current)
import { startTracking, sendCustomEvent } from '@tracelog/client';

startTracking('your-id');
sendCustomEvent('event_name', { data: 'value' });
// pageView and sessions are automatic
```

## Version Support

| Version | Status | Support Until | Notes |
|---------|--------|---------------|-------|
| 2.0.x | Active | Current | Current stable version |
| 1.9.x | Security Only | 2024-12-31 | Critical security fixes only |
| 1.8.x | End of Life | 2024-06-30 | No longer supported |

## Security

If you discover a security vulnerability, please send an email to security@tracelog.io instead of using the issue tracker.

## Support

- **Documentation**: [Full documentation](./README.md)
- **Issues**: [GitHub Issues](https://github.com/nacorga/tracelog-script/issues)
- **Discussions**: [GitHub Discussions](https://github.com/nacorga/tracelog-script/discussions)

---

## Types of Changes

- **🚀 Added** for new features
- **📦 Changed** for changes in existing functionality
- **🗑️ Deprecated** for soon-to-be removed features
- **🗑️ Removed** for now removed features
- **🔧 Fixed** for any bug fixes
- **🔒 Security** for vulnerability fixes 