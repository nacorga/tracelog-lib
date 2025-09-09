# Performance Tracking - Long Task Detection

## Description
Validates that long tasks are detected and tracked with appropriate throttling and sampling to avoid excessive events.

## Test Requirements
- [ ] Test detection of long tasks using Performance Observer
- [ ] Verify long task duration thresholds are respected
- [ ] Confirm throttling prevents excessive long task events
- [ ] Test sampling reduces long task event volume
- [ ] Validate long task attribution and source information
- [ ] Ensure long task tracking doesn't impact performance

## Acceptance Criteria
- Long tasks exceeding duration threshold are detected
- Throttling prevents overwhelming number of long task events
- Sampling configuration appropriately reduces event volume
- Long task events include duration and attribution data
- Performance tracking itself doesn't cause performance issues

## Priority
Medium

## Labels
- e2e-test
- performance-tracking
- long-tasks
- throttling