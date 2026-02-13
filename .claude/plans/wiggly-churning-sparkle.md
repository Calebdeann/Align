# Add Email Sign-In/Sign-Up for Apple Testers

## Overview

Add email/password authentication to the sign-in screen (`app/onboarding/signin.tsx`) so Apple App Store review testers can create accounts and sign in without needing Apple ID or Google. This is a tester-only flow on the "Welcome Back" screen only.

## Approach

**Collapsible email section** below the existing Apple/Google buttons, toggled by a "Sign in with Email" text link. Keeps the screen clean by default. Single "Continue" button that auto-detects whether to sign in or sign up:

1. Try `signInWithPassword` first
2. If fails with "Invalid login credentials" (no user exists), try `signUp` to create account
3. On sign-up success, create a minimal profile (since email users bypass onboarding)

## Changes

### 1. `app/onboarding/signin.tsx` (primary change)

**New state:**

- `showEmailForm`, `email`, `password`, `isEmailLoading`

**New imports:**

- `TextInput`, `KeyboardAvoidingView`, `Platform` from react-native

**New handler: `handleEmailSignIn`**

- Validates email non-empty, password >= 6 chars
- Tries `supabase.auth.signInWithPassword()` first
- If sign-in succeeds: check profile → navigate to `/(tabs)`
- If "Invalid login credentials": call `supabase.auth.signUp()` → create minimal profile → navigate
- Error handling via Alert

**New helper: `createMinimalProfile`**

- `supabase.from('profiles').upsert({ id, email, updated_at })` with `onConflict: 'id'`
- Follows same RLS pattern as `linkOnboardingToUser`

**UI additions (after Google button):**

- "Sign in with Email" toggle link (mail icon + text, `rgba(255,255,255,0.7)`)
- Collapsible form with:
  - Email TextInput (semi-transparent white bg, white text)
  - Password TextInput (secureTextEntry)
  - "Continue with Email" button (white bg, purple text)

**Wrap container in `KeyboardAvoidingView`** for keyboard handling.

### 2. Translation files (8 new keys under `"auth"`)

```json
"signInWithEmail": "Sign in with Email",
"hideEmailSignIn": "Hide email sign-in",
"emailPlaceholder": "Email address",
"passwordPlaceholder": "Password",
"continueWithEmail": "Continue with Email",
"emailPasswordRequired": "Please enter both email and password.",
"passwordTooShort": "Password must be at least 6 characters.",
"emailSignInError": "Unable to sign in with email. Please try again."
```

Add to `en.json` + all 11 other locale files.

### 3. Supabase Dashboard (manual prerequisite)

- Enable Email provider in Authentication > Providers
- Disable "Confirm email" so testers can sign in immediately

## Files to Modify

| File                                                       | Change                                               |
| ---------------------------------------------------------- | ---------------------------------------------------- |
| `app/onboarding/signin.tsx`                                | Add email form UI, handler, minimal profile creation |
| `src/i18n/locales/en.json`                                 | Add 8 translation keys                               |
| `src/i18n/locales/{es,fr,de,it,pt,nl,ru,zh,hi,ro,az}.json` | Same 8 keys (English fallbacks)                      |

## Verification

1. Enter new email + password on sign-in screen → verify account created, navigates to app
2. Close app, reopen, sign in with same credentials → verify sign-in works
3. Enter wrong password → verify error shown
4. Empty fields → verify validation error
5. Password < 6 chars → verify validation error
6. Verify keyboard doesn't cover the form (KeyboardAvoidingView)
