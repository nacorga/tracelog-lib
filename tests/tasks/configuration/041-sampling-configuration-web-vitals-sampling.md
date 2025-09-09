# Sampling Configuration - Web Vitals Sampling

## Description
Tests that web vitals events have separate sampling rates and long tasks have additional sampling reduction.

## Test Requirements
- [ ] Test separate sampling rates for web vitals events
- [ ] Verify long tasks have additional sampling reduction
- [ ] Confirm web vitals sampling is independent of regular events
- [ ] Test sampling configuration for different performance metrics
- [ ] Validate performance sampling doesn't affect other event types
- [ ] Ensure critical performance data is captured despite sampling

## Acceptance Criteria
- Web vitals events use separate sampling configuration
- Long tasks receive additional sampling reduction as configured
- Performance event sampling operates independently
- Critical performance metrics are captured appropriately
- Sampling maintains representative performance data

## Priority
Medium

## Labels
- e2e-test
- sampling-configuration
- web-vitals
- performance-sampling