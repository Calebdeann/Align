# Fix TikTok Import: Poor Exercise Extraction (only 1-2 exercises found)

## Context

User reports that across 4-5 test videos (with clear TikTok native text overlays showing exercises), the pipeline only extracts 1-2 exercises instead of the full workout (typically 5-8 exercises).

## Root Cause Analysis

The pipeline has 3 paths:

1. **Sticker path** (text-only): Uses `stickersOnItem` from TikTok's JSON. Problem: `stickersOnItem` often only contains 1-2 stickers (the ones visible in the cover frame), not ALL text overlays shown throughout the video.
2. **Caption path** (text-only): Uses og:description/caption. Problem: Usually truncated to ~160 chars and mostly hashtags, not exercise lists.
3. **Image fallback** (Vision): Uses cover/thumbnail images. Problem: Only shows 1 frame, not all exercises.

**Critical bug:** When Path 1 finds even 1-2 stickers, it NEVER falls through to images. So if `stickersOnItem` has 2 exercises but the video shows 6, only 2 are returned.

## Fix

### File: `supabase/functions/process-tiktok/index.ts`

**Change 1: Always combine ALL data sources into a single Claude call**

Replace the 3 separate paths with one unified approach:

- Always send stickers + caption + cover images together
- Let Claude see everything and extract as many exercises as possible
- Use a single comprehensive prompt that handles all data types

**Change 2: Always download and include cover images**

Even when stickers are found, download cover images too. The cover often shows a summary/list of all exercises in the workout.

**Change 3: Improve the Claude prompt**

Current prompt says stickers are "PRIMARY source". New prompt should:

- Tell Claude that stickers may only show SOME exercises
- Tell Claude to look at ALL data sources (stickers, caption, images) and combine them
- Tell Claude to extract the MAXIMUM number of exercises visible across all sources
- Explicitly say "workout TikToks typically have 4-8 exercises"

**Change 4: Upgrade to Sonnet for image analysis**

Haiku struggles with OCR on cover images. Use `claude-sonnet-4-5-20250929` when images are included (it's much better at reading text in images). Keep Haiku for text-only calls when we have good sticker data (5+ stickers).

**Change 5: Increase max_tokens from 1024 to 2048**

1024 tokens can truncate responses for workouts with 6+ exercises.

### Implementation

Replace the path routing logic (lines 122-193) with:

```typescript
// Always download cover images as supplementary data
const images = await downloadCoverImages(scraped.imageUrls);

// Decision: use text-only (fast) if we have 5+ workout-relevant stickers
// Otherwise, use multimodal to combine all signals
const hasRichStickers = scraped.rawStickers.length >= 5 && scraped.hasStickerText;

let result: ProcessResult;
if (hasRichStickers) {
  // Enough stickers to trust text-only path
  result = await parseExercisesWithClaudeFastPath(scraped.captionText, scraped.stickerText);
  result.path = 'fast';
} else {
  // Combine everything: stickers + caption + images
  result = await parseExercisesUnified(scraped.captionText, scraped.stickerText, images);
  result.path = scraped.hasStickerText ? 'fast' : images.length > 0 ? 'fallback' : 'caption';
}
```

Add new unified function `parseExercisesUnified()` that:

- Sends cover images as Vision input
- Includes sticker text AND caption in the text prompt
- Uses Sonnet when images are present, Haiku when text-only
- Uses max_tokens: 2048
- Has an improved prompt that tells Claude to combine all sources

### Prompt improvements (for the unified call):

```
You are extracting exercises from a TikTok fitness/workout video.
You have multiple data sources - use ALL of them to find every exercise:

1. ON-SCREEN TEXT STICKERS (if available): Text the creator placed on the video
2. VIDEO CAPTION/METADATA: The description, hashtags, and metadata
3. COVER IMAGES (if available): Thumbnail/cover images that may show exercise lists

IMPORTANT:
- Workout TikToks typically show 4-8 exercises. If you only see 1-2, look harder.
- Cover images often show a summary list of ALL exercises in the workout.
- Stickers may only show exercises for the currently visible frame, not the full workout.
- The caption may list exercises that aren't in the stickers.
- Extract the MAXIMUM number of unique exercises across all sources.
- Combine information: if stickers say "Squat 3x12" and the image shows "Squats", that's one exercise.
```

## Files Modified

- `supabase/functions/process-tiktok/index.ts` - Pipeline routing, new unified function, prompt improvements

## Verification

1. Deploy: `supabase functions deploy process-tiktok`
2. Test with the same 4-5 videos that previously returned only 1-2 exercises
3. Should now return 4-8 exercises per video
4. Check edge function logs for which path was taken and what data was available
