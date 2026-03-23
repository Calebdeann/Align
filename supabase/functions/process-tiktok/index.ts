import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
};

// L1 cache: in-memory, persists within same edge function isolate
const pageCache = new Map<string, { html: string; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// In-memory result cache: ephemeral, no data stored in Supabase
const resultCache = new Map<string, { result: ProcessResult; timestamp: number }>();
const RESULT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type VideoPlatform = 'tiktok' | 'instagram';

/** Detect platform from URL */
function detectPlatform(url: string): VideoPlatform {
  if (url.includes('instagram.com')) return 'instagram';
  return 'tiktok';
}

/** Extract video/content ID from a URL (platform-aware) */
function extractVideoId(url: string): string | null {
  // TikTok: /video/1234567890
  const tiktokMatch = url.match(/\/video\/(\d+)/);
  if (tiktokMatch) return tiktokMatch[1];

  // Instagram: /reel/ABC123 or /p/ABC123
  const igMatch = url.match(/\/(reel|p)\/([A-Za-z0-9_-]+)/);
  if (igMatch) return igMatch[2];

  return null;
}

interface TikTokExercise {
  name: string;
  sets?: number;
  reps?: number;
  repsPerSet?: number[];
  weight?: string;
  notes?: string;
}

interface ProcessResult {
  success: boolean;
  workoutName?: string;
  exercises?: TikTokExercise[];
  error?: string;
  confidence: number;
  path?: 'fast' | 'caption' | 'fallback' | 'frames';
  ocrFoundText?: boolean;
}

interface StickerEntry {
  text: string;
  startTime?: number;
  endTime?: number;
  rawData: unknown;
}

interface ScrapedData {
  captionText: string;
  stickerText: string;
  rawStickers: StickerEntry[];
  imageUrls: string[];
  hasStickerText: boolean;
  fullPageFetched: boolean;
}

interface DownloadedImage {
  data: string; // base64
  mediaType: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[process-tiktok] Request received');

    // TODO: Re-enable auth after confirming pipeline works
    // Skip auth for now - the gateway already validates the apikey JWT
    console.log('[process-tiktok] Skipping auth check (testing mode)');

    const body = await req.json();
    // Accept both videoUrl (new) and tiktokUrl (legacy) for backward compatibility
    const videoUrl: string = body.videoUrl || body.tiktokUrl;
    const clientExtractedData = body.clientExtractedData;
    const platform: VideoPlatform = body.platform || detectPlatform(videoUrl || '');
    // Video frames extracted client-side via expo-video-thumbnails (base64 JPEG strings)
    const videoFrames: string[] = Array.isArray(body.videoFrames) ? body.videoFrames : [];

    if (!videoUrl || typeof videoUrl !== 'string') {
      return jsonResponse({ success: false, error: 'Missing video URL', confidence: 0 });
    }

    const isValidUrl = videoUrl.includes('tiktok.com') || videoUrl.includes('instagram.com');
    if (!isValidUrl) {
      console.log('[process-tiktok] Invalid URL:', videoUrl);
      return jsonResponse({
        success: false,
        error: 'Not a valid TikTok or Instagram URL',
        confidence: 0,
      });
    }

    console.log(`[process-tiktok] Processing ${platform} URL:`, videoUrl);

    // Step 0: Check in-memory cache (ephemeral, no DB storage)
    const resolvedForCache = platform === 'tiktok' ? await resolveShortUrl(videoUrl) : videoUrl;
    const videoId = extractVideoId(resolvedForCache);
    if (videoId) {
      const cached = resultCache.get(videoId);
      if (cached && Date.now() - cached.timestamp < RESULT_CACHE_TTL_MS) {
        console.log(`[process-tiktok] Cache hit for ${platform} video ${videoId}`);
        return jsonResponse({ ...cached.result, cached: true });
      }
    }

    // Step 1: Extract data - prefer client-extracted (WebView, never rate-limited) over server scraping
    let scraped: ScrapedData | null;
    if (clientExtractedData && clientExtractedData.hasData) {
      console.log(`[process-tiktok] Using client-extracted data (WebView) for ${platform}`);
      scraped = buildScrapedDataFromClient(clientExtractedData, platform);
      if (scraped) {
        console.log('[process-tiktok] Client data parsed successfully');
      } else if (platform === 'tiktok') {
        console.warn('[process-tiktok] Client data parsing failed, falling back to server scrape');
        scraped = await extractTikTokData(videoUrl);
      } else {
        console.warn(
          '[process-tiktok] Client data parsing failed for Instagram, trying server extraction'
        );
        scraped = await extractInstagramData(videoUrl);
      }
    } else if (platform === 'tiktok') {
      console.log('[process-tiktok] No client data, using TikTok server-side scraping');
      scraped = await extractTikTokData(videoUrl);
    } else {
      console.log('[process-tiktok] No client data, using Instagram server-side extraction');
      scraped = await extractInstagramData(videoUrl);
    }

    // Always supplement with oEmbed for TikTok - it reliably returns the full caption
    // which often contains structured exercise lists that client WebView data misses
    if (scraped && platform === 'tiktok') {
      try {
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`;
        const oembedResp = await fetch(oembedUrl, {
          headers: { 'User-Agent': 'AlignApp/1.0' },
        });
        if (oembedResp.ok) {
          const oembedData = await oembedResp.json();
          if (oembedData.title && !scraped.captionText.includes(oembedData.title)) {
            console.log(
              '[process-tiktok] Supplementing with oEmbed title:',
              oembedData.title.substring(0, 200)
            );
            scraped = {
              ...scraped,
              captionText: `Title: ${oembedData.title}\n${scraped.captionText}`,
            };
          }
        }
      } catch (e) {
        console.warn('[process-tiktok] oEmbed supplement failed:', e);
      }
    }

    if (!scraped) {
      console.log('[process-tiktok] No data extracted');
      return jsonResponse({
        success: false,
        error: 'Could not extract video content. The video may be private or unavailable.',
        confidence: 0,
      });
    }

    console.log(
      '[process-tiktok] Data available:',
      JSON.stringify({
        fullPageFetched: scraped.fullPageFetched,
        stickerCount: scraped.rawStickers.length,
        stickerTextLength: scraped.stickerText.length,
        captionTextLength: scraped.captionText.length,
        captionHasExercises: isWorkoutRelevantText(scraped.captionText),
        coverImageCount: scraped.imageUrls.length,
        hasStickerText: scraped.hasStickerText,
      })
    );

    // Check if we have absolutely nothing to work with
    if (
      !scraped.hasStickerText &&
      scraped.captionText.length === 0 &&
      scraped.imageUrls.length === 0 &&
      videoFrames.length === 0
    ) {
      console.warn(
        '[process-tiktok] No data at all: no stickers, no caption, no images, no frames'
      );
      return jsonResponse({
        success: false,
        error: 'Unable to read this video right now. Please try again in a minute.',
        confidence: 0,
      });
    }

    if (!scraped.fullPageFetched) {
      console.warn(
        '[process-tiktok] Full page scrape failed (rate limited), proceeding with available data'
      );
    }

    // Convert client-sent video frames to DownloadedImage format
    const clientFrameImages = convertClientFramesToImages(videoFrames);
    const hasClientFrames = clientFrameImages.length >= 3;
    console.log(
      '[process-tiktok] Client video frames:',
      clientFrameImages.length,
      '(usable:',
      hasClientFrames,
      ')'
    );

    // Always download cover images as supplement/fallback
    const coverImages = await downloadCoverImages(scraped.imageUrls);
    console.log('[process-tiktok] Cover images downloaded:', coverImages.length);

    const platformName = platform === 'instagram' ? 'Instagram Reel' : 'TikTok';
    let result: ProcessResult;
    let ocrFoundText: boolean | null = null;

    // Check if caption has structured exercise data (numbered list, set/rep patterns, etc.)
    const captionIsStructured = captionHasStructuredExercises(scraped.captionText);
    const captionHasExerciseData = isWorkoutRelevantText(scraped.captionText);

    console.log(
      '[process-tiktok] Caption analysis:',
      JSON.stringify({ captionIsStructured, captionHasExerciseData })
    );

    // Only use text-only fast path when we have abundant sticker data (5+ stickers)
    const hasRichStickers = scraped.rawStickers.length >= 5 && scraped.hasStickerText;

    // === PATH SELECTION (priority order) ===

    // 1. CAPTION-FIRST: If caption clearly lists exercises, use it directly
    if (captionIsStructured) {
      console.log('[process-tiktok] Caption-first path: caption has structured exercise list');
      result = await parseExercisesFromCaption(scraped.captionText);
      result.path = 'caption';

      // If caption-first yields good results, we're done
      if (!result.success || (result.exercises?.length || 0) < 2) {
        console.log('[process-tiktok] Caption-first yielded few results, trying other paths');
        // Fall through to other paths, keep caption result for cross-validation
        const captionResult = result;

        if (hasRichStickers) {
          result = await parseExercisesWithClaudeFastPath(
            scraped.captionText,
            scraped.stickerText,
            platformName
          );
          result.path = 'fast';
        } else if (hasClientFrames) {
          const { ocrText, hasReadableText } = await ocrFrameText(clientFrameImages, coverImages);
          ocrFoundText = hasReadableText;
          if (hasReadableText || scraped.hasStickerText) {
            result = await parseExercisesFromOcrText(
              ocrText,
              scraped.captionText,
              scraped.stickerText,
              platformName
            );
          } else {
            result = captionResult; // Nothing better available, stick with caption
          }
          result.path = 'frames';
        } else {
          result = await parseExercisesUnified(
            scraped.captionText,
            scraped.stickerText,
            coverImages,
            platformName
          );
          result.path = coverImages.length > 0 ? 'fallback' : 'caption';
        }
      }
    }
    // 2. FAST PATH: Rich sticker data (5+ stickers with exercise-relevant text)
    else if (hasRichStickers) {
      console.log(
        '[process-tiktok] Fast path: rich sticker data (' +
          scraped.rawStickers.length +
          ' stickers)'
      );
      result = await parseExercisesWithClaudeFastPath(
        scraped.captionText,
        scraped.stickerText,
        platformName
      );
      result.path = 'fast';
    }
    // 3. FRAMES PATH (two-pass): Extract text via OCR, then parse exercises from text
    else if (hasClientFrames) {
      console.log(
        `[process-tiktok] Frames path (two-pass): ${clientFrameImages.length} frames + ${coverImages.length} covers (${platform})`
      );

      // Pass 1: Pure OCR - extract all visible text from frames
      const { ocrText, hasReadableText } = await ocrFrameText(clientFrameImages, coverImages);
      ocrFoundText = hasReadableText;

      if (!hasReadableText && !scraped.hasStickerText && !captionHasExerciseData) {
        // No text found anywhere
        console.warn('[process-tiktok] No text found in frames, stickers, or caption');
        result = {
          success: false,
          error:
            'Could not find exercise text in this video. Try a video with exercise names shown on screen or in the caption.',
          confidence: 0.1,
        };
      } else {
        // Pass 2: Parse exercises from all text sources
        result = await parseExercisesFromOcrText(
          ocrText,
          scraped.captionText,
          scraped.stickerText,
          platformName
        );
      }
      result.path = 'frames';
    }
    // 4. UNIFIED PATH: Combine all available data (stickers + caption + cover images)
    else {
      console.log(`[process-tiktok] Unified path: combining all data sources (${platform})`);
      result = await parseExercisesUnified(
        scraped.captionText,
        scraped.stickerText,
        coverImages,
        platformName
      );
      result.path =
        coverImages.length > 0 ? 'fallback' : scraped.hasStickerText ? 'fast' : 'caption';
    }

    // === POST-PROCESSING ===

    // Cross-validate against caption (if caption has exercise info and we used a different path)
    if (result.success && result.path !== 'caption' && captionHasExerciseData) {
      const validated = crossValidateResults(result, scraped.captionText, result.path || '');

      // If cross-validation dropped confidence, try caption path as fallback
      if (validated.confidence < 0.4 && captionIsStructured) {
        console.log('[process-tiktok] Cross-validation failed, falling back to caption path');
        const captionFallback = await parseExercisesFromCaption(scraped.captionText);
        if (captionFallback.success && (captionFallback.exercises?.length || 0) >= 2) {
          result = captionFallback;
          result.path = 'caption';
        } else {
          result = validated;
        }
      } else {
        result = validated;
      }
    }

    // Calibrate confidence based on objective signals (replace Claude's self-reported confidence)
    if (result.success) {
      result.confidence = calibrateConfidence(
        result,
        result.path || 'fallback',
        ocrFoundText,
        captionHasExerciseData
      );
      if (ocrFoundText !== null) {
        result.ocrFoundText = ocrFoundText;
      }
      console.log(
        '[process-tiktok] Calibrated confidence:',
        result.confidence,
        '(path:',
        result.path,
        ')'
      );
    }

    // Cache successful results in memory only (no DB storage)
    if (result.success && videoId) {
      resultCache.set(videoId, { result, timestamp: Date.now() });
      console.log(`[process-tiktok] Cached result in memory for video ${videoId}`);
    }

    return jsonResponse(result);
  } catch (error) {
    console.error('[process-tiktok] Error:', error);
    return jsonResponse({
      success: false,
      error: 'Processing failed. Please try again.',
      confidence: 0,
    });
  }
});

/** Convert base64 frame strings from the client into DownloadedImage format */
function convertClientFramesToImages(frames: string[]): DownloadedImage[] {
  return frames
    .filter((f) => f && f.length > 1000 && f.length < 500_000)
    .map((f) => ({
      data: f,
      mediaType: 'image/jpeg', // expo-video-thumbnails produces JPEG
    }));
}

/**
 * Resolves short TikTok URLs (vm.tiktok.com, vt.tiktok.com) to full URLs.
 * oEmbed requires the full tiktok.com/@user/video/ID format.
 */
async function resolveShortUrl(url: string): Promise<string> {
  if (!url.includes('vm.tiktok.com') && !url.includes('vt.tiktok.com') && !url.includes('/t/')) {
    return url;
  }
  try {
    console.log('[process-tiktok] Resolving short URL:', url);
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      },
    });
    const resolved = response.url;
    console.log('[process-tiktok] Resolved to:', resolved);
    return resolved;
  } catch (e) {
    console.warn('[process-tiktok] URL resolution failed:', e);
    return url;
  }
}

/** Check if the fetched HTML is a full TikTok page (not a bot-blocked skeleton) */
function isFullTikTokPage(html: string): boolean {
  if (html.length < 10_000) return false;
  return (
    html.includes('__UNIVERSAL_DATA_FOR_REHYDRATION__') ||
    html.includes('SIGI_STATE') ||
    html.includes('__DEFAULT_SCOPE__')
  );
}

/** Try fetch strategies sequentially (1 at a time to reduce rate-limit burn) */
async function fetchFullTikTokPage(url: string): Promise<{ html: string; strategy: string }> {
  // Check cache first (keyed by video ID)
  const videoIdMatch = url.match(/\/video\/(\d+)/);
  const videoId = videoIdMatch?.[1];
  if (videoId) {
    const cached = pageCache.get(videoId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log(`[process-tiktok] Cache hit for video ${videoId} (${cached.html.length} bytes)`);
      return { html: cached.html, strategy: 'cache' };
    }
  }

  // Strategy 1: Embed page (different endpoint, different rate limit bucket)
  if (videoId) {
    try {
      const embedUrl = `https://www.tiktok.com/embed/v2/${videoId}`;
      console.log(`[process-tiktok] Trying embed page: ${embedUrl}`);
      const response = await fetch(embedUrl, {
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        redirect: 'follow',
      });
      if (response.ok) {
        const html = await response.text();
        console.log(`[process-tiktok] Embed page: ${html.length} bytes`);
        // Embed pages use different data markers
        if (
          html.length > 5_000 &&
          (html.includes('__UNIVERSAL_DATA_FOR_REHYDRATION__') ||
            html.includes('SIGI_STATE') ||
            html.includes('video-detail'))
        ) {
          console.log(`[process-tiktok] Embed page has full data`);
          if (videoId) pageCache.set(videoId, { html, timestamp: Date.now() });
          return { html, strategy: 'embed' };
        }
      }
    } catch (e) {
      console.warn('[process-tiktok] Embed page failed:', e);
    }
  }

  // Strategy 2: Sequential bot UA attempts (try 1 random UA at a time, stop on success)
  const defaultHeaders = {
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  const allStrategies = [
    {
      name: 'googlebot',
      headers: {
        ...defaultHeaders,
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      },
    },
    {
      name: 'bingbot',
      headers: {
        ...defaultHeaders,
        'User-Agent': 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
      },
    },
    {
      name: 'facebook',
      headers: {
        ...defaultHeaders,
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      },
    },
    { name: 'twitterbot', headers: { ...defaultHeaders, 'User-Agent': 'Twitterbot/1.0' } },
    {
      name: 'applebot',
      headers: {
        ...defaultHeaders,
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Safari/605.1.15 (Applebot/0.1; +http://www.apple.com/go/applebot)',
      },
    },
    {
      name: 'duckduckbot',
      headers: {
        ...defaultHeaders,
        'User-Agent': 'DuckDuckBot/1.1; (+http://duckduckgo.com/duckduckbot.html)',
      },
    },
  ];

  // Shuffle and try ONE at a time (halves rate-limit burn vs trying 2 in parallel)
  const shuffled = [...allStrategies].sort(() => Math.random() - 0.5);
  let bestFallback = { html: '', strategy: 'none' };

  for (const strategy of shuffled.slice(0, 2)) {
    try {
      console.log(`[process-tiktok] Trying strategy: ${strategy.name}`);
      const response = await fetch(url, {
        headers: strategy.headers,
        redirect: 'follow',
      });
      if (!response.ok) {
        console.log(`[process-tiktok] Strategy '${strategy.name}': HTTP ${response.status}`);
        continue;
      }
      const html = await response.text();
      const full = isFullTikTokPage(html);
      console.log(
        `[process-tiktok] Strategy '${strategy.name}': ${html.length} bytes, full=${full}`
      );

      if (full) {
        if (videoId) pageCache.set(videoId, { html, timestamp: Date.now() });
        return { html, strategy: strategy.name };
      }
      // Track largest fallback
      if (html.length > bestFallback.html.length) {
        bestFallback = { html, strategy: strategy.name };
      }
    } catch (e) {
      console.log(`[process-tiktok] Strategy '${strategy.name}': FAILED - ${e}`);
    }
  }

  console.warn(
    `[process-tiktok] All strategies failed. Best: ${bestFallback.strategy} (${bestFallback.html.length} bytes)`
  );
  return bestFallback;
}

async function extractTikTokData(url: string): Promise<ScrapedData | null> {
  const resolvedUrl = await resolveShortUrl(url);
  const textParts: string[] = [];
  const imageUrls: string[] = [];
  const stickers: StickerEntry[] = [];
  let fullPageFetched = false;

  // Method 1: oEmbed API (quick, gets title + thumbnail)
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(resolvedUrl)}`;
    console.log('[process-tiktok] Trying oEmbed:', oembedUrl);
    const response = await fetch(oembedUrl, {
      headers: { 'User-Agent': 'AlignApp/1.0' },
    });
    if (response.ok) {
      const data = await response.json();
      if (data.title) {
        console.log('[process-tiktok] oEmbed title:', data.title.substring(0, 200));
        textParts.push(`Title: ${data.title}`);
      }
      if (data.author_name) {
        textParts.push(`Author: ${data.author_name}`);
      }
      if (data.thumbnail_url) {
        imageUrls.push(data.thumbnail_url);
      }
    }
  } catch (e) {
    console.warn('[process-tiktok] oEmbed failed:', e);
  }

  // Method 2: Full page scrape (multi-strategy to bypass anti-bot)
  try {
    console.log('[process-tiktok] Scraping page for full data (multi-strategy)');
    const { html, strategy } = await fetchFullTikTokPage(resolvedUrl);

    if (html.length > 0) {
      console.log(`[process-tiktok] Page HTML length: ${html.length} (strategy: ${strategy})`);
      fullPageFetched = isFullTikTokPage(html);

      // Extract og:image
      const ogImage = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]*)"/i);
      if (ogImage?.[1]) {
        const imgUrl = decodeHtmlEntities(ogImage[1]);
        if (!imageUrls.includes(imgUrl)) {
          imageUrls.push(imgUrl);
        }
      }

      // Extract og:description
      const ogDesc = html.match(/<meta\s+(?:property|name)="og:description"\s+content="([^"]*)"/i);
      if (ogDesc?.[1]) {
        const decoded = decodeHtmlEntities(ogDesc[1]);
        textParts.push(`Description: ${decoded}`);
      }

      // Extract regular description
      const metaDesc = html.match(/<meta\s+(?:property|name)="description"\s+content="([^"]*)"/i);
      if (metaDesc?.[1]) {
        const decoded = decodeHtmlEntities(metaDesc[1]);
        if (!textParts.some((p) => p.includes(decoded))) {
          textParts.push(`Meta description: ${decoded}`);
        }
      }

      // Extract from __UNIVERSAL_DATA_FOR_REHYDRATION__
      const universalDataMatch = html.match(
        /<script\s+id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/i
      );
      if (universalDataMatch?.[1]) {
        try {
          const universalData = JSON.parse(universalDataMatch[1]);
          const extracted = extractFromUniversalData(universalData, imageUrls, stickers);
          if (extracted) textParts.push(extracted);
        } catch (e) {
          console.warn('[process-tiktok] Universal data parse failed:', e);
        }
      }

      // Extract from SIGI_STATE (older TikTok format)
      const sigiMatch = html.match(/<script\s+id="SIGI_STATE"[^>]*>([\s\S]*?)<\/script>/i);
      if (sigiMatch?.[1]) {
        try {
          const sigiData = JSON.parse(sigiMatch[1]);
          const extracted = extractFromSigiState(sigiData, imageUrls, stickers);
          if (extracted) textParts.push(extracted);
        } catch (e) {
          console.warn('[process-tiktok] SIGI_STATE parse failed:', e);
        }
      }

      // Extract from JSON-LD
      const jsonLdMatch = html.match(
        /<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i
      );
      if (jsonLdMatch?.[1]) {
        try {
          const jsonLd = JSON.parse(jsonLdMatch[1]);
          if (jsonLd.description && !textParts.some((p) => p.includes(jsonLd.description))) {
            textParts.push(`Structured data: ${jsonLd.description}`);
          }
          if (jsonLd.name && !textParts.some((p) => p.includes(jsonLd.name))) {
            textParts.push(`Video name: ${jsonLd.name}`);
          }
          if (jsonLd.keywords) {
            const kw = Array.isArray(jsonLd.keywords)
              ? jsonLd.keywords.join(', ')
              : jsonLd.keywords;
            textParts.push(`Keywords: ${kw}`);
          }
          if (jsonLd.thumbnailUrl) {
            const thumbs = Array.isArray(jsonLd.thumbnailUrl)
              ? jsonLd.thumbnailUrl
              : [jsonLd.thumbnailUrl];
            for (const t of thumbs) {
              if (t && !imageUrls.includes(t)) imageUrls.push(t);
            }
          }
        } catch {
          // JSON parse failed
        }
      }

      // Extract hashtags from page content
      const hashtagMatches = html.matchAll(/#(\w{2,30})/g);
      const hashtags = new Set<string>();
      for (const m of hashtagMatches) {
        const tag = m[1].toLowerCase();
        if (!['script', 'style', 'html', 'head', 'body', 'div', 'span', 'class'].includes(tag)) {
          hashtags.add(tag);
        }
      }
      if (hashtags.size > 0) {
        textParts.push(`Hashtags: ${[...hashtags].map((h) => `#${h}`).join(' ')}`);
      }
    }
  } catch (e) {
    console.warn('[process-tiktok] Page scrape failed:', e);
  }

  if (textParts.length === 0 && imageUrls.length === 0 && stickers.length === 0) return null;

  const captionText = textParts.join('\n');

  // Format sticker text with timestamps
  const stickerText = stickers
    .map((s) => {
      const timePrefix =
        s.startTime !== undefined
          ? s.endTime !== undefined
            ? `[${s.startTime}s - ${s.endTime}s] `
            : `[${s.startTime}s] `
          : '';
      return `${timePrefix}"${s.text}"`;
    })
    .join('\n');

  const hasStickerText = stickers.length > 0 && isWorkoutRelevantStickerText(stickers);

  console.log(
    '[process-tiktok] Caption text (' + captionText.length + ' chars):',
    captionText.substring(0, 300)
  );
  console.log(
    '[process-tiktok] Sticker text (' + stickerText.length + ' chars):',
    stickerText.substring(0, 300)
  );
  console.log(
    '[process-tiktok] Total stickers:',
    stickers.length,
    '| Workout-relevant:',
    hasStickerText
  );

  return {
    captionText,
    stickerText,
    rawStickers: stickers,
    imageUrls,
    hasStickerText,
    fullPageFetched,
  };
}

/**
 * Server-side extraction for Instagram Reels.
 * Much simpler than TikTok - we only extract meta tags and cover images.
 * Instagram's anti-bot is aggressive, so client-side WebView is the preferred path.
 */
async function extractInstagramData(url: string): Promise<ScrapedData | null> {
  const textParts: string[] = [];
  const imageUrls: string[] = [];

  try {
    // Fetch the page with a browser-like UA
    console.log('[process-tiktok] Fetching Instagram page:', url);
    const response = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      console.warn('[process-tiktok] Instagram page fetch failed:', response.status);
      return null;
    }

    const html = await response.text();
    console.log(`[process-tiktok] Instagram page HTML: ${html.length} bytes`);

    // Extract og:description (may contain truncated caption)
    const ogDesc = html.match(/<meta\s+(?:property|name)="og:description"\s+content="([^"]*)"/i);
    if (ogDesc?.[1]) {
      const decoded = decodeHtmlEntities(ogDesc[1]);
      textParts.push(`Description: ${decoded}`);
    }

    // Extract og:title
    const ogTitle = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]*)"/i);
    if (ogTitle?.[1]) {
      textParts.push(`Title: ${decodeHtmlEntities(ogTitle[1])}`);
    }

    // Extract og:image (thumbnail)
    const ogImage = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]*)"/i);
    if (ogImage?.[1]) {
      imageUrls.push(decodeHtmlEntities(ogImage[1]));
    }

    // Extract meta description
    const metaDesc = html.match(/<meta\s+(?:property|name)="description"\s+content="([^"]*)"/i);
    if (metaDesc?.[1]) {
      const decoded = decodeHtmlEntities(metaDesc[1]);
      if (!textParts.some((p) => p.includes(decoded))) {
        textParts.push(`Meta description: ${decoded}`);
      }
    }

    // Extract JSON-LD
    const jsonLdMatch = html.match(
      /<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i
    );
    if (jsonLdMatch?.[1]) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1]);
        if (jsonLd.caption && !textParts.some((p) => p.includes(jsonLd.caption))) {
          textParts.push(`Structured caption: ${jsonLd.caption}`);
        }
        if (jsonLd.description && !textParts.some((p) => p.includes(jsonLd.description))) {
          textParts.push(`Structured data: ${jsonLd.description}`);
        }
        if (jsonLd.articleBody && !textParts.some((p) => p.includes(jsonLd.articleBody))) {
          textParts.push(`Article body: ${jsonLd.articleBody}`);
        }
        if (jsonLd.thumbnailUrl) {
          const thumbs = Array.isArray(jsonLd.thumbnailUrl)
            ? jsonLd.thumbnailUrl
            : [jsonLd.thumbnailUrl];
          for (const t of thumbs) {
            if (t && !imageUrls.includes(t)) imageUrls.push(t);
          }
        }
      } catch {
        // JSON parse failed
      }
    }

    // Extract hashtags
    const hashtagMatches = html.matchAll(/#(\w{2,30})/g);
    const hashtags = new Set<string>();
    for (const m of hashtagMatches) {
      const tag = m[1].toLowerCase();
      if (!['script', 'style', 'html', 'head', 'body', 'div', 'span', 'class'].includes(tag)) {
        hashtags.add(tag);
      }
    }
    if (hashtags.size > 0) {
      textParts.push(`Hashtags: ${[...hashtags].map((h) => `#${h}`).join(' ')}`);
    }
  } catch (e) {
    console.warn('[process-tiktok] Instagram page extraction failed:', e);
  }

  if (textParts.length === 0 && imageUrls.length === 0) return null;

  const captionText = textParts.join('\n');
  console.log(
    '[process-tiktok] Instagram caption text (' + captionText.length + ' chars):',
    captionText.substring(0, 300)
  );

  return {
    captionText,
    stickerText: '', // Instagram doesn't expose text sticker data
    rawStickers: [],
    imageUrls,
    hasStickerText: false,
    fullPageFetched: true,
  };
}

/** Build ScrapedData from client-extracted WebView data (no server scraping needed) */
function buildScrapedDataFromClient(
  clientData: any,
  platform: VideoPlatform = 'tiktok'
): ScrapedData | null {
  const textParts: string[] = [];
  const imageUrls: string[] = [];
  const stickers: StickerEntry[] = [];

  if (platform === 'instagram') {
    // Instagram: caption + meta tags + images from rendered DOM
    if (clientData.caption) {
      textParts.push(`Caption: ${clientData.caption}`);
    }
    if (clientData.ogDescription) {
      textParts.push(`Description: ${clientData.ogDescription}`);
    }
    if (clientData.ogTitle) {
      textParts.push(`Title: ${clientData.ogTitle}`);
    }
    if (
      clientData.metaDescription &&
      !textParts.some((p) => p.includes(clientData.metaDescription))
    ) {
      textParts.push(`Meta description: ${clientData.metaDescription}`);
    }
    if (clientData.pageTitle) {
      textParts.push(`Page title: ${clientData.pageTitle}`);
    }
    if (clientData.ogImage && !imageUrls.includes(clientData.ogImage)) {
      imageUrls.push(clientData.ogImage);
    }
    // Images from rendered DOM (carousel, cover)
    if (clientData.imageUrls && Array.isArray(clientData.imageUrls)) {
      for (const imgUrl of clientData.imageUrls) {
        if (imgUrl && !imageUrls.includes(imgUrl)) imageUrls.push(imgUrl);
      }
    }
    // JSON-LD
    if (clientData.jsonLd) {
      const jsonLd = clientData.jsonLd;
      if (jsonLd.caption && !textParts.some((p) => p.includes(jsonLd.caption))) {
        textParts.push(`Structured caption: ${jsonLd.caption}`);
      }
      if (jsonLd.description && !textParts.some((p) => p.includes(jsonLd.description))) {
        textParts.push(`Structured data: ${jsonLd.description}`);
      }
      if (jsonLd.articleBody && !textParts.some((p) => p.includes(jsonLd.articleBody))) {
        textParts.push(`Article body: ${jsonLd.articleBody}`);
      }
    }
  } else {
    // TikTok: videoDetail + itemModule + meta tags
    if (clientData.videoDetail) {
      const universalData = {
        __DEFAULT_SCOPE__: { 'webapp.video-detail': clientData.videoDetail },
      };
      const extracted = extractFromUniversalData(universalData as any, imageUrls, stickers);
      if (extracted) textParts.push(extracted);
    }

    if (clientData.itemModule) {
      const sigiData = { ItemModule: clientData.itemModule };
      const extracted = extractFromSigiState(sigiData as any, imageUrls, stickers);
      if (extracted) textParts.push(extracted);
    }

    if (clientData.ogDescription) {
      textParts.push(`Description: ${clientData.ogDescription}`);
    }
    if (
      clientData.metaDescription &&
      !textParts.some((p) => p.includes(clientData.metaDescription))
    ) {
      textParts.push(`Meta description: ${clientData.metaDescription}`);
    }
    if (clientData.ogImage && !imageUrls.includes(clientData.ogImage)) {
      imageUrls.push(clientData.ogImage);
    }

    if (clientData.jsonLd) {
      const jsonLd = clientData.jsonLd;
      if (jsonLd.description && !textParts.some((p) => p.includes(jsonLd.description))) {
        textParts.push(`Structured data: ${jsonLd.description}`);
      }
      if (jsonLd.thumbnailUrl) {
        const thumbs = Array.isArray(jsonLd.thumbnailUrl)
          ? jsonLd.thumbnailUrl
          : [jsonLd.thumbnailUrl];
        for (const t of thumbs) {
          if (t && !imageUrls.includes(t)) imageUrls.push(t);
        }
      }
    }
  }

  if (textParts.length === 0 && imageUrls.length === 0 && stickers.length === 0) return null;

  const captionText = textParts.join('\n');
  const stickerText = stickers
    .map((s) => {
      const timePrefix =
        s.startTime !== undefined
          ? s.endTime !== undefined
            ? `[${s.startTime}s - ${s.endTime}s] `
            : `[${s.startTime}s] `
          : '';
      return `${timePrefix}"${s.text}"`;
    })
    .join('\n');

  const hasStickerText = stickers.length > 0 && isWorkoutRelevantStickerText(stickers);

  console.log(
    `[process-tiktok] Client data (${platform}) - caption:`,
    captionText.length,
    'chars, stickers:',
    stickers.length,
    ', images:',
    imageUrls.length
  );

  return {
    captionText,
    stickerText,
    rawStickers: stickers,
    imageUrls,
    hasStickerText,
    fullPageFetched: true,
  };
}

const EXERCISE_SIGNALS = [
  'squat',
  'press',
  'curl',
  'row',
  'deadlift',
  'lunge',
  'thrust',
  'fly',
  'raise',
  'pulldown',
  'pull down',
  'extension',
  'kickback',
  'crunch',
  'plank',
  'pushup',
  'push up',
  'pullup',
  'pull up',
  'dip',
  'bench',
  'overhead',
  'lateral',
  'cable',
  'dumbbell',
  'barbell',
  'superset',
  'drop set',
  'circuit',
  'rdl',
  'hip thrust',
  'glute bridge',
  'leg press',
  'hamstring',
  'quad',
  'calf',
  'lat pull',
  'tricep',
  'bicep',
  'shoulder',
  'chest fly',
];

/** Check if caption text contains a clearly structured exercise list (numbered list, explicit exercise names with set/rep info) */
function captionHasStructuredExercises(text: string): boolean {
  const lower = text.toLowerCase();

  // Pattern 1: Numbered list with exercise names (e.g., "1. Bulgarian Split Squats 2. Barbell Squats")
  // Use non-greedy match with lookahead so "1. X 2. Y 3. Z" on one line splits correctly
  const numberedLines = text.match(/\d+[\.\)]\s*[A-Za-z].+?(?=\s*\d+[\.\)]|$)/g) || [];
  const numberedWithExercise = numberedLines.filter((line) => {
    const lineLower = line.toLowerCase();
    return EXERCISE_SIGNALS.some((s) => lineLower.includes(s));
  });
  if (numberedWithExercise.length >= 3) return true;

  // Pattern 2: "exercises:" or "workout:" header followed by exercise names
  if (/(?:exercises|workout|routine)\s*[:\-|]/i.test(text)) {
    let exerciseCount = 0;
    for (const signal of EXERCISE_SIGNALS) {
      if (lower.includes(signal)) exerciseCount++;
    }
    if (exerciseCount >= 3) return true;
  }

  // Pattern 3: Multiple set/rep patterns paired with exercise names
  const setRepMatches = text.match(/[A-Za-z][\w\s]{2,30}\d\s*[x×]\s*\d/gi) || [];
  if (setRepMatches.length >= 3) return true;

  return false;
}

/** Check if sticker text contains workout-relevant content */
function isWorkoutRelevantStickerText(stickers: StickerEntry[]): boolean {
  const combined = stickers
    .map((s) => s.text)
    .join(' ')
    .toLowerCase();
  return isWorkoutRelevantText(combined);
}

/** Check if text contains exercise names or set/rep patterns */
function isWorkoutRelevantText(text: string): boolean {
  const lower = text.toLowerCase();

  // Check for set/rep patterns: "3x12", "4 x 10", "3 sets", "10 reps"
  const hasSetRepPattern =
    /\d\s*[x×]\s*\d/.test(lower) || /\d\s*sets?/i.test(lower) || /\d\s*reps?/i.test(lower);

  if (hasSetRepPattern) return true;

  // Need at least 2 exercise keywords to consider caption as having exercises
  let matchCount = 0;
  for (const signal of EXERCISE_SIGNALS) {
    if (lower.includes(signal)) {
      matchCount++;
      if (matchCount >= 2) return true;
    }
  }

  return false;
}

/** Extract text from sticker object, trying multiple possible field names */
function extractStickerText(sticker: any): string {
  // Try known and speculative field names for text content
  const text =
    sticker.stickerText ||
    sticker.text ||
    sticker.content ||
    sticker.textContent ||
    sticker.displayText ||
    sticker.stickerValue ||
    '';

  if (typeof text === 'string') return text.trim();
  if (typeof text === 'object' && text !== null) {
    // Some stickers might have nested text in an object
    return text.text || text.value || text.content || JSON.stringify(text);
  }
  return '';
}

/** Extract timestamps from sticker object, trying multiple possible field names */
function extractStickerTimes(sticker: any): { startTime?: number; endTime?: number } {
  const startTime =
    sticker.startTime ?? sticker.start ?? sticker.timeStart ?? sticker.beginTime ?? undefined;
  const endTime = sticker.endTime ?? sticker.end ?? sticker.timeEnd ?? undefined;

  // Also check for duration-based timing
  if (startTime !== undefined && endTime === undefined && sticker.duration !== undefined) {
    return { startTime: Number(startTime), endTime: Number(startTime) + Number(sticker.duration) };
  }

  return {
    startTime: startTime !== undefined ? Number(startTime) : undefined,
    endTime: endTime !== undefined ? Number(endTime) : undefined,
  };
}

/** Extract video description, stickers, and cover images from __UNIVERSAL_DATA_FOR_REHYDRATION__ */
function extractFromUniversalData(
  data: Record<string, unknown>,
  imageUrls: string[],
  stickers: StickerEntry[]
): string | null {
  const parts: string[] = [];
  try {
    const defaultScope = (data as any)?.['__DEFAULT_SCOPE__'];
    if (!defaultScope) return null;

    const videoDetail =
      defaultScope['webapp.video-detail'] || defaultScope['webapp.video-detail-non-ssr'];
    if (videoDetail) {
      const itemInfo = videoDetail.itemInfo?.itemStruct;
      if (itemInfo) {
        // Log all top-level keys on itemStruct for field discovery
        console.log('[process-tiktok] itemStruct keys:', Object.keys(itemInfo).join(', '));
        if (itemInfo.desc) parts.push(`Video description: ${itemInfo.desc}`);

        // Extract cover image URLs
        const video = itemInfo.video;
        if (video) {
          if (video.originCover && !imageUrls.includes(video.originCover)) {
            imageUrls.push(video.originCover);
          }
          if (video.cover && !imageUrls.includes(video.cover)) {
            imageUrls.push(video.cover);
          }
          if (video.reflowCover && !imageUrls.includes(video.reflowCover)) {
            imageUrls.push(video.reflowCover);
          }
        }

        // Extract stickersOnItem (text overlays added via TikTok's native text tool)
        if (itemInfo.stickersOnItem && Array.isArray(itemInfo.stickersOnItem)) {
          console.log(
            '[process-tiktok] stickersOnItem found in UNIVERSAL_DATA:',
            itemInfo.stickersOnItem.length,
            'stickers'
          );
          for (const sticker of itemInfo.stickersOnItem) {
            // Log raw sticker data for field discovery
            console.log('[process-tiktok] Raw sticker:', JSON.stringify(sticker).substring(0, 500));

            const text = extractStickerText(sticker);
            if (text) {
              const times = extractStickerTimes(sticker);
              stickers.push({ text, ...times, rawData: sticker });
            }
          }
        }

        // Also check for text stickers in other possible locations
        if (itemInfo.textStickerInfos && Array.isArray(itemInfo.textStickerInfos)) {
          console.log('[process-tiktok] textStickerInfos found:', itemInfo.textStickerInfos.length);
          for (const sticker of itemInfo.textStickerInfos) {
            console.log(
              '[process-tiktok] Raw textStickerInfo:',
              JSON.stringify(sticker).substring(0, 500)
            );
            const text = extractStickerText(sticker);
            if (text) {
              const times = extractStickerTimes(sticker);
              stickers.push({ text, ...times, rawData: sticker });
            }
          }
        }

        // Extract hashtag metadata (textExtra)
        if (itemInfo.textExtra) {
          const textExtras = itemInfo.textExtra
            .map((t: any) => t.hashtagName || t.text || '')
            .filter(Boolean);
          if (textExtras.length > 0) parts.push(`Text tags: ${textExtras.join(', ')}`);
        }

        // Subtitles
        if (itemInfo.subtitleInfos) {
          for (const sub of itemInfo.subtitleInfos) {
            if (sub.Url) {
              parts.push('[Has subtitles]');
              break;
            }
          }
        }

        // Challenges / hashtags
        if (itemInfo.challenges) {
          const challenges = itemInfo.challenges.map((c: any) => c.title).filter(Boolean);
          if (challenges.length > 0) parts.push(`Challenges: ${challenges.join(', ')}`);
        }

        // Suggested words
        if (itemInfo.suggestedWords) {
          parts.push(`Suggested: ${itemInfo.suggestedWords.join(', ')}`);
        }

        // Slideshow images
        if (itemInfo.imagePost?.images) {
          for (const img of itemInfo.imagePost.images) {
            const imgUrl = img.imageURL?.urlList?.[0];
            if (imgUrl && !imageUrls.includes(imgUrl)) {
              imageUrls.push(imgUrl);
            }
          }
          console.log('[process-tiktok] Slideshow images found:', itemInfo.imagePost.images.length);
        }
      }
    }
  } catch (e) {
    console.warn('[process-tiktok] Universal data extraction error:', e);
  }
  return parts.length > 0 ? parts.join('\n') : null;
}

/** Extract video description, stickers, and cover images from SIGI_STATE (older format) */
function extractFromSigiState(
  data: Record<string, unknown>,
  imageUrls: string[],
  stickers: StickerEntry[]
): string | null {
  const parts: string[] = [];
  try {
    const itemModule = (data as any)?.ItemModule;
    if (itemModule) {
      for (const videoId of Object.keys(itemModule)) {
        const item = itemModule[videoId];
        if (item.desc) parts.push(`Video description: ${item.desc}`);
        if (item.textExtra) {
          const extras = item.textExtra.map((t: any) => t.hashtagName || '').filter(Boolean);
          if (extras.length > 0) parts.push(`Tags: ${extras.join(', ')}`);
        }

        // Extract cover images
        const video = item.video;
        if (video) {
          if (video.originCover && !imageUrls.includes(video.originCover)) {
            imageUrls.push(video.originCover);
          }
          if (video.cover && !imageUrls.includes(video.cover)) {
            imageUrls.push(video.cover);
          }
        }

        // Extract stickersOnItem from SIGI_STATE
        if (item.stickersOnItem && Array.isArray(item.stickersOnItem)) {
          console.log(
            '[process-tiktok] stickersOnItem found in SIGI_STATE:',
            item.stickersOnItem.length,
            'stickers'
          );
          for (const sticker of item.stickersOnItem) {
            console.log(
              '[process-tiktok] Raw SIGI sticker:',
              JSON.stringify(sticker).substring(0, 500)
            );
            const text = extractStickerText(sticker);
            if (text) {
              const times = extractStickerTimes(sticker);
              stickers.push({ text, ...times, rawData: sticker });
            }
          }
        }

        // Also check textStickerInfos in SIGI_STATE
        if (item.textStickerInfos && Array.isArray(item.textStickerInfos)) {
          console.log(
            '[process-tiktok] textStickerInfos found in SIGI_STATE:',
            item.textStickerInfos.length
          );
          for (const sticker of item.textStickerInfos) {
            console.log(
              '[process-tiktok] Raw SIGI textStickerInfo:',
              JSON.stringify(sticker).substring(0, 500)
            );
            const text = extractStickerText(sticker);
            if (text) {
              const times = extractStickerTimes(sticker);
              stickers.push({ text, ...times, rawData: sticker });
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('[process-tiktok] SIGI_STATE extraction error:', e);
  }
  return parts.length > 0 ? parts.join('\n') : null;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

/** Download cover images and convert to base64 for Claude Vision. Max 3 images, max 1MB each. */
async function downloadCoverImages(urls: string[]): Promise<DownloadedImage[]> {
  const images: DownloadedImage[] = [];
  const uniqueUrls = [...new Set(urls)].slice(0, 4);

  for (const url of uniqueUrls) {
    if (images.length >= 3) break;
    try {
      console.log('[process-tiktok] Downloading image:', url.substring(0, 100));
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      });
      if (!response.ok) {
        console.warn('[process-tiktok] Image download failed:', response.status);
        continue;
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      if (bytes.length > 1_000_000) {
        console.warn('[process-tiktok] Image too large, skipping:', bytes.length);
        continue;
      }
      if (bytes.length < 1000) {
        console.warn('[process-tiktok] Image too small, skipping:', bytes.length);
        continue;
      }

      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      let mediaType = 'image/jpeg';
      if (contentType.includes('png')) mediaType = 'image/png';
      else if (contentType.includes('webp')) mediaType = 'image/webp';
      else if (contentType.includes('gif')) mediaType = 'image/gif';

      images.push({ data: base64, mediaType });
      console.log('[process-tiktok] Image downloaded:', bytes.length, 'bytes,', mediaType);
    } catch (e) {
      console.warn('[process-tiktok] Image download error:', e);
    }
  }
  return images;
}

/** FAST PATH: Text-only Claude call using sticker text + caption. No images needed. */
async function parseExercisesWithClaudeFastPath(
  captionText: string,
  stickerText: string,
  platformName: string = 'TikTok'
): Promise<ProcessResult> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    console.error('[process-tiktok] ANTHROPIC_API_KEY not set');
    return { success: false, error: 'AI service not configured', confidence: 0 };
  }

  const prompt = `You are extracting exercises from a ${platformName} fitness/workout video. You have been given on-screen text overlays (the creator's text stickers) and the video caption/metadata.

=== ON-SCREEN TEXT (from video text overlays, highest priority) ===
${stickerText}

=== VIDEO CAPTION & METADATA ===
${captionText}

Respond with ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "isWorkout": true,
  "workoutName": "Name of the workout",
  "confidence": 0.9,
  "exercises": [
    {
      "name": "Exercise Name (standard gym terminology)",
      "sets": 3,
      "reps": 12,
      "repsPerSet": null,
      "weight": "optional weight info or null",
      "notes": "any special instructions or null"
    }
  ]
}

Rules:
- The ON-SCREEN TEXT section contains text stickers the creator placed on the video. This is your PRIMARY source of exercise information.
- Common sticker formats: "Exercise Name - 3x12", "Exercise Name 4 sets x 10 reps", "Exercise\\n3x12", or just exercise names shown one at a time.
- The CAPTION section provides context (workout name, muscle focus, hashtags). Use it to fill gaps but trust ON-SCREEN TEXT for specific exercises.
- Normalize exercise names to standard gym terminology (capitalize properly, e.g. "Barbell Hip Thrust" not "hip thrusts").
- If sets/reps are not specified, use reasonable defaults (3 sets, 10 reps).
- If a rep range is given like "8-12", use the higher number for reps.
- IMPORTANT: For pyramid/descending/ascending rep patterns like "3x10,8,6" or "4x12,10,8,6", set "sets" to the number of sets (3 or 4), "reps" to the first rep count (10 or 12), and "repsPerSet" to the full array e.g. [10,8,6] or [12,10,8,6]. If all sets have the same reps, set "repsPerSet" to null.
- Return exercises in the order they appear (by timestamp if available).
- Set confidence based on how clearly exercises are listed. If you are unsure about any exercise names, lower the confidence.
- Only set isWorkout to false if the content is clearly NOT fitness-related.

CRITICAL - DO NOT HALLUCINATE:
- ONLY return exercises that are explicitly written as text. NEVER guess or infer exercises.
- NEVER infer exercises from physical movements, body positions, or equipment.
- NEVER generate "default" or "common" exercises that are not explicitly mentioned in the text.
- If the text only mentions a body part (e.g., "leg day") without listing specific exercises, set isWorkout to false.
- If you are uncertain whether a word is an exercise name, DO NOT include it.
- It is BETTER to return fewer exercises or isWorkout: false than to guess.`;

  console.log('[process-tiktok] Calling Claude fast path (text-only)');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[process-tiktok] Claude API error:', response.status, errorText);
    return { success: false, error: 'AI processing failed', confidence: 0 };
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  console.log('[process-tiktok] Claude fast path response:', text.substring(0, 300));

  return parseClaudeResponse(text);
}

/** UNIFIED PATH: Combines stickers + caption + cover images into one Claude call */
async function parseExercisesUnified(
  captionText: string,
  stickerText: string,
  images: DownloadedImage[],
  platformName: string = 'TikTok'
): Promise<ProcessResult> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    console.error('[process-tiktok] ANTHROPIC_API_KEY not set');
    return { success: false, error: 'AI service not configured', confidence: 0 };
  }

  const contentBlocks: any[] = [];

  // Add images first (Vision)
  for (const img of images) {
    contentBlocks.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: img.mediaType,
        data: img.data,
      },
    });
  }

  // Build the text sections
  const textSections: string[] = [];

  if (stickerText.length > 0) {
    textSections.push(`=== ON-SCREEN TEXT STICKERS ===\n${stickerText}`);
  }

  if (captionText.length > 0) {
    textSections.push(`=== VIDEO CAPTION & METADATA ===\n${captionText}`);
  }

  const imageNote =
    images.length > 0
      ? `\n\nYou have also been given ${images.length} cover/thumbnail image(s) from the video. IMPORTANT: These images often show a SUMMARY LIST of all exercises in the workout. Read ALL text visible in the images carefully.`
      : '';

  contentBlocks.push({
    type: 'text',
    text: `You are extracting exercises from a ${platformName} fitness/workout video.
You have multiple data sources. Use ALL of them to find every exercise.${imageNote}

${textSections.join('\n\n')}

Respond with ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "isWorkout": true,
  "workoutName": "Name of the workout",
  "confidence": 0.85,
  "exercises": [
    {
      "name": "Exercise Name (standard gym terminology)",
      "sets": 3,
      "reps": 12,
      "repsPerSet": null,
      "weight": "optional weight info or null",
      "notes": "any special instructions or null"
    }
  ]
}

Rules:
- Cover/thumbnail images often show a COMPLETE LIST of all exercises. Read every piece of text in the images.
- Text stickers may only show exercises for one segment of the video, not the full workout.
- The caption may list exercises not shown in stickers or images. Include them.
- Extract unique exercises across ALL sources. DEDUPLICATE: if the same exercise appears across sources with slight name differences (e.g., "leg extension" in one source and "single leg extension" in another), count it as ONE exercise. Use the most specific name.
- Normalize exercise names to standard gym terminology (e.g. "Barbell Hip Thrust" not "hip thrusts").
- If sets/reps are not specified, use reasonable defaults (3 sets, 10 reps).
- If a rep range is given like "8-12", use the higher number.
- IMPORTANT: For pyramid/descending/ascending rep patterns like "3x10,8,6" or "4x12,10,8,6", set "sets" to the number of sets (3 or 4), "reps" to the first rep count (10 or 12), and "repsPerSet" to the full array e.g. [10,8,6] or [12,10,8,6]. If all sets have the same reps, set "repsPerSet" to null.
- Return exercises in the order they appear.
- Do NOT identify exercises by looking at physical movements in images. Only extract from WRITTEN TEXT.

CRITICAL - DO NOT HALLUCINATE:
- ONLY return exercises that are explicitly written as text. NEVER guess or infer exercises.
- NEVER infer exercises from physical movements, body positions, or equipment visible in images.
- NEVER generate "default" or "common" exercises that are not explicitly mentioned in the text.
- If the text only mentions a body part (e.g., "leg day") without listing specific exercises, set isWorkout to false.
- If you are uncertain whether a word is an exercise name, DO NOT include it.
- It is BETTER to return fewer exercises or isWorkout: false than to guess.
- Only set isWorkout to true if you found explicit exercise names in text.`,
  });

  // Use Sonnet when we have images (better OCR), Haiku for text-only
  const model = images.length > 0 ? 'claude-sonnet-4-5-20250929' : 'claude-haiku-4-5-20251001';
  console.log(
    '[process-tiktok] Calling Claude unified path with',
    contentBlocks.length,
    'blocks (' + images.length + ' images), model:',
    model
  );

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      messages: [{ role: 'user', content: contentBlocks }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[process-tiktok] Claude API error:', response.status, errorText);
    return { success: false, error: 'AI processing failed', confidence: 0 };
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  console.log('[process-tiktok] Claude unified response:', text.substring(0, 500));

  return parseClaudeResponse(text);
}

/** CAPTION PATH: Text-only Claude call using just caption/description text */
async function parseExercisesFromCaption(captionText: string): Promise<ProcessResult> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    console.error('[process-tiktok] ANTHROPIC_API_KEY not set');
    return { success: false, error: 'AI service not configured', confidence: 0 };
  }

  const prompt = `You are extracting exercises from a fitness/workout video. You ONLY have the video's caption/description text. There are no images or on-screen text available.

=== VIDEO CAPTION & METADATA ===
${captionText}

Respond with ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "isWorkout": true,
  "workoutName": "Name of the workout",
  "confidence": 0.7,
  "exercises": [
    {
      "name": "Exercise Name (standard gym terminology)",
      "sets": 3,
      "reps": 12,
      "repsPerSet": null,
      "weight": "optional weight info or null",
      "notes": "any special instructions or null"
    }
  ]
}

Rules:
- Extract ONLY exercises that are explicitly named in the caption text.
- Do NOT guess or infer exercises from hashtags alone (e.g. #legday does NOT mean "Squat").
- If the caption lists exercises with set/rep info, extract them with high confidence (0.8+).
- If the caption mentions exercise names without sets/reps, extract them with defaults (3 sets, 10 reps) and confidence 0.6-0.7.
- Normalize exercise names to standard gym terminology (e.g. "Barbell Hip Thrust" not "hip thrusts").
- If the caption only has hashtags and a general description without specific exercise names, set isWorkout to false.
- Keep the exercise type EXACT. Do not substitute similar exercises (e.g. "wide grip row" must stay as a row, not become "push ups").
- IMPORTANT: For pyramid/descending/ascending rep patterns like "3x10,8,6" or "4x12,10,8,6", set "sets" to the number of sets (3 or 4), "reps" to the first rep count (10 or 12), and "repsPerSet" to the full array e.g. [10,8,6] or [12,10,8,6]. If all sets have the same reps, set "repsPerSet" to null.

CRITICAL - DO NOT HALLUCINATE:
- ONLY return exercises that are explicitly written in the caption. NEVER guess or infer exercises.
- NEVER generate "default" or "common" exercises that are not explicitly mentioned.
- If you are uncertain whether a word is an exercise name, DO NOT include it.
- It is BETTER to return fewer exercises or isWorkout: false than to guess.`;

  console.log('[process-tiktok] Calling Claude caption path (text-only)');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[process-tiktok] Claude API error:', response.status, errorText);
    return { success: false, error: 'AI processing failed', confidence: 0 };
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  console.log('[process-tiktok] Claude caption path response:', text.substring(0, 300));

  return parseClaudeResponse(text);
}

/** FALLBACK: Multimodal Claude call with cover images + caption text */
async function parseExercisesWithClaude(
  captionText: string,
  images: DownloadedImage[]
): Promise<ProcessResult> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    console.error('[process-tiktok] ANTHROPIC_API_KEY not set');
    return { success: false, error: 'AI service not configured', confidence: 0 };
  }

  const contentBlocks: any[] = [];

  for (const img of images) {
    contentBlocks.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: img.mediaType,
        data: img.data,
      },
    });
  }

  const hasImages = images.length > 0;
  const imageContext = hasImages
    ? `\n\nYou have also been given ${images.length} image(s) from the video (cover/thumbnail images). Look for any TEXT written on these images (exercise names, set/rep counts). Workout videos often show exercise lists as text overlays.`
    : '';

  contentBlocks.push({
    type: 'text',
    text: `You are extracting exercises from a fitness/workout video. Below is text data scraped from the video page, including the title, description, hashtags, and metadata.${imageContext}

Video data:
"""
${captionText}
"""

Respond with ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "isWorkout": true,
  "workoutName": "Name of the workout (infer from context, e.g. 'Upper Body Day', 'Leg Day')",
  "confidence": 0.85,
  "exercises": [
    {
      "name": "exercise name (use standard gym terminology, e.g. 'Barbell Hip Thrust' not 'hip thrusts')",
      "sets": 3,
      "reps": 12,
      "repsPerSet": null,
      "weight": "optional weight info or null",
      "notes": "any special instructions or null"
    }
  ]
}

Rules:
- Your PRIMARY sources are: (1) text written in the images and (2) the video caption/description text above.
- ONLY return exercises that are explicitly NAMED in the text data or clearly WRITTEN as text in the images.
- Do NOT identify exercises by looking at what someone is physically doing in the image. Only extract exercises from WRITTEN TEXT.
- If you only see a person exercising but no written exercise names, set isWorkout to false.
- If the caption mentions exercises by name, extract those exact exercise names.
- Normalize exercise names to standard gym terminology (capitalize properly, e.g. 'Barbell Hip Thrust' not 'hip thrusts'). Keep the exercise type EXACT, do not substitute (e.g. "wide grip row" stays a row, not push ups).
- If sets/reps are not specified, use reasonable defaults (3 sets, 10 reps).
- If a rep range is given like "8-12", use the higher number for reps.
- IMPORTANT: For pyramid/descending/ascending rep patterns like "3x10,8,6" or "4x12,10,8,6", set "sets" to the number of sets (3 or 4), "reps" to the first rep count (10 or 12), and "repsPerSet" to the full array e.g. [10,8,6] or [12,10,8,6]. If all sets have the same reps, set "repsPerSet" to null.
- Return exercises in the order they appear.
- confidence should be 0.0-1.0. Use 0.3 or lower if uncertain.
- Only set isWorkout to true if you found explicit exercise names in text.

CRITICAL - DO NOT HALLUCINATE:
- ONLY return exercises that are explicitly written as text. NEVER guess or infer exercises.
- NEVER infer exercises from physical movements, body positions, or equipment visible in images.
- NEVER generate "default" or "common" exercises that are not explicitly mentioned in the text.
- If you are uncertain whether a word is an exercise name, DO NOT include it.
- It is BETTER to return fewer exercises or isWorkout: false than to guess.`,
  });

  console.log(
    '[process-tiktok] Calling Claude fallback with',
    contentBlocks.length,
    'content blocks (' + images.length + ' images)'
  );

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      messages: [{ role: 'user', content: contentBlocks }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[process-tiktok] Claude API error:', response.status, errorText);
    return { success: false, error: 'AI processing failed', confidence: 0 };
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  console.log('[process-tiktok] Claude fallback response:', text.substring(0, 300));

  return parseClaudeResponse(text);
}

/**
 * FRAMES PATH - PASS 1: Pure OCR. Extract all visible text from video frames.
 * Does NOT interpret exercises. Just transcribes what text is visible.
 */
async function ocrFrameText(
  frameImages: DownloadedImage[],
  coverImages: DownloadedImage[]
): Promise<{ ocrText: string; hasReadableText: boolean }> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    console.error('[process-tiktok] ANTHROPIC_API_KEY not set');
    return { ocrText: '', hasReadableText: false };
  }

  const contentBlocks: any[] = [];

  const maxFrames = 10;
  const framesToSend = frameImages.slice(0, maxFrames);
  for (const img of framesToSend) {
    contentBlocks.push({
      type: 'image',
      source: { type: 'base64', media_type: img.mediaType, data: img.data },
    });
  }

  for (const img of coverImages.slice(0, 2)) {
    contentBlocks.push({
      type: 'image',
      source: { type: 'base64', media_type: img.mediaType, data: img.data },
    });
  }

  const totalImages = framesToSend.length + Math.min(coverImages.length, 2);

  contentBlocks.push({
    type: 'text',
    text: `You are an OCR assistant. You have been given ${framesToSend.length} sequential frames from a workout video${coverImages.length > 0 ? ` and ${Math.min(coverImages.length, 2)} cover/thumbnail image(s)` : ''}.

Your ONLY job is to transcribe ALL text visible in these images EXACTLY as written.

For each image that contains text, list the text you can read. Include:
- Exercise names
- Numbers (sets, reps, weights)
- Any other text overlays or captions

Format your response as:
Frame 1: [exact text found, or "NO TEXT VISIBLE"]
Frame 2: [exact text found, or "NO TEXT VISIBLE"]
...
${coverImages.length > 0 ? 'Cover 1: [exact text found, or "NO TEXT VISIBLE"]\n...' : ''}

CRITICAL RULES:
- ONLY transcribe text that is actually written/displayed as text overlays in the images.
- If an image shows a person exercising but has NO written text, write "NO TEXT VISIBLE".
- Do NOT describe what people are doing physically.
- Do NOT guess exercise names from body positions or equipment.
- Do NOT infer or generate exercise names that are not literally written as text in the image.
- It is completely fine to report "NO TEXT VISIBLE" for most or all frames. Many workout videos have no on-screen text.
- Transcribe text EXACTLY as it appears, even if misspelled or abbreviated.`,
  });

  console.log(
    '[process-tiktok] OCR Pass 1: sending',
    totalImages,
    'images to Claude Sonnet for text extraction'
  );

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      messages: [{ role: 'user', content: contentBlocks }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[process-tiktok] OCR Pass 1 error:', response.status, errorText);
    return { ocrText: '', hasReadableText: false };
  }

  const data = await response.json();
  const ocrText = data.content?.[0]?.text || '';
  console.log('[process-tiktok] OCR Pass 1 response:', ocrText.substring(0, 500));

  // Check if any frames actually had readable text
  const lines = ocrText.split('\n').filter((l: string) => l.trim().length > 0);
  const noTextCount = lines.filter((l: string) =>
    l.toUpperCase().includes('NO TEXT VISIBLE')
  ).length;
  const hasReadableText = lines.length > 0 && noTextCount < lines.length;

  console.log(
    '[process-tiktok] OCR Pass 1 summary:',
    lines.length,
    'lines,',
    noTextCount,
    '"NO TEXT VISIBLE",',
    'hasReadableText:',
    hasReadableText
  );

  return { ocrText, hasReadableText };
}

/**
 * FRAMES PATH - PASS 2: Parse exercises from OCR-extracted text + caption + stickers.
 * Text-only call, no images. Separates OCR from interpretation to prevent hallucination.
 */
async function parseExercisesFromOcrText(
  ocrText: string,
  captionText: string,
  stickerText: string,
  platformName: string = 'TikTok'
): Promise<ProcessResult> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    console.error('[process-tiktok] ANTHROPIC_API_KEY not set');
    return { success: false, error: 'AI service not configured', confidence: 0 };
  }

  const textSections: string[] = [];

  if (ocrText.length > 0) {
    textSections.push(`=== TEXT EXTRACTED FROM VIDEO FRAMES (OCR) ===\n${ocrText}`);
  }
  if (stickerText.length > 0) {
    textSections.push(`=== ON-SCREEN TEXT STICKERS ===\n${stickerText}`);
  }
  if (captionText.length > 0) {
    textSections.push(`=== VIDEO CAPTION & METADATA ===\n${captionText}`);
  }

  const prompt = `You are extracting exercises from a ${platformName} fitness/workout video. You have been given text from multiple sources. Use ALL of them to find every exercise.

${textSections.join('\n\n')}

Respond with ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "isWorkout": true,
  "workoutName": "Name of the workout",
  "confidence": 0.85,
  "exercises": [
    {
      "name": "Exercise Name (standard gym terminology)",
      "sets": 3,
      "reps": 12,
      "repsPerSet": null,
      "weight": "optional weight info or null",
      "notes": "any special instructions or null"
    }
  ]
}

Rules:
- Extract exercises from ALL text sources. The OCR section contains text read from video frames, stickers are text overlays, and caption is the video description.
- If the caption clearly lists exercises (e.g., numbered list), prioritize those as they are the most reliable.
- If the exact same exercise appears in multiple sources, only include it once. But do NOT merge exercises that are similar but different (e.g., "leg extension" and "single leg extension" are DIFFERENT exercises, "bench press" and "close grip bench press" are DIFFERENT exercises). When in doubt, keep them separate.
- Normalize exercise names to standard gym terminology (e.g. "Barbell Hip Thrust" not "hip thrusts").
- If sets/reps are not specified, use reasonable defaults (3 sets, 10 reps).
- If a rep range is given like "8-12", use the higher number.
- IMPORTANT: For pyramid/descending/ascending rep patterns like "3x10,8,6" or "4x12,10,8,6", set "sets" to the number of sets (3 or 4), "reps" to the first rep count (10 or 12), and "repsPerSet" to the full array e.g. [10,8,6] or [12,10,8,6]. If all sets have the same reps, set "repsPerSet" to null.
- Return exercises in the order they appear.

CRITICAL - DO NOT HALLUCINATE:
- ONLY return exercises that are explicitly written in the provided text. NEVER guess or infer exercises.
- If the OCR text says "NO TEXT VISIBLE" for all frames, do NOT invent exercises from that.
- NEVER generate "default" or "common" exercises that are not explicitly mentioned.
- If the text only mentions a body part (e.g., "leg day") without listing specific exercises, set isWorkout to false.
- If you are uncertain whether a word is an exercise name, DO NOT include it.
- It is BETTER to return fewer exercises or isWorkout: false than to guess.`;

  console.log('[process-tiktok] Parse Pass 2: sending text-only to Claude Haiku');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[process-tiktok] Parse Pass 2 error:', response.status, errorText);
    return { success: false, error: 'AI processing failed', confidence: 0 };
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  console.log('[process-tiktok] Parse Pass 2 response:', text.substring(0, 500));

  return parseClaudeResponse(text);
}

/**
 * Cross-validate primary results against caption text.
 * If caption has exercise info and primary results have zero overlap, the primary results
 * are likely hallucinated. Returns result with reduced confidence if no overlap found.
 */
function crossValidateResults(
  primaryResult: ProcessResult,
  captionText: string,
  primaryPath: string
): ProcessResult {
  // Only cross-validate if we have both primary results and caption with exercise info
  if (!primaryResult.success || !primaryResult.exercises?.length) return primaryResult;
  if (!isWorkoutRelevantText(captionText)) return primaryResult;
  // Don't cross-validate caption-first results against themselves
  if (primaryPath === 'caption') return primaryResult;

  // Extract exercise-like words from caption
  const captionLower = captionText.toLowerCase();
  const captionSignals = EXERCISE_SIGNALS.filter((s) => captionLower.includes(s));

  if (captionSignals.length < 2) return primaryResult; // Not enough caption data to validate

  // Check overlap: do any primary exercises match caption signals?
  const primaryNames = primaryResult.exercises!.map((e) => e.name.toLowerCase());
  const hasOverlap = primaryNames.some((name) =>
    captionSignals.some((signal) => name.includes(signal))
  );

  if (hasOverlap) {
    console.log('[process-tiktok] Cross-validation: primary results overlap with caption signals');
    return primaryResult;
  }

  // No overlap -- primary results may be hallucinated
  console.warn(
    '[process-tiktok] Cross-validation FAILED: primary exercises have no overlap with caption'
  );
  console.warn('[process-tiktok] Primary exercises:', primaryNames);
  console.warn('[process-tiktok] Caption signals:', captionSignals);

  return {
    ...primaryResult,
    confidence: Math.min(primaryResult.confidence, 0.3),
  };
}

/**
 * Calculate confidence based on objective signals rather than Claude's self-reported confidence.
 */
function calibrateConfidence(
  result: ProcessResult,
  path: string,
  ocrFoundText: boolean | null,
  captionHasExercises: boolean
): number {
  if (!result.success || !result.exercises?.length) return 0;

  const exerciseCount = result.exercises.length;
  let confidence = 0.5; // Base

  // Path-based adjustments
  if (path === 'fast') {
    // Rich sticker data is highly reliable
    confidence = 0.85;
  } else if (path === 'caption') {
    // Caption-only depends on how structured the caption was
    confidence = captionHasExercises ? 0.8 : 0.55;
  } else if (path === 'frames') {
    if (ocrFoundText === true) {
      confidence = 0.7; // OCR found text, parsing is likely good
    } else if (ocrFoundText === false) {
      confidence = 0.15; // OCR found no text but we still got exercises - very suspicious
    } else {
      confidence = 0.5;
    }
  } else {
    // Unified/fallback
    confidence = 0.55;
  }

  // Exercise count adjustments
  if (exerciseCount >= 3 && exerciseCount <= 10) {
    confidence += 0.05; // Reasonable count
  } else if (exerciseCount === 1) {
    confidence -= 0.1; // Suspiciously few
  } else if (exerciseCount > 12) {
    confidence -= 0.1; // Suspiciously many
  }

  // Caption corroboration bonus (for non-caption paths)
  if (path !== 'caption' && captionHasExercises) {
    confidence += 0.1;
  }

  return Math.max(0, Math.min(1, confidence));
}

/** Shared response parser for all Claude paths */
function parseClaudeResponse(text: string): ProcessResult {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('[process-tiktok] Could not parse AI response:', text);
    return { success: false, error: 'Could not parse workout data', confidence: 0 };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);

    // Only reject if Claude explicitly says this is not a workout
    // Confidence thresholds are handled by calibrateConfidence in the main handler
    if (!parsed.isWorkout) {
      return {
        success: false,
        error: 'This video does not appear to contain a workout',
        confidence: parsed.confidence || 0,
      };
    }

    return {
      success: true,
      workoutName: parsed.workoutName || 'Imported Workout',
      exercises: (parsed.exercises || []).map((e: TikTokExercise) => {
        let repsPerSet = Array.isArray(e.repsPerSet) ? e.repsPerSet : null;
        let sets = e.sets || 3;
        let reps = e.reps || 10;

        // Handle case where reps came back as a string like "10,8,6"
        if (typeof e.reps === 'string' && (e.reps as string).includes(',')) {
          const parsed = (e.reps as string)
            .split(',')
            .map(Number)
            .filter((n) => !isNaN(n));
          if (parsed.length > 1) {
            repsPerSet = parsed;
            sets = parsed.length;
            reps = parsed[0];
          }
        }

        // If repsPerSet exists, derive sets count from it
        if (repsPerSet && repsPerSet.length > 0) {
          sets = repsPerSet.length;
          reps = repsPerSet[0];
        }

        return {
          name: e.name,
          sets,
          reps,
          repsPerSet,
          weight: e.weight || null,
          notes: e.notes || null,
        };
      }),
      confidence: parsed.confidence || 0.5,
    };
  } catch (parseError) {
    console.error('[process-tiktok] JSON parse error:', parseError);
    return { success: false, error: 'Could not parse workout data', confidence: 0 };
  }
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
