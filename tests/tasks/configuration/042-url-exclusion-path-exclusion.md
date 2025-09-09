# URL Exclusion - Path Exclusion

## Description
Verifies that events are not tracked on pages matching excluded URL path patterns, including wildcard and regex patterns.

## Test Requirements
- [ ] Test path exclusion using exact path matches
- [ ] Verify wildcard pattern matching for path exclusion
- [ ] Confirm regex pattern support for complex exclusions
- [ ] Test case sensitivity handling in path matching
- [ ] Validate exclusion applies to all event types on matched paths
- [ ] Ensure excluded paths don't interfere with other tracking

## Acceptance Criteria
- Exact path matches prevent all event tracking on those pages
- Wildcard patterns work correctly for path exclusion
- Regular expression patterns provide flexible exclusion rules
- Path exclusion is consistent across different event types
- Non-excluded paths continue normal event tracking

## Priority
Medium

## Labels
- e2e-test
- url-exclusion
- path-exclusion
- pattern-matching