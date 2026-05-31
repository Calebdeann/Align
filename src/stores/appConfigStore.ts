import { create } from 'zustand';
import { supabase } from '@/services/supabase';

// Remote feature flags fetched from the `app_config` Supabase table.
// First flag: in_app_paywall_enabled. When true, the global PaywallGate
// re-presents Superwall on every (tabs) mount for non-subscribed users.
// When false, signed-in users stay in the app freely.
//
// Second flag: apple_review_mode. When true, the onboarding paywall
// (app/onboarding/pre-paywall.tsx) lets a user proceed into /(tabs)
// after dismissing the Superwall sheet, so App Review reviewers aren't
// stranded. Flip to false in the Supabase dashboard once Apple approves.
//
// Default is FALSE for both so a fetch failure (or unmigrated DB) errs
// on the side of NOT bypassing paywalls.

interface AppConfigState {
  inAppPaywallEnabled: boolean;
  appleReviewMode: boolean;
  hasLoaded: boolean;
  refresh: () => Promise<void>;
}

export const useAppConfigStore = create<AppConfigState>((set) => ({
  inAppPaywallEnabled: false,
  appleReviewMode: false,
  hasLoaded: false,
  refresh: async () => {
    try {
      const { data, error } = await supabase
        .from('app_config')
        .select('key, value')
        .in('key', ['in_app_paywall_enabled', 'apple_review_mode']);
      if (error) {
        // Network/RLS error: keep current values, mark loaded so consumers
        // don't spin forever. Safer to leave gates off than to flicker.
        set({ hasLoaded: true });
        return;
      }
      const byKey: Record<string, unknown> = {};
      for (const row of data ?? []) byKey[row.key] = row.value;
      set({
        inAppPaywallEnabled: byKey['in_app_paywall_enabled'] === true,
        appleReviewMode: byKey['apple_review_mode'] === true,
        hasLoaded: true,
      });
    } catch {
      set({ hasLoaded: true });
    }
  },
}));
