# Custom Event Tracking - Valid Events

## Description
Tests that TraceLog.event() successfully tracks custom events with valid names and metadata, sanitizes input data, and delivers events to the API endpoint.

## Test Requirements
- [ ] Verify TraceLog.event() accepts valid event names and metadata
- [ ] Test successful delivery of custom events to API endpoint
- [ ] Confirm input data sanitization for security
- [ ] Validate event structure includes all required fields
- [ ] Test various metadata types and sizes within limits
- [ ] Ensure events are properly queued and batched for delivery

## Acceptance Criteria
- Custom events with valid names and metadata are successfully tracked
- All custom events reach the API endpoint with correct structure
- Input data is sanitized while preserving legitimate content
- Events include proper timestamps, session ID, and project context
- Various metadata types are handled correctly within size limits

## Priority
High

## Labels
- e2e-test
- custom-events
- event-tracking
- api-delivery