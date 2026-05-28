# Legacy Features — From the Align / Snatched App

This file documents features that existed in the original Align / Snatched codebase but were intentionally removed during the It Girl rebuild. They are recorded here so we can re-implement them in the future if the product direction calls for it.

The git history (commit `7677f33` and earlier) is the source of truth for the actual code. This doc captures the design and the moving parts so a future rebuild doesn't have to reverse-engineer it from scratch.

---

## 1. TikTok / Instagram Video Import

### What it did

Users could share a TikTok or Instagram Reel into the It Girl app via the iOS Share Sheet (or paste the link manually inside Explore Templates). The app extracted the video's exercises, sets, reps, and weights using a combination of client-side scraping and a server-side edge function, then surfaced the result as a new workout template the user could save to their library.

The flow:

1. **Entry points**
   - **Share Sheet:** the iOS Share Extension wrote the shared URL to App Group storage. On next app launch (or foreground), `app/_layout.tsx`'s `checkPendingVideoImport()` read it via the native `WorkoutWidgetBridge.readPendingVideoImport()` bridge and pushed to `/import-video` with `{ videoUrl, platform }`.
   - **In-app:** a social-import dropdown in the top-right of Explore Templates (`app/explore-templates.tsx`) opened a sheet with TikTok / Instagram options, each pushing to `/import-guide?platform=<tiktok|instagram>`. The guide screen explained how to copy the link and tapped through to `/import-video`.

2. **`app/import-video.tsx` (main extraction screen)**
   - Loaded the video URL into a hidden WebView and ran injected JS to scrape the page's `__INITIAL_STATE__` / `__NEXT_DATA__` hydration blobs. This captured title, description, hashtags, caption text, author handle, and a canonical video URL.
   - Used a `<canvas>` in the WebView to extract frame thumbnails at intervals (e.g. every 2 seconds) so the server could OCR text on the frames.
   - Sent the structured data + frames to `processVideoImport()` (see below), then rendered the returned exercises in a preview the user could confirm.

3. **`src/services/api/tiktokImport.ts` (client API)**
   - `processVideoImport(payload)` — POST to the `process-tiktok` Supabase Edge Function.
   - `processTikTokVideo(payload)` — same but with TikTok-specific shape.
   - `extractVideoId(url, platform)` — regex parse to get a stable ID for the cache key.
   - `getCachedImport(videoId, platform)` / `saveCachedImport(...)` — read/write the shared `imported_workout_cache` table so the same video URL never re-runs the expensive extraction within 24 hours.

4. **`supabase/functions/process-tiktok/index.ts` (server-side, ~80KB)**
   - Accepted the client's pre-scraped video data + frames.
   - Ran a heuristic + LLM pipeline that:
     - Parsed the caption / OCR text for exercise names matching the It Girl exercise library.
     - Estimated sets / reps / weights from explicit text (e.g. "3x10 @ 50lbs") or returned best-effort defaults.
     - Cross-referenced exercise muscle groups via the `exercises` table.
   - Fell back to headless-browser scraping when the client-provided data was incomplete (deeper page parsing).
   - Wrote the result to `imported_workout_cache` for repeat lookups.

5. **Database**
   - Migration `025_tiktok_cache.sql` — original `tiktok_cache` table (24h TTL).
   - Migration `026_drop_tiktok_cache.sql` — dropped it once the schema generalised.
   - Migration `030_imported_workout_cache.sql` — replaced it with `imported_workout_cache` supporting both TikTok and Instagram, RLS so users only see their own cache rows.
   - These migrations remain applied to the DB (not rolled back) so the schema is still there if we re-enable the feature.

6. **Native iOS pieces (still present in `ios/`)**
   - **Share Extension target** — appends shared URLs into App Group `group.com.itgirlapp.app` so the main app can read them on next launch. Located in the Xcode project alongside the `Alyne` target.
   - **`WorkoutWidgetBridge`** native module — exposes `readPendingVideoImport()` to JS. Implementation reads/clears the App Group entry.

### What was removed during It Girl rebuild

Removed from the client (deleted in this commit):

- `app/import-guide.tsx`
- `app/import-video.tsx`
- `src/services/api/tiktokImport.ts`
- In `app/explore-templates.tsx`: the top-right social-import dropdown (TikTok + Instagram icons) and its state.
- In `app/_layout.tsx`: the `checkPendingVideoImport()` function, the foreground listener, the `usePathname()` gate against re-pushing `/import-video`, and the `WorkoutWidgetBridge` JS import.
- `Stack.Screen` registrations for `import-video` and `import-guide`.

Kept (intentionally):

- All `supabase/migrations/025_*`, `026_*`, `030_*` — DB schema history.
- `supabase/functions/process-tiktok/` — server-side edge function (idle, no client calling it).
- Native iOS Share Extension target + `WorkoutWidgetBridge` module — they don't run unless the JS calls them, so leaving them in place keeps the iOS build configuration intact.
- `assets/images/social_import.png`, the TikTok / Instagram icons in `assets/images/Onboarding Icons/6. Hear us/` — used in onboarding traffic-source survey.
- "Follow on TikTok" social link in Settings — different feature.

### To re-implement later

1. Restore the three deleted client files from the `7677f33`-era git history (`git show <commit>:app/import-video.tsx > app/import-video.tsx` etc).
2. Add the `Stack.Screen` entries back to `app/_layout.tsx` (with `slide_from_bottom` animation).
3. Restore the deeplink handler in `_layout.tsx` (the `usePathname` + AppState foreground hook + `checkPendingVideoImport` function — all preserved in this file's "Removed" section above for the easy copy-paste).
4. Re-add the top-right import dropdown JSX to `app/explore-templates.tsx`.
5. Verify the `process-tiktok` edge function still works (it should; the schema is intact).
6. Test the Share Extension flow on a real device (simulator can't receive shares).

---

(Add other deprecated Align features below this line over time.)
