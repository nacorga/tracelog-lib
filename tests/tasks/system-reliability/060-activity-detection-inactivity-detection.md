# Activity Detection - Inactivity Detection

## Description
Tests that user inactivity is correctly identified and triggers appropriate session timeout behavior.

## Test Requirements
- [ ] Test inactivity detection after configured timeout period
- [ ] Verify session timeout triggers when no activity detected
- [ ] Confirm inactivity threshold configuration is respected
- [ ] Test inactivity detection across different activity types
- [ ] Validate proper cleanup when inactivity detected
- [ ] Ensure inactivity detection works with page visibility

## Acceptance Criteria
- Inactivity is detected after appropriate timeout period
- Session timeout behavior triggers correctly on inactivity
- Different activity types reset the inactivity timer
- Inactivity thresholds can be configured appropriately
- Page visibility changes affect inactivity detection properly

## Priority
Medium

## Labels
- e2e-test
- activity-detection
- inactivity-detection
- session-timeout