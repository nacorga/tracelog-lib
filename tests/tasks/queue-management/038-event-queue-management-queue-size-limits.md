# Event Queue Management - Queue Size Limits

## Description
Ensures that event queues don't exceed maximum size limits and oldest events are discarded when limits are reached.

## Test Requirements
- [ ] Test queue size limit enforcement
- [ ] Verify oldest events are discarded when limit reached
- [ ] Confirm queue size monitoring and management
- [ ] Test behavior at and beyond queue limits
- [ ] Validate memory usage control through size limits
- [ ] Ensure critical events are prioritized when queue full

## Acceptance Criteria
- Event queues respect configured maximum size limits
- Oldest events are discarded to make room for new events
- Queue size limits prevent excessive memory usage
- Critical events (session start/end) receive priority
- Queue management maintains system stability

## Priority
Medium

## Labels
- e2e-test
- event-queue-management
- size-limits
- memory-management