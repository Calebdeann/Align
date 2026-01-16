# Align - Project Context

## Quick Summary

Align is a women-focused workout tracker and scheduler app. Built with React Native + Expo, targeting iOS first.

## Tech Stack

- **Framework:** React Native + Expo (managed workflow)
- **Navigation:** Expo Router (file-based routing)
- **State Management:** Zustand
- **Backend:** Supabase (Auth, Database, Storage)
- **Auth:** Apple Sign-In + Google Sign-In
- **Bundle ID:** com.align.app
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
├── app/                    # Expo Router screens
├── src/
│   ├── components/         # UI components
│   ├── constants/          # Theme, config
│   ├── services/           # Supabase, API calls
│   ├── stores/             # Zustand stores
│   ├── hooks/              # Custom hooks
│   └── types/              # TypeScript types
├── assets/
│   └── fonts/              # Quicksand font files
├── docs/figma/             # Figma exports
└── .claude/                # Claude efficiency files
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
- **Bundle ID:** com.align.app
- **Target:** iOS first
