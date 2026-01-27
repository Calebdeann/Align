# Bugs & Lessons Learned

## Critical Rules (Always Follow)

1. Always use expo-secure-store for auth tokens, never AsyncStorage
2. Start with Slot instead of Stack/Tabs - add complexity only when needed
3. Test navigation changes one screen at a time
4. Core save operations (workouts, templates, profiles) must always have a fallback retry path when using new database columns. See `.claude/backend-rules.md`.

---

## Bug Log

### 2026-01-16 - Navigation - TypeError boolean/string

**Problem:** `TypeError: expected dynamic type 'boolean', but had type 'string'`
**Root Cause:** Tabs navigator with screenOptions conflicts with RN new architecture
**Solution:** Use simple Slot-based routing, avoid complex navigators
**Prevention Rule:** Start minimal, add navigation complexity only when proven stable

### 2026-01-27 - Supabase - Save workout crashes with image selected

**Problem:** Saving a workout with an image fails with `PGRST204 - Could not find the 'image_template_id' column of 'workouts' in the schema cache`
**Root Cause:** Code in `src/services/api/workouts.ts` lines 156-160 adds `image_type`, `image_uri`, `image_template_id` to the INSERT when user selects an image, but migration `010_workout_image.sql` was not applied to Supabase.
**Solution:** Added try-catch retry pattern: first attempt includes image fields, on schema error retries with base fields only. Also need to apply the migration with `npm run db:push`.
**Prevention Rule:** All INSERT/UPDATE statements that reference new columns must include a schema-error fallback path. See `.claude/backend-rules.md` Rule 2. Core save operations must never hard-fail due to optional features (Rule 3).

### 2026-01-27 - LiveActivity - Maximum number of activities error on app open

**Problem:** Red error screen on app open: `FunctionCallException: Maximum number of activities`
**Root Cause:** `currentActivityId` was stored in memory only. When the app gets killed/restarted, the ID is lost and stale Live Activities pile up until iOS rejects new ones. `console.error` in the catch block triggered the red dev error overlay.
**Solution:** Persist activity ID to AsyncStorage so it survives restarts. Added `cleanupStaleLiveActivities()` called on app mount to stop orphaned activities. Changed all `console.error` to `console.warn` since Live Activity is non-critical.
**Prevention Rule:** Non-critical native features (Live Activities, widgets, haptics) must never use `console.error` - use `console.warn` instead. Always persist native resource IDs that need cleanup across app restarts.

### 2026-01-27 - Templates - Red error screen + "Template not found" after creating template

**Problem:** Creating a new template shows red `console.error` screen ("Error saving template sets: Network request failed") and navigating to the template shows "Template not found".
**Root Cause:** Two issues: (1) `console.error` in `src/services/api/templates.ts` triggers the red dev overlay for non-critical backend sync failures. (2) Race condition in `src/stores/templateStore.ts`: `createTemplate` generates a local ID, then async backend save replaces it with a Supabase UUID. If the user navigates to template-detail before the swap, the URL param has the old local ID, but the store now has the UUID. `getTemplateById(localId)` returns undefined.
**Solution:** Changed all `console.error` to `console.warn` in templates.ts and templateStore.ts. Added `_localId` field preservation when swapping to backend UUID, and updated `getTemplateById` to check both `id` and `_localId`.
**Prevention Rule:** Backend sync operations (template save, update, delete) must never use `console.error`. When swapping local IDs for backend IDs, always preserve the original local ID so lookups can find the entity by either ID.
