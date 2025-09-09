# Session Management - Custom Session Timeout

## Description
Tests that custom session timeout values are respected, validates timeout bounds (30 seconds to 24 hours), and sessions end according to custom timeouts.

## Test Requirements
- [ ] Test custom timeout values within valid bounds
- [ ] Verify timeout bound validation (30s - 24h)
- [ ] Test sessions end according to custom timeouts
- [ ] Validate error handling for invalid timeout values
- [ ] Test extreme timeout values (minimum and maximum)
- [ ] Ensure timeout persistence across page reloads

## Acceptance Criteria
- Custom timeouts are properly applied and respected
- Invalid timeout values are rejected with clear errors
- Sessions end at the exact custom timeout duration
- Timeout bounds are enforced consistently
- Configuration persists correctly

## Priority
Medium

## Labels
- e2e-test
- session-management
- custom-configuration
- validation