import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fonts } from '@/constants/theme';
import { UserAvatar, VerifiedBadge } from '@/components';
import {
  getPendingRequests,
  getSuggestedUsers,
  acceptFriendRequest,
  declineFriendRequest,
  sendFriendRequest,
  cancelFriendRequest,
  getPokesReceived,
  markPokesAsSeen,
  type PendingRequest,
  type SuggestedUser,
  type PokeReceived,
} from '@/services/api/friends';
import { getPublicWorkouts } from '@/services/api/publicProfile';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { formatTimeAgo } from '@/utils/time';
import { TRAIT_CATEGORIES, type PlacedTrait } from '@/constants/traits';

// Number of recent workout photos to show per card.
const PHOTOS_PER_USER = 3;

// Silent rate limit on the Suggestions refresh button: max 3 refreshes per
// rolling 1-hour window per user. When exceeded, the button no-ops — no toast,
// no error message, no visual change. Persisted in AsyncStorage so closing the
// app doesn't reset it.
const SUGGESTIONS_REFRESH_LIMIT = 3;
const SUGGESTIONS_REFRESH_WINDOW_MS = 60 * 60 * 1000;
const suggestionsRefreshKey = (userId: string) => `suggestions-refresh-${userId}`;

async function recordSuggestionsRefreshIfAllowed(userId: string): Promise<boolean> {
  if (!userId) return false;
  const key = suggestionsRefreshKey(userId);
  let stamps: number[] = [];
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) stamps = parsed.filter((n) => typeof n === 'number');
    }
  } catch {
    // Corrupt entry — treat as empty.
  }
  const now = Date.now();
  stamps = stamps.filter((t) => now - t < SUGGESTIONS_REFRESH_WINDOW_MS);
  if (stamps.length >= SUGGESTIONS_REFRESH_LIMIT) {
    // Persist the pruned list so storage doesn't grow forever.
    AsyncStorage.setItem(key, JSON.stringify(stamps)).catch(() => {});
    return false;
  }
  stamps.push(now);
  AsyncStorage.setItem(key, JSON.stringify(stamps)).catch(() => {});
  return true;
}

// Fetch the most recent N workout photos for a batch of users in parallel.
// Returns a map keyed by userId. Users with no photos are simply absent from
// the map (the photo row will not render).
async function fetchPhotosForUsers(
  viewerId: string,
  userIds: string[]
): Promise<Record<string, string[]>> {
  if (!viewerId || userIds.length === 0) return {};
  // Use allSettled so one failed user fetch doesn't kill the whole batch.
  const settled = await Promise.allSettled(
    userIds.map(async (id) => {
      const workouts = await getPublicWorkouts(viewerId, id);
      const photos = workouts
        .filter((w) => !!w.imageUri)
        .slice(0, PHOTOS_PER_USER)
        .map((w) => w.imageUri as string);
      return [id, photos] as const;
    })
  );
  const out: Record<string, string[]> = {};
  for (const result of settled) {
    if (result.status === 'fulfilled') {
      const [id, photos] = result.value;
      if (photos.length > 0) out[id] = photos;
    }
  }
  return out;
}

const PHOTO_W = 98;
const PHOTO_H = 118;
const PHOTO_ROTATIONS = ['0.5deg', '2deg', '0deg'] as const;

// ─── Trait pill ──────────────────────────────────────────────────────────────

function TraitPill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.traitPill, { backgroundColor: color }]}>
      <Text style={styles.traitText}>{label}</Text>
    </View>
  );
}

// ─── Workout photo row ───────────────────────────────────────────────────────
// Renders the user's most recent workout photos as polaroid-style tilted cards.
// If the user has no photos, the row renders nothing — no placeholder squares.

function WorkoutPhotoRow({ photos }: { photos: string[] }) {
  if (photos.length === 0) return null;
  return (
    <View style={styles.photoRow}>
      {photos.slice(0, PHOTO_ROTATIONS.length).map((uri, i) => (
        <Image
          key={i}
          source={{ uri }}
          style={[styles.photoCard, { transform: [{ rotate: PHOTO_ROTATIONS[i] }] }]}
          contentFit="cover"
        />
      ))}
    </View>
  );
}

// ─── Poke row ────────────────────────────────────────────────────────────────

function PokeRow({ poke }: { poke: PokeReceived }) {
  return (
    <Pressable
      style={styles.pokeRow}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        router.push({
          pathname: '/profile/[userId]',
          params: {
            userId: poke.senderId,
            prefillName: poke.senderName,
            prefillAvatar: poke.senderAvatar ?? '',
          },
        });
      }}
    >
      <UserAvatar uri={poke.senderAvatar} size={52} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.pokeRowName} numberOfLines={1}>
          {poke.senderName} poked you
        </Text>
        {poke.message ? (
          <Text style={styles.pokeRowMessage} numberOfLines={2}>
            &ldquo;{poke.message}&rdquo;
          </Text>
        ) : null}
        <Text style={styles.pokeRowTime}>{formatTimeAgo(poke.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

// ─── Request card ─────────────────────────────────────────────────────────────

type RequestCardProps = {
  req: PendingRequest;
  index: number;
  photos: string[];
  onAccept: () => void;
  onDecline: () => void;
};

function RequestCard({ req, index, photos, onAccept, onDecline }: RequestCardProps) {
  const rotation = index % 2 === 0 ? '1deg' : '-1deg';
  const traits = (req.requesterTraits ?? []) as PlacedTrait[];

  return (
    <View style={[styles.card, { transform: [{ rotate: rotation }] }]}>
      <View style={styles.cardTop}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.push({
              pathname: '/profile/[userId]',
              params: {
                userId: req.requesterId,
                prefillName: req.requesterName,
                prefillAvatar: req.requesterAvatar ?? '',
              },
            });
          }}
          hitSlop={4}
        >
          <UserAvatar uri={req.requesterAvatar} size={88} />
        </Pressable>
        <Pressable
          style={styles.cardInfo}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.push({
              pathname: '/profile/[userId]',
              params: {
                userId: req.requesterId,
                prefillName: req.requesterName,
                prefillAvatar: req.requesterAvatar ?? '',
              },
            });
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.cardName} numberOfLines={1}>
              {req.requesterName}
            </Text>
            {req.requesterIsVerified && (
              <View style={{ marginTop: 4 }}>
                <VerifiedBadge size={13} />
              </View>
            )}
          </View>
          {req.requesterBio ? (
            <Text style={styles.cardBio} numberOfLines={1}>
              {req.requesterBio}
            </Text>
          ) : null}
        </Pressable>
        <View style={styles.cardActions}>
          <Pressable
            style={styles.actionBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              onAccept();
            }}
          >
            <LinearGradient
              colors={['#262626', '#000000']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.actionGradient}
            >
              <Text style={styles.actionText}>Accept</Text>
            </LinearGradient>
          </Pressable>
          <Pressable
            style={styles.declineBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              onDecline();
            }}
            hitSlop={8}
          >
            <Ionicons name="close" size={20} color="rgba(0,0,0,0.4)" />
          </Pressable>
        </View>
      </View>
      {traits.length > 0 && (
        <View style={styles.traitRow}>
          {traits.slice(0, 5).map((t, i) => {
            const cat = TRAIT_CATEGORIES.find((c) => c.id === t.categoryId);
            return <TraitPill key={i} label={t.tag} color={cat?.color ?? '#f0f0f0'} />;
          })}
        </View>
      )}
      <WorkoutPhotoRow photos={photos} />
    </View>
  );
}

// ─── Suggestion card ──────────────────────────────────────────────────────────

type SuggestionCardProps = {
  user: SuggestedUser;
  index: number;
  requested: boolean;
  photos: string[];
  onAdd: () => void;
  onCancel: () => void;
};

function SuggestionCard({ user, index, requested, photos, onAdd, onCancel }: SuggestionCardProps) {
  const rotation = index % 2 === 0 ? '-1deg' : '1deg';
  const traits = (user.traits ?? []) as PlacedTrait[];

  return (
    <View style={[styles.card, { transform: [{ rotate: rotation }] }]}>
      <View style={styles.cardTop}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.push({
              pathname: '/profile/[userId]',
              params: {
                userId: user.id,
                prefillName: user.name,
                prefillAvatar: user.avatarUrl ?? '',
              },
            });
          }}
          hitSlop={4}
        >
          <UserAvatar uri={user.avatarUrl} size={88} />
        </Pressable>
        <Pressable
          style={styles.cardInfo}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.push({
              pathname: '/profile/[userId]',
              params: {
                userId: user.id,
                prefillName: user.name,
                prefillAvatar: user.avatarUrl ?? '',
              },
            });
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.cardName} numberOfLines={1}>
              {user.name}
            </Text>
            {user.isVerified && (
              <View style={{ marginTop: 4 }}>
                <VerifiedBadge size={13} />
              </View>
            )}
          </View>
          {user.bio ? (
            <Text style={styles.cardBio} numberOfLines={1}>
              {user.bio}
            </Text>
          ) : null}
        </Pressable>
        <Pressable
          style={styles.actionBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            requested ? onCancel() : onAdd();
          }}
        >
          {requested ? (
            <View style={styles.requestedPill}>
              <Text style={styles.requestedText}>Requested</Text>
            </View>
          ) : (
            <LinearGradient
              colors={['#262626', '#000000']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.actionGradient}
            >
              <Text style={styles.actionText}>Add</Text>
            </LinearGradient>
          )}
        </Pressable>
      </View>
      {traits.length > 0 && (
        <View style={styles.traitRow}>
          {traits.slice(0, 5).map((t, i) => {
            const cat = TRAIT_CATEGORIES.find((c) => c.id === t.categoryId);
            return <TraitPill key={i} label={t.tag} color={cat?.color ?? '#f0f0f0'} />;
          })}
        </View>
      )}
      <WorkoutPhotoRow photos={photos} />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AddFriendsScreen() {
  const insets = useSafeAreaInsets();
  const userId = useUserProfileStore((s) => s.profile?.id ?? '');

  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [pokes, setPokes] = useState<PokeReceived[]>([]);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const [photosByUserId, setPhotosByUserId] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const [reqs, sugs, pks] = await Promise.all([
        getPendingRequests(userId),
        getSuggestedUsers(userId),
        getPokesReceived(userId),
      ]);
      // Fetch recent photos for every user that needs a photo row, in parallel.
      const ids = [...sugs.map((s) => s.id), ...reqs.map((r) => r.requesterId)];
      const photos = await fetchPhotosForUsers(userId, ids);
      setRequests(reqs);
      setSuggestions(sugs);
      setPokes(pks);
      setPhotosByUserId(photos);
      setLoading(false);
      // Clear the red dot — pokes are now visible on this screen.
      markPokesAsSeen(userId);
    })();
  }, [userId]);

  const handleAccept = useCallback(async (req: PendingRequest) => {
    const ok = await acceptFriendRequest(req.id);
    if (ok) setRequests((prev) => prev.filter((r) => r.id !== req.id));
  }, []);

  const handleDecline = useCallback(async (req: PendingRequest) => {
    const ok = await declineFriendRequest(req.id);
    if (ok) setRequests((prev) => prev.filter((r) => r.id !== req.id));
  }, []);

  const handleAdd = useCallback(
    async (user: SuggestedUser) => {
      const ok = await sendFriendRequest(userId, user.id);
      if (ok) setRequestedIds((prev) => new Set([...prev, user.id]));
    },
    [userId]
  );

  const handleCancel = useCallback(
    async (user: SuggestedUser) => {
      setRequestedIds((prev) => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
      const ok = await cancelFriendRequest(userId, user.id);
      if (!ok) setRequestedIds((prev) => new Set([...prev, user.id]));
    },
    [userId]
  );

  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    // Silently swallow further refreshes once the rolling-hour quota is spent.
    const allowed = await recordSuggestionsRefreshIfAllowed(userId);
    if (!allowed) return;
    setRefreshing(true);
    const sugs = await getSuggestedUsers(userId);
    const photos = await fetchPhotosForUsers(
      userId,
      sugs.map((s) => s.id)
    );
    setSuggestions(sugs);
    // Merge — keep existing request-card photos, replace suggestion photos.
    setPhotosByUserId((prev) => ({ ...prev, ...photos }));
    setRequestedIds(new Set());
    setRefreshing(false);
  }, [userId]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.back();
          }}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>Add Friends</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#000" />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        >
          {/* Pokes section */}
          {pokes.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Pokes</Text>
              {pokes.map((p) => (
                <PokeRow key={p.id} poke={p} />
              ))}
            </>
          )}

          {/* Requests section */}
          {requests.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Requests</Text>
              {requests.map((req, i) => (
                <RequestCard
                  key={req.id}
                  req={req}
                  index={i}
                  photos={photosByUserId[req.requesterId] ?? []}
                  onAccept={() => handleAccept(req)}
                  onDecline={() => handleDecline(req)}
                />
              ))}
            </>
          )}

          {/* Suggestions section */}
          <View style={styles.suggestionsHeader}>
            <Text style={styles.sectionLabel}>Suggestions</Text>
            <Pressable
              onPress={handleRefresh}
              hitSlop={8}
              style={{ opacity: refreshing ? 0.4 : 1 }}
              disabled={refreshing}
            >
              <Ionicons name="refresh" size={22} color="rgba(0,0,0,0.5)" />
            </Pressable>
          </View>

          {suggestions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No suggestions right now.</Text>
              <Text style={styles.emptySubtext}>Check back later or invite friends!</Text>
            </View>
          ) : (
            suggestions.map((user, i) => (
              <SuggestionCard
                key={user.id}
                user={user}
                index={i}
                requested={requestedIds.has(user.id)}
                photos={photosByUserId[user.id] ?? []}
                onAdd={() => handleAdd(user)}
                onCancel={() => handleCancel(user)}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 26,
    color: '#000',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: 'rgba(0,0,0,0.5)',
    marginBottom: 2,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  // ─── Poke row ──────────────────────────────────────────────────────────────
  pokeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  pokeRowName: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#000',
    letterSpacing: -0.3,
  },
  pokeRowMessage: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: '#333',
    letterSpacing: -0.2,
  },
  pokeRowTime: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: '#999',
  },
  // ─── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    paddingHorizontal: 20,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 15,
    elevation: 8,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardInfo: {
    flex: 1,
    gap: 3,
  },
  cardName: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: '#000',
    letterSpacing: -0.4,
  },
  cardBio: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: '#666',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    borderRadius: 500,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionGradient: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 500,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  actionText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#fff',
  },
  requestedPill: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 500,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    backgroundColor: '#F0F0F0',
  },
  requestedText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: 'rgba(0,0,0,0.35)',
  },
  declineBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  // ─── Traits ────────────────────────────────────────────────────────────────
  traitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
  },
  traitPill: {
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  traitText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: '#000',
    letterSpacing: -0.2,
  },
  // ─── Workout placeholders ──────────────────────────────────────────────────
  photoRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  photoCard: {
    width: PHOTO_W,
    height: PHOTO_H,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  // ─── Avatar fallback ───────────────────────────────────────────────────────
  avatarFallback: {
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: fonts.bold,
    color: '#555',
  },
  // ─── Empty state ───────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 6,
  },
  emptyText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#000',
  },
  emptySubtext: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: '#888',
  },
});
