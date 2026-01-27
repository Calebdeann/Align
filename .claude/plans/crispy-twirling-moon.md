# Fix: Explore Templates "Add" Flow — Freeze, No Navigation, Not Adding to Library

## Problems

1. Tapping "Add" on a template in explore, selecting colour, tapping "Add to Library" → nothing happens
2. The explore page becomes frozen/unresponsive afterward
3. Template doesn't appear as "Added" in the list and doesn't show in library

## Root Causes

### Bug 1: Stacked `<Modal>` components on iOS

`explore-templates.tsx` has TWO `<Modal>` visible simultaneously:

- CategoryModal (line 145): `animationType="slide"` — the template list
- Colour picker Modal (line 340): `animationType="none"` — shows on top

On iOS, stacking two native `<Modal>` components causes the second to be unresponsive or not render properly.

### Bug 2: Navigation races with modal animations

`confirmAddWithColour` (line 255) calls `closeColourModal()` (250ms animation) and `router.navigate()` simultaneously. Navigating while modals are animating causes iOS to freeze.

### Bug 3: Missing `userId` on added templates

`addTemplate` (templateStore.ts:136) spreads the preset template but presets don't have `userId`. The added template has `userId: undefined`. But `isTemplateSaved` (line 261) checks `t.userId === userId` → never matches → button stays "Add" → user taps again → `addTemplate` returns false (name exists) → `if (!added) return` exits without navigating.

## Fix

### File: `app/explore-templates.tsx`

**1. `handleAddTemplate`** — Close CategoryModal before showing colour picker:

```typescript
const handleAddTemplate = (template: WorkoutTemplate) => {
  setPendingTemplate(template);
  setAddColourId('purple');
  setShowCategoryModal(false);
  setTimeout(() => {
    setShowColourModal(true);
    Animated.spring(colourSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, 350);
};
```

**2. `confirmAddWithColour`** — Navigate after animation, pass userId:

```typescript
const confirmAddWithColour = () => {
  if (!pendingTemplate) return;
  const colour = WORKOUT_COLOURS.find((c) => c.id === addColourId);
  const tagColor = colour?.color || colors.primary;
  const added = addTemplate({ ...pendingTemplate, userId: userId || undefined }, tagColor);

  Animated.timing(colourSlideAnim, {
    toValue: SCREEN_HEIGHT,
    duration: 250,
    useNativeDriver: true,
  }).start(() => {
    setShowColourModal(false);
    setPendingTemplate(null);
    if (!added) return;
    setSelectedCategory(null);
    router.navigate('/(tabs)/workout');
  });
};
```

**3. `closeColourModal`** — Reopen CategoryModal on cancel:

```typescript
const closeColourModal = () => {
  Animated.timing(colourSlideAnim, {
    toValue: SCREEN_HEIGHT,
    duration: 250,
    useNativeDriver: true,
  }).start(() => {
    setShowColourModal(false);
    setPendingTemplate(null);
    if (selectedCategory) {
      setShowCategoryModal(true);
    }
  });
};
```

### File: `app/template-detail.tsx`

**4. `confirmAddWithColour`** — Navigate after animation, pass userId:

```typescript
const confirmAddWithColour = (colourId: string) => {
  const colour = WORKOUT_COLOURS.find((c) => c.id === colourId);
  const tagColor = colour?.color || colors.primary;
  const added = addTemplate({ ...template, userId: userId || undefined }, tagColor);

  Animated.timing(addColourSlideAnim, {
    toValue: SCREEN_HEIGHT,
    duration: 250,
    useNativeDriver: true,
  }).start(() => {
    setShowAddColourModal(false);
    if (!added) return;
    router.navigate('/(tabs)/workout');
  });
};
```

## Files to Modify

| File                        | Change                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------- |
| `app/explore-templates.tsx` | Close CategoryModal before colour picker; navigate after animation; pass userId; reopen modal on cancel |
| `app/template-detail.tsx`   | Navigate after animation; pass userId                                                                   |

## Verification

1. Explore → Glutes → tap "Add" → colour picker appears (no freeze)
2. Select colour → "Add to Library" → navigates to workout tab
3. Template appears in "My Templates" folder
4. Go back to Explore → Glutes → template shows "Added"
5. Cancel test: tap "Add", close colour picker → category modal reopens
6. Template-detail: open template → "Add" → colour → "Add to Library" → navigates correctly
