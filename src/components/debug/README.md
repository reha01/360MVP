# Debug Banner Component

## Overview

The `DebugBanner` component provides real-time debugging information about the application's environment, feature flags, and runtime state. It's designed to help developers understand the current application configuration during development and troubleshooting.

## Features

- **Environment Detection**: Shows current environment (local/staging/prod)
- **Host Type**: Indicates if running on public or local host
- **Feature Flags**: Displays emulator status and other feature flags
- **Organization Context**: Shows active organization ID when available
- **Tenant Information**: Displays current tenant configuration
- **Real-time Updates**: Updates automatically as the application state changes

## Activation

The debug banner is visible when either of these conditions is met:

1. **Development Mode**: Automatically visible when `import.meta.env.MODE !== 'production'`
2. **Manual Activation**: Set `localStorage.DEBUG = '1'` in the browser console

### How to Activate

```javascript
// In browser console
localStorage.setItem('DEBUG', '1');
window.location.reload();
```

### How to Deactivate

```javascript
// In browser console
localStorage.removeItem('DEBUG');
window.location.reload();
```

Or click the "×" button on the debug banner itself.

## Visual Design

- **Position**: Fixed at the bottom of the screen
- **Style**: Amber background with subtle border and shadow
- **Typography**: Monospace font for better readability
- **Responsive**: Adapts to different screen sizes
- **Non-intrusive**: Designed to not interfere with normal app usage

## Information Displayed

| Field | Description | Values |
|-------|-------------|---------|
| **ENV** | Current environment | `LOCAL`, `STAGING`, `PROD` |
| **HOST** | Host type | `LOCAL`, `PUBLIC` |
| **EMULATORS** | Emulator status | `ON`, `OFF` |
| **ORG** | Active organization | First 8 chars of org ID |
| **TENANT** | Current tenant | Tenant name/ID |

## Color Coding

- **Green**: Normal/expected state
- **Red**: Production/public/warning state
- **Gray**: Disabled/inactive state
- **Blue**: Organization context
- **Purple**: Tenant information

## Usage in Components

```tsx
import DebugBanner from './components/debug/DebugBanner';
import { useDebugInfo } from './hooks/useDebugInfo';

const MyComponent = () => {
  const debugInfo = useDebugInfo();
  
  return (
    <div>
      {/* Your component content */}
      <DebugBanner info={debugInfo} />
    </div>
  );
};
```

## Technical Details

- **TypeScript**: Fully typed with proper interfaces
- **Performance**: Uses `useMemo` to prevent unnecessary re-renders
- **Context Aware**: Automatically updates when organization context changes
- **Environment Aware**: Respects both development and production modes

## Troubleshooting

### Banner Not Showing

1. Check if you're in development mode: `console.log(import.meta.env.MODE)`
2. Verify localStorage setting: `console.log(localStorage.getItem('DEBUG'))`
3. Check browser console for any errors

### Information Not Updating

1. Ensure the component is inside the proper context providers
2. Check if the `useDebugInfo` hook is working correctly
3. Verify that the organization context is properly set up

## Security Note

The debug banner is automatically hidden in production builds, but the manual activation via `localStorage.DEBUG` can still be used. This is intentional for troubleshooting production issues, but be aware that this information could be visible to end users if they know how to activate it.




























