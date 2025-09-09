# Click Tracking - Custom Data Attributes

## Description
Tests that elements with data-tl-name and data-tl-value attributes trigger custom events in addition to click tracking.

## Test Requirements
- [ ] Test elements with data-tl-name trigger custom events
- [ ] Verify data-tl-value attributes are included in custom events
- [ ] Confirm both CLICK and CUSTOM events are generated
- [ ] Test various combinations of data attributes
- [ ] Validate custom event names match data-tl-name values
- [ ] Ensure proper precedence when multiple data attributes exist

## Acceptance Criteria
- Elements with data-tl-name generate both CLICK and CUSTOM events
- data-tl-value content is properly included in custom event metadata
- Custom event names accurately reflect data-tl-name attribute values
- Multiple data attributes on same element are handled correctly
- Custom events maintain proper event structure and timing

## Priority
Medium

## Labels
- e2e-test
- click-tracking
- custom-events
- data-attributes