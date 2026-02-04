# Align - Project Context

## Quick Summary

Align is a women-focused workout tracker and scheduler app. Built with React Native + Expo, targeting iOS first.

## Tech Stack

- **Framework:** React Native + Expo (managed workflow)
- **Navigation:** Expo Router (file-based routing)
- **State Management:** Zustand
- **Backend:** Supabase (Auth, Database, Storage)
- **Auth:** Apple Sign-In + Google Sign-In
- **Validation:** Zod (API input validation)
- **Exercise API:** Ascend API (ExerciseDB) - https://www.ascendapi.com/api/v1
- **Bundle ID:** com.aligntracker.app
- **Language:** TypeScript

## Exercise Library

**IMPORTANT:** All exercise images/animations MUST come from the Ascend API (ExerciseDB).

- **API:** https://www.ascendapi.com/api/v1
- **GIF URL format:** `https://static.exercisedb.dev/media/{exerciseId}.gif`
- **Documentation:** https://exercisedb.notion.site/Table-of-Contents-1a6983b728ca80b69e85c5c74133220e
- **Do NOT** use other image sources (MuscleWiki, GitHub, etc.)
- Exercise data is stored in Supabase `exercises` table with `image_url` pointing to ExerciseDB GIFs

## Current Phase

🎯 **PHASE: Environment Setup → Onboarding**

- Focus on onboarding flow first (30-40 screens → hard paywall)
- User has Figma designs - follow them exactly
- Don't over-engineer, keep it simple
- Speed > perfection

## Design System

- **Primary Color:** #947AFF (purple)
- **Font:** Quicksand (Regular, Medium, SemiBold, Bold)
- **Theme File:** src/constants/theme.ts

## App Structure

**3 Main Tabs:**

1. **Planner** - Calendar + List view for workout scheduling
2. **Workout** - Exercise tracking, presets, session logging
3. **Profile** - User settings

**Key Features:**

- Recurring workout scheduling (weekly patterns)
- Exercise library from Supabase
- Workout presets and Align templates
- Color-coded by workout type (Legs, Arms, etc.)
- Full offline support (later phase)

## User Preferences

- TypeScript beginner - add helpful comments when complex
- Speed focused - MVP over perfection
- Has exact UI vision from Figma - don't auto-generate, build step by step
- Prefers iOS Simulator for testing

## File Structure

```
align/
├── app/                        # Expo Router screens (file-based routing)
│   ├── (tabs)/                 # Tab navigator screens
│   │   ├── _layout.tsx         # Tab bar configuration
│   │   ├── index.tsx           # Planner/Calendar screen
│   │   ├── workout.tsx         # Workout screen
│   │   └── profile.tsx         # Profile screen
│   ├── onboarding/             # Onboarding flow screens
│   ├── _layout.tsx             # Root layout (fonts, splash)
│   └── index.tsx               # Entry point / Welcome screen
│
├── src/                        # Source code (non-routing)
│   ├── components/             # Reusable UI components
│   │   ├── icons/              # SVG icon components
│   │   ├── layout/             # Layout wrapper components
│   │   ├── ui/                 # Generic UI (buttons, cards, etc.)
│   │   └── index.ts            # Barrel export
│   ├── constants/              # App-wide constants
│   │   └── theme.ts            # Colors, fonts, spacing
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Third-party library configs
│   ├── schemas/                # Zod validation schemas
│   │   ├── common.schema.ts    # Shared validation patterns
│   │   ├── workout.schema.ts   # Workout validation
│   │   ├── template.schema.ts  # Template validation
│   │   └── user.schema.ts      # User/profile validation
│   ├── services/               # API & external services
│   │   ├── supabase.ts         # Supabase client
│   │   └── api/                # API functions (workouts, templates, user)
│   ├── stores/                 # Zustand state stores
│   │   └── onboardingStore.ts  # Onboarding state
│   ├── types/                  # TypeScript type definitions
│   │   └── index.ts            # Shared types
│   └── utils/                  # Helper functions
│       ├── calendar.ts         # Calendar date utilities
│       └── logger.ts           # Structured logging utility
│
├── assets/                     # Static assets
│   ├── fonts/                  # Custom fonts
│   ├── images/                 # App images
│   ├── Figma_App/              # Figma exports for main app
│   └── Figma_Onboarding/       # Figma exports for onboarding
│
├── supabase/                   # Supabase configuration
│   └── migrations/             # SQL migrations (RLS policies, schema)
├── ios/                        # Native iOS project (dev builds)
└── .claude/                    # Claude project files
```

## Data Storage Architecture

### Per-User Namespaced Storage

User data is stored in AsyncStorage with per-user namespaced keys to ensure complete data isolation between accounts on the same device.

**Storage Key Format:** `{baseKey}-{userId}`

- Example: `workout-store-abc123def456`

**Stores Using Per-User Storage:**
| Store | Base Key | Persisted Data |
|-------|----------|----------------|
| workoutStore | `workout-store` | Scheduled workouts, active workout, cached completed workouts |
| templateStore | `template-store` | User-created templates, folders |

**Stores Using Device-Wide Storage:**
| Store | Key | Persisted Data |
|-------|-----|----------------|
| userPreferencesStore | `user-preferences` | Unit preferences (kg/lbs, etc.) |

**Stores Without Persistence:**

- `userProfileStore` - In-memory only, syncs from Supabase
- `onboardingStore` - In-memory only, syncs to Supabase during flow

### Key Files

- `src/services/authState.ts` - Centralized auth state listener
- `src/lib/userNamespacedStorage.ts` - Custom storage adapter with migration
- `src/lib/storeManager.ts` - Store reset/rehydration on auth changes

### How It Works

1. **App Start:** `initializeStoreManager()` subscribes to auth changes
2. **User Login:** Storage adapter reads from `{baseKey}-{userId}`, migrates legacy data if needed
3. **User Logout:** Stores reset to initial state, next user gets fresh state
4. **User Switch:** Previous user's data stays in their namespaced key, new user's data loads
5. **Account Delete:** User's namespaced storage keys are explicitly deleted

### Migration from Legacy Keys

On first login after upgrade, the storage adapter:

1. Checks if user-specific data exists (`workout-store-{userId}`)
2. If not, checks for legacy data in global key (`workout-store`)
3. Filters legacy data by `userId` field and migrates to namespaced key
4. Legacy data is preserved (not deleted) for other users who may need migration

## Key Patterns

### Onboarding Option Cards

Use `QuestionLayout` component with `optionStyles` for all multi-select/single-select screens:

- **Unselected:** White background (#FFFFFF), gray border (rgba(239,239,239,0.5)), black text
- **Selected:** Purple background (#947AFF), purple border, white text
- **Height:** 74px fixed
- **Checkbox (multi-select):** Circle with white border/background when selected, purple inner dot
- **Icon:** 20px emoji on left side
- Use `optionStyles.optionCard` and `optionStyles.optionCardSelected` from QuestionLayout

## Important Rules

1. Always use expo-secure-store for auth tokens, never AsyncStorage
2. Follow Figma designs exactly - don't improvise UI
3. Ask before adding new dependencies
4. Keep components small and focused
5. All API write functions must validate input with Zod schemas before DB operations
6. RLS policies enforce data isolation - users can only access their own data
7. **NEVER reference "male" in the app.** This is a women's workout tracker. All exercise animations, images, and content must use female variants only. Never add male-gendered content, labels, or references in any user-facing code or new scripts.
8. **Database columns must be backwards-compatible in code.** When adding new database columns: (a) never unconditionally include them in INSERT or UPDATE statements, (b) always provide a fallback retry path that strips new columns if the insert fails with a schema error (PGRST204), and (c) core save operations (workouts, templates, profiles) must NEVER hard-fail due to optional feature columns. See `.claude/backend-rules.md` for the full pattern and protected operations list.
9. **Exercise row tap targets:** Exercise detail view must ONLY open when tapping the thumbnail image or the exercise name text. Never wrap entire exercise rows in a navigation Pressable. Always use `Text.onPress` with `alignSelf: 'flex-start'` on exercise name Text elements so the tap target is constrained to the visible text only (not the full row width). The parent View should use `flex: 1` + `pointerEvents="box-none"` so taps on empty space pass through harmlessly.

## Backend Security

### Row Level Security (RLS)

All user data tables have RLS policies enabled. This means:

- Users can only read/write their own data
- Even if app code has a bug, the database enforces data isolation
- Policies are defined in `supabase/migrations/`

**Protected Tables:**

- `profiles`, `workouts`, `workout_exercises`, `workout_sets`, `workout_muscles`
- `workout_templates`, `template_exercises`, `template_sets`
- `user_exercise_preferences`

**Reference Tables (read-only for users):**

- `exercises`, `exercise_muscles`

### Input Validation

All API write functions validate input using Zod schemas before database operations:

- Schemas located in `src/schemas/`
- Validates types, lengths, ranges, and formats
- Prevents malformed data from reaching the database

### Useful Commands

```bash
npm run types:generate  # Generate TypeScript types from Supabase schema
npm run db:push         # Push migrations to Supabase
```

## Security - Credentials Handling

**CRITICAL: Never commit secrets to the codebase.**

### What's Safe in Code (Public)

- OAuth **Client IDs** (iOS, Web) - These are public identifiers
- Supabase **URL** and **Anon Key** - Designed to be public
- Bundle IDs, Team IDs, Key IDs

### What Must NEVER Be in Code (Secrets)

- OAuth **Client Secrets** - Store only in Supabase dashboard
- Apple **.p8 private keys** - Store only in Supabase dashboard
- Supabase **Service Role Key** - Never needed in client app
- Any API keys with write/admin access

### Current OAuth Setup

```
Apple Sign-In:
- App ID: com.aligntracker.app
- Service ID: com.aligntracker.app.auth (for Supabase callback)
- Key ID: 26CKNHTCMG
- Team ID: 26YKG8V9Q8
- P8 Key & Secret: STORED IN SUPABASE ONLY

Google Sign-In:
- iOS Client ID: 1032254562807-29eof3svg4o8erh24t94v0nqe3l53ed8.apps.googleusercontent.com
- Web Client ID: 1032254562807-qkr613tq0nqc07l6e23h9le715scvkrq.apps.googleusercontent.com
- Client Secret: STORED IN SUPABASE ONLY
```

### Where Secrets Live

| Secret               | Location                                 |
| -------------------- | ---------------------------------------- |
| Apple P8 Key         | Supabase → Auth → Providers → Apple      |
| Apple JWT Secret     | Supabase → Auth → Providers → Apple      |
| Google Client Secret | Supabase → Auth → Providers → Google     |
| Supabase Service Key | Supabase → Settings → API (never in app) |

## Don'ts

- Don't auto-generate full UI - build step by step with user
- Don't add features not requested
- Don't over-engineer or add unnecessary abstractions
- Don't add comments unless logic is complex
- Never use em-dashes in the app. Use commas or periods instead.

## Monetization (Later)

- Hard paywall after onboarding
- Monthly + Annual subscriptions via Superwall
- Mixpanel for analytics

## Quick Reference

- **Primary:** #947AFF
- **Font:** Quicksand
- **Bundle ID:** com.aligntracker.app
- **Target:** iOS first

## Response Format

At the end of every response after completing a task, include:

**Completed:** (A 1 sentence explanation of what was just done)
