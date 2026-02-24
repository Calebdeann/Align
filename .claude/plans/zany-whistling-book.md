# Plan: Create Custom Exercise Feature

## Context

Users currently can only use exercises from the pre-loaded Supabase library. This feature lets users create their own custom exercises from the exercise library screen, with a name, image, equipment type, primary muscle group, and optional secondary muscles. Custom exercises are stored in Supabase and appear alongside library exercises.

## Approach: Extend the `exercises` table

Rather than creating a separate table, we'll add `user_id` (nullable) and `is_custom` (boolean) columns to the existing `exercises` table. This means:

- All existing exercise lookups, filters, search, history, and PRs work automatically with zero code changes
- Custom exercises appear naturally in the exercise list
- Only need to update RLS policies to allow user-scoped CRUD

**RLS changes:**

- SELECT: `user_id IS NULL` (global) OR `user_id = auth.uid()` (user's custom)
- INSERT: `is_custom = true AND user_id = auth.uid()`
- UPDATE/DELETE: `is_custom = true AND user_id = auth.uid()`

## Files to Create

### 1. `app/create-exercise.tsx` — New screen

The create exercise form with:

- **Header**: Back button (left), "Create Exercise" title (center), purple "Save" button (right) — same pattern as [edit-profile.tsx](app/profile/edit-profile.tsx)
- **Image circle**: 120x120 circle with camera icon (centered), "Add Image" text below — reuses avatar pattern from edit-profile.tsx
- **Form fields** (card-style inputs like edit-profile):
  - Exercise Name (TextInput)
  - Equipment (Pressable → opens equipment filter modal, reuse `FilterModal` from add-exercise.tsx)
  - Primary Muscle Group (Pressable → opens muscle group filter modal)
  - Other Muscles (optional, Pressable → opens muscle group modal, multi-select)
- **Image picker**: Alert with "Choose from Library" / "Take Photo" — same as edit-profile.tsx
- **Save**: Uploads image to `custom-exercise-images` bucket, inserts row into `exercises` table with `is_custom=true` and `user_id`
- After save, refresh exercise store and go back

### 2. `src/services/api/customExercises.ts` — API functions

- `uploadCustomExerciseImage(userId, uri)` → upload to `custom-exercise-images` bucket, return public URL
- `createCustomExercise(userId, data)` → insert into `exercises` table with `is_custom=true`, `user_id=userId`
- Zod validation schema for the input

### 3. `supabase/migrations/023_custom_exercises.sql` — Migration

- Add `user_id UUID REFERENCES auth.users(id)` (nullable, default null)
- Add `is_custom BOOLEAN DEFAULT false`
- Update RLS policies on `exercises` table
- Create `custom-exercise-images` storage bucket with appropriate policies
- Add index on `user_id` for performance

## Files to Modify

### 4. `app/add-exercise.tsx` — Add "Create" button

- Replace the empty `<View style={{ width: 50 }} />` spacer in the header (line 563) with a purple "Create" text Pressable
- On press: `router.push('/create-exercise')`
- Pass back context so custom exercise can be auto-selected after creation

### 5. `src/stores/exerciseStore.ts` — Force refresh on auth change

- Export a `resetExerciseStore` function that sets `isLoaded = false`
- So when a different user logs in, their custom exercises load fresh

### 6. `src/lib/storeManager.ts` — Reset exercise store on auth change

- Call `resetExerciseStore()` alongside other store resets when user changes

### 7. `src/services/api/exercises.ts` — No changes needed

All queries already select from `exercises` table, so custom exercises are automatically included.

## UI Flow

1. User is on add-exercise screen → taps "Create" (top right, purple text)
2. Navigates to create-exercise screen
3. User fills in name, taps circle to add image, selects equipment + muscle groups
4. Taps "Save" → image uploads, exercise row inserted, store refreshed
5. Returns to add-exercise screen where the new custom exercise appears in the list
6. Custom exercises appear in the exercise list under "Custom Exercises" section (optional: add a section header or badge)

## Key Implementation Details

- **Equipment options**: Reuse from add-exercise.tsx — `none, barbell, dumbbell, kettlebell, machine, weighted plate, band, other`
- **Muscle group options**: Reuse `SIMPLIFIED_MUSCLE_GROUPS` from [muscleGroups.ts](src/constants/muscleGroups.ts), but use the first `muscleGroupValues` entry as the DB value
- **Image upload**: Follow exact same pattern as `uploadAvatar()` in [user.ts](src/services/api/user.ts) — FormData with upsert
- **Haptics**: Use same patterns as rest of app (Light for taps, Heavy for save)
- **Exercise name**: Stored as both `name` (lowercase) and `display_name` (user-entered casing)
- **No instructions/GIF**: Custom exercises won't have ExerciseDB GIFs or instructions — that's fine, `ExerciseImage` already handles null images with a fallback icon

## Verification

1. Open exercise library from active workout or template builder
2. Tap "Create" in top right
3. Fill in exercise name, pick an image, select equipment and muscle group
4. Tap Save — verify it saves successfully
5. Verify the new exercise appears in the exercise list
6. Add the custom exercise to a workout, complete sets, verify it works in history/PRs
7. Log out and log in as different user — verify they don't see the first user's custom exercises
