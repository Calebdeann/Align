# Plan: Fix "expected dynamic type 'boolean'" Error

## Problem

Persistent error: `Exception in HostFunction: TypeError: expected dynamic type 'boolean', but had type 'string'`

The error occurs in ReactFabric-dev.js (the new architecture renderer) even though `newArchEnabled: false` is set. This is a caching/bundler issue - old Fabric code is still being used.

## Solution: Hard Cache Reset

Run these commands in order:

```bash
# 1. Kill all Expo/Metro processes
pkill -f "expo" || true
pkill -f "metro" || true

# 2. Clear watchman cache
watchman watch-del-all 2>/dev/null || true

# 3. Remove Metro/Expo caches
rm -rf /tmp/metro-*
rm -rf /tmp/haste-*
rm -rf node_modules/.cache

# 4. Clear Expo cache directory
rm -rf ~/.expo/web-build-cache 2>/dev/null || true

# 5. Restart Expo with full cache clear
npx expo start --clear
```

## If That Doesn't Work: Rebuild node_modules

```bash
rm -rf node_modules
rm -rf package-lock.json
npm install
npx expo start --clear
```

## Verification

- App should load without the TypeError
- Navigate through onboarding to tabs
- All 3 tabs should render (Planner, Workout, Profile)

---

# Deferred: Apple HealthKit Integration

(Saved for later when switching to dev build - see previous plan content)
