import { create } from 'zustand';
import { supabase } from '@/services/supabase';

// Remote feature flags fetched from the `app_config` Supabase table.
// First flag: in_app_paywall_enabled. When true, the global PaywallGate
// re-presents Superwall on every (tabs) mount for non-subscribed users.
// When false, signed-in users stay in the app freely.
//
// Default is FALSE so a fetch failure (or unmigrated DB) errs on the side
// of NOT blocking users — important for the first App Store submission
// where the onboarding paywall is the only paywall surface.

interface AppConfigState {
  inAppPaywallEnabled: boolean;
  hasLoaded: boolean;
  refresh: () => Promise<void>;
}

export const useAppConfigStore = create<AppConfigState>((set) => ({
  inAppPaywallEnabled: false,
  hasLoaded: false,
  refresh: async () => {
    try {
      const { data, error } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'in_app_paywall_enabled')
        .maybeSingle();
      if (error) {
        // Network/RLS error: keep current value, mark loaded so consumers
        // don't spin forever. Safer to leave the gate off than to flicker.
        set({ hasLoaded: true });
        return;
      }
      const enabled = data?.value === true;
      set({ inAppPaywallEnabled: enabled, hasLoaded: true });
    } catch {
      set({ hasLoaded: true });
    }
  },
}));
