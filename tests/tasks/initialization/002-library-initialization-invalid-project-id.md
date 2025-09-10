# Library Initialization - Invalid Project ID

## Description
Verifies that TraceLog.init() throws appropriate error when called with missing, empty, or invalid project ID, and ensures no tracking occurs.

## Test Requirements
- [x] Test initialization with missing project ID
- [x] Test initialization with empty project ID
- [x] Test initialization with invalid project ID format
- [x] Verify appropriate error messages are thrown
- [x] Confirm no tracking functionality is enabled
- [x] Ensure no event handlers are attached

## Acceptance Criteria
- [x] TraceLog.init() throws descriptive errors for invalid inputs
- [x] No tracking occurs when initialization fails
- [x] No event listeners are attached to DOM
- [x] No localStorage data is created for invalid projects
