# Managers

Core business logic components that handle analytics data processing, state management, and external integrations.

## ApiManager

**Purpose**: Utility module for generating API URLs based on project identifiers with development and production environment support.

**Core Functionality**:
- **Development URLs**: Converts `localhost:PORT` format to `http://localhost:PORT` for local development
- **Production URLs**: Generates subdomain-based URLs via domain parsing
- **URL Validation**: Ensures generated URLs meet security requirements (HTTPS enforcement)
- **Error Handling**: Provides detailed error context for debugging

**Key Features**:
- Zero dependencies, uses only existing TraceLog utilities
- Special handling for localhost URLs with HTTP support
- Security-first with HTTPS enforcement by default
- Debug-friendly with comprehensive logging

## ConfigManager

**Purpose**: Loads and merges application configuration from three sources: default settings, API configuration, and client initialization parameters.

**Core Functionality**:
- **Configuration Loading**: Fetches server-side configuration via API calls
- **Intelligent Merging**: Combines default, API, and app configs with proper precedence
- **Environment Detection**: Auto-detects QA mode, localhost, and skip scenarios
- **Dynamic Settings**: Applies mode-specific settings (error sampling rates, debug flags)

**Key Features**:
- Skip mode (`id: 'skip'`) for pure offline testing
- Localhost development server support
- QA mode detection via URL parameters
- Configurable error sampling rates
- Sanitized configuration merging

## EventManager

**Purpose**: Core component responsible for event tracking, queue management, deduplication, and API communication coordination.

**Core Functionality**:
- **Event Tracking**: Captures user interactions (clicks, scrolls, page views, custom events, web vitals)
- **Queue Management**: Batches events and manages sending intervals to optimize network requests
- **Deduplication**: Prevents duplicate events using fingerprint-based approach
- **API Communication**: Coordinates with SenderManager for reliable event transmission
- **Integration Support**: Forwards custom events to Google Analytics when configured

**Key Features**:
- Unified fingerprint-based deduplication (10px coordinate precision)
- Event queue overflow protection with configurable limits
- Sampling and URL exclusion filtering
- Synchronous and asynchronous flushing capabilities
- Session state management and persistence

## SamplingManager

**Status**: **REMOVED** in v1 refactoring.

**Reason**: Dead code elimination - the SamplingManager was completely unused throughout the codebase. Event sampling is now handled directly in EventManager using simple random sampling (`Math.random() < samplingRate`), providing consistent behavior across all event types while reducing bundle size and architectural complexity.

## SenderManager

**Purpose**: Reliable event transmission to the analytics API with network resilience, retry logic, and event persistence for recovery.

**Core Functionality**:
- **Network Transmission**: Sends analytics events via HTTP POST to API endpoints
- **Retry Logic**: Exponential backoff retry mechanism for failed requests
- **Event Persistence**: localStorage-based persistence for recovery after network failures
- **Synchronous Support**: Special handling for page unload scenarios using sync XHR
- **Circuit Breaker Integration**: Respects global circuit breaker state for failure management

**Key Features**:
- Exponential backoff retry (1s, 2s, 4s, 8s...) for temporary network issues
- Event persistence in localStorage for crash recovery
- Dual sending modes: async (normal) and sync (page unload)
- Sanitized error logging for privacy protection
- Google Analytics integration forwarding

## SessionManager

**Purpose**: Manages user session lifecycle across browser tabs with cross-tab synchronization and session recovery capabilities.

**Core Functionality**:
- **Session Lifecycle**: Creates, tracks, and terminates user sessions based on configurable timeouts
- **Cross-Tab Sync**: Uses BroadcastChannel API to maintain consistent session state across tabs
- **Session Recovery**: Automatically recovers existing sessions from localStorage on page refresh
- **Activity Tracking**: Monitors user engagement to extend session duration
- **Event Integration**: Tracks SESSION_START and SESSION_END events via EventManager

**Key Features**:
- Configurable session timeouts (default: 15 minutes)
- BroadcastChannel-based cross-tab communication
- Automatic session recovery from localStorage
- Page visibility change handling (pause/resume timeouts)
- Graceful cleanup and resource management
- Unique session ID generation (timestamp + random string)

## StateManager

**Purpose**: Foundational abstract base class providing centralized state management for all TraceLog components.

**Core Functionality**:
- **Global State Access**: Thread-safe read/write access to shared application state
- **State Persistence**: Manages critical state properties across component lifecycle
- **Debug Logging**: Automatic logging for important state changes (sessionId, config, etc.)
- **Component Coordination**: Shared state bridge between managers and handlers

**Key Features**:
- Simple key-value store with minimal overhead
- Type-safe operations with generic constraints
- Critical state change logging for debugging
- Memory-efficient synchronous operations
- Clean reset functionality for test isolation
- Supports all core state: `apiUrl`, `config`, `sessionId`, `userId`, `device`, `pageUrl`

## StorageManager

**Purpose**: Robust localStorage wrapper with automatic fallback to in-memory storage for browser environments where localStorage is unavailable.

**Core Functionality**:
- **localStorage Interface**: Provides consistent API for session data and configuration persistence
- **Automatic Fallback**: Falls back to in-memory storage when localStorage fails or is unavailable
- **Browser Compatibility**: Handles storage quota limits, privacy modes, and SSR environments
- **Data Persistence**: Manages session data, configuration cache, and analytics metadata

**Key Features**:
- Automatic fallback from localStorage to in-memory storage
- SSR-safe initialization with window availability checks
- Storage quota and error handling
- Explicit cleanup methods for TraceLog-namespaced data
- Public availability checking for conditional logic
- Consistent API regardless of underlying storage mechanism

## TagsManager

**Purpose**: Evaluates event data against configured tag conditions and returns matching tag IDs for flexible event categorization and segmentation.

**Core Functionality**:
- **Condition Evaluation**: Processes tag conditions based on URL patterns, device types, UTM parameters, and DOM properties
- **Event Tagging**: Returns matching tag IDs for events based on conditional logic
- **Flexible Matching**: Supports multiple condition types (equals, contains, regex, starts with, ends with)
- **Logical Operators**: Handles AND/OR logic across multiple conditions per tag

**Key Features**:
- Unified string matching for URL, device, and UTM conditions
- Optimized element data matching with exact and fuzzy search paths
- Safe regex evaluation with error handling
- Performance optimized with reduced string operations (~60% fewer toLowerCase() calls)
- Support for complex conditional logic with multiple operators

## UserManager

**Purpose**: Simple utility for managing unique user identification for analytics tracking with project namespacing support.

**Core Functionality**:
- **User ID Generation**: Creates RFC4122-compliant UUID v4 identifiers
- **Persistence**: Stores user IDs in localStorage with automatic fallback
- **Project Namespacing**: Supports multiple projects with separate user identifications
- **Session Continuity**: Reuses existing user IDs across browser sessions

**Key Features**:
- Static utility method pattern (no object instantiation required)
- UUID v4 generation for globally unique identifiers
- Project-scoped user ID storage (supports multi-project scenarios)
- Automatic fallback to memory storage when localStorage unavailable
- Minimal dependencies and zero allocation approach

---

All managers extend `StateManager` for global state access and follow clean code principles with comprehensive error handling, TypeScript strict mode compliance, and production-ready reliability for the v1 release.