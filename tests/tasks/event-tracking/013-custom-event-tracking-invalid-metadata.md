# Custom Event Tracking - Invalid Metadata

## Description
Ensures that invalid metadata (circular references, too large objects, invalid types) is rejected or sanitized properly, with clear error messages in QA mode.

## Test Requirements
- [ ] Test rejection of metadata with circular references
- [ ] Verify metadata size limits are enforced
- [ ] Confirm invalid data types are handled appropriately
- [ ] Validate error messages in QA mode for invalid metadata
- [ ] Test sanitization behavior for partially invalid objects
- [ ] Ensure memory safety with malformed metadata

## Acceptance Criteria
- Circular references in metadata are detected and rejected
- Metadata exceeding size limits triggers appropriate handling
- Invalid data types are either rejected or sanitized safely
- QA mode provides detailed error information for debugging
- System remains stable when processing malformed metadata

## Priority
Medium

## Labels
- e2e-test
- custom-events
- validation
- data-sanitization