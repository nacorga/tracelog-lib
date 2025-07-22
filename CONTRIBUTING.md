# Contributing to the TraceLog client

Thank you for your interest in contributing to the TraceLog client! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Style](#code-style)
- [Submitting Changes](#submitting-changes)
- [Issue Reporting](#issue-reporting)
- [Feature Requests](#feature-requests)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and professional in all interactions.

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Git
- TypeScript knowledge
- Basic understanding of web analytics and tracking

### First Contribution

1. Fork the repository
2. Clone your fork locally
3. Create a feature branch
4. Make your changes
5. Test your changes
6. Submit a pull request

## Development Setup

### Clone and Install

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/tracelog-script.git
cd tracelog-script

# Install dependencies
npm install
```

### Available Scripts

```bash
# Build the project
npm run build

# Build for both ESM and CJS
npm run build:all

# Format code
npm run format

# Create a release
npm run release

# RC version management
npm run rc:list
npm run rc:cleanup
```

### Environment Setup

Create a `.env` file for local development:

```bash
# .env.local
NODE_ENV=development
TRACKING_ID=dev-test-id
```

## Project Structure

```
tracelog-script/
├── src/                    # Source code
│   ├── constants.ts        # Configuration constants
│   ├── types.ts           # TypeScript type definitions
│   ├── public-api.ts      # Main public API
│   ├── tracking.ts        # Core tracking class
│   ├── core/              # Core functionality
│   ├── events/            # Event handling modules
│   ├── modules/           # Core business logic modules
│   └── utils/             # Utility functions
├── dist/                  # Built output
├── doc/                   # Documentation
├── scripts/               # Build and utility scripts
└── tsconfig*.json         # TypeScript configurations
```

### Key Files

- **`src/public-api.ts`**: Main entry point, exports public API
- **`src/tracking.ts`**: Core tracking implementation
- **`src/types.ts`**: All TypeScript interfaces and types
- **`src/constants.ts`**: Configuration constants and defaults

## Development Workflow

### Branch Naming

Use descriptive branch names with prefixes:

```bash
# Feature branches
feature/add-new-event-type
feature/improve-error-handling

# Bug fixes
fix/memory-leak-in-session-handler
fix/typescript-definitions

# Documentation
docs/update-api-reference
docs/add-contributing-guide

# Refactoring
refactor/simplify-event-manager
refactor/optimize-bundle-size
```

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```bash
# Format
<type>[optional scope]: <description>

# Examples
feat: add support for custom scroll containers
fix: resolve memory leak in event listeners
docs: update API documentation
refactor: simplify session management
perf: optimize event queue processing
test: add unit tests for sanitization
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

## Testing

### Manual Testing

Create test files to verify functionality:

```javascript
// test-example.js
import { TraceLog } from './dist/cjs/public-api';

// Test basic functionality
TraceLog.init({
  id: 'test-id',
  globalMetadata: { test: true }
});

TraceLog.event('test_event', {
  action: 'manual_test',
  timestamp: Date.now()
});

console.log('✅ Manual test completed');
```

Run tests:

```bash
node test-example.js
```

### Browser Testing

Test in different browsers and environments:

1. Chrome (latest)
2. Firefox (latest)
3. Safari (latest)
4. Edge (latest)

### Performance Testing

Monitor performance metrics:

```javascript
// Performance test
console.time('client-initialization');
TraceLog.init({ id: 'perf-test' });
console.timeEnd('client-initialization');

console.time('event-sending');
TraceLog.event('perf_test', { data: 'test' });
console.timeEnd('event-sending');
```

## Code Style

### TypeScript Guidelines

- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use branded types for IDs and validated data
- Include JSDoc comments for public APIs

```typescript
// Good
interface EventData {
  readonly id: string;
  readonly timestamp: number;
  readonly metadata?: Record<string, MetadataType>;
}

/**
 * Sends a custom tracking event
 * @param name - Event name identifier
 * @param metadata - Optional event metadata
 */
export function TraceLog.event(name: string, metadata?: Record<string, MetadataType>): void;

// Avoid
type EventData = {
  id: string;
  timestamp: number;
  metadata?: any;
}
```

### Code Organization

- Keep functions small and focused
- Use descriptive variable and function names
- Separate concerns into different modules
- Prefer composition over inheritance

### Error Handling

- Handle errors gracefully without breaking user apps
- Log errors in development/QA mode
- Provide meaningful error messages
- Use try-catch blocks for critical operations

```typescript
// Good
try {
  const result = riskyOperation();
  return result;
} catch (error) {
  console.error('[TraceLog] Operation failed:', error);
  return fallbackValue;
}

// Avoid
const result = riskyOperation(); // Could throw and break user app
```

### Performance Considerations

- Minimize bundle size
- Use lazy loading where appropriate
- Avoid blocking the main thread
- Implement efficient data structures

```typescript
// Good - efficient deduplication
const uniqueEvents = new Map<string, Event>();

// Avoid - inefficient array operations
const uniqueEvents = events.filter((event, index) => 
  events.findIndex(e => e.id === event.id) === index
);
```

## Submitting Changes

### Pull Request Process

1. **Fork and Branch**: Create a feature branch from `main`
2. **Develop**: Make your changes following the guidelines
3. **Test**: Verify your changes work correctly
4. **Document**: Update documentation if needed
5. **Submit**: Create a pull request with a clear description

### Pull Request Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Manual testing completed
- [ ] Cross-browser testing done
- [ ] Performance impact assessed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or properly documented)
```

### Review Process

1. **Automated Checks**: Ensure TypeScript compilation passes
2. **Code Review**: Maintainers review code quality and design
3. **Testing**: Verify functionality works as expected
4. **Documentation**: Check if docs need updates
5. **Approval**: At least one maintainer approval required

### Merge Requirements

- ✅ TypeScript compilation successful
- ✅ Code review approved
- ✅ No merge conflicts
- ✅ Branch up to date with main
- ✅ Documentation updated (if needed)

## Issue Reporting

### Bug Reports

Use the bug report template:

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Call TraceLog.init({ id: 'id' })
2. Call TraceLog.event('test')
3. See error

**Expected behavior**
What you expected to happen.

**Environment:**
- Browser: [e.g. Chrome 91]
- Client Version: [e.g. 2.0.4]
- Framework: [e.g. React 18]
- OS: [e.g. macOS 12]

**Additional context**
Any other context about the problem.
```

### Bug Severity

- **Critical**: Client completely broken, security issues
- **High**: Major functionality broken
- **Medium**: Minor functionality issues
- **Low**: Cosmetic issues, documentation

## Feature Requests

### Proposal Process

1. **Check Existing**: Search for similar requests
2. **Create Issue**: Use feature request template
3. **Discussion**: Community and maintainer feedback
4. **Design**: Technical design if approved
5. **Implementation**: Development and testing

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions you've considered.

**Use cases**
How would this feature be used?

**Implementation considerations**
Any technical details or constraints to consider.
```

### Evaluation Criteria

Features are evaluated based on:

- **User Value**: How many users would benefit?
- **Complexity**: Implementation and maintenance cost
- **Compatibility**: Impact on existing functionality
- **Performance**: Bundle size and runtime impact
- **Scope**: Alignment with project goals

## Development Guidelines

### API Design Principles

1. **Simplicity**: Keep the API minimal and intuitive
2. **Consistency**: Use consistent naming and patterns
3. **Performance**: Optimize for speed and bundle size
4. **Privacy**: Respect user privacy by default
5. **Reliability**: Handle errors gracefully

### Backward Compatibility

- Avoid breaking changes when possible
- Deprecate features before removal
- Provide migration guides for breaking changes
- Use semantic versioning

### Documentation Requirements

All contributions should include:

- **Code Comments**: JSDoc for public APIs
- **README Updates**: If functionality changes
- **API Docs**: For new public methods
- **Examples**: For new features

## Getting Help

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Pull Request Comments**: Code-specific discussions

### Maintainer Response

- **Issues**: Response within 48 hours
- **Pull Requests**: Initial review within 72 hours
- **Questions**: Best effort to respond quickly

### Contributing Areas

Ways to contribute:

- **Code**: Bug fixes, features, optimizations
- **Documentation**: Guides, examples, API docs
- **Testing**: Cross-browser testing, edge cases
- **Design**: UX improvements, API design
- **Community**: Helping other contributors

---

Thank you for contributing to the TraceLog client! Your contributions help make web analytics better for everyone. 