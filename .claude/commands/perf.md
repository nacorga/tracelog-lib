---
description: Analyze bundle size and performance impact of library builds
allowed-tools: [Bash, Read, Glob]
model: claude-sonnet-4-5
---

# Performance & Bundle Size Analysis

Analyze build output sizes and performance impact of the TraceLog library.

## Build All Bundles

!npm run build:all

## Analyze Bundle Sizes

Check sizes of all build outputs:

!ls -lh dist/esm/public-api.js dist/cjs/public-api.js dist/browser/tracelog.esm.js 2>/dev/null || echo "Build files not found"

## Gzip Analysis

Check compressed sizes (production scenario):

!gzip -c dist/browser/tracelog.esm.js | wc -c | awk '{printf "%.2f KB\n", $1/1024}'

## Report Format

```
⚡ Performance & Bundle Size Analysis

=== BUNDLE SIZES ===

ESM Build:
- Uncompressed: X.X KB [✅ under 50KB target]
- Files: dist/esm/

CJS Build:
- Uncompressed: X.X KB
- Files: dist/cjs/

Browser Build (Production):
- Uncompressed: X.X KB [✅ under 60KB target]
- Gzipped: X.X KB [✅ under 20KB target]
- File: dist/browser/tracelog.esm.js

=== DEPENDENCY ANALYSIS ===

Runtime Dependencies:
✅ web-vitals: 4.2.4 (only runtime dependency)

Dev Dependencies: XX packages
- TypeScript 5.7
- Vite 7.0
- Vitest 3.2
- Playwright 1.54
- [others...]

=== PERFORMANCE IMPACT ===

Network Impact:
- Initial Load: ~X.X KB (gzipped)
- HTTP/2 Multiplexing: Supported
- Caching Strategy: Long-term (versioned URLs)

Runtime Impact:
- Passive Event Listeners: ✅ Used
- Memory Footprint: Minimal (cleanup implemented)
- CPU Usage: Negligible (debounced events)

=== RECOMMENDATIONS ===

[If under budget:]
✅ All bundle sizes within performance budget
✅ Minimal dependency footprint
✅ Production-ready

[If over budget:]
⚠️ Bundle size concerns:
- Browser bundle: X.X KB (target: <60KB)
- Recommendation: [specific optimization steps]

=== SIZE TRENDS ===

Compare with previous builds (if available):
- Current: X.X KB
- Previous: Y.Y KB
- Change: [+/-]Z.Z KB ([+/-]N%)
```

## Performance Targets

- **ESM Bundle**: < 50 KB uncompressed
- **Browser Bundle**: < 60 KB uncompressed
- **Gzipped**: < 20 KB (target: ~15 KB)
- **Runtime Dependency**: Only `web-vitals` allowed

## Size Optimization Tips

If bundle is too large:
1. Check for unused code (tree-shaking)
2. Verify build configuration (Vite optimization)
3. Consider code splitting for integrations
4. Review dependency sizes
