# Authentication State Directory

This directory contains authentication state files for Playwright tests.

## Files

- `state.json` - Captured authentication state (cookies, localStorage, etc.)
- `authenticated-state.png` - Screenshot verification of authenticated state

## Security

⚠️ **Important**: All files in this directory except this README are ignored by git to prevent committing sensitive authentication data.

## Usage

1. Capture authentication state:
   ```bash
   npm run test:auth:capture
   ```

2. Use in tests by configuring Playwright to use the saved state:
   ```typescript
   use: {
     storageState: 'tests/.auth/state.json'
   }
   ```

## Regeneration

Re-run the capture process if:
- Authentication expires
- User credentials change
- Testing with different user roles














