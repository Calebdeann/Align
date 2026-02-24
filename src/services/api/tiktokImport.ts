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

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: EDGE_FUNCTION_APIKEY,
        Authorization: `Bearer ${EDGE_FUNCTION_APIKEY}`,
      },
      body: JSON.stringify(body),
    });

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
