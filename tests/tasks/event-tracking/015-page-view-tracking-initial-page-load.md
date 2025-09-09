# Page View Tracking - Initial Page Load

## Description
Validates that initial page view is tracked on library initialization with correct URL, referrer, title, and UTM parameters if present.

## Test Requirements
- [ ] Test PAGE_VIEW event is triggered on library initialization
- [ ] Verify correct URL is captured for initial page load
- [ ] Confirm referrer information is properly extracted
- [ ] Validate page title is included in the event data
- [ ] Test UTM parameter extraction and inclusion
- [ ] Ensure event timing is accurate for page load

## Acceptance Criteria
- PAGE_VIEW event fires immediately after successful initialization
- All URL components are captured accurately including query parameters
- Referrer data matches actual browser referrer information
- UTM parameters are parsed and included when present
- Event timestamp reflects actual page load timing

## Priority
High

## Labels
- e2e-test
- page-view-tracking
- initialization
- utm-parameters