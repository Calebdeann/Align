import { create } from 'zustand';
import { Image } from 'expo-image';
import { getPublicWorkoutPhotos, type PublicWorkoutPhoto } from '@/services/api/workouts';
import { getNextOfficialPosts } from '@/services/api/motivationalPosts';

// Prefetch the first page of the discover feed (posts + officials + image
// bytes) before the user reaches /(tabs). This lets the discover feed render
// instantly during the brief window the user sees the app before the
// PaywallGate covers it.
//
// Lives in memory only — never persisted. Idempotent: re-calling hydrate()
// within FRESHNESS_MS is a no-op so personalising → pre-paywall can both
// safely fire it.

const FRESHNESS_MS = 60_000;
const POSTS_LIMIT = 20;
const OFFICIALS_LIMIT = 4;

interface DiscoverPrefetchState {
  posts: PublicWorkoutPhoto[];
  officials: PublicWorkoutPhoto[];
  prefetchedAt: number | null;
  hydrate: (viewerId: string | undefined | null) => Promise<void>;
  clear: () => void;
}

export const useDiscoverPrefetchStore = create<DiscoverPrefetchState>((set, get) => ({
  posts: [],
  officials: [],
  prefetchedAt: null,

  hydrate: async (viewerId) => {
    const { prefetchedAt } = get();
    if (prefetchedAt && Date.now() - prefetchedAt < FRESHNESS_MS) return;

    try {
      const [posts, officials] = await Promise.all([
        getPublicWorkoutPhotos(POSTS_LIMIT, undefined, 'public'),
        viewerId
          ? getNextOfficialPosts(viewerId, OFFICIALS_LIMIT, 0)
          : Promise.resolve([] as PublicWorkoutPhoto[]),
      ]);

      const urls = [...posts, ...officials].map((p) => p.imageUri).filter((u): u is string => !!u);
      if (urls.length > 0) {
        Image.prefetch(urls).catch(() => {});
      }

      set({ posts, officials, prefetchedAt: Date.now() });
    } catch {
      // best-effort; feed will fall back to normal load
    }
  },

  clear: () => set({ posts: [], officials: [], prefetchedAt: null }),
}));
