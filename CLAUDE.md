# Align - Project Context

## Quick Summary

Align is a women-focused workout tracker and scheduler app. Built with React Native + Expo, targeting iOS first.

## Tech Stack

- **Framework:** React Native + Expo (managed workflow)
- **Navigation:** Expo Router (file-based routing)
- **State Management:** Zustand
- **Backend:** Supabase (Auth, Database, Storage)
- **Auth:** Apple Sign-In + Google Sign-In
- **Bundle ID:** com.aligntracker.app
- **Language:** TypeScript

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
│   ├── services/               # API & external services
│   │   └── supabase.ts         # Supabase client
│   ├── stores/                 # Zustand state stores
│   │   └── onboardingStore.ts  # Onboarding state
│   ├── types/                  # TypeScript type definitions
│   │   └── index.ts            # Shared types
│   └── utils/                  # Helper functions
│       └── calendar.ts         # Calendar date utilities
│
├── assets/                     # Static assets
│   ├── fonts/                  # Custom fonts
│   ├── images/                 # App images
│   ├── Figma_App/              # Figma exports for main app
│   └── Figma_Onboarding/       # Figma exports for onboarding
│
├── ios/                        # Native iOS project (dev builds)
└── .claude/                    # Claude project files
```

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

## Monetization (Later)

- Hard paywall after onboarding
- Monthly + Annual subscriptions via Superwall
- Mixpanel for analytics

## Quick Reference

- **Primary:** #947AFF
- **Font:** Quicksand
- **Bundle ID:** com.aligntracker.app
- **Target:** iOS first
