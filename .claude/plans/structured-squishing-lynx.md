# Fix Superwall Paywall Not Showing in Onboarding

## Problem

After the loading bar reaches 100% in `generating-plan.tsx`, the Superwall paywall never shows. The campaign `campaign_trigger` is set to 100% visibility in the Superwall dashboard.

## Root Cause

The Superwall SDK configures itself **asynchronously** inside `SuperwallProvider`. The `registerPlacement` call happens before the SDK finishes configuring. When the SDK isn't configured:

- The native call returns silently (no error)
- No paywall is presented
- The `feature()` callback fires immediately, navigating away

In `_layout.tsx`, `SuperwallReadyContext` is set to `true` immediately (line 145) without waiting for the SDK's `isConfigured` to become true.

## Fix

### 1. Wait for SDK configuration in `generating-plan.tsx`

Add `isConfigured` check from the Superwall store. When the loading bar finishes, wait for the SDK to be ready before triggering the placement. Add a safety timeout so the user isn't stuck forever if configuration fails.

```tsx
// Also import useSuperwall to check isConfigured
let useSuperwall: any = null;
try {
  const sw = require('expo-superwall');
  usePlacementImported = sw.usePlacement;
  useSuperwall = sw.useSuperwall;
} catch (e) { ... }

// Inside component:
const isConfigured = useSuperwallConfigured(); // reads store's isConfigured
const [loadingComplete, setLoadingComplete] = useState(false);

// When animation finishes:
setIsLoading(false);
setLoadingComplete(true);

// Effect: trigger paywall when both loading is done AND SDK is ready
useEffect(() => {
  if (!loadingComplete) return;

  if (isConfigured) {
    triggerPaywallRef.current({
      placement: 'campaign_trigger',
      feature: () => navigateToSignup(),
    }).catch(() => navigateToSignup());
    return;
  }

  // Safety timeout: if SDK doesn't configure within 5s, navigate anyway
  const timeout = setTimeout(() => navigateToSignup(), 5000);
  return () => clearTimeout(timeout);
}, [loadingComplete, isConfigured]);
```

### 2. Clean up the safe import pattern

Consolidate the safe imports and create a proper `useSuperwallConfigured` helper that returns `isConfigured` from the store (or `false` if module unavailable).

## Files Modified

| File                                 | Change                                                                |
| ------------------------------------ | --------------------------------------------------------------------- |
| `app/onboarding/generating-plan.tsx` | Wait for `isConfigured` before triggering paywall; add safety timeout |

## Verification

1. Reload app, go through onboarding to generating-plan screen
2. Loading bar reaches 100% → paywall should appear
3. If paywall appears: dismiss it → should navigate to signup
4. If paywall is skipped/error: should navigate to signup
5. Edge case: if SDK never configures, 5s timeout navigates to signup
