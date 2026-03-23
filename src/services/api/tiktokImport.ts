import { supabase } from '../supabase';
import { logger } from '@/utils/logger';

interface ImportedExercise {
  name: string;
  sets?: number;
  reps?: number;
  repsPerSet?: number[];
  weight?: string;
  notes?: string;
}

export interface VideoImportResult {
  success: boolean;
  workoutName?: string;
  exercises?: ImportedExercise[];
  error?: string;
  confidence: number;
}

// Keep old type name as alias for backward compatibility
export type TikTokImportResult = VideoImportResult;

// Hardcoded to avoid any env var / Metro cache issues
const EDGE_FUNCTION_URL = 'https://app.aligntracker.app/functions/v1/process-tiktok';
const EDGE_FUNCTION_APIKEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuZ3BzYWJ5cXN1dW5hanRvdGNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MzMyODgsImV4cCI6MjA4NDEwOTI4OH0.1uYlpa65jGJDvZ-z9OH18p5HdFYllRS6jXezNIBELh8';

export type VideoPlatform = 'tiktok' | 'instagram';

/**
 * Calls the edge function to extract exercises from a video URL.
 * Supports both TikTok and Instagram. When clientExtractedData is provided
 * (from WebView), the server uses the client-provided data directly.
 */
export async function processVideoImport(
  videoUrl: string,
  platform: VideoPlatform,
  clientExtractedData?: any,
  videoFrames?: string[]
): Promise<VideoImportResult> {
  try {
    const body: Record<string, any> = {
      videoUrl,
      platform,
      // Keep tiktokUrl for backward compatibility with existing edge function
      tiktokUrl: videoUrl,
    };
    if (clientExtractedData?.hasData) {
      body.clientExtractedData = clientExtractedData;
    }
    if (videoFrames && videoFrames.length > 0) {
      body.videoFrames = videoFrames;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let response: Response;
    try {
      response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: EDGE_FUNCTION_APIKEY,
          Authorization: `Bearer ${EDGE_FUNCTION_APIKEY}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.error || data?.message || `Server error (${response.status})`;
      logger.warn('[VideoImport] Edge function error', {
        status: response.status,
        errorMsg,
        platform,
      });
      return {
        success: false,
        error: errorMsg,
        confidence: 0,
      };
    }

    return data as VideoImportResult;
  } catch (error) {
    logger.warn('[VideoImport] Unexpected error', { error, platform });
    return {
      success: false,
      error: 'Something went wrong. Please try again.',
      confidence: 0,
    };
  }
}

// Keep old function name as alias for backward compatibility
export const processTikTokVideo = (url: string, clientData?: any) =>
  processVideoImport(url, 'tiktok', clientData);

/**
 * Extract the video ID from a TikTok or Instagram URL.
 * TikTok: /video/1234567890 → "1234567890"
 * Instagram: /reel/ABC123 or /p/ABC123 → "ABC123"
 */
export function extractVideoId(url: string): string | null {
  const tiktokMatch = url.match(/\/video\/(\d+)/);
  if (tiktokMatch) return tiktokMatch[1];
  const igMatch = url.match(/\/(reel|p)\/([A-Za-z0-9_-]+)/);
  if (igMatch) return igMatch[2];
  return null;
}

/**
 * Check if a video import result is already cached in Supabase.
 */
export async function getCachedImport(
  platform: VideoPlatform,
  videoId: string
): Promise<VideoImportResult | null> {
  try {
    const { data, error } = await supabase
      .from('imported_workout_cache')
      .select('workout_name, exercises, confidence')
      .eq('platform', platform)
      .eq('video_id', videoId)
      .single();

    if (error || !data) return null;

    return {
      success: true,
      workoutName: data.workout_name,
      exercises: data.exercises as ImportedExercise[],
      confidence: Number(data.confidence),
    };
  } catch {
    return null;
  }
}

/**
 * Save a successful video import result to the shared cache.
 * Uses upsert so duplicate inserts are safe.
 */
export async function saveCachedImport(
  platform: VideoPlatform,
  videoId: string,
  result: VideoImportResult
): Promise<void> {
  try {
    await supabase.from('imported_workout_cache').upsert(
      {
        platform,
        video_id: videoId,
        workout_name: result.workoutName || null,
        exercises: result.exercises || [],
        confidence: result.confidence,
      },
      { onConflict: 'platform,video_id' }
    );
  } catch {
    // Cache save is best-effort, don't break the import flow
  }
}
