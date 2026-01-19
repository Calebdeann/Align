# Edge Cases Analysis - Potential Changes Needed

## Overview

Large-scale analysis of edge cases, state synchronization issues, and potential bugs across the Align app.

---

## CRITICAL PRIORITY (Fix Immediately)

### 1. Timer Duplication Bug

**Files:** `app/active-workout.tsx`, `src/components/workout/ActiveWorkoutWidget.tsx`

**Problem:** When workout is minimized, TWO timer intervals can run simultaneously:

- Main screen keeps its interval running
- Widget starts its own interval
- Timer runs at 2x speed

**Fix:** Stop the main screen's timer when minimized, or consolidate timer logic to store only.

---

### 2. Widget Timer Memory Leak

**File:** `src/components/workout/ActiveWorkoutWidget.tsx:21-33`

**Problem:** Dependency array includes `activeWorkout?.elapsedSeconds`, causing effect to re-run every second. Creates/clears interval every second instead of once.

```typescript
// Current (broken)
}, [activeWorkout?.isMinimized, activeWorkout?.elapsedSeconds]);

// Should be
}, [activeWorkout?.isMinimized]);
```

**Fix:** Remove `elapsedSeconds` from dependency array.

---

### 3. Workout Completion Not Synced to Server

**File:** `src/stores/workoutStore.ts:292-306`

**Problem:** `toggleWorkoutCompletion()` only updates local state. Completion status is NEVER saved to Supabase. If app closes, all completion data is lost.

**Fix:** Add Supabase sync call, or add persist middleware to workoutStore.

---

### 4. Templates Not Persisted

**File:** `src/stores/templateStore.ts`

**Problem:** Templates are stored in-memory only (no `persist` middleware like userPreferencesStore has). User creates template, closes app → template lost.

**Fix:** Add Zustand persist middleware or save templates to Supabase.

---

### 5. Memory Leak in Exercise Detail Screen

**File:** `app/exercise/[id].tsx:35-64`

**Problem:** No cleanup function in useEffect. If user navigates away while data is loading, state updates happen on unmounted component.

```typescript
// Current
useEffect(() => {
  loadData();
}, [id]); // No cleanup!

// Should add AbortController or mounted flag
```

**Fix:** Add cleanup function to prevent state updates after unmount.

---

## HIGH PRIORITY (Fix Soon)

### 6. Auth Race Condition

**File:** `app/onboarding/signin.tsx:44-50`

**Problem:** Navigation happens while async operations are still completing:

```typescript
await linkOnboardingToUser(data.user.id);
await clearAnonymousSession();
router.replace('/onboarding/name'); // Fires while above may still be running
```

**Fix:** Ensure all async operations complete before navigation.

---

### 7. Onboarding Save is Fire-and-Forget

**File:** `src/stores/onboardingStore.ts:115-123`

**Problem:** `setAndSave()` updates local state immediately, but Supabase save is caught and ignored if it fails. User thinks data is saved, but server never received it.

**Fix:** Add retry logic or show error toast when save fails.

---

### 8. Pending Exercises Not Cleared on Error

**File:** `app/active-workout.tsx:560-596`

**Problem:** If API call fails when adding pending exercises, `pendingExercises` is never cleared. Creates infinite retry loop.

**Fix:** Clear pending exercises in catch block.

---

### 9. Multiple Modals Can Overlap

**File:** `app/active-workout.tsx` (6+ modal states)

**Problem:** No mutex/stack for modals. If rest timer completes while another modal is open, both render simultaneously.

**Fix:** Implement modal queue or ensure only one modal can be open at a time.

---

### 10. Profile Cache Never Invalidates

**File:** `src/stores/userProfileStore.ts:41-68`

**Problem:** 5-minute cache, but no invalidation when user updates profile elsewhere. No refresh when app returns from background.

**Fix:** Add cache invalidation on profile update, add AppState listener for foreground refresh.

---

### 11. API Errors Return Empty Arrays

**Files:** `src/services/api/exercises.ts`, `src/services/api/workouts.ts`

**Problem:** All API functions return empty arrays/null on error. UI shows "No items" instead of "Error loading data". User can't distinguish between actual empty state and failure.

**Fix:** Return error objects or throw errors, let UI display appropriate error states.

---

### 12. Index Stale After Exercise Removal

**File:** `app/active-workout.tsx:1371-1374, 1042-1051`

**Problem:** Modal stores exercise/set index. If user removes an exercise while modal is open, index becomes invalid.

**Fix:** Store exercise ID instead of index, or close modal when exercises change.

---

## MEDIUM PRIORITY (Polish Items)

### 13. Modal State Lost on Tab Switch

**File:** `app/(tabs)/workout.tsx`

**Problem:** `showWorkoutInProgressModal` is local state. Tab away and back → modal state resets but underlying condition persists.

**Fix:** Move modal visibility to store, or use `useFocusEffect` to sync state.

---

### 14. Error States Not Cleared on Screen Blur

**Files:** `app/onboarding/name.tsx`, `app/add-exercise.tsx`

**Problem:** Error messages persist in state. Navigate away with error showing, come back → old error might flash.

**Fix:** Clear error states in `useFocusEffect` cleanup.

---

### 15. Template ID Validation Missing

**File:** `app/(tabs)/workout.tsx:204-218`

**Problem:** When starting from template, no check if template still exists. If deleted between button render and navigation, workout starts empty.

**Fix:** Validate template exists before navigation.

---

### 16. Superset ID Collision Risk

**File:** `app/active-workout.tsx:629-636`

**Problem:** `getNextSupersetId()` uses `Math.max(...existingIds) + 1`. If superset removed and re-added, could reuse same ID.

**Fix:** Use UUID or increment counter that never decreases.

---

### 17. Loading State Can Get Stuck

**Files:** `app/save-workout.tsx:248-300`, `app/onboarding/name.tsx`

**Problem:** If navigation fails after setting `isLoading = true`, loading state stays true forever (component unmounts before finally block runs).

**Fix:** Use cleanup in useEffect, or move loading state to store.

---

### 18. No Debouncing on Profile Updates

**File:** `src/stores/userProfileStore.ts:122-155`

**Problem:** `updateProfile()` doesn't debounce. Rapid changes trigger multiple concurrent requests.

**Fix:** Add debounce/throttle to update function.

---

### 19. Anonymous Session Orphaning

**File:** `src/stores/onboardingStore.ts:159`

**Problem:** `reset()` clears store state but doesn't call `clearAnonymousSession()`. Session IDs accumulate in SecureStore.

**Fix:** Clear anonymous session in reset().

---

### 20. useFocusEffect Missing on Key Screens

**Files:** `app/active-workout.tsx`, `app/add-exercise.tsx`

**Problem:** These screens don't refresh data when regaining focus. If data changes elsewhere, user sees stale information.

**Fix:** Add useFocusEffect to re-sync relevant data.

---

## LOW PRIORITY (Nice to Have)

### 21. Unsafe Type Casting

**File:** `app/active-workout.tsx:472, 549`

**Problem:** Uses `as WorkoutExercise[]` without validating structure. If types diverge, runtime errors.

**Fix:** Add type guards or validation.

---

### 22. Optional Fields Undefined

**File:** `src/stores/workoutStore.ts:184-194`

**Problem:** `startActiveWorkout()` doesn't initialize `sourceTemplateId` and `templateName`. Code checking these must handle undefined.

**Fix:** Initialize all optional fields explicitly.

---

### 23. Workout Frequency String Parsing

**File:** `src/stores/onboardingStore.ts:38-44`

**Problem:** Parses "4 days / week" with regex. If format changes, returns null silently.

**Fix:** Add validation and fallback handling.

---

## SUMMARY BY FILE

| File                          | Issues                    | Severity      |
| ----------------------------- | ------------------------- | ------------- |
| `active-workout.tsx`          | #1, #8, #9, #12, #16, #21 | Critical/High |
| `ActiveWorkoutWidget.tsx`     | #2                        | Critical      |
| `workoutStore.ts`             | #3, #22                   | Critical      |
| `templateStore.ts`            | #4                        | Critical      |
| `exercise/[id].tsx`           | #5                        | Critical      |
| `signin.tsx`                  | #6                        | High          |
| `onboardingStore.ts`          | #7, #19, #23              | High/Medium   |
| `exercises.ts`, `workouts.ts` | #11                       | High          |
| `userProfileStore.ts`         | #10, #18                  | High/Medium   |
| `workout.tsx` (tabs)          | #13, #15                  | Medium        |
| `save-workout.tsx`            | #17                       | Medium        |

---

## RECOMMENDED ORDER OF FIXES

1. **Immediate (data loss risk):**
   - #3 Workout completion sync
   - #4 Template persistence
   - #7 Onboarding save reliability

2. **This week (crashes/memory):**
   - #2 Widget timer memory leak
   - #1 Timer duplication
   - #5 Memory leak in exercise detail

3. **Soon (UX issues):**
   - #9 Modal overlapping
   - #11 API error handling
   - #8 Pending exercises error handling

4. **Later (polish):**
   - Remaining medium/low items
