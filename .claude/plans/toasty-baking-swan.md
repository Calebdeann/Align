# Fix TikTok Import - Edge Function Unreachable

## Context

The TikTok import always fails with "Could not reach the server." The root cause: `supabase.functions.invoke()` sends the Supabase anon key as the `apikey` HTTP header. The app's anon key is a **publishable key** (`sb_publishable_...`) which is NOT a JWT. The Supabase edge function gateway validates `apikey` as a JWT and rejects non-JWT values with 401 "Invalid JWT" before the edge function code even runs.

I already changed `.env` to use the JWT anon key, but the change hasn't taken effect because env vars are baked into the JS bundle at build time and Metro needs `--clear` to pick it up.

## Fix (2 changes)

### 1. Replace `supabase.functions.invoke()` with direct `fetch()` in `tiktokImport.ts`

This gives us full control over headers and error handling, and avoids any Supabase client caching issues.

**File:** `src/services/api/tiktokImport.ts`

```typescript
export async function processTikTokVideo(tiktokUrl: string): Promise<TikTokImportResult> {
  try {
    // Get user's session JWT for authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return { success: false, error: 'Please sign in to import workouts.', confidence: 0 };
    }

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/process-tiktok`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        apikey: anonKey || '',
      },
      body: JSON.stringify({ tiktokUrl }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data?.error || 'Server error', confidence: 0 };
    }
    return data as TikTokImportResult;
  } catch (error) {
    return { success: false, error: 'Something went wrong. Please try again.', confidence: 0 };
  }
}
```

### 2. Remove debug alerts from `app/import-tiktok.tsx`

Remove the two `if (__DEV__) { Alert.alert('DEBUG: ...') }` blocks in the `processUrl` function (lines 151-153 and 158-160).

## `.env` change (already done)

The anon key was already switched from `sb_publishable_LXI8w9s0XF_...` to the JWT format `eyJhbG...`. This is required because the edge function gateway ONLY accepts JWT-format keys in the `apikey` header.

## Verification

1. Stop Metro
2. Run `npx expo start --clear` to clear the Metro cache and pick up the new `.env`
3. Reload app on device
4. Share a TikTok workout video to Align
5. Expect: loading spinner, then either exercises shown or a meaningful error message (not "Could not reach the server")

## Files to modify

| File                               | Change                                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| `src/services/api/tiktokImport.ts` | Replace `supabase.functions.invoke()` with direct `fetch()` using session JWT |
| `app/import-tiktok.tsx`            | Remove debug alerts                                                           |
