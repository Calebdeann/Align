import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useSuperwall, usePlacement, useUser } from 'expo-superwall';
import { useAppConfigStore } from '@/stores/appConfigStore';

const PLACEMENT = 'campaign_trigger';

// Safety-net subscription gate. Mounted once inside /(tabs)/_layout so it
// covers every main page. Re-presents the same Superwall paywall whenever a
// non-subscribed user reaches the tabs or returns to foreground.
//
// Reads subscription status from expo-superwall's useUser(). Waits while
// status is UNKNOWN (Superwall not yet finished bootstrapping). Uses a ref to
// prevent double-presenting if status flickers or AppState fires concurrently.
//
// Whether the gate actually fires is controlled by the
// `in_app_paywall_enabled` remote flag in Supabase's `app_config` table
// (managed via appConfigStore). Ships FALSE for the first App Store
// submission — flip the row to TRUE in Supabase to re-enable without
// rebuilding.
export function useSubscriptionGate() {
  const { isConfigured } = useSuperwall();
  const { subscriptionStatus } = useUser();
  const inAppPaywallEnabled = useAppConfigStore((s) => s.inAppPaywallEnabled);
  const hasLoadedFlag = useAppConfigStore((s) => s.hasLoaded);
  const refreshFlag = useAppConfigStore((s) => s.refresh);
  const presentingRef = useRef(false);

  // Reset on (re)mount in case a previous unmount happened mid-present and
  // the dismiss/skip/error callback fired after the component was already
  // gone — leaving presentingRef stuck true and the gate unable to re-fire.
  useEffect(() => {
    presentingRef.current = false;
  }, []);

  const { registerPlacement } = usePlacement({
    onDismiss: () => {
      presentingRef.current = false;
    },
    onSkip: () => {
      presentingRef.current = false;
    },
    onError: () => {
      presentingRef.current = false;
    },
  });

  const presentIfNeeded = useCallback(async () => {
    // Dev bypass: don't gate while iterating locally. __DEV__ is stripped at
    // production build time so this never leaks to release.
    if (__DEV__) return;
    // Remote kill-switch. Defaults false until app_config fetch completes,
    // so a slow or failed fetch leaves the gate inert (better to under-gate
    // than to block users on a flaky network).
    if (!hasLoadedFlag) return;
    if (!inAppPaywallEnabled) return;
    if (!isConfigured) return;
    if (!subscriptionStatus) return;
    if (subscriptionStatus.status === 'UNKNOWN') return;
    if (subscriptionStatus.status === 'ACTIVE') return;
    if (presentingRef.current) return;

    presentingRef.current = true;
    try {
      await registerPlacement({
        placement: PLACEMENT,
        feature: () => {
          presentingRef.current = false;
        },
      });
    } catch {
      presentingRef.current = false;
    }
  }, [hasLoadedFlag, inAppPaywallEnabled, isConfigured, subscriptionStatus, registerPlacement]);

  // Fire on mount + whenever configured/status/flag changes
  useEffect(() => {
    presentIfNeeded();
  }, [presentIfNeeded]);

  // Re-fire on background → active. Also re-fetch the flag so toggles in
  // Supabase propagate the next time the user opens the app from the tray.
  const appStateRef = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appStateRef.current.match(/inactive|background/) && next === 'active') {
        refreshFlag();
        presentIfNeeded();
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, [presentIfNeeded, refreshFlag]);

  return {
    // In dev, OR when the remote flag disables the gate, OR when the user
    // is subscribed → don't block back navigation.
    isActive: __DEV__ || !inAppPaywallEnabled || subscriptionStatus?.status === 'ACTIVE',
  };
}
