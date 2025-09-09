# Scroll Tracking - Scroll Suppression

## Description
Verifies that scroll events are properly suppressed immediately after page view events to avoid noise from automatic scrolling.

## Test Requirements
- [ ] Test scroll event suppression after PAGE_VIEW events
- [ ] Verify suppression timeout duration is appropriate
- [ ] Confirm legitimate user scroll events are not suppressed
- [ ] Test suppression behavior during rapid navigation
- [ ] Validate suppression doesn't affect other event types
- [ ] Ensure suppression resets properly after timeout

## Acceptance Criteria
- Scroll events are suppressed immediately after page navigation
- Suppression timeout allows legitimate scroll events after brief delay
- User-initiated scroll events are captured after suppression period
- Navigation-induced scroll noise is filtered out effectively
- Other event types continue to function during scroll suppression

## Priority
Medium

## Labels
- e2e-test
- scroll-tracking
- event-suppression
- navigation