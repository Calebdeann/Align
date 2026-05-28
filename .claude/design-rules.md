# It Girl — Design Rules

These rules are derived from completed, approved screens. Any new screen must match these patterns exactly — no inventing new sizes.

---

## Typography Scale

| Role                     | Font                    | Size | Weight        | Where used                                   |
| ------------------------ | ----------------------- | ---- | ------------- | -------------------------------------------- |
| Hero / Workout title     | Instrument Serif Italic | 38px | —             | workout-summary (editable title)             |
| Screen title (full-page) | Quicksand               | 26px | Bold          | profile header, workout-photo "Submit Photo" |
| Large section header     | Quicksand               | 24px | Bold          | workout-summary stats header                 |
| Section header           | Quicksand               | 22px | Bold/SemiBold | profile "Week N", plan section headers       |
| Sheet / modal title      | Quicksand               | 18px | SemiBold      | workout-photo "Choose Image" sheet           |
| Card / row title         | Quicksand               | 18px | Bold          | workout-summary exercise name                |
| Body / nav label         | Quicksand               | 17px | Medium        | workout-photo "Template / Upload" links      |
| Secondary body           | Quicksand               | 16px | Medium        | profile stats, plan card subtitles           |
| Small label              | Quicksand               | 15px | Medium        | workout-summary set rows                     |
| Caption                  | Quicksand               | 13px | Regular       | workout-summary date stamp                   |
| Micro                    | Quicksand               | 12px | Medium        | tags, badges                                 |

### Rule: Never invent a new font size

If a new element needs text, pick the closest role from the table above. If nothing fits, escalate and ask — don't add a one-off value.

---

## Component Patterns

### Full-page screen header (nav bar equivalent)

```
Row: [CircleIconButton back] [Title 26px Bold center flex:1] [CircleIconButton right]
paddingHorizontal: 16, paddingBottom: 12
```

Examples: workout-photo "Submit Photo"

### Bottom-sheet header

```
Row: [IconBtn 40px back] [Title 18px SemiBold center flex:1] [IconBtn 40px right]
paddingHorizontal: 16, paddingVertical: 12
Drag handle: 40×4px, color #C8C8CC, above header
```

Examples: workout-photo "Choose Image" sheet

### Section header within a scroll list

```
Text: 22px SemiBold, marginBottom: 12
```

Examples: profile "Week 3", template grid section titles

### Grid cards (3-column photo grid)

```
CARD_SIZE = Math.floor((screenWidth - 32 - 16) / 3)
  — 32 = paddingHorizontal 16 × 2
  — 16 = gap 8 × 2 between 3 columns
gap: 8 between cards, no rotation
borderRadius: 16, overflow: hidden
```

Examples: workout-photo template grid

---

## Spacing & Layout

- Screen horizontal padding: **16px** on each side
- Section gap in ScrollView contentContainerStyle: **24px**
- Card/row internal padding: **12–16px**
- Bottom safe area buffer (above tab bar): `LIQUID_TAB_BAR_HEIGHT + 24`

---

## Iconography

- Back buttons: `Ionicons chevron-back` size 22 inside a 44px CircleIconButton
- Sheet back buttons: `Ionicons chevron-back` size 24 inside a 40px plain icon button
- Info / action secondary: `Ionicons information-circle-outline` or `options-outline` size 22–24

---

## Colors

- Background: `#FFFFFF`
- Primary text: `#000000`
- Secondary text: `#888888` (captions, placeholders)
- Disabled / muted: `rgba(0,0,0,0.35)`
- Card background: `#F5F5F5` or `#1C1C1E` (dark cards)
- Skeleton / placeholder: `#E0E0E0`
- Drag handle: `#C8C8CC`
