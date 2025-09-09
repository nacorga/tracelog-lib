# Custom Event Tracking - Invalid Event Names

## Description
Validates that invalid event names (too long, containing XSS patterns, reserved words) are rejected with appropriate error messages in QA mode.

## Test Requirements
- [ ] Test rejection of event names that are too long
- [ ] Verify XSS patterns in event names are blocked
- [ ] Confirm reserved words are not allowed as event names
- [ ] Validate appropriate error messages are shown in QA mode
- [ ] Test silent handling of invalid names in production mode
- [ ] Ensure no events are tracked when names are invalid

## Acceptance Criteria
- Event names exceeding length limits are rejected
- XSS patterns and reserved words trigger validation errors
- QA mode provides clear, actionable error messages
- Production mode handles invalid names gracefully without errors
- No invalid events are sent to the API endpoint

## Priority
Medium

## Labels
- e2e-test
- custom-events
- validation
- security