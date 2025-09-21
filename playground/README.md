# TraceLog Playground

A fully functional playground for testing the TraceLog Events Library with a simple and intuitive interface.

## Quick Start

### Recommended (Using npm scripts)
```bash
# Build and start playground in one command
npm run playground:dev

# Or step by step:
npm run playground:setup    # Build library and copy to playground
npm run serve:playground    # Start HTTP server on port 3001
```

Then open `http://localhost:3001` in your browser.

### Manual Setup
1. **Build the TraceLog library**:
   ```bash
   npm run build:browser
   ```

2. **Copy tracelog.js to playground**:
   ```bash
   cp dist/browser/tracelog.js playground/tracelog.js
   ```

3. **Start a local server** (required for proper functionality):
   ```bash
   # Option 1: Using the npm script (recommended)
   npm run serve:playground

   # Option 2: Using Node.js http-server directly
   npx http-server playground -p 3001 --cors
   ```

4. **Open in browser**: Navigate to `http://localhost:3001`

## Features

### Configuration Panel
- **Project ID**: Set your unique project identifier
- **Mode**: Choose between Production, QA, or Debug modes
- **Session Timeout**: Set session duration (15min, 30min, 1h)
- **Global Metadata**: Add JSON metadata to all events
- **Mock Server**: Toggle between real API calls and simulated responses

### Controls
- **Init TraceLog**: Initialize the library with current configuration
- **Destroy**: Clean up and destroy the TraceLog instance
- **Send Custom Event**: Send custom events with any name

### Demo Elements
- **Click Tracking**: Test button click events
- **Scroll Tracking**: Test scroll events in a container
- **External Link**: Test navigation tracking
- **Form Input**: Test input field interactions

### Event Log Console
- Real-time display of all captured events
- JSON-formatted event data
- Timestamps and event numbering
- Clear logs functionality

## Usage

1. **Configure**: Set your desired configuration in the left panel
2. **Initialize**: Click "Init TraceLog" to start tracking
3. **Test**: Interact with demo elements to generate events
4. **Monitor**: Watch events appear in real-time in the log console
5. **Experiment**: Send custom events and try different configurations

## Keyboard Shortcuts

- **Ctrl/Cmd + I**: Initialize TraceLog
- **Ctrl/Cmd + D**: Destroy TraceLog
- **Ctrl/Cmd + L**: Clear event logs

## Mock Server

The playground includes a built-in mock server that simulates API responses:

- **Config endpoint**: Returns mock configuration with sampling rate, tags, etc.
- **Events endpoint**: Simulates successful event collection with realistic delays
- **Toggle**: Use the "Mock server responses" checkbox to enable/disable

When mock server is disabled, the playground will attempt to make real API calls to your TraceLog backend.

## Development Notes

- The playground loads the TraceLog library from local `tracelog.js` (copied from build)
- Clean separation: HTML structure, CSS styling, and JavaScript functionality in separate files
- No external dependencies except the TraceLog library itself
- Responsive design works on desktop and mobile devices
- HTTP server required for CORS and proper file loading

## Troubleshooting

### TraceLog library not found
Ensure you've built the browser version:
```bash
npm run build:browser
```

### Events not appearing
1. Check that TraceLog is initialized (green status indicator)
2. Verify your configuration is valid
3. Look for error messages in the alerts area
4. Check browser console for additional error details

### Mock server issues
- Toggle the mock server checkbox to switch between real/fake API calls
- When disabled, ensure you have a running TraceLog backend
- Check network tab in browser dev tools to see actual requests

## Configuration Examples

### Basic Setup
```json
{
  "id": "my-project",
  "mode": "qa",
  "sessionTimeout": 900000
}
```

### Advanced Setup
```json
{
  "id": "my-project",
  "mode": "debug",
  "sessionTimeout": 1800000,
  "globalMetadata": {
    "environment": "staging",
    "version": "2.1.0",
    "feature_flags": ["new_ui", "analytics_v2"]
  },
  "errorSampling": 0.5
}
```

## Browser Compatibility

The playground works in all modern browsers that support:
- ES6+ JavaScript features
- Fetch API
- LocalStorage
- CSS Grid

Tested on Chrome, Firefox, Safari, and Edge.