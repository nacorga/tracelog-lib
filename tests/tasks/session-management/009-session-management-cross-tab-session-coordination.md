# Session Management - Cross-Tab Session Coordination

## Description
Ensures that multiple tabs share the same session when appropriate, one tab acts as session leader, and session ends only when all tabs are closed or inactive.

## Test Requirements
- [ ] Verify multiple tabs share the same session ID when opened within session timeout
- [ ] Confirm only one tab acts as session leader for timing management
- [ ] Validate session remains active while any tab has user activity
- [ ] Test session ends only when all tabs are closed or become inactive
- [ ] Ensure proper BroadcastChannel communication between tabs
- [ ] Verify session leader election when current leader tab is closed

## Acceptance Criteria
- Multiple tabs maintain consistent session ID during active session
- Only one tab manages session timeout timing at any given time
- Session continues as long as any tab shows user activity
- Session ends properly when all tabs are closed or inactive
- BroadcastChannel messaging works for session coordination
