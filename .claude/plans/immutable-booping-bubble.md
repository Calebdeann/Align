# Plan: Apple & Google Authentication Setup

## Context

- Hard paywall after onboarding → users must authenticate to use the app
- Workout tracker requires `userId` to save/fetch data
- Auth infrastructure exists (Supabase + expo-secure-store) but sign-in flows not implemented

---

## Phase 1: OAuth Credential Setup (User Action Required)

### Apple Sign-In Setup

**1. Apple Developer Portal (https://developer.apple.com)**

a) Go to Certificates, Identifiers & Profiles → Identifiers
b) Your App ID (`com.align.app`) should already exist
c) Edit it and enable "Sign In with Apple" capability
d) Create a **Services ID**:

- Identifier: `com.align.app.auth` (or similar)
- Enable "Sign In with Apple"
- Configure domains: Add your Supabase callback URL

e) Create a **Key** for Sign In with Apple:

- Keys → Create a Key
- Enable "Sign In with Apple"
- Download the `.p8` file (save it securely!)
- Note the **Key ID**

**2. Supabase Dashboard (https://supabase.com/dashboard)**

a) Go to Authentication → Providers → Apple
b) Enable Apple provider
c) Fill in:

- **Service ID (Client ID):** `com.align.app.auth`
- **Team ID:** Your Apple Team ID (found in Apple Developer account)
- **Key ID:** From the key you created
- **Private Key:** Contents of the `.p8` file

d) Note the **Callback URL** shown - add this to Apple's Service ID config

---

### Google Sign-In Setup

**1. Google Cloud Console (https://console.cloud.google.com)**

a) Create a new project (or use existing)
b) Go to APIs & Services → OAuth consent screen

- Configure consent screen (External)
- Add app name, support email, etc.

c) Go to APIs & Services → Credentials → Create Credentials → OAuth Client ID

- Create **iOS** client:
  - Application type: iOS
  - Bundle ID: `com.align.app`
  - Note the **iOS Client ID**

- Create **Web** client:
  - Application type: Web application
  - Add authorized redirect URI: `https://dngpsabyqsuunajtotci.supabase.co/auth/v1/callback`
  - Note the **Web Client ID** and **Client Secret**

**2. Supabase Dashboard**

a) Go to Authentication → Providers → Google
b) Enable Google provider
c) Fill in:

- **Client ID:** Web Client ID
- **Client Secret:** Web Client Secret

---

## Phase 2: Code Implementation

Once OAuth is configured, I'll implement:

### Step 1: Install Google Sign-In Package

```bash
npx expo install @react-native-google-signin/google-signin
```

### Step 2: Create Auth Service (`src/services/auth.ts`)

- `signInWithApple()` - Native Apple auth → Supabase
- `signInWithGoogle()` - Google auth → Supabase
- `onAuthStateChange()` - Listen for auth changes

### Step 3: Create Sign-In Screen (`app/onboarding/signin.tsx`)

- Apple Sign-In button (white, iOS native style)
- Google Sign-In button (white with Google logo)
- Loading states during auth
- Error handling with alerts
- On success: link onboarding data → navigate to tabs

### Step 4: Update Profile Screen (`app/(tabs)/profile.tsx`)

- Implement Log Out handler
- Implement Delete Account handler

### Step 5: Add Auth State Check

- Check if user is authenticated on app launch
- Redirect appropriately (splash vs tabs)

---

## Files to Create/Modify

| File                        | Action | Purpose                          |
| --------------------------- | ------ | -------------------------------- |
| `src/services/auth.ts`      | Create | Apple/Google sign-in logic       |
| `app/onboarding/signin.tsx` | Create | Sign-in screen UI                |
| `app/(tabs)/profile.tsx`    | Modify | Logout/delete handlers           |
| `app.json`                  | Verify | Ensure Apple auth config present |

---

## Sign-In Screen Design

```
┌─────────────────────────────────────┐
│  ←                           Skip   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%   │
│                                     │
│                                     │
│       Create your account           │
│                                     │
│    Sign in to save your progress    │
│      and access your workouts       │
│                                     │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  ◉ Continue with Apple     │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  G Continue with Google     │    │
│  └─────────────────────────────┘    │
│                                     │
│                                     │
│     By continuing, you agree to     │
│     our Terms and Privacy Policy    │
│                                     │
└─────────────────────────────────────┘
```

---

## Verification Checklist

After implementation:

- [ ] Apple Sign-In creates user in Supabase Auth
- [ ] Google Sign-In creates user in Supabase Auth
- [ ] User profile created in `profiles` table
- [ ] Onboarding data linked from anonymous session
- [ ] User can log out from Profile screen
- [ ] Workout tracker works with authenticated user

---

## Next Steps

1. **You:** Set up OAuth credentials (Apple + Google) per instructions above
2. **You:** Let me know when credentials are configured in Supabase
3. **Me:** Implement the code (auth service, sign-in screen, profile handlers)
4. **Test:** Full auth flow on iOS simulator

Ready to proceed when OAuth is configured!
