import { supabase } from '../supabase';
import type { PlacedTrait } from '@/constants/traits';

export type PublicProfile = {
  id: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  traits: PlacedTrait[];
  planId: string | null;
  createdAt: string;
  showShells: boolean;
  isVerified: boolean;
};

export type PublicWorkout = {
  id: string;
  name: string | null;
  completedAt: string;
  imageUri: string | null;
  durationSeconds: number | null;
};

export async function getPublicProfile(
  viewerId: string,
  targetId: string
): Promise<PublicProfile | null> {
  const { data, error } = await supabase.rpc('get_public_profile', {
    p_viewer_id: viewerId,
    p_target_id: targetId,
  });
  if (error || !data?.[0]) {
    if (error) console.warn('getPublicProfile error:', error);
    return null;
  }
  const r = data[0];
  return {
    id: r.id,
    name: r.name ?? '',
    avatarUrl: r.avatar_url ?? null,
    bio: r.bio ?? null,
    traits: (r.traits ?? []) as PlacedTrait[],
    planId: r.plan_id ?? null,
    createdAt: r.created_at,
    showShells: r.show_shells ?? true,
    isVerified: r.is_verified ?? false,
  };
}

export async function getPublicWorkouts(
  viewerId: string,
  targetId: string
): Promise<PublicWorkout[]> {
  const { data, error } = await supabase.rpc('get_public_workouts', {
    p_viewer_id: viewerId,
    p_target_id: targetId,
    p_limit: 30,
  });
  if (error) {
    console.warn('getPublicWorkouts error:', error);
    return [];
  }
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name ?? null,
    completedAt: r.completed_at,
    imageUri: r.image_uri ?? null,
    durationSeconds: r.duration_seconds ?? null,
  }));
}
