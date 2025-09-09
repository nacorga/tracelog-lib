# Page View Tracking - URL Normalization

## Description
Ensures that sensitive query parameters are removed from tracked URLs according to configuration, while preserving important URL components.

## Test Requirements
- [ ] Test removal of configured sensitive query parameters
- [ ] Verify preservation of important URL components
- [ ] Confirm UTM parameters are retained when not in sensitive list
- [ ] Test URL normalization with various parameter combinations
- [ ] Validate hash fragments are handled according to config
- [ ] Ensure port numbers and protocols are preserved

## Acceptance Criteria
- Sensitive query parameters are consistently removed from URLs
- Important marketing and tracking parameters remain intact
- URL structure and readability are maintained after normalization
- Configuration changes properly affect URL processing
- Hash fragments and other URL components handled correctly

## Priority
Medium

## Labels
- e2e-test
- page-view-tracking
- url-normalization
- privacy