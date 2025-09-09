# Performance Tracking - Web Vitals Collection

## Description
Tests that Core Web Vitals (LCP, CLS, FCP, TTFB, INP) are collected and reported with accurate values and proper sampling.

## Test Requirements
- [ ] Test collection of LCP (Largest Contentful Paint) metrics
- [ ] Verify CLS (Cumulative Layout Shift) tracking
- [ ] Confirm FCP (First Contentful Paint) measurement
- [ ] Test TTFB (Time to First Byte) collection
- [ ] Validate INP (Interaction to Next Paint) tracking
- [ ] Ensure proper sampling rates are applied to web vitals

## Acceptance Criteria
- All Core Web Vitals metrics are collected when available
- Metric values are accurate and within expected ranges
- Web vitals events include proper metric names and values
- Sampling configuration is respected for performance events
- Fallback behavior works when web-vitals library unavailable

## Priority
High

## Labels
- e2e-test
- performance-tracking
- web-vitals
- core-metrics