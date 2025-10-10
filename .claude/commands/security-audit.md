---
description: Comprehensive security and privacy audit based on GDPR/LOPD requirements
allowed-tools: [Bash, Read, Grep, Glob]
model: claude-sonnet-4-5
---

# Security & Privacy Audit

Comprehensive security and privacy audit based on SECURITY.md guidelines.

## Reference Document

@SECURITY.md

## Automated Scans

### 1. PII Pattern Detection

Check for potential PII capture in click tracking:

!grep -rn "textContent\|innerText" src/handlers/ || echo "No textContent usage found"

!grep -rn "\.value" src/handlers/ || echo "No .value access found"

### 2. Sensitive Data Handling

Check sanitization implementations:

!grep -rn "sanitize" src/utils/security/ || echo "No sanitization utils found"

### 3. Query Parameter Filtering

Check for sensitive parameter defaults:

!grep -rn "sensitiveQueryParams\|DEFAULT_SENSITIVE" src/ || echo "Check sensitive params config"

### 4. Consent Management

Check for consent handling:

!grep -rn "consent\|setConsent\|doNotTrack" src/ || echo "No consent management found"

### 5. Storage Security

Check what's stored in localStorage:

!grep -rn "localStorage.setItem\|sessionStorage.setItem" src/managers/ || echo "Check storage usage"

### 6. Integration Loading

Check external script loading (GA, etc.):

!grep -rn "script\|createElement.*script" src/integrations/ || echo "Check integration loading"

## Manual Review Items

Review these files manually:

@src/handlers/click.handler.ts
@src/utils/security/sanitize.utils.ts
@src/constants/config.constants.ts
@src/integrations/google-analytics.integration.ts

## Report Format

```
🔒 Security & Privacy Audit Report

=== CRITICAL ISSUES (🔴) - Phase 1 ===

[For each critical issue:]
Issue #X: [Title from SECURITY.md]
Status: [✅ Implemented | ⚠️ Partial | ❌ Not Implemented]
Legal Risk: [Critical/High/Medium/Low]
Privacy Risk: [High/Medium/Low]

Current State:
- [What currently exists]

Required Implementation:
- [What needs to be done]

Files Affected:
- [List of files]

Test Requirements:
- [Required tests]

Reference: SECURITY.md (specific section)
Priority: [P0/P1/P2]

---

=== HIGH PRIORITY (🟠) - Phase 2 ===

[Similar format for high priority items]

---

=== COMPLIANCE STATUS ===

Phase 1 (Critical - Before E-commerce): X/4 complete (XX%)
✅ #1 Consent Management: [Status]
✅ #2 Click Data Protection: [Status]
✅ #3 URL Params Default: [Status]
✅ #5 GA Conditional Loading: [Status]

Phase 2 (High Priority): X/3 complete (XX%)
Phase 3 (Future): X/Y complete (XX%)

Overall Compliance: [✅ READY | ⚠️ PARTIAL | ❌ NOT READY] for production

---

=== RISK ASSESSMENT ===

Critical Risks: X
High Risks: Y
Medium Risks: Z

Blocking Issues for E-commerce: [Number]
Estimated Time to Compliance: [X days/weeks]

---

=== RECOMMENDATIONS ===

Immediate Actions (P0):
1. [Action with reference to SECURITY.md]
2. [...]

Next Steps (P1):
1. [...]

Future Enhancements (P2):
1. [...]

---

=== GDPR COMPLIANCE CHECKLIST ===

- [ ] Consent required before tracking
- [ ] Users can opt-out
- [ ] No PII captured unintentionally
- [ ] Sensitive data sanitized
- [ ] Third-party scripts loaded conditionally
- [ ] Data retention policy defined
- [ ] Privacy documentation exists
- [ ] Security measures documented

Compliance Level: [X/8 criteria met]
```

## Focus Areas

Based on SECURITY.md priorities:

### Phase 1 (Critical)
1. **Consent Management** (#1) - Legal compliance
2. **Click Tracking** (#2) - PII protection
3. **URL Parameters** (#3) - Token/email filtering
4. **GA Loading** (#5) - Consent-based loading

### Phase 2 (High)
5. **PII Sanitization** (#6) - Enhanced patterns
6. **Input Protection** (#9) - Prevent value capture
7. **Documentation** (#11) - Security transparency

### Phase 3 (Future)
8. **Storage Encryption** (#4)
9. **Data Retention** (#10)
10. **Anonymization** (#12)

## Output Summary

End with actionable summary:

```
=== AUDIT SUMMARY ===

Status: [✅ COMPLIANT | ⚠️ NEEDS WORK | ❌ NOT COMPLIANT]

Critical Issues: X (P0 - must fix before production)
High Priority: Y (P1 - fix in next release)
Medium Priority: Z (P2 - future enhancement)

Ready for E-commerce: [YES/NO]
Blocker Count: X

Next Actions:
1. [Most critical action with time estimate]
2. [...]

Estimated Time to Full Phase 1 Compliance: X days
```
