// Hosted legal documents. Linked from the EULA checkbox on every sign-in
// path AND from the Profile → Settings → Legal section. Update both
// surfaces if these URLs ever change.

export const TERMS_URL = 'https://itgirltermsandconditions.carrd.co/';
export const PRIVACY_URL = 'https://itgirlprivacypolicy.carrd.co/';
export const SUPPORT_URL = 'https://itgirlsupport.carrd.co/';

// Bump this when the Terms wording materially changes — the EULA gate in
// app/_layout.tsx (future) compares the user's stored `terms_version`
// against this constant and re-prompts if they don't match.
export const TERMS_VERSION = 'v1';
