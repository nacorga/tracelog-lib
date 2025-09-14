## Performance Benchmarks

This folder contains the TraceLog SDK end-to-end performance benchmarks and the generated JSON report with the latest results.

### What this is

- Playwright-based E2E benchmarks that measure SDK timings in a real browser context using `performance.now()`.
- A Node.js script that runs the tests, parses their console output, and writes a structured JSON report.
- The JSON report is the single source of truth for benchmark data.

### How it works

1. Tests in `benchmarks.spec.ts` run in the browser and measure timings via `page.evaluate()` with `performance.now()`.
2. Each measured step logs a line like `[Performance] Initialization took 12.3ms` to stdout.
3. The script `scripts/extract-performance-data.js` executes the tests and parses stdout with regex to collect metrics per browser.
4. Metrics are aggregated into `performance-results.json` with raw values and a computed summary (min, max, avg, count).

Notes:
- Tests use the config `{ id: 'test' }` to avoid real network calls and ensure stable timings.
- Measurements are taken entirely in the page (browser) context to reflect real execution costs.

### Run the benchmarks

```bash
npm run performance:benchmark
```

This will:
- Build the browser bundle if necessary as part of E2E flow
- Run the Playwright tests for all configured browsers
- Generate/update `performance/performance-results.json`
- Print a short summary to the console

### Output: performance-results.json

Location: `performance/performance-results.json`

Schema overview:

```json
{
  "timestamp": "ISO 8601 string",
  "summary": {
    "<browser>": {
      "<metricName>": {
        "min": number,
        "max": number,
        "avg": number,
        "count": number
      }
    }
  }
}
```

Where `<browser>` is one of: `chromium`, `firefox`, `webkit`, `mobile-chrome`, `mobile-safari` (based on Playwright projects).

Captured metrics and meaning:
- `initialization`: Time to initialize the SDK.
- `clickEvent`: Time to track a click event (JS path only).
- `scrollEvent`: Time to track a scroll event (JS path only).
- `customEvent`: Time to track a custom event.
- `sessionInit`: Time to start a session.
- `batchProcessing`: Time to process a small batch of events (internal queue processing path).
- `averageEvent`: Average time per event in a synthetic batch (if emitted by the suite).
- `memoryUsage`: Delta or current memory use snapshot when available (best effort).
- `cleanupEfficiency`: Time to cleanup/destroy handlers and free resources.

Interpreting the summary:
- `min`/`max`: Best and worst observed values across repeated measurements in the same run.
- `avg`: Arithmetic mean across collected values.
- `count`: Number of samples collected for the metric in that browser.

### Performance budgets (enforced by tests)

These thresholds are validated in the test suite to ensure regressions fail CI locally:
- Initialization: 100 ms
- Event tracking (click/scroll/custom): 10–15 ms (depending on metric)
- Session start: 100 ms

If a budget is exceeded, the corresponding test fails. The JSON will still be generated when run via the script, which enables post-run analysis even for borderline cases.

### Troubleshooting

- Ensure Playwright browsers are installed: `npx playwright install`.
- Close other heavy applications that can skew timings.
- If you see no metrics for a browser, search the raw test output for lines containing `[Performance]` to confirm logs are emitted.
- The JSON file is not manually edited; always re-run the benchmark to refresh data.

### Non-goals

- This suite does not attempt to measure network timing; `qaMode: true` disables real sends.
- Numbers are best-effort and machine-dependent; compare trends rather than absolutes across machines.


