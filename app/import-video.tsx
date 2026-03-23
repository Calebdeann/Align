import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  NativeModules,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
let WebView: any = null;
type WebViewMessageEvent = any;
try {
  const mod = require('react-native-webview');
  WebView = mod.default || mod;
} catch {
  // WebView not available (e.g. Expo Go) - will be null
}
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';
import { ExerciseImage } from '@/components/ExerciseImage';
import {
  processVideoImport,
  VideoPlatform,
  extractVideoId,
  getCachedImport,
  saveCachedImport,
} from '@/services/api/tiktokImport';
import { matchExercisesToDatabase, MatchResult } from '@/services/exerciseMatching';
import { TemplateExercise } from '@/stores/templateStore';
import { useExerciseStore } from '@/stores/exerciseStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useNavigationLock } from '@/hooks/useNavigationLock';

const { WorkoutWidgetBridge } = NativeModules;

type ScreenState = 'loading' | 'review' | 'error';

// Platform display names for UI text
const PLATFORM_NAMES: Record<VideoPlatform, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
};

// JS injected into the hidden WebView to extract TikTok page data client-side.
// Polls repeatedly for hydration data (videoDetail/itemModule) since TikTok may
// inject it dynamically after page load. Also polls for video duration.
const TIKTOK_EXTRACTION_JS = `
(function() {
  var result = { extractionErrors: [] };
  var attempts = 0;
  var maxAttempts = 20;
  var sent = false;

  function findVideoDetail(obj) {
    // Recursively search for video detail data (stickersOnItem, itemStruct, desc)
    if (!obj || typeof obj !== 'object') return null;
    // Direct match: has itemInfo or itemStruct
    if (obj.itemInfo || obj.itemStruct) return obj;
    // Check keys for anything containing 'video' or 'detail'
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i].toLowerCase();
      if (k.indexOf('video') !== -1 || k.indexOf('detail') !== -1 || k.indexOf('item') !== -1) {
        var found = findVideoDetail(obj[keys[i]]);
        if (found) return found;
      }
    }
    return null;
  }

  function tryExtractFromData(fullData, label) {
    try {
      // Log top-level keys for debugging
      var topKeys = Object.keys(fullData);
      result._hydrationKeys = topKeys;

      var scope = fullData['__DEFAULT_SCOPE__'];
      if (scope) {
        var scopeKeys = Object.keys(scope);
        result._scopeKeys = scopeKeys;

        // Try known keys first (TikTok renamed to webapp.reflow.video.detail in 2025)
        var detail = scope['webapp.video-detail'] || scope['webapp.video-detail-non-ssr'] || scope['webapp.reflow.video.detail'];
        if (detail) { result.videoDetail = detail; return true; }

        // Try any key containing 'video' or 'detail'
        for (var i = 0; i < scopeKeys.length; i++) {
          var k = scopeKeys[i].toLowerCase();
          if (k.indexOf('video') !== -1 || k.indexOf('detail') !== -1) {
            result.videoDetail = scope[scopeKeys[i]];
            result._matchedKey = scopeKeys[i];
            return true;
          }
        }

        // Deep search for itemInfo/itemStruct in any scope value
        for (var j = 0; j < scopeKeys.length; j++) {
          var found = findVideoDetail(scope[scopeKeys[j]]);
          if (found) {
            result.videoDetail = found;
            result._matchedKey = scopeKeys[j] + ' (deep)';
            return true;
          }
        }
      }

      // No __DEFAULT_SCOPE__, try deep search on full data
      var found = findVideoDetail(fullData);
      if (found) {
        result.videoDetail = found;
        result._matchedKey = label + ' (deep-root)';
        return true;
      }
    } catch(e) { result.extractionErrors.push(label + ': ' + e.message); }
    return false;
  }

  function tryExtractHydrationById() {
    var uniEl = document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__');
    if (uniEl && uniEl.textContent) {
      try {
        var fullData = JSON.parse(uniEl.textContent);
        return tryExtractFromData(fullData, 'uni_el');
      } catch(e) { result.extractionErrors.push('uni_parse: ' + e.message); }
    }
    return false;
  }

  function tryExtractHydrationFromWindow() {
    try {
      if (window.__UNIVERSAL_DATA_FOR_REHYDRATION__) {
        return tryExtractFromData(window.__UNIVERSAL_DATA_FOR_REHYDRATION__, 'win');
      }
    } catch(e) { result.extractionErrors.push('win_parse: ' + e.message); }
    return false;
  }

  function tryExtractHydrationFromScripts() {
    try {
      var scripts = document.querySelectorAll('script');
      for (var i = 0; i < scripts.length; i++) {
        var text = scripts[i].textContent || '';
        if (text.length > 500 && (text.indexOf('video') !== -1 && text.indexOf('sticker') !== -1)) {
          try {
            var parsed = JSON.parse(text);
            if (tryExtractFromData(parsed, 'script_' + i)) return true;
          } catch(e2) {}
        }
      }
    } catch(e) { result.extractionErrors.push('scripts_scan: ' + e.message); }
    return false;
  }

  function tryExtractSigiState() {
    var sigiEl = document.getElementById('SIGI_STATE');
    if (sigiEl && sigiEl.textContent) {
      try {
        var sigiData = JSON.parse(sigiEl.textContent);
        if (sigiData.ItemModule) { result.itemModule = sigiData.ItemModule; return true; }
      } catch(e) { result.extractionErrors.push('sigi_parse: ' + e.message); }
    }
    return false;
  }

  function extractMetaTags() {
    var ogDesc = document.querySelector('meta[property="og:description"]');
    result.ogDescription = ogDesc ? (ogDesc.getAttribute('content') || '') : '';

    var ogImage = document.querySelector('meta[property="og:image"]');
    result.ogImage = ogImage ? (ogImage.getAttribute('content') || '') : '';

    var metaDesc = document.querySelector('meta[name="description"]');
    result.metaDescription = metaDesc ? (metaDesc.getAttribute('content') || '') : '';
  }

  function extractJsonLd() {
    var jsonLdEls = document.querySelectorAll('script[type="application/ld+json"]');
    for (var j = 0; j < jsonLdEls.length; j++) {
      try {
        var parsed = JSON.parse(jsonLdEls[j].textContent);
        result.jsonLd = parsed;
        if (parsed.duration) {
          var dur = parsed.duration;
          var match = dur.match(/PT(?:(\\d+)M)?(?:(\\d+)S)?/);
          if (match) {
            var mins = parseInt(match[1] || '0', 10);
            var secs = parseInt(match[2] || '0', 10);
            result.videoDuration = mins * 60 + secs;
          }
        }
        if (parsed.contentUrl && !parsed.contentUrl.startsWith('blob:')) {
          result.videoPlayUrl = parsed.contentUrl;
        }
        break;
      } catch(e) { result.extractionErrors.push('jsonld: ' + e.message); }
    }
  }

  function extractVideoUrl() {
    if (result.videoDetail) {
      try {
        var item = result.videoDetail.itemInfo && result.videoDetail.itemInfo.itemStruct;
        if (item && item.video) {
          var v = item.video;
          result.videoPlayUrl = v.playAddr || v.downloadAddr || result.videoPlayUrl || '';
          if (v.duration) result.videoDuration = v.duration;
        }
      } catch(e) { result.extractionErrors.push('video_url: ' + e.message); }
    }

    var videoEl = document.querySelector('video');
    if (videoEl) {
      if (!result.videoPlayUrl) {
        var src = videoEl.src || videoEl.currentSrc || '';
        if (src && !src.startsWith('blob:')) result.videoPlayUrl = src;
      }
      if (videoEl.duration && isFinite(videoEl.duration)) {
        result.videoDuration = videoEl.duration;
      }
    }
  }

  function sendResult() {
    if (sent) return;
    sent = true;
    result.hasData = !!(result.videoDetail || result.itemModule || result.ogDescription);
    result._debug = {
      url: window.location.href,
      scriptTagCount: document.querySelectorAll('script').length,
      hasUniElement: !!document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__'),
      hasUniWindow: !!window.__UNIVERSAL_DATA_FOR_REHYDRATION__,
      hasSigiElement: !!document.getElementById('SIGI_STATE'),
      videoElementCount: document.querySelectorAll('video').length,
      attemptsTaken: attempts,
      extractionErrors: result.extractionErrors
    };
    window.ReactNativeWebView.postMessage(JSON.stringify(result));
  }

  function poll() {
    attempts++;

    // Try all hydration extraction strategies
    var hasHydration = result.videoDetail || result.itemModule;
    if (!hasHydration) {
      hasHydration = tryExtractHydrationById() || tryExtractHydrationFromWindow() || tryExtractHydrationFromScripts() || tryExtractSigiState();
    }

    // Always refresh meta tags and JSON-LD
    extractMetaTags();
    extractJsonLd();
    extractVideoUrl();

    // If we got rich hydration data, send immediately
    if (result.videoDetail || result.itemModule) {
      sendResult();
      return;
    }

    // Keep polling until max attempts
    if (attempts >= maxAttempts) {
      sendResult();
      return;
    }

    setTimeout(poll, 500);
  }

  // Start polling immediately
  poll();
  true;
})();
`;

// JS injected into the hidden WebView to extract Instagram Reel data client-side.
// Phase 1: Extract meta tags (available in initial SSR HTML).
// Phase 2: Poll for rendered DOM caption text (Instagram is a SPA).
const INSTAGRAM_EXTRACTION_JS = `
(function() {
  var result = { platform: 'instagram' };

  // Phase 1: Meta tags (available immediately in SSR HTML)
  var metas = document.querySelectorAll('meta[property], meta[name]');
  var metaData = {};
  for (var i = 0; i < metas.length; i++) {
    var key = metas[i].getAttribute('property') || metas[i].getAttribute('name');
    if (key) metaData[key] = metas[i].getAttribute('content') || '';
  }
  result.ogDescription = metaData['og:description'] || '';
  result.ogImage = metaData['og:image'] || '';
  result.metaDescription = metaData['description'] || '';
  result.ogTitle = metaData['og:title'] || '';

  // JSON-LD structured data
  var jsonLdEls = document.querySelectorAll('script[type="application/ld+json"]');
  for (var j = 0; j < jsonLdEls.length; j++) {
    try {
      var parsed = JSON.parse(jsonLdEls[j].textContent);
      if (parsed.caption || parsed.description || parsed.articleBody) {
        result.jsonLd = parsed;
        break;
      }
    } catch(e) {}
  }

  // Phase 2: Poll for rendered caption text (Instagram's React app loads async)
  var attempts = 0;
  var maxAttempts = 20;
  var captionFound = false;

  function tryExtractCaption() {
    attempts++;

    // Try multiple selector strategies for Instagram's caption
    var captionText = '';

    // Strategy 1: Look for the main article content
    var article = document.querySelector('article');
    if (article) {
      // Caption is usually in a span within the article, after the username
      var spans = article.querySelectorAll('span');
      var longestSpan = '';
      for (var s = 0; s < spans.length; s++) {
        var text = spans[s].textContent || '';
        if (text.length > longestSpan.length && text.length > 20) {
          longestSpan = text;
        }
      }
      if (longestSpan) captionText = longestSpan;
    }

    // Strategy 2: Look for h1 elements (sometimes used for caption)
    if (!captionText) {
      var h1s = document.querySelectorAll('h1');
      for (var h = 0; h < h1s.length; h++) {
        var h1Text = h1s[h].textContent || '';
        if (h1Text.length > 20) {
          captionText = h1Text;
          break;
        }
      }
    }

    // Strategy 3: Page title often contains caption snippet
    if (!captionText && document.title && document.title.length > 20) {
      result.pageTitle = document.title;
    }

    if (captionText && captionText.length > 20) {
      result.caption = captionText;
      captionFound = true;
    }

    // Extract any visible image URLs (carousel/cover)
    var images = document.querySelectorAll('img[src*="instagram"], img[src*="cdninstagram"], img[src*="fbcdn"]');
    var imageUrls = [];
    for (var im = 0; im < images.length; im++) {
      var src = images[im].getAttribute('src');
      if (src && !src.includes('profile') && !src.includes('avatar') && imageUrls.length < 5) {
        imageUrls.push(src);
      }
    }
    if (imageUrls.length > 0) result.imageUrls = imageUrls;

    // Extract video source URL and duration for frame extraction
    var videoEl = document.querySelector('video');
    if (videoEl) {
      var videoSrc = videoEl.src || videoEl.currentSrc || '';
      if (videoSrc && !videoSrc.startsWith('blob:')) {
        result.videoSrcUrl = videoSrc;
      }
      if (!result.videoSrcUrl) {
        var sources = videoEl.querySelectorAll('source');
        for (var sv = 0; sv < sources.length; sv++) {
          var srcVal = sources[sv].getAttribute('src');
          if (srcVal && !srcVal.startsWith('blob:')) {
            result.videoSrcUrl = srcVal;
            break;
          }
        }
      }
      if (videoEl.duration && isFinite(videoEl.duration)) {
        result.videoDuration = videoEl.duration;
      }
    }

    // Send result if caption found or we've exhausted attempts
    if (captionFound || attempts >= maxAttempts) {
      result.hasData = !!(result.caption || result.ogDescription || result.ogImage);
      window.ReactNativeWebView.postMessage(JSON.stringify(result));
      return;
    }

    // Keep polling (Instagram's JS renders async)
    setTimeout(tryExtractCaption, 500);
  }

  // Start polling after a short delay for initial render
  setTimeout(tryExtractCaption, 1000);
  true;
})();
`;

// Map of platform to extraction JS
const EXTRACTION_SCRIPTS: Record<VideoPlatform, string> = {
  tiktok: TIKTOK_EXTRACTION_JS,
  instagram: INSTAGRAM_EXTRACTION_JS,
};

// JS injected into WebView to extract frames using canvas.
// Self-contained: finds the video, computes timestamps, captures frames.
// If canvas is tainted by CORS, falls back to fetching the video via XHR
// (which carries the WebView's cookies) and creating a same-origin blob URL.
// Captures frames from a playing video at intervals.
// No seeking needed - just lets the video play and grabs frames as it goes.
// TikTok/Instagram autoplay, so we wait for playback then capture periodically.
const CANVAS_FRAME_EXTRACTION_JS = `
(function() {
  var pollAttempts = 0;
  var maxPollAttempts = 30;

  function tryCaptureStillFrame(video) {
    // Fallback: capture a single frame from a loaded but non-playing video
    try {
      var canvas = document.createElement('canvas');
      var vw = video.videoWidth || video.clientWidth || 360;
      var vh = video.videoHeight || video.clientHeight || 640;
      var scale = Math.min(1, 480 / Math.max(vw, vh));
      canvas.width = Math.round(vw * scale);
      canvas.height = Math.round(vh * scale);
      var ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      var url = canvas.toDataURL('image/jpeg', 0.6);
      var b64 = url.split(',')[1];
      if (b64 && b64.length > 1000 && b64.length < 200000) return [b64];
    } catch(e) {}
    return [];
  }

  function waitForPlaying() {
    var video = document.querySelector('video');
    if (video) {
      video.muted = true;
      video.setAttribute('playsinline', '');
      video.play().catch(function(){});
    }
    // Wait until video is actually playing (has current time > 0 or is not paused)
    if (video && !video.paused && video.currentTime > 0) {
      captureWhilePlaying(video);
      return;
    }
    pollAttempts++;
    if (pollAttempts >= maxPollAttempts) {
      // Last resort: try to capture a still frame if video has loaded data
      var stillFrames = [];
      if (video && video.readyState >= 2) {
        stillFrames = tryCaptureStillFrame(video);
      }
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'frames_done',
        frames: stillFrames,
        error: video ? 'video_not_playing' : 'no_video_element',
        readyState: video ? video.readyState : -1,
        paused: video ? video.paused : true,
        stillFallback: stillFrames.length > 0
      }));
      return;
    }
    setTimeout(waitForPlaying, 500);
  }

  waitForPlaying();

  function captureWhilePlaying(video) {
    var canvas = document.createElement('canvas');
    var vw = video.videoWidth || video.clientWidth || 360;
    var vh = video.videoHeight || video.clientHeight || 640;
    var scale = Math.min(1, 480 / Math.max(vw, vh));
    canvas.width = Math.round(vw * scale);
    canvas.height = Math.round(vh * scale);
    var ctx = canvas.getContext('2d');

    var duration = video.duration;
    if (!duration || !isFinite(duration) || duration <= 0) duration = 30;

    var frames = [];
    var lastCaptureTime = -999;
    var tainted = false;
    var captureInterval = 1.5; // seconds between captures
    var maxFrames = Math.min(16, Math.max(4, Math.ceil(duration * 0.8 / captureInterval)));

    // Keep video playing and looping
    video.loop = true;
    video.muted = true;
    video.play().catch(function(){});

    function tryCapture() {
      if (tainted || frames.length >= maxFrames) {
        finish();
        return;
      }

      var ct = video.currentTime;
      // Only capture if we've moved at least 1.5s since last capture
      // and we're in the middle 80% of the video (skip 10% edges)
      var trimStart = duration * 0.1;
      var trimEnd = duration * 0.9;

      if (ct >= trimStart && ct <= trimEnd && (ct - lastCaptureTime) >= captureInterval) {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          var url = canvas.toDataURL('image/jpeg', 0.6);
          var b64 = url.split(',')[1];
          if (b64 && b64.length > 1000 && b64.length < 200000) {
            frames.push(b64);
            lastCaptureTime = ct;
          }
        } catch(e) {
          tainted = true;
          finish();
          return;
        }
      }

      // Check again in 200ms
      if (frames.length < maxFrames) {
        setTimeout(tryCapture, 200);
      } else {
        finish();
      }
    }

    function finish() {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'frames_done',
        frames: frames,
        duration: duration,
        capturedCount: frames.length,
        tainted: tainted
      }));
    }

    // Start capturing
    tryCapture();

    // Safety timeout - finish with whatever we have after 35s
    setTimeout(function() { if (frames.length < maxFrames) finish(); }, 35000);
  }
  true;
})();
`;

function CloseIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={colors.text}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Reads pending video import data from App Groups (written by Share Extension).
 * Returns JSON string with {url, platform} or null.
 */
async function readPendingVideoImport(): Promise<{ url: string; platform: VideoPlatform } | null> {
  if (Platform.OS !== 'ios' || !WorkoutWidgetBridge?.readPendingVideoImport) return null;
  try {
    const jsonString = await WorkoutWidgetBridge.readPendingVideoImport();
    if (!jsonString) return null;
    const data = JSON.parse(jsonString);
    return {
      url: data.url,
      platform: data.platform === 'instagram' ? 'instagram' : 'tiktok',
    };
  } catch {
    return null;
  }
}

/**
 * Detect platform from URL as fallback when no explicit platform is provided.
 */
function detectPlatformFromUrl(url: string): VideoPlatform {
  if (url.includes('instagram.com')) return 'instagram';
  return 'tiktok';
}

export default function ImportVideoScreen() {
  const params = useLocalSearchParams<{
    videoUrl?: string;
    platform?: string;
    tiktokUrl?: string;
  }>();
  const { isNavigating, withLock } = useNavigationLock();

  const [state, setState] = useState<ScreenState>('loading');
  const [loadingStep, setLoadingStep] = useState<'extracting' | 'frames' | 'analyzing'>(
    'extracting'
  );
  const [exercises, setExercises] = useState<MatchResult[]>([]);
  const [workoutName, setWorkoutName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [platform, setPlatform] = useState<VideoPlatform>('tiktok');

  const isLoaded = useExerciseStore((s) => s.isLoaded);
  const loadExercises = useExerciseStore((s) => s.loadExercises);

  // WebView client-side extraction state
  const [webviewUrl, setWebviewUrl] = useState<string | null>(null);
  const webviewRef = useRef<any>(null);
  const extractionResolveRef = useRef<((data: any) => void) | null>(null);
  const extractionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bestExtractionRef = useRef<any>(null);
  // Canvas frame extraction state
  const frameResolveRef = useRef<((frames: string[]) => void) | null>(null);
  const frameTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track which exercise index is being replaced via add-exercise
  const replacingIndexRef = useRef<number | null>(null);

  // Magnifying glass search animation
  const searchTranslateX = useSharedValue(0);
  const searchTranslateY = useSharedValue(0);
  const searchRotate = useSharedValue(0);

  useEffect(() => {
    // Quick dart to a spot, brief pause, then dart to next spot
    const dart = Easing.bezier(0.25, 0.1, 0.25, 1);
    const hold = Easing.linear;
    searchTranslateX.value = withRepeat(
      withSequence(
        // Dart to top-right area
        withTiming(14, { duration: 400, easing: dart }),
        withTiming(14, { duration: 600, easing: hold }),
        // Dart to left area
        withTiming(-16, { duration: 450, easing: dart }),
        withTiming(-16, { duration: 500, easing: hold }),
        // Dart to bottom-right
        withTiming(10, { duration: 400, easing: dart }),
        withTiming(10, { duration: 550, easing: hold }),
        // Dart to top-left
        withTiming(-12, { duration: 400, easing: dart }),
        withTiming(-12, { duration: 600, easing: hold }),
        // Dart to center-right
        withTiming(8, { duration: 350, easing: dart }),
        withTiming(8, { duration: 500, easing: hold }),
        // Back to center
        withTiming(0, { duration: 400, easing: dart }),
        withTiming(0, { duration: 400, easing: hold })
      ),
      -1,
      false
    );
    searchTranslateY.value = withRepeat(
      withSequence(
        // Top-right area
        withTiming(-14, { duration: 400, easing: dart }),
        withTiming(-14, { duration: 600, easing: hold }),
        // Left-center area
        withTiming(4, { duration: 450, easing: dart }),
        withTiming(4, { duration: 500, easing: hold }),
        // Bottom-right
        withTiming(16, { duration: 400, easing: dart }),
        withTiming(16, { duration: 550, easing: hold }),
        // Top-left
        withTiming(-10, { duration: 400, easing: dart }),
        withTiming(-10, { duration: 600, easing: hold }),
        // Center-right
        withTiming(6, { duration: 350, easing: dart }),
        withTiming(6, { duration: 500, easing: hold }),
        // Back to center
        withTiming(0, { duration: 400, easing: dart }),
        withTiming(0, { duration: 400, easing: hold })
      ),
      -1,
      false
    );
    searchRotate.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 400, easing: dart }),
        withTiming(-6, { duration: 600, easing: hold }),
        withTiming(8, { duration: 450, easing: dart }),
        withTiming(8, { duration: 500, easing: hold }),
        withTiming(-4, { duration: 400, easing: dart }),
        withTiming(-4, { duration: 550, easing: hold }),
        withTiming(6, { duration: 400, easing: dart }),
        withTiming(6, { duration: 600, easing: hold }),
        withTiming(-3, { duration: 350, easing: dart }),
        withTiming(-3, { duration: 500, easing: hold }),
        withTiming(0, { duration: 400, easing: dart }),
        withTiming(0, { duration: 400, easing: hold })
      ),
      -1,
      false
    );
  }, []);

  const magnifyingGlassStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: searchTranslateX.value },
      { translateY: searchTranslateY.value },
      { rotate: `${searchRotate.value}deg` },
    ],
  }));

  // When returning from add-exercise, check for pending exercises to replace the unmatched one
  useFocusEffect(
    useCallback(() => {
      const idx = replacingIndexRef.current;
      if (idx === null) return;
      replacingIndexRef.current = null;

      const pending = useWorkoutStore.getState().pendingExercises;
      if (!pending || pending.length === 0) return;

      const selected = pending[0];
      const allExercises = useExerciseStore.getState().allExercises;
      const fullExercise = allExercises.find((e) => e.id === selected.id);

      if (fullExercise) {
        setExercises((prev) =>
          prev.map((ex, i) =>
            i === idx
              ? {
                  ...ex,
                  matchedExercise: fullExercise,
                  confidence: 1.0,
                  matched: true,
                }
              : ex
          )
        );
      }

      useWorkoutStore.getState().setPendingExercises([]);
    }, [])
  );

  // Haptic pulse during loading - feels like the app is actively searching
  useEffect(() => {
    if (state !== 'loading') return;
    const interval = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 800);
    return () => clearInterval(interval);
  }, [state]);

  // Main init: get URL and process
  useEffect(() => {
    async function init() {
      if (!isLoaded) {
        await loadExercises();
      }

      // Try to get URL from route params first
      let url = params.videoUrl || params.tiktokUrl;
      let detectedPlatform: VideoPlatform = (params.platform as VideoPlatform) || 'tiktok';

      // If no URL in params, read from App Groups (Share Extension)
      if (!url) {
        const pendingImport = await readPendingVideoImport();
        if (pendingImport) {
          url = pendingImport.url;
          detectedPlatform = pendingImport.platform;
        }
      }

      if (!url) {
        setState('error');
        setErrorMessage('No video link found. Try sharing the video again.');
        return;
      }

      // If platform wasn't explicitly set, detect from URL
      if (!params.platform) {
        detectedPlatform = detectPlatformFromUrl(url);
      }

      setPlatform(detectedPlatform);
      setVideoUrl(url);
      processUrl(url, detectedPlatform);
    }
    init();
  }, []);

  // Load URL in hidden WebView and extract page data client-side.
  function extractDataFromWebView(url: string): Promise<any> {
    return new Promise((resolve) => {
      bestExtractionRef.current = null;
      extractionResolveRef.current = resolve;
      setWebviewUrl(url);

      // Instagram needs more time (SPA, async render)
      const timeout = platform === 'instagram' ? 20000 : 15000;

      extractionTimeoutRef.current = setTimeout(() => {
        console.log(`[${platform}] WebView extraction timed out`);
        const best = bestExtractionRef.current;
        bestExtractionRef.current = null;
        extractionResolveRef.current = null;
        // Don't close WebView - we still need it for canvas frame extraction
        resolve(best);
      }, timeout);
    });
  }

  // Inject extraction JS on every page load (handles redirects)
  function handleWebViewLoadEnd() {
    const script = EXTRACTION_SCRIPTS[platform];
    setTimeout(() => {
      webviewRef.current?.injectJavaScript(script);
    }, 500);
  }

  function handleWebViewMessage(event: WebViewMessageEvent) {
    let data = null;
    try {
      data = JSON.parse(event.nativeEvent.data);
    } catch {}

    // Handle canvas frame extraction messages
    if (data?.type === 'frames_done') {
      if (frameTimeoutRef.current) {
        clearTimeout(frameTimeoutRef.current);
        frameTimeoutRef.current = null;
      }
      console.log(
        `[import-video] Canvas extracted ${data.frames?.length || 0} frames${data.error ? ' (error: ' + data.error + ')' : ''}${data.duration ? ' (duration: ' + data.duration + 's)' : ''}`
      );
      setWebviewUrl(null);
      frameResolveRef.current?.(data.frames || []);
      frameResolveRef.current = null;
      return;
    }
    if (data?.type === 'frames_progress') {
      console.log(`[import-video] Frame progress: ${data.count}/${data.total}`);
      return;
    }

    // TikTok: Got the rich data (video detail JSON), resolve immediately
    // NOTE: Don't close WebView yet - we may need it for frame extraction
    if (platform === 'tiktok' && (data?.videoDetail || data?.itemModule)) {
      if (extractionTimeoutRef.current) {
        clearTimeout(extractionTimeoutRef.current);
        extractionTimeoutRef.current = null;
      }
      bestExtractionRef.current = null;
      extractionResolveRef.current?.(data);
      extractionResolveRef.current = null;
      return;
    }

    // Instagram: Caption extracted or all attempts exhausted, resolve
    // NOTE: Don't close WebView yet - we may need it for frame extraction
    if (platform === 'instagram' && data?.hasData) {
      if (extractionTimeoutRef.current) {
        clearTimeout(extractionTimeoutRef.current);
        extractionTimeoutRef.current = null;
      }
      bestExtractionRef.current = null;
      extractionResolveRef.current?.(data);
      extractionResolveRef.current = null;
      return;
    }

    // Store partial data as fallback, keep waiting
    if (data?.hasData) {
      bestExtractionRef.current = data;
    }
  }

  function handleWebViewError() {
    if (extractionTimeoutRef.current) {
      clearTimeout(extractionTimeoutRef.current);
      extractionTimeoutRef.current = null;
    }
    const best = bestExtractionRef.current;
    bestExtractionRef.current = null;
    // Resolve metadata extraction but keep WebView open for frame attempt
    if (extractionResolveRef.current) {
      extractionResolveRef.current(best);
      extractionResolveRef.current = null;
    } else {
      // Error during frame extraction phase - resolve frames as empty
      setWebviewUrl(null);
      frameResolveRef.current?.([]);
      frameResolveRef.current = null;
    }
  }

  // Extract frames via canvas inside the still-open WebView.
  // The WebView has cookies/auth so the video is accessible.
  function extractFramesViaCanvas(): Promise<string[]> {
    return new Promise((resolve) => {
      frameResolveRef.current = resolve;

      // Timeout for frame extraction
      frameTimeoutRef.current = setTimeout(() => {
        console.log('[import-video] Canvas frame extraction timed out');
        setWebviewUrl(null);
        const r = frameResolveRef.current;
        frameResolveRef.current = null;
        r?.([]);
      }, 45000);

      // Inject the self-contained frame extraction script (delay to let video load)
      setTimeout(() => {
        webviewRef.current?.injectJavaScript(CANVAS_FRAME_EXTRACTION_JS);
      }, 1500);
    });
  }

  async function processUrl(url: string, plat: VideoPlatform) {
    setState('loading');
    setLoadingStep('extracting');
    const startTime = Date.now();

    // Step 0: Check shared cache first (by video ID from URL)
    let videoId = extractVideoId(url);
    if (videoId) {
      console.log(`[import-video] Checking cache for ${plat} video ${videoId}`);
      const cached = await getCachedImport(plat, videoId);
      if (cached) {
        console.log(`[import-video] Cache hit! ${cached.exercises?.length} exercises`);
        const elapsed = Date.now() - startTime;
        if (elapsed < 1000) await new Promise((r) => setTimeout(r, 1000 - elapsed));

        if (cached.success && cached.exercises?.length) {
          const matched = matchExercisesToDatabase(cached.exercises);
          setExercises(matched);
          setWorkoutName(cached.workoutName || 'Imported Workout');
          setState('review');
          return;
        }
      }
      console.log('[import-video] Cache miss, proceeding with extraction');
    }

    // Step 1: Extract metadata via hidden WebView (keeps WebView open for frames)
    const extractedData = await extractDataFromWebView(url);

    console.log(
      '[import-video] WebView extracted data:',
      JSON.stringify(
        {
          hasData: extractedData?.hasData,
          hasVideoDetail: !!extractedData?.videoDetail,
          hasItemModule: !!extractedData?.itemModule,
          ogDescription: extractedData?.ogDescription?.substring(0, 200),
          videoDuration: extractedData?.videoDuration,
          caption: extractedData?.caption?.substring(0, 200),
        },
        null,
        2
      )
    );

    if (extractedData?._debug) {
      console.log(
        '[import-video] Extraction debug:',
        JSON.stringify(extractedData._debug, null, 2)
      );
    }
    if (extractedData?._hydrationKeys) {
      console.log(
        '[import-video] Hydration top keys:',
        JSON.stringify(extractedData._hydrationKeys)
      );
    }
    if (extractedData?._scopeKeys) {
      console.log('[import-video] Scope keys:', JSON.stringify(extractedData._scopeKeys));
    }
    if (extractedData?._matchedKey) {
      console.log('[import-video] Matched key:', extractedData._matchedKey);
    }

    // Try to get video ID from canonical URL if we didn't have it from the input URL
    if (!videoId && extractedData?._debug?.url) {
      videoId = extractVideoId(extractedData._debug.url);
      if (videoId) {
        console.log(`[import-video] Got video ID from canonical URL: ${videoId}`);
        // Check cache again with the resolved ID
        const cached = await getCachedImport(plat, videoId);
        if (cached?.success && cached.exercises?.length) {
          console.log(
            `[import-video] Cache hit (after redirect)! ${cached.exercises?.length} exercises`
          );
          setWebviewUrl(null);
          const elapsed = Date.now() - startTime;
          if (elapsed < 1000) await new Promise((r) => setTimeout(r, 1000 - elapsed));
          const matched = matchExercisesToDatabase(cached.exercises);
          setExercises(matched);
          setWorkoutName(cached.workoutName || 'Imported Workout');
          setState('review');
          return;
        }
      }
    }

    // Step 2: Extract frames via canvas inside the still-open WebView
    let videoFrames: string[] = [];
    if (webviewRef.current && WebView) {
      try {
        setLoadingStep('frames');
        videoFrames = await extractFramesViaCanvas();
        const totalSizeKB = videoFrames.reduce((sum, f) => sum + f.length, 0) / 1024;
        console.log(
          `[import-video] Canvas extracted ${videoFrames.length} frames, total size: ${Math.round(totalSizeKB)}KB`
        );
      } catch (e) {
        console.warn('[import-video] Canvas frame extraction failed:', e);
      }
    } else {
      console.warn('[import-video] WebView not available for frame extraction');
    }

    // Close WebView now that we're done with both phases
    setWebviewUrl(null);

    // Step 3: Send to edge function
    setLoadingStep('analyzing');
    console.log(
      `[import-video] Sending to edge function: ${videoFrames.length} frames, platform: ${plat}`
    );
    const result = await processVideoImport(url, plat, extractedData, videoFrames);

    console.log(
      '[import-video] Edge function result:',
      JSON.stringify(
        {
          success: result.success,
          confidence: result.confidence,
          workoutName: result.workoutName,
          exerciseCount: result.exercises?.length,
          exercises: result.exercises?.map((e) => e.name),
          error: result.error,
        },
        null,
        2
      )
    );

    // Ensure loading shows for at least 1s
    const elapsed = Date.now() - startTime;
    if (elapsed < 1000) {
      await new Promise((r) => setTimeout(r, 1000 - elapsed));
    }

    if (!result.success || !result.exercises?.length) {
      setState('error');
      setErrorMessage(
        result.error || 'Could not find any exercises in this video. Try a different workout video.'
      );
      return;
    }

    // Reject low-confidence results - better to show nothing than wrong exercises
    if (result.confidence !== undefined && result.confidence < 0.5) {
      setState('error');
      setErrorMessage(
        'Could not reliably identify exercises in this video. Try a video with clear exercise names on screen.'
      );
      return;
    }

    // Save to shared cache for future imports (best-effort, don't await)
    if (videoId && result.success && result.exercises?.length) {
      saveCachedImport(plat, videoId, result).then(() => {
        console.log(`[import-video] Saved to cache: ${plat} video ${videoId}`);
      });
    }

    const matched = matchExercisesToDatabase(result.exercises);
    setExercises(matched);
    setWorkoutName(result.workoutName || 'Imported Workout');
    setState('review');
  }

  function handleRemoveExercise(index: number) {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSearchForExercise(index: number) {
    replacingIndexRef.current = index;
    router.push('/add-exercise');
  }

  function handleUpdateSets(index: number, sets: number) {
    setExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, sets: Math.max(1, sets) } : ex))
    );
  }

  function handleUpdateReps(index: number, delta: number) {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== index) return ex;
        if (ex.repsPerSet && ex.repsPerSet.length > 0) {
          const updated = ex.repsPerSet.map((r) => Math.max(1, r + delta));
          return { ...ex, repsPerSet: updated, reps: updated[0] };
        }
        return { ...ex, reps: Math.max(1, ex.reps + delta) };
      })
    );
  }

  function handleSaveAsTemplate() {
    const matchedExercises = exercises.filter((e) => e.matched && e.matchedExercise);

    if (matchedExercises.length === 0) {
      Alert.alert(
        'No exercises matched',
        'None of the exercises could be matched to the library. Try editing the exercise names.'
      );
      return;
    }

    const templateExercises: TemplateExercise[] = matchedExercises.map((e, index) => ({
      id: `ex_import_${Date.now()}_${index}`,
      exerciseId: e.matchedExercise!.id,
      exerciseName: e.matchedExercise!.display_name || e.matchedExercise!.name,
      muscle: e.matchedExercise!.muscle_group || e.matchedExercise!.muscle || '',
      gifUrl: e.matchedExercise!.image_url,
      thumbnailUrl: e.matchedExercise!.thumbnail_url,
      sets: Array.from({ length: e.sets }, (_, i) => ({
        setNumber: i + 1,
        targetReps: e.repsPerSet?.[i] ?? e.reps,
        targetWeight: undefined,
      })),
      restTimerSeconds: 90,
    }));

    withLock(() => {
      router.push({
        pathname: '/save-template',
        params: { exercises: JSON.stringify(templateExercises), name: workoutName },
      });
    });
  }

  function handleClose() {
    Alert.alert('Discard Import?', 'Your imported workout will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ]);
  }

  function handleRetry() {
    if (videoUrl) {
      processUrl(videoUrl, platform);
    }
  }

  const platformName = PLATFORM_NAMES[platform];

  // --- RENDER ---

  if (state === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.primary }}>
        {/* Hidden WebView — rendered first, fully outside flex layout */}
        {webviewUrl && WebView && (
          <View
            style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' }}
            pointerEvents="none"
          >
            <WebView
              ref={webviewRef}
              source={{ uri: webviewUrl }}
              style={{ width: 1, height: 1 }}
              onLoadEnd={handleWebViewLoadEnd}
              onMessage={handleWebViewMessage}
              onError={handleWebViewError}
              onHttpError={handleWebViewError}
              javaScriptEnabled
              domStorageEnabled
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              sharedCookiesEnabled={platform === 'instagram'}
              userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
              onShouldStartLoadWithRequest={(request: any) => request.url.startsWith('http')}
            />
          </View>
        )}
        <SafeAreaView style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <Text style={styles.loadingLogo}>ALIGN</Text>
            {/* Scanning frame with animated magnifying glass */}
            <View style={styles.scanArea}>
              <View style={styles.scanFrame}>
                <View style={[styles.cornerBracket, styles.cornerTopLeft]} />
                <View style={[styles.cornerBracket, styles.cornerTopRight]} />
                <View style={[styles.cornerBracket, styles.cornerBottomLeft]} />
                <View style={[styles.cornerBracket, styles.cornerBottomRight]} />
                <Animated.Text style={[styles.magnifyingGlass, magnifyingGlassStyle]}>
                  🔍
                </Animated.Text>
              </View>
              <Text style={styles.loadingTitle}>
                {loadingStep === 'extracting'
                  ? 'Analyzing video...'
                  : loadingStep === 'frames'
                    ? 'Identifying exercises...'
                    : 'Creating workout...'}
              </Text>
              <Text style={styles.loadingSubtitle}>
                {`Extracting exercises from ${platformName}`}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (state === 'error') {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.errorTitle}>Could not import workout</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          <View style={styles.errorButtons}>
            {videoUrl ? (
              <Pressable style={styles.retryButton} onPress={handleRetry}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </Pressable>
            ) : null}
            <Pressable style={styles.goBackButton} onPress={() => router.back()}>
              <Text style={styles.goBackButtonText}>Go Back</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Review state
  const matchedCount = exercises.filter((e) => e.matched).length;
  const totalCount = exercises.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleClose} hitSlop={12}>
          <CloseIcon />
        </Pressable>
        <Text style={styles.headerTitle}>Import Workout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Workout Name */}
        <View style={styles.nameSection}>
          <Text style={styles.sectionLabel}>Workout Name</Text>
          <TextInput
            style={styles.nameInput}
            value={workoutName}
            onChangeText={setWorkoutName}
            placeholder="Workout name"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        {/* Match Summary */}
        <View style={styles.summaryCard}>
          <Ionicons
            name={matchedCount === totalCount ? 'checkmark-circle' : 'information-circle'}
            size={20}
            color={matchedCount === totalCount ? colors.success : colors.warning}
          />
          <Text style={styles.summaryText}>
            {matchedCount} of {totalCount} exercises matched
          </Text>
        </View>

        {/* Exercise List */}
        <View style={styles.exerciseList}>
          {exercises.map((exercise, index) => (
            <View key={index} style={styles.exerciseCard}>
              <View style={styles.exerciseRow}>
                {/* Thumbnail */}
                {exercise.matched && exercise.matchedExercise ? (
                  <ExerciseImage
                    gifUrl={exercise.matchedExercise.image_url}
                    thumbnailUrl={exercise.matchedExercise.thumbnail_url}
                    size={48}
                    borderRadius={8}
                  />
                ) : (
                  <Pressable
                    style={styles.noMatchThumb}
                    onPress={() => handleSearchForExercise(index)}
                  >
                    <Ionicons name="search-outline" size={24} color={colors.primary} />
                  </Pressable>
                )}

                {/* Exercise Info */}
                <View style={styles.exerciseInfo}>
                  {exercise.matched && exercise.matchedExercise ? (
                    <Text style={styles.exerciseName} numberOfLines={1}>
                      {exercise.matchedExercise.display_name || exercise.matchedExercise.name}
                    </Text>
                  ) : (
                    <Pressable onPress={() => handleSearchForExercise(index)}>
                      <Text style={styles.exerciseName} numberOfLines={1}>
                        {exercise.aiName}
                      </Text>
                      <Text style={styles.tapToSearchLabel}>Tap to search library</Text>
                    </Pressable>
                  )}
                  {exercise.matched && exercise.matchedExercise && (
                    <Text style={styles.muscleLabel}>
                      {exercise.matchedExercise.muscle_group || exercise.matchedExercise.muscle}
                    </Text>
                  )}
                </View>

                {/* Remove Button */}
                <Pressable
                  onPress={() => handleRemoveExercise(index)}
                  hitSlop={8}
                  style={styles.removeButton}
                >
                  <Ionicons name="close-circle" size={22} color={colors.textTertiary} />
                </Pressable>
              </View>

              {/* Sets / Reps Controls */}
              <View style={styles.setsRepsRow}>
                <View style={styles.setsRepsControl}>
                  <Text style={styles.setsRepsLabel}>Sets</Text>
                  <View style={styles.counterRow}>
                    <Pressable
                      onPress={() => handleUpdateSets(index, exercise.sets - 1)}
                      style={styles.counterButton}
                    >
                      <Ionicons name="remove" size={16} color={colors.text} />
                    </Pressable>
                    <Text style={styles.counterValue}>{exercise.sets}</Text>
                    <Pressable
                      onPress={() => handleUpdateSets(index, exercise.sets + 1)}
                      style={styles.counterButton}
                    >
                      <Ionicons name="add" size={16} color={colors.text} />
                    </Pressable>
                  </View>
                </View>
                <View style={styles.setsRepsControl}>
                  <Text style={styles.setsRepsLabel}>Reps</Text>
                  <View style={styles.counterRow}>
                    <Pressable
                      onPress={() => handleUpdateReps(index, -1)}
                      style={styles.counterButton}
                    >
                      <Ionicons name="remove" size={16} color={colors.text} />
                    </Pressable>
                    <Text style={styles.counterValue}>
                      {exercise.repsPerSet && exercise.repsPerSet.length > 0
                        ? exercise.repsPerSet.join(', ')
                        : exercise.reps}
                    </Text>
                    <Pressable
                      onPress={() => handleUpdateReps(index, 1)}
                      style={styles.counterButton}
                    >
                      <Ionicons name="add" size={16} color={colors.text} />
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomBar}>
        <Pressable
          style={[styles.saveButton, matchedCount === 0 && styles.saveButtonDisabled]}
          onPress={handleSaveAsTemplate}
          disabled={matchedCount === 0 || isNavigating}
        >
          <Text style={styles.saveButtonText}>
            Save as Template ({matchedCount} exercise{matchedCount !== 1 ? 's' : ''})
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Loading state
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  loadingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
  },
  loadingLogo: {
    fontFamily: fonts.canela,
    fontSize: 50,
    color: '#FFFFFF',
    letterSpacing: 6,
    fontStyle: 'italic',
    marginBottom: 48,
  },
  scanArea: {
    alignItems: 'center',
  },
  scanFrame: {
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  cornerBracket: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#FFFFFF',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 4,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 4,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 4,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 4,
  },
  magnifyingGlass: {
    fontSize: 48,
  },
  loadingTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  loadingSubtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Error state
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.xl,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  errorButtons: {
    gap: spacing.md,
    width: '100%',
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  retryButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: '#FFFFFF',
  },
  goBackButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  goBackButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },

  // Review state
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },

  // Name section
  nameSection: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  nameInput: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.xl,
    color: colors.text,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },

  // Summary
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...cardStyle,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },

  // Exercise list
  exerciseList: {
    gap: spacing.sm,
  },
  exerciseCard: {
    ...cardStyle,
    padding: spacing.md,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  noMatchThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  muscleLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  noMatchLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSize.xs,
    color: colors.warning,
    marginTop: 2,
  },
  tapToSearchLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.primary,
    marginTop: 2,
  },
  removeButton: {
    padding: spacing.xs,
  },

  // Sets/Reps controls
  setsRepsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(217, 217, 217, 0.25)',
  },
  setsRepsControl: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  setsRepsLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  counterButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
  },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: '#FFFFFF',
  },
});
