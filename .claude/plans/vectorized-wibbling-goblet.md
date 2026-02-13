# Fix: Orphaned Scheduled Workouts from Deleted Templates

## Problem

When a user deletes a custom template, scheduled workouts referencing it via `templateId` become orphaned:

- The workout still appears on the calendar/list but may not be clickable
- Checking/unchecking stops working reliably
- There's no way to remove the stuck workout from the planner
- `workout-preview.tsx` shows "No Template Linked" but the workout is otherwise intact

**Root cause:** `removeTemplate()` in templateStore deletes the template but never cleans up scheduled workouts that reference it.

## Approach: Silent Detach on Delete + Migration for Existing Orphans

When a template is deleted, automatically detach all scheduled workouts that reference it. The workouts keep their own `name`, `tagColor`, and `image` (already denormalized) but lose the `templateId` link. They become normal standalone scheduled workouts.

Also add a one-time migration to fix any workouts that are already orphaned.

---

## Changes

### 1. Add `detachScheduledWorkoutsForTemplate` action

**File:** `src/stores/workoutStore.ts`

Add to the store interface and implementation (after `updateScheduledWorkoutsForTemplate`):

```typescript
detachScheduledWorkoutsForTemplate: (templateId: string) => void;
```

Implementation: map over `scheduledWorkouts`, for any workout with matching `templateId`, set `templateId: undefined` and `templateName: null`. The workout retains its `name`, `tagColor`, `image`.

### 2. Call detach from `removeTemplate`

**File:** `src/stores/templateStore.ts` (lines 154-166)

In `removeTemplate`, before removing the template from state, call `detachScheduledWorkoutsForTemplate(id)`. Use the existing `require('./workoutStore')` pattern already established at line 236.

### 3. Clean up existing orphans on store rehydration

**File:** `src/stores/workoutStore.ts`

Add `onRehydrateStorage` to the persist config. After rehydration, check each scheduled workout's `templateId` against the template store. If the template no longer exists, clear `templateId` and `templateName`.

Use `setTimeout(fn, 0)` to defer until both stores have rehydrated.

### 4. Hide "Template" section for detached workouts (optional polish)

**File:** `app/workout-preview.tsx` (lines 378-506)

When `workout.templateId` is undefined, hide the "Template" section header and "No Template Linked" card entirely. The workout info card still shows the workout name, date, time, and repeat. The "Start Workout" button still works (starts an empty workout).

---

## Files to Modify

| File                          | Change                                                                            |
| ----------------------------- | --------------------------------------------------------------------------------- |
| `src/stores/workoutStore.ts`  | Add `detachScheduledWorkoutsForTemplate` + orphan cleanup in `onRehydrateStorage` |
| `src/stores/templateStore.ts` | Call detach in `removeTemplate` before deletion                                   |
| `app/workout-preview.tsx`     | Hide Template section when no `templateId`                                        |

## Verification

1. **Delete a template that has scheduled workouts** - Confirm the scheduled workouts remain on the planner but no longer show a template name badge
2. **Tap the detached workout** - Confirm navigation to workout-preview works, shows workout info without Template section
3. **Check/uncheck the detached workout** - Confirm toggling completion works
4. **Start the detached workout** - Confirm it starts an empty active workout
5. **Delete the detached workout** - Confirm deletion from workout-preview works
6. **Restart app with existing orphans** - Confirm the migration cleans them up on rehydration
