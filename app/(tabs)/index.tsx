import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
  RefreshControl,
  useWindowDimensions,
  Animated,
  InteractionManager,
} from 'react-native';
import { Image as CachedImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { fonts, spacing } from '@/constants/theme';
import { UserAvatar, VerifiedBadge, ReportForm } from '@/components';
import {
  getFriendsWithActivity,
  pokeFriend,
  getUnseenPokeCount,
  getRecentPokesByMe,
  processSeedBuddyAccepts,
  getLatestAcceptedFriendshipAt,
  type FriendActivity,
} from '@/services/api/friends';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { useUISignals } from '@/stores/uiSignalsStore';
import { getPublicWorkoutPhotos, type PublicWorkoutPhoto } from '@/services/api/workouts';
import { getNextOfficialPosts } from '@/services/api/motivationalPosts';
import { useDiscoverPrefetchStore } from '@/stores/discoverPrefetchStore';
import { pickRandomPokeMessage } from '@/constants/pokeMessages';
import { formatTimeAgo } from '@/utils/time';
import { fromKgForDisplay, getWeightUnit } from '@/utils/units';

const FORTY_EIGHT_HRS_MS = 48 * 60 * 60 * 1000;
const FOUR_HRS_MS = 4 * 60 * 60 * 1000;

// Per-user "last time the user opened the My Friends view" timestamp. Used to
// decide whether to show the red dot next to the Friends/Discover title.
const lastViewedKey = (uid: string) => `friends-activity-last-viewed-${uid}`;

async function readLastViewedMs(uid: string): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(lastViewedKey(uid));
    if (!raw) return 0;
    const t = new Date(raw).getTime();
    return Number.isFinite(t) ? t : 0;
  } catch {
    return 0;
  }
}

async function writeLastViewedNow(uid: string): Promise<void> {
  try {
    await AsyncStorage.setItem(lastViewedKey(uid), new Date().toISOString());
  } catch {}
}

function isWithin48hr(iso: string | null): boolean {
  if (!iso) return false;
  const diff = Date.now() - new Date(iso).getTime();
  return diff >= 0 && diff < FORTY_EIGHT_HRS_MS;
}

type WorkoutPost = {
  id: string;
  imageUri?: string;
  aspectRatio: number;
  username: string;
  avatarUri?: string;
  avatarVersion?: string;
  userId: string;
  caption: string;
  completedAt: string;
  titleCustomized: boolean;
  isOfficial?: boolean;
  isVerified?: boolean;
};

// Format duration seconds → "1h 2 mins" or "45 mins" (singular for 1)
function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const minLabel = m === 1 ? 'min' : 'mins';
  if (h > 0) return `${h}h ${m} ${minLabel}`;
  return `${m} ${minLabel}`;
}

// Format volume in kg or lbs
function formatVolume(kg: number | null, units: 'metric' | 'imperial'): string {
  if (kg == null) return '';
  const val = Math.round(fromKgForDisplay(kg, units));
  return `${val.toLocaleString()} ${getWeightUnit(units)}`;
}

// Format last workout date → "Monday", "Tuesday", etc.
function formatLastWorkoutDay(isoString: string | null): string {
  if (!isoString) return 'Never';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const date = new Date(isoString);
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return days[date.getDay()];
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function FriendCard({
  entry,
  units,
  index,
}: {
  entry: FriendActivity;
  units: 'metric' | 'imperial';
  index: number;
}) {
  const { width: sw } = useWindowDimensions();
  const cw = sw - 32;
  const ch = Math.round(cw * 0.51);
  const mw = Math.round(cw * 0.287);
  const mh = Math.round(mw * 1.165);
  const avatarSize = Math.round(cw * 0.19);
  const miniTop = Math.round((ch - mh) / 2);
  const rotation = index % 2 === 0 ? '1deg' : '-1deg';

  const openWorkout = () => {
    if (!entry.workoutId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push({
      pathname: '/workout-summary',
      params: {
        workoutId: entry.workoutId,
        mode: 'view',
        workoutTitle: entry.workoutName ?? '',
        imageUri: entry.imageUri ?? '',
        userName: entry.name,
        ownerUserId: entry.friendId,
        isVerified: entry.isVerified ? '1' : '0',
      },
    });
  };

  return (
    <View style={[styles.card, { width: cw, height: ch, transform: [{ rotate: rotation }] }]}>
      {/* Profile section — tapping goes to friend's profile */}
      <Pressable
        style={[styles.leftInfo, { width: Math.round(cw * 0.36) }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          router.push({
            pathname: '/profile/[userId]',
            params: {
              userId: entry.friendId,
              prefillName: entry.name,
              prefillAvatar: entry.avatarUrl ?? '',
            },
          });
        }}
      >
        <View style={{ marginBottom: 6 }}>
          <UserAvatar uri={entry.avatarUrl} size={avatarSize} />
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <Text style={styles.friendName}>{entry.name.split(' ')[0]}</Text>
          {entry.isVerified && (
            <View style={{ marginTop: 3 }}>
              <VerifiedBadge size={12} />
            </View>
          )}
        </View>
        <Text style={styles.timeAgo}>{formatTimeAgo(entry.workoutAt)}</Text>
      </Pressable>

      {/* Photo card — tapping pulls up the workout */}
      <Pressable
        style={[
          styles.photoCard,
          {
            left: Math.round(cw * 0.596),
            top: miniTop - 4,
            width: mw,
            height: mh,
            transform: [{ rotate: '7deg' }],
          },
        ]}
        onPress={openWorkout}
      >
        {entry.imageUri ? (
          <CachedImage
            source={{ uri: entry.imageUri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#C8C8C8' }]} />
        )}
      </Pressable>

      {/* Stat card — tapping pulls up the workout */}
      <Pressable
        style={[
          styles.statCard,
          {
            left: Math.round(cw * 0.364),
            top: miniTop + 4,
            width: mw,
            height: mh,
            transform: [{ rotate: '-5deg' }],
          },
        ]}
        onPress={openWorkout}
      >
        <Text style={styles.statLabel}>Workout</Text>
        <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
          {entry.workoutName ?? '—'}
        </Text>
        <Text style={styles.statLabel}>Time</Text>
        <Text style={styles.statValue}>{formatDuration(entry.durationSeconds)}</Text>
        <Text style={styles.statLabel}>Volume</Text>
        <Text style={styles.statValue}>{formatVolume(entry.volumeKg, units)}</Text>
      </Pressable>
    </View>
  );
}

function InactiveFriendRow({
  entry,
  index,
  onPoke,
  pokedAt,
}: {
  entry: FriendActivity;
  index: number;
  onPoke: (friendId: string, friendName: string) => void;
  pokedAt: string | null;
}) {
  const rotation = index % 2 === 0 ? '1deg' : '-1deg';
  const avatarSize = 56;
  const isPokedRecently = !!pokedAt && Date.now() - new Date(pokedAt).getTime() < FOUR_HRS_MS;

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 3, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        if (entry.friendId.startsWith('buddy-')) {
          router.push({
            pathname: '/profile/buddy',
            params: { buddyIndex: entry.friendId.split('-')[1] },
          });
        } else {
          router.push({
            pathname: '/profile/[userId]',
            params: {
              userId: entry.friendId,
              prefillName: entry.name,
              prefillAvatar: entry.avatarUrl ?? '',
            },
          });
        }
      }}
    >
      <Animated.View
        style={[
          styles.inactiveCard,
          { transform: [{ rotate: rotation }, { translateX: shakeAnim }] },
        ]}
      >
        <UserAvatar uri={entry.avatarUrl} size={avatarSize} />

        <View style={styles.inactiveInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.inactiveName}>{entry.name.split(' ')[0]}</Text>
            {entry.isVerified && (
              <View style={{ marginTop: 3 }}>
                <VerifiedBadge size={12} />
              </View>
            )}
          </View>
          <Text style={styles.inactiveSubtitle}>
            {entry.lastWorkoutAt
              ? `Last Workout: ${formatLastWorkoutDay(entry.lastWorkoutAt)}`
              : 'No workouts yet'}
          </Text>
        </View>

        <Pressable
          style={[styles.pokeBtn, isPokedRecently && styles.pokeBtnPoked]}
          onPress={(e) => {
            if (isPokedRecently) return;
            e.stopPropagation?.();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            triggerShake();
            onPoke(entry.friendId, entry.name.split(' ')[0]);
          }}
        >
          <Text style={[styles.pokeBtnText, isPokedRecently && styles.pokeBtnPokedText]}>
            {isPokedRecently ? 'Poked' : 'Poke'}
          </Text>
        </Pressable>
      </Animated.View>
    </Pressable>
  );
}

function renderCaption(caption: string): React.ReactNode {
  const parts = caption.split(/(@\w+)/g);
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <Text key={i} style={styles.postCaptionMention}>
        {part}
      </Text>
    ) : (
      <Text key={i}>{part}</Text>
    )
  );
}

const WorkoutPostCard = React.memo(function WorkoutPostCard({
  post,
  colWidth,
  onImageError,
  onRequestReport,
}: {
  post: WorkoutPost;
  colWidth: number;
  onImageError: (id: string) => void;
  onRequestReport: (postId: string, label: string) => void;
}) {
  const cardHeight = Math.round(colWidth * post.aspectRatio);

  const isFake = post.id.startsWith('fake-');
  if (post.isOfficial || isFake) {
    return (
      <View style={{ marginBottom: 4 }}>
        <View
          style={[
            styles.postCard,
            { height: cardHeight },
            isFake && { backgroundColor: fakeBgColor(post.id) },
          ]}
        >
          {post.imageUri ? (
            <CachedImage
              source={{ uri: post.imageUri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
              onError={() => onImageError(post.id)}
            />
          ) : null}
          <View style={styles.postUserOverlay}>
            <View style={styles.postAvatarShadow}>
              <UserAvatar uri={post.avatarUri} size={28} />
            </View>
            <Text style={styles.postUsername}>{post.username}</Text>
            {(post.isOfficial || post.isVerified) && (
              <View style={styles.verifiedBadgeShadow}>
                <VerifiedBadge size={13} />
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      style={{ marginBottom: 4 }}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        router.push({
          pathname: '/workout-summary',
          params: {
            workoutId: post.id,
            mode: 'view',
            workoutTitle: post.caption,
            imageUri: post.imageUri ?? '',
            imageAspectRatio: post.aspectRatio ? String(post.aspectRatio) : '',
            completedAt: post.completedAt,
            userName: post.username,
            userAvatarUrl: post.avatarUri ?? '',
            ownerUserId: post.userId,
            isVerified: post.isOfficial || post.isVerified ? '1' : '0',
          },
        });
      }}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onRequestReport(post.id, post.caption || post.username);
      }}
    >
      <View style={[styles.postCard, { height: cardHeight }]}>
        {post.imageUri ? (
          <CachedImage
            source={{ uri: post.imageUri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            onError={() => onImageError(post.id)}
          />
        ) : null}
        <Pressable
          style={styles.postUserOverlay}
          onPress={(e) => {
            e.stopPropagation?.();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.push({
              pathname: '/profile/[userId]',
              params: {
                userId: post.userId,
                prefillName: post.username,
                prefillAvatar: post.avatarUri ?? '',
              },
            });
          }}
        >
          <View style={styles.postAvatarShadow}>
            <UserAvatar uri={post.avatarUri} size={28} version={post.avatarVersion} />
          </View>
          <Text style={styles.postUsername}>{post.username}</Text>
          {(post.isOfficial || post.isVerified) && (
            <View style={styles.verifiedBadgeShadow}>
              <VerifiedBadge size={13} />
            </View>
          )}
        </Pressable>
      </View>
      {post.titleCustomized && (
        <Text style={styles.postCaption}>{renderCaption(post.caption)}</Text>
      )}
    </Pressable>
  );
});

const PAGE_SIZE = 20;
// Density of It Girl official posts: 1 official spliced in after every N real posts
// (so officials land at the (N+1)th, (2N+1)th, ... slot in the combined feed).
const OFFICIAL_DENSITY = 5;

// TEMP: inject fake placeholder posts to visualise feed density before there
// are real users. Set to 0 to remove. Cards render as grey boxes with varied
// sizes and are non-tappable. Seed-script-generated fake content has replaced
// these placeholders — keep at 0 unless re-enabling for layout debugging.
const DEV_FAKE_POSTS_COUNT = 0;
const FAKE_ASPECT_RATIOS = [0.85, 1.0, 1.2, 1.5, 0.95, 1.35, 1.1, 1.6, 0.8, 1.25, 1.45, 1.05];
const FAKE_NAMES = ['sophie', 'emma', 'olivia', 'ava', 'isabella', 'mia', 'lily', 'chloe'];
const FAKE_GREYS = [
  '#cfcfcf',
  '#bdbdbd',
  '#aaaaaa',
  '#d6d6d6',
  '#9c9c9c',
  '#c4c4c4',
  '#dcdcdc',
  '#b0b0b0',
];

function makeFakePosts(count: number): PublicWorkoutPhoto[] {
  return Array.from({ length: count }, (_, i) => ({
    workoutId: `fake-${i}`,
    workoutName: 'Workout',
    completedAt: new Date(Date.now() - i * 60000).toISOString(),
    imageUri: null,
    aspectRatio: FAKE_ASPECT_RATIOS[i % FAKE_ASPECT_RATIOS.length],
    userId: `fake-user-${i}`,
    userName: FAKE_NAMES[i % FAKE_NAMES.length],
    userAvatar: null,
    titleCustomized: false,
  }));
}

function fakeBgColor(postId: string): string {
  const m = postId.match(/(\d+)/);
  const idx = m ? parseInt(m[1], 10) : 0;
  return FAKE_GREYS[idx % FAKE_GREYS.length];
}

// First render only mounts this many cards (~3 rows above the fold on most
// phones). The rest reveal progressively after the screen paints so the user
// sees content immediately instead of waiting for all 20 cards to mount at once.
const INITIAL_VISIBLE_COUNT = 6;
const VISIBLE_CHUNK_SIZE = 6;

function DiscoverFeed() {
  const { width } = useWindowDimensions();
  const colWidth = Math.floor((width - 32 - 6) / 2);
  const [posts, setPosts] = useState<PublicWorkoutPhoto[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Report state — long-pressing a Discover card surfaces the ReportForm
  // with target_type='workout' and the post's workoutId.
  const [reportTarget, setReportTarget] = useState<{ id: string; label: string } | null>(null);
  const handleRequestReport = useCallback(
    (postId: string, label: string) => setReportTarget({ id: postId, label }),
    []
  );
  const isLoadingRef = useRef(false);
  const cursorRef = useRef<string | undefined>(undefined);
  const hasMoreRef = useRef(true);
  // Stable cache of officials in fetch order. cache[0] is always permutation
  // position 0 for this viewer (the RPC seed is (viewer_id, cycle_index) so
  // the same user always gets the same permutation). We never persist offsets
  // — slot K → cache[K-1] is deterministic across sessions, making each
  // "posted" official feel permanent like an Instagram post.
  const officialsCacheRef = useRef<PublicWorkoutPhoto[]>([]);
  // Count of real (non-official) items currently rendered in the feed. Resets
  // on hard refresh; increases on loadMore. Drives which cache index each
  // official slot maps to: official cache[K-1] lives after the K * DENSITY-th
  // real item, deterministically.
  const realCountRef = useRef(0);
  const scrollRef = useRef<ScrollView>(null);
  const myProfile = useUserProfileStore((s) => s.profile);
  const mySessionAvatarUri = useUserProfileStore((s) => s.sessionAvatarUri);

  // Tab-bar tap-while-focused signal: scroll to top FIRST, then trigger the
  // visible pull-to-refresh flow (Instagram-style). The scroll animation
  // completes before the RefreshControl spinner is shown so the user gets:
  // smooth glide → spinner appears at top → content swaps → spinner dismisses.
  // Initial-mount fire is suppressed so cold launch doesn't double-fetch.
  const reloadNonce = useUISignals((s) => s.discoverReloadNonce);
  const skipFirstReloadRef = useRef(true);
  useEffect(() => {
    if (skipFirstReloadRef.current) {
      skipFirstReloadRef.current = false;
      return;
    }
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    // iOS animated scrollTo settles in ~300ms for short distances and up to
    // ~500ms for long ones. 450ms is a safe sweet spot that doesn't feel laggy
    // but ensures the scroll has visually arrived at top before the spinner shows.
    const t = setTimeout(() => {
      onRefresh();
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadNonce]);

  // Ensure the officials cache contains at least `needed` items, fetching
  // from the RPC at offset = current cache length. Offset is NEVER persisted
  // across sessions: every fresh launch fetches from 0 so the same user
  // always sees the same image at the same slot.
  async function ensureOfficialsCached(needed: number): Promise<void> {
    if (!myProfile?.id) return;
    while (officialsCacheRef.current.length < needed) {
      const offset = officialsCacheRef.current.length;
      const toFetch = needed - officialsCacheRef.current.length;
      const fetched = await getNextOfficialPosts(myProfile.id, toFetch, offset);
      if (fetched.length === 0) break;
      officialsCacheRef.current.push(...fetched);
    }
  }

  // Splice cached officials into a chunk of real posts at fixed positions.
  // `realStartIdx` is the index of real[0] in the overall feed (0 on first
  // page / refresh; previous realCount on loadMore). Officials are pulled
  // from the cache by their deterministic index — never re-ordered.
  function interleaveOfficials(
    real: PublicWorkoutPhoto[],
    realStartIdx: number
  ): PublicWorkoutPhoto[] {
    const out: PublicWorkoutPhoto[] = [];
    for (let i = 0; i < real.length; i++) {
      out.push(real[i]);
      const overall1 = realStartIdx + i + 1;
      if (overall1 % OFFICIAL_DENSITY === 0) {
        const cacheIdx = overall1 / OFFICIAL_DENSITY - 1;
        const off = officialsCacheRef.current[cacheIdx];
        if (off) out.push(off);
      }
    }
    return out;
  }

  async function loadMore() {
    if (isLoadingRef.current || !hasMoreRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    const visibility = useUserPreferencesStore.getState().discoverFeedVisibility;
    const next = await getPublicWorkoutPhotos(PAGE_SIZE, cursorRef.current, visibility);
    if (next.length < PAGE_SIZE) hasMoreRef.current = false;
    const isFirstPage = cursorRef.current === undefined;
    if (next.length > 0) {
      cursorRef.current = next[next.length - 1].completedAt;
    }
    // TEMP: only inject fakes on the first page so they don't repeat across pages.
    const padded =
      isFirstPage && DEV_FAKE_POSTS_COUNT > 0
        ? [...next, ...makeFakePosts(DEV_FAKE_POSTS_COUNT)]
        : next;
    if (padded.length > 0) {
      const realStartIdx = realCountRef.current;
      realCountRef.current += padded.length;
      await ensureOfficialsCached(Math.floor(realCountRef.current / OFFICIAL_DENSITY));
      const combined = interleaveOfficials(padded, realStartIdx);
      setPosts((prev) => [...prev, ...combined]);
    }
    setLoading(false);
    isLoadingRef.current = false;
  }

  async function onRefresh() {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setRefreshing(true);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
    cursorRef.current = undefined;
    hasMoreRef.current = true;
    realCountRef.current = 0;
    const visibility = useUserPreferencesStore.getState().discoverFeedVisibility;
    // Run the posts fetch and the officials cache warm-up in parallel — they
    // don't depend on each other, so awaiting them serially just stalls refresh.
    // We pre-warm with a heuristic guess (PAGE_SIZE / OFFICIAL_DENSITY); if the
    // real count turns out smaller, we just have a few extra officials cached.
    const [fresh] = await Promise.all([
      getPublicWorkoutPhotos(PAGE_SIZE, undefined, visibility),
      ensureOfficialsCached(Math.ceil(PAGE_SIZE / OFFICIAL_DENSITY)),
    ]);
    if (fresh.length < PAGE_SIZE) hasMoreRef.current = false;
    if (fresh.length > 0) cursorRef.current = fresh[fresh.length - 1].completedAt;
    const padded =
      DEV_FAKE_POSTS_COUNT > 0 ? [...fresh, ...makeFakePosts(DEV_FAKE_POSTS_COUNT)] : fresh;
    realCountRef.current = padded.length;
    setPosts(interleaveOfficials(padded, 0));
    setRefreshing(false);
    isLoadingRef.current = false;
  }

  // Silent reload used on tab-focus — does NOT set refreshing=true so the
  // RefreshControl spinner never fires, preventing the stuck-gap layout bug.
  // Does NOT clear `posts` up front: keeping the old list visible while
  // fetching avoids a flash of blank feed (Instagram-style swap).
  async function silentReload() {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setFailedIds(new Set());
    setVisibleCount(INITIAL_VISIBLE_COUNT);
    cursorRef.current = undefined;
    hasMoreRef.current = true;
    realCountRef.current = 0;
    const visibility = useUserPreferencesStore.getState().discoverFeedVisibility;
    const fresh = await getPublicWorkoutPhotos(PAGE_SIZE, undefined, visibility);
    if (fresh.length < PAGE_SIZE) hasMoreRef.current = false;
    if (fresh.length > 0) cursorRef.current = fresh[fresh.length - 1].completedAt;
    const padded =
      DEV_FAKE_POSTS_COUNT > 0 ? [...fresh, ...makeFakePosts(DEV_FAKE_POSTS_COUNT)] : fresh;
    realCountRef.current = padded.length;
    await ensureOfficialsCached(Math.floor(realCountRef.current / OFFICIAL_DENSITY));
    setPosts(interleaveOfficials(padded, 0));
    isLoadingRef.current = false;
  }

  useEffect(() => {
    // If we have a warm prefetch from onboarding, paint instantly from cache
    // (images are already on disk via expo-image), then let loadMore() handle
    // pagination on demand. Otherwise fall back to the normal fetch.
    const {
      posts: pre,
      officials: preOff,
      prefetchedAt,
      clear,
    } = useDiscoverPrefetchStore.getState();
    if (pre.length > 0 && prefetchedAt && Date.now() - prefetchedAt < 5 * 60 * 1000) {
      officialsCacheRef.current = [...preOff];
      realCountRef.current = pre.length;
      cursorRef.current = pre[pre.length - 1]?.completedAt;
      hasMoreRef.current = pre.length >= PAGE_SIZE;
      setPosts(interleaveOfficials(pre, 0));
      clear();
      return;
    }
    loadMore();
  }, []);

  // Progressive render: once posts arrive, reveal cards in chunks after each
  // paint so React doesn't mount all ~20 WorkoutPostCards in one blocking pass.
  // The first INITIAL_VISIBLE_COUNT paint immediately; the rest get scheduled
  // through InteractionManager so the visible portion lands first.
  useEffect(() => {
    if (visibleCount >= posts.length) return;
    const task = InteractionManager.runAfterInteractions(() => {
      setVisibleCount((c) => Math.min(posts.length, c + VISIBLE_CHUNK_SIZE));
    });
    return () => task.cancel();
  }, [visibleCount, posts.length]);

  // Reload the feed when the user flips Public ↔ Friends Only. Subscribing
  // directly to the store (instead of a useEffect on a selector value) avoids
  // first-render-skip bugs and survives remounts.
  useEffect(() => {
    const unsub = useUserPreferencesStore.subscribe((state, prev) => {
      if (state.discoverFeedVisibility !== prev.discoverFeedVisibility) {
        silentReload();
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If the initial loadMore ran before myProfile hydrated, the officials cache
  // is empty and the feed contains only real items. Once the profile id
  // arrives, fetch officials and re-splice them in at their stable slots.
  const officialsBackfilledRef = useRef(false);
  useEffect(() => {
    if (!myProfile?.id || officialsBackfilledRef.current) return;
    if (officialsCacheRef.current.length > 0 || realCountRef.current === 0) return;
    officialsBackfilledRef.current = true;
    (async () => {
      await ensureOfficialsCached(Math.floor(realCountRef.current / OFFICIAL_DENSITY));
      if (officialsCacheRef.current.length === 0) return;
      setPosts((prev) =>
        interleaveOfficials(
          prev.filter((p) => !p.isOfficial),
          0
        )
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myProfile?.id, posts.length]);

  const handleImageError = useCallback((id: string) => {
    setFailedIds((prev) => new Set([...prev, id]));
  }, []);

  const mappedPosts = useMemo<WorkoutPost[]>(
    () =>
      posts.map((p) => {
        const effectiveImageUri = failedIds.has(p.workoutId)
          ? undefined
          : (p.imageUri ?? undefined);
        const isOfficial = !!p.isOfficial;
        return {
          id: p.workoutId,
          imageUri: effectiveImageUri,
          aspectRatio: effectiveImageUri ? (p.aspectRatio ?? 1.2) : 1.25,
          username: isOfficial
            ? (p.userName ?? 'It Girl')
            : p.userId === myProfile?.id
              ? (myProfile?.name ?? p.userName ?? 'Anonymous')
              : (p.userName ?? 'Anonymous'),
          avatarUri: isOfficial
            ? (p.userAvatar ?? undefined)
            : p.userId === myProfile?.id
              ? (mySessionAvatarUri ?? myProfile?.avatar_url ?? undefined)
              : (p.userAvatar ?? undefined),
          avatarVersion:
            !isOfficial && p.userId === myProfile?.id
              ? (myProfile?.updated_at ?? undefined)
              : undefined,
          userId: p.userId,
          caption: p.workoutName ?? 'Workout',
          completedAt: p.completedAt,
          titleCustomized: p.titleCustomized,
          isOfficial,
          isVerified: !isOfficial && !!p.isVerified,
        };
      }),
    [
      posts,
      failedIds,
      myProfile?.id,
      myProfile?.name,
      myProfile?.avatar_url,
      myProfile?.updated_at,
      mySessionAvatarUri,
    ]
  );

  // Masonry: place each card into whichever column currently has the lower
  // running total height. The two newest posts still anchor the top (both
  // columns start at 0 so post 0 → left, post 1 → right). From post 2 onwards
  // we optimise for balanced columns instead of strict chronology.
  // Only iterate over the currently-revealed slice — the column assignment for
  // posts 0..N is deterministic from those posts alone, so growing the slice
  // only ever appends to the columns (no reflow).
  const { leftPosts, rightPosts } = useMemo(() => {
    const GAP = 8;
    const left: WorkoutPost[] = [];
    const right: WorkoutPost[] = [];
    let leftH = 0;
    let rightH = 0;
    for (const p of mappedPosts.slice(0, visibleCount)) {
      const cardH = colWidth * p.aspectRatio;
      if (leftH <= rightH) {
        left.push(p);
        leftH += cardH + GAP;
      } else {
        right.push(p);
        rightH += cardH + GAP;
      }
    }
    return { leftPosts: left, rightPosts: right };
  }, [mappedPosts, visibleCount, colWidth]);

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      contentContainerStyle={styles.discoverScrollContent}
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustContentInsets={false}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={200}
      onScroll={({ nativeEvent: { layoutMeasurement, contentOffset, contentSize } }) => {
        if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 400) loadMore();
      }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />
      }
    >
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <View style={{ flex: 1, gap: 8 }}>
          {leftPosts.map((p) => (
            <WorkoutPostCard
              key={p.id}
              post={p}
              colWidth={colWidth}
              onImageError={handleImageError}
              onRequestReport={handleRequestReport}
            />
          ))}
        </View>
        <View style={{ flex: 1, gap: 8 }}>
          {rightPosts.map((p) => (
            <WorkoutPostCard
              key={p.id}
              post={p}
              colWidth={colWidth}
              onImageError={handleImageError}
              onRequestReport={handleRequestReport}
            />
          ))}
        </View>
      </View>

      <ReportForm
        visible={!!reportTarget}
        onClose={() => setReportTarget(null)}
        targetType="workout"
        targetId={reportTarget?.id ?? ''}
        targetLabel={reportTarget?.label}
      />
    </ScrollView>
  );
}

export default function FriendsScreen() {
  const { top } = useSafeAreaInsets();
  const profile = useUserProfileStore((s) => s.profile);
  const userId = profile?.id ?? '';
  const units = useUserPreferencesStore((s) => (s.weightUnit === 'lbs' ? 'imperial' : 'metric'));

  const refreshProfile = useUserProfileStore((s) => s.refreshProfile);

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [refreshProfile])
  );

  const [activeView, setActiveView] = useState<'friends' | 'discover'>('discover');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [allFriends, setAllFriends] = useState<FriendActivity[]>([]);
  const [unseenPokes, setUnseenPokes] = useState(0);
  const [recentPokesMap, setRecentPokesMap] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [hasUnseen, setHasUnseen] = useState(false);

  const loadFriends = useCallback(async () => {
    if (!userId) return;
    // Flip any ripe seed-buddy auto-accepts first so the list reflects them.
    await processSeedBuddyAccepts().catch(() => {});
    const [friends, pokeCount, myPokes, latestAcceptedAt, lastViewedMs] = await Promise.all([
      getFriendsWithActivity(userId),
      getUnseenPokeCount(userId),
      getRecentPokesByMe(userId),
      getLatestAcceptedFriendshipAt(userId),
      readLastViewedMs(userId),
    ]);
    setAllFriends(friends);
    setUnseenPokes(pokeCount);
    setRecentPokesMap(myPokes);

    const acceptedTs = latestAcceptedAt ? new Date(latestAcceptedAt).getTime() : 0;
    const workoutTs = friends.reduce((max, f) => {
      const t = f.workoutAt ? new Date(f.workoutAt).getTime() : 0;
      return t > max ? t : max;
    }, 0);
    setHasUnseen(acceptedTs > lastViewedMs || workoutTs > lastViewedMs);
  }, [userId]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  // Always refresh on focus so the red-dot recomputes against any accepts/
  // workouts that happened while the user was on another screen — including
  // auto-accepts triggered from /add-friends (where processSeedBuddyAccepts
  // already fired earlier and would return 0 here). loadFriends internally
  // calls processSeedBuddyAccepts before fetching the latest state.
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      loadFriends();
    }, [userId, loadFriends])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFriends();
    setRefreshing(false);
  };

  const handlePoke = async (friendId: string, _friendName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 80);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 160);
    setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 280);
    const nowIso = new Date().toISOString();
    setRecentPokesMap((prev) => ({ ...prev, [friendId]: nowIso }));
    if (friendId.startsWith('buddy-')) return;
    const msg = pickRandomPokeMessage();
    const ok = await pokeFriend(userId, friendId, msg);
    if (!ok) {
      setRecentPokesMap((prev) => {
        const next = { ...prev };
        delete next[friendId];
        return next;
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: top + 4 }]}>
        <Pressable
          style={styles.titleRow}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setDropdownOpen((v) => !v);
          }}
        >
          {hasUnseen && <View style={styles.titleDot} />}
          <Text style={styles.title}>{activeView === 'friends' ? 'My Friends' : 'Discover'}</Text>
          <View style={[styles.dropArrow, dropdownOpen && styles.dropArrowUp]} />
        </Pressable>

        <View style={styles.headerIcons}>
          {/* Add friend button (with poke notification dot) */}
          <Pressable
            style={styles.iconBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              router.push('/add-friends');
            }}
          >
            <Ionicons name="person-add-outline" size={20} color="#000" />
            {unseenPokes > 0 && (
              <View style={styles.notifDot}>
                <Text style={styles.notifDotText}>{unseenPokes > 9 ? '9+' : unseenPokes}</Text>
              </View>
            )}
          </Pressable>

          {/* Discover settings */}
          <Pressable
            style={styles.iconBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              router.push('/discover-settings');
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#000" />
          </Pressable>
        </View>
      </View>

      {activeView === 'friends' ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />
          }
        >
          {allFriends.length === 0 ? (
            <View style={styles.emptyFriendsContainer}>
              <Ionicons name="people-outline" size={48} color="rgba(0,0,0,0.25)" />
              <Text style={styles.emptyFriendsTitle}>No friends yet</Text>
              <Text style={styles.emptyFriendsSubtitle}>Tap the + icon above to add friends.</Text>
            </View>
          ) : (
            allFriends.map((f, i) =>
              isWithin48hr(f.workoutAt) && f.workoutId ? (
                <FriendCard key={f.friendId} entry={f} units={units} index={i} />
              ) : (
                <InactiveFriendRow
                  key={f.friendId}
                  entry={f}
                  index={i}
                  onPoke={handlePoke}
                  pokedAt={recentPokesMap[f.friendId] ?? null}
                />
              )
            )
          )}
        </ScrollView>
      ) : (
        <DiscoverFeed />
      )}

      {/* Dropdown — rendered last so the backdrop sits on top of all other
          content and any outside tap (including inside the scroll area)
          closes the menu. */}
      {dropdownOpen && (
        <>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              setDropdownOpen(false);
            }}
          />
          <View style={[styles.dropdown, { top: top + 56 }]}>
            {(['discover', 'friends'] as const).map((v) => (
              <Pressable
                key={v}
                style={styles.dropdownOption}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  if (v === 'friends') {
                    writeLastViewedNow(userId).catch(() => {});
                    setHasUnseen(false);
                  }
                  setActiveView(v);
                  setDropdownOpen(false);
                }}
              >
                {v === 'friends' && hasUnseen && <View style={styles.titleDot} />}
                <Text
                  style={[
                    styles.dropdownOptionText,
                    activeView === v && styles.dropdownOptionActive,
                  ]}
                >
                  {v === 'friends' ? 'My Friends' : 'Discover'}
                </Text>
                {activeView === v && <Ionicons name="checkmark" size={18} color="#000000" />}
              </Pressable>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
    color: '#000',
    letterSpacing: -0.3,
  },
  dropArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#000000',
    marginTop: 3,
  },
  dropArrowUp: {
    transform: [{ rotate: '180deg' }],
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  iconBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  titleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  notifDotText: {
    fontFamily: fonts.bold,
    fontSize: 8,
    color: '#fff',
    lineHeight: 10,
  },
  dropdown: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dropdownOptionText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: '#000000',
  },
  dropdownOptionActive: {
    color: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 140,
    gap: 20,
    alignItems: 'center',
  },
  emptyFriendsContainer: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
    gap: 10,
  },
  emptyFriendsTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 17,
    color: '#000',
    marginTop: 8,
  },
  emptyFriendsSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: 'rgba(0,0,0,0.55)',
    textAlign: 'center',
  },

  // Active friend cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 46,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  leftInfo: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
    gap: 2,
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatarInitial: {
    fontFamily: fonts.bold,
    color: '#FFFFFF',
  },
  friendName: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: '#000000',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  timeAgo: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  photoCard: {
    position: 'absolute',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  statCard: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  statLabel: {
    fontFamily: fonts.instrumentSerif,
    fontSize: 10,
    color: '#000000',
    textAlign: 'center',
    marginTop: 4,
  },
  statValue: {
    fontFamily: fonts.frauncesBold,
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
    letterSpacing: -0.3,
  },

  // Inactive friend rows
  inactiveCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  inactiveInfo: {
    flex: 1,
  },
  inactiveName: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#000',
    letterSpacing: -0.3,
  },
  inactiveSubtitle: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  pokeBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
  },
  pokeBtnText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: 'rgba(0,0,0,0.7)',
  },
  pokeBtnPoked: {
    backgroundColor: '#000000',
  },
  pokeBtnPokedText: {
    color: '#FFFFFF',
  },
  // Discover feed
  discoverScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
  postCard: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
  },
  postCardNoPhoto: {
    backgroundColor: '#1A1A1A',
  },
  postNoPhotoContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  postNoPhotoLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  postUserOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postAvatarShadow: {
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  postUsername: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  verifiedBadgeShadow: {
    marginLeft: -2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  postCaption: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(0,0,0,0.75)',
    marginTop: 5,
    letterSpacing: -0.2,
  },
  postCaptionMention: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: 'rgba(0,0,0,0.75)',
    letterSpacing: -0.2,
  },
});
