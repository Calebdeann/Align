import { create } from 'zustand';

// Ephemeral, in-memory signals that bridge unrelated parts of the UI.
// Bump a nonce when something out-of-tree (e.g. a tab-bar listener) needs
// to nudge a deeply-nested component to react, without prop-drilling.
type UISignalsState = {
  discoverReloadNonce: number;
  requestDiscoverReload: () => void;
};

export const useUISignals = create<UISignalsState>((set) => ({
  discoverReloadNonce: 0,
  requestDiscoverReload: () => set((s) => ({ discoverReloadNonce: s.discoverReloadNonce + 1 })),
}));
