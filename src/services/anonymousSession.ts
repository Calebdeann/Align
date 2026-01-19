import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const ANON_SESSION_KEY = 'align_anonymous_session_id';

export async function getAnonymousSessionId(): Promise<string> {
  let sessionId = await SecureStore.getItemAsync(ANON_SESSION_KEY);
  if (!sessionId) {
    sessionId = Crypto.randomUUID();
    await SecureStore.setItemAsync(ANON_SESSION_KEY, sessionId);
  }
  return sessionId;
}

export async function clearAnonymousSession(): Promise<void> {
  await SecureStore.deleteItemAsync(ANON_SESSION_KEY);
}
