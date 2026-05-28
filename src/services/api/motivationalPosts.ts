import { supabase } from '../supabase';
import { logger } from '@/utils/logger';
import {
  IT_GIRL_USER_ID,
  IT_GIRL_NAME,
  IT_GIRL_AVATAR_URL,
  getMotivationalPostUrl,
} from '@/constants/officialAccount';
import type { PublicWorkoutPhoto } from './workouts';

/**
 * Fetches the next `count` official It Girl posts for this viewer, starting
 * at position `offset` in their deterministic permutation. Wraps automatically
 * across cycles (each cycle uses a different shuffle seed).
 *
 * If the requested range straddles a cycle boundary, the RPC returns only the
 * tail of the current cycle. Callers can issue a second request at
 * `offset += returned.length` to top up from the next cycle.
 *
 * Returns rows shaped like `PublicWorkoutPhoto` so they slot directly into the
 * discover feed, with `isOfficial: true` as a discriminator.
 */
export async function getNextOfficialPosts(
  viewerId: string,
  count: number,
  offset: number
): Promise<PublicWorkoutPhoto[]> {
  if (count <= 0) return [];

  const { data, error } = await supabase.rpc('get_next_official_posts', {
    p_viewer_id: viewerId,
    p_count: count,
    p_offset: offset,
  });

  if (error) {
    logger.warn('getNextOfficialPosts error', { error });
    return [];
  }

  return (data ?? []).map((row: any) => ({
    workoutId: `official-${row.id}`,
    workoutName: row.caption ?? null,
    completedAt: new Date().toISOString(),
    imageUri: getMotivationalPostUrl(row.storage_path),
    aspectRatio: row.aspect_ratio != null ? Number(row.aspect_ratio) : null,
    userId: IT_GIRL_USER_ID,
    userName: IT_GIRL_NAME,
    userAvatar: IT_GIRL_AVATAR_URL,
    titleCustomized: false,
    isOfficial: true,
  }));
}
