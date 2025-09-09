# Page View Tracking - Navigation Events

## Description
Tests that page view events are properly tracked for history.pushState, history.replaceState, popstate, and hashchange events with accurate from_page_url.

## Test Requirements
- [ ] Test PAGE_VIEW tracking for history.pushState navigation
- [ ] Verify PAGE_VIEW tracking for history.replaceState changes
- [ ] Confirm popstate events trigger PAGE_VIEW tracking
- [ ] Test hashchange events generate PAGE_VIEW events
- [ ] Validate from_page_url accuracy for navigation events
- [ ] Ensure proper debouncing of rapid navigation events

## Acceptance Criteria
- All navigation methods trigger appropriate PAGE_VIEW events
- from_page_url correctly reflects the previous page location
- Navigation events are properly debounced to avoid duplicates
- Hash changes are tracked with accurate URL information
- History API changes capture both old and new URLs

## Priority
High

## Labels
- e2e-test
- page-view-tracking
- navigation
- spa-routing