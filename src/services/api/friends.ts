import { supabase } from '../supabase';

// Helper: retry a supabase call once if fetch throws (transient network failure).
// Prevents raw TypeErrors from bubbling up to LogBox as red console errors.
async function callRpcWithRetry<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    await new Promise((r) => setTimeout(r, 600));
    try {
      return await fn();
    } catch {
      return fallback;
    }
  }
}

export type FriendActivity = {
  friendId: string;
  name: string;
  avatarUrl: string | null;
  isActive: boolean;
  workoutId: string | null;
  workoutName: string | null;
  durationSeconds: number | null;
  volumeKg: number | null;
  workoutAt: string | null;
  lastWorkoutAt: string | null;
  imageUri: string | null;
  imageAudience: string | null;
};

export type PendingRequest = {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterAvatar: string | null;
  requesterBio: string | null;
  requesterTraits: any[];
};

export type SuggestedUser = {
  id: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  traits: any[];
};

export type PokeReceived = {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  message: string | null;
  createdAt: string;
  seen: boolean;
};

// Get all accepted friends sorted by most recent workout first (no "today only" gate).
export async function getFriendsWithActivity(userId: string): Promise<FriendActivity[]> {
  const { data, error } = await callRpcWithRetry(
    () => supabase.rpc('get_friends_with_activity', { p_user_id: userId }),
    { data: [], error: null } as any
  );

  if (error) {
    console.warn('getFriendsWithActivity error:', error);
    return [];
  }

  const friends: FriendActivity[] = (data ?? []).map((row: any) => ({
    friendId: row.friend_id,
    name: row.friend_name ?? 'Friend',
    avatarUrl: row.friend_avatar ?? null,
    isActive: row.is_active ?? false,
    workoutId: row.workout_id ?? null,
    workoutName: row.workout_name ?? null,
    durationSeconds: row.duration_seconds ?? null,
    volumeKg: row.volume_kg != null ? Number(row.volume_kg) : null,
    workoutAt: row.workout_at ?? null,
    lastWorkoutAt: row.last_workout_at ?? null,
    imageUri: row.image_uri ?? null,
    imageAudience: row.image_audience ?? null,
  }));

  // Sort by most recent workout first; friends with no workouts at the bottom.
  return friends.sort((a, b) => {
    if (!a.workoutAt && !b.workoutAt) return 0;
    if (!a.workoutAt) return 1;
    if (!b.workoutAt) return -1;
    return new Date(b.workoutAt).getTime() - new Date(a.workoutAt).getTime();
  });
}

// Send a friend request from requester to addressee.
//
// Side effect: if the addressee is a seed-buddy account (traffic_source like
// 'seed-buddy-%'), schedule an auto-accept by writing scheduled_accept_at on
// the row. In __DEV__ the delay is 0 (instant); in prod it's a uniform random
// 0–60 minutes. The actual flip from pending→accepted happens in the
// process_seed_buddy_accepts RPC, called on app start and on friends-tab
// focus. Scheduling failures must not fail the request itself.
export async function sendFriendRequest(
  requesterId: string,
  addresseeId: string
): Promise<boolean> {
  const { error } = await supabase.from('friendships').insert({
    requester_id: requesterId,
    addressee_id: addresseeId,
    status: 'pending',
  });

  // Unique violation = already exists; still treat as success but fall
  // through to scheduleSeedBuddyAccept so a stale pending row (e.g. created
  // before migration 076 added the auto-accept column) gets its
  // scheduled_accept_at stamped on retry.
  if (error && error.code !== '23505') {
    console.warn('sendFriendRequest error:', error);
    return false;
  }

  await scheduleSeedBuddyAccept(requesterId, addresseeId).catch((err) => {
    console.warn('scheduleSeedBuddyAccept error:', err);
  });

  return true;
}

// Stamp scheduled_accept_at on the friendship row so the server RPC can
// flip it when ripe. We can't determine client-side whether the addressee
// is a seed-buddy (profiles RLS blocks reading other users' traffic_source —
// see migration 004), so we stamp the column unconditionally. The RPC
// process_seed_buddy_accepts has SECURITY DEFINER and includes its own
// seed-buddy filter — real users get a harmless scheduled_accept_at value
// but their row is never flipped because they're not seed-buddies.
async function scheduleSeedBuddyAccept(requesterId: string, addresseeId: string): Promise<void> {
  // FIXME(pre-ASC): currently __DEV__ === instant; everyone else gets the
  // 0-60min random delay. Before App Store submission, replace the __DEV__
  // check with a real admin-detection mechanism (e.g. an ADMIN_EMAILS array
  // or a profiles.is_admin flag) so the dev/tester accounts keep instant
  // accepts in production, while real users see the natural-feeling delay.
  const delaySeconds = __DEV__ ? 0 : Math.floor(Math.random() * 60 * 60);
  const scheduledAt = new Date(Date.now() + delaySeconds * 1000).toISOString();

  const { error: updateErr } = await supabase
    .from('friendships')
    .update({ scheduled_accept_at: scheduledAt })
    .eq('requester_id', requesterId)
    .eq('addressee_id', addresseeId);

  if (updateErr) {
    console.warn('scheduleSeedBuddyAccept update error:', updateErr);
    return;
  }

  // Opportunistically process — in dev this flips immediately; in prod it picks
  // up any other ripe rows for this user without waiting for the next focus.
  await processSeedBuddyAccepts();
}

// Server-side processor: flips any pending requests the caller sent to seed
// buddies whose scheduled_accept_at has passed. Safe to call frequently;
// no-ops when nothing is ripe. Returns the number of rows flipped.
export async function processSeedBuddyAccepts(): Promise<number> {
  const { data, error } = await supabase.rpc('process_seed_buddy_accepts');
  if (error) {
    console.warn('processSeedBuddyAccepts error:', error);
    return 0;
  }
  return (data as number) ?? 0;
}

// Add the seed buddy (the one the user picked in onboarding) as an instant
// accepted friend. The buddy is a real Supabase account (one of seed-buddy-1..20)
// but is fake — it can't tap "accept" — so we insert with status='accepted'
// directly. RLS allows this because the user is the requester.
//
// Returns true on success (including "already friends"); false if the seed
// account isn't found or the insert fails for any other reason.
export async function addSeedBuddyAsFriend(userId: string, buddyId: number): Promise<boolean> {
  const sentinel = `seed-buddy-${buddyId}`;
  const { data: buddyRow, error: lookupErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('traffic_source', sentinel)
    .maybeSingle();

  if (lookupErr || !buddyRow) {
    console.warn('addSeedBuddyAsFriend: seed buddy not found', { sentinel, lookupErr });
    return false;
  }

  const { error } = await supabase.from('friendships').insert({
    requester_id: userId,
    addressee_id: buddyRow.id,
    status: 'accepted',
  });

  if (error) {
    // Unique violation = already friends. Treat as success.
    if (error.code === '23505') return true;
    console.warn('addSeedBuddyAsFriend insert error:', error);
    return false;
  }

  return true;
}

// Accept a pending request. The caller must be the addressee.
export async function acceptFriendRequest(friendshipId: string): Promise<boolean> {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', friendshipId);

  if (error) {
    console.warn('acceptFriendRequest error:', error);
    return false;
  }

  return true;
}

// Returns the most recent updated_at among accepted friendships where the
// caller is the requester. Used by the Friends-tab title dot to detect that
// a friend the user sent a request to has just accepted.
export async function getLatestAcceptedFriendshipAt(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('friendships')
    .select('updated_at')
    .eq('requester_id', userId)
    .eq('status', 'accepted')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn('getLatestAcceptedFriendshipAt error:', error);
    return null;
  }
  return (data as { updated_at: string } | null)?.updated_at ?? null;
}

// Get pending friend requests sent to this user.
export async function getPendingRequests(userId: string): Promise<PendingRequest[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select(
      'id, requester_id, profiles!friendships_requester_id_fkey(name, avatar_url, bio, traits)'
    )
    .eq('addressee_id', userId)
    .eq('status', 'pending');

  if (error) {
    console.warn('getPendingRequests error:', error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    requesterId: row.requester_id,
    requesterName: row.profiles?.name ?? 'Unknown',
    requesterAvatar: row.profiles?.avatar_url ?? null,
    requesterBio: row.profiles?.bio ?? null,
    requesterTraits: row.profiles?.traits ?? [],
  }));
}

// Record a poke. Optionally attach a message; falls back to no-message insert if the
// message column doesn't exist yet on the deployed DB (PGRST204).
export async function pokeFriend(
  pokerId: string,
  pokeeId: string,
  message?: string
): Promise<boolean> {
  const tryInsert = async (includeMessage: boolean) => {
    const payload: Record<string, unknown> = { poker_id: pokerId, pokee_id: pokeeId };
    if (includeMessage && message) payload.message = message;
    return await supabase.from('pokes').insert(payload);
  };

  let { error } = await tryInsert(true);
  if (error?.code === 'PGRST204') {
    ({ error } = await tryInsert(false));
  }

  if (error) {
    console.warn('pokeFriend error:', error);
    return false;
  }

  return true;
}

// Returns a map of pokeeId -> latest createdAt for pokes the current user sent in
// the last 4 hours. Used to render the black "Poked" state on the poke button.
export async function getRecentPokesByMe(userId: string): Promise<Record<string, string>> {
  const fourHrAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('pokes')
    .select('pokee_id, created_at')
    .eq('poker_id', userId)
    .gte('created_at', fourHrAgo)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('getRecentPokesByMe error:', error);
    return {};
  }

  const map: Record<string, string> = {};
  for (const row of (data ?? []) as Array<{ pokee_id: string; created_at: string }>) {
    if (!map[row.pokee_id]) map[row.pokee_id] = row.created_at;
  }
  return map;
}

// Pokes the user has received, joined with sender's profile name + avatar.
// Done in two queries to avoid coupling to a specific FK alias name.
export async function getPokesReceived(userId: string, limit = 30): Promise<PokeReceived[]> {
  const { data, error } = await supabase
    .from('pokes')
    .select('id, poker_id, message, created_at, seen')
    .eq('pokee_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('getPokesReceived error:', error);
    return [];
  }

  const rows = (data ?? []) as Array<{
    id: string;
    poker_id: string;
    message: string | null;
    created_at: string;
    seen: boolean;
  }>;

  if (rows.length === 0) return [];

  const senderIds = Array.from(new Set(rows.map((r) => r.poker_id)));
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, name, avatar_url')
    .in('id', senderIds);

  if (pErr) {
    console.warn('getPokesReceived profiles lookup error:', pErr);
  }

  const profileMap = new Map<string, { name: string | null; avatar_url: string | null }>();
  for (const p of (profiles ?? []) as Array<{
    id: string;
    name: string | null;
    avatar_url: string | null;
  }>) {
    profileMap.set(p.id, { name: p.name, avatar_url: p.avatar_url });
  }

  return rows.map((row) => {
    const sender = profileMap.get(row.poker_id);
    return {
      id: row.id,
      senderId: row.poker_id,
      senderName: sender?.name ?? 'Friend',
      senderAvatar: sender?.avatar_url ?? null,
      message: row.message,
      createdAt: row.created_at,
      seen: row.seen,
    };
  });
}

// Count unseen pokes for this user (shown as a notification badge).
export async function getUnseenPokeCount(userId: string): Promise<number> {
  const { count, error } = await callRpcWithRetry(
    () =>
      supabase
        .from('pokes')
        .select('*', { count: 'exact', head: true })
        .eq('pokee_id', userId)
        .eq('seen', false),
    { count: 0, error: null } as any
  );

  if (error) {
    console.warn('getUnseenPokeCount error:', error);
    return 0;
  }

  return count ?? 0;
}

// Mark all pokes addressed to this user as seen.
export async function markPokesAsSeen(userId: string): Promise<void> {
  await supabase.from('pokes').update({ seen: true }).eq('pokee_id', userId).eq('seen', false);
}

// Cancel an outgoing friend request that the current user sent.
export async function cancelFriendRequest(
  requesterId: string,
  addresseeId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('requester_id', requesterId)
    .eq('addressee_id', addresseeId)
    .eq('status', 'pending');

  if (error) {
    console.warn('cancelFriendRequest error:', error);
    return false;
  }
  return true;
}

// Decline / dismiss an incoming friend request. Deletes the row so sender can re-request later.
export async function declineFriendRequest(friendshipId: string): Promise<boolean> {
  const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
  if (error) {
    console.warn('declineFriendRequest error:', error);
    return false;
  }
  return true;
}

// Fetch random platform users the current user is not already connected to.
export async function getSuggestedUsers(userId: string, limit = 5): Promise<SuggestedUser[]> {
  const { data, error } = await supabase.rpc('get_suggested_users', {
    p_user_id: userId,
    p_limit: limit,
  });

  if (error) {
    console.warn('getSuggestedUsers error:', error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name ?? 'User',
    avatarUrl: row.avatar_url ?? null,
    bio: row.bio ?? null,
    traits: row.traits ?? [],
  }));
}

// Block another user. Idempotent — a duplicate insert (23505) is treated as success.
export async function blockUser(blockerId: string, blockedId: string): Promise<boolean> {
  const { error } = await supabase
    .from('blocked_users')
    .insert({ blocker_id: blockerId, blocked_id: blockedId });
  if (error) {
    if (error.code === '23505') return true;
    console.warn('blockUser error:', error);
    return false;
  }
  return true;
}

// Remove a block. No-op if no such row exists.
export async function unblockUser(blockerId: string, blockedId: string): Promise<boolean> {
  const { error } = await supabase
    .from('blocked_users')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId);
  if (error) {
    console.warn('unblockUser error:', error);
    return false;
  }
  return true;
}
