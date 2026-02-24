/**
 * Centralized auth state manager for per-user data isolation.
 *
 * This manager listens for Supabase auth changes and provides the current
 * userId to storage adapters and other parts of the app that need it.
 *
 * Why this exists:
 * - Zustand persist middleware needs userId at storage read/write time
 * - Auth state may not be available synchronously on app start
 * - Multiple parts of the app need to react to auth changes
 */

import { supabase } from './supabase';
import { logger } from '@/utils/logger';

type AuthStateListener = (userId: string | null) => void;

class AuthStateManager {
  private currentUserId: string | null = null;
  private listeners: Set<AuthStateListener> = new Set();
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.initialize();
  }

  private async initialize() {
    try {
      // Use getSession() instead of getUser() - reads from local storage without
      // a network call, so userId is available immediately on cold start even
      // without network. onAuthStateChange handles token refresh in the background.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      this.currentUserId = session?.user?.id ?? null;
    } catch (error) {
      logger.error('[AuthState] Failed to get initial session', { error });
      // If stored tokens are invalid/corrupt, clear them so the app doesn't get stuck
      try {
        await supabase.auth.signOut();
      } catch {}
    } finally {
      this.initialized = true;
    }

    // Register listener OUTSIDE try/catch - must always run even if initial
    // fetch failed, otherwise auth can never recover and stores never rehydrate
    supabase.auth.onAuthStateChange(async (event, session) => {
      const newUserId = session?.user?.id ?? null;

      // Handle invalid refresh token: Supabase fires TOKEN_REFRESHED with null session
      if (event === 'TOKEN_REFRESHED' && !session) {
        logger.warn('[AuthState] Token refresh failed, signing out to clear stale tokens');
        try {
          await supabase.auth.signOut();
        } catch {}
      }

      // Only notify if userId actually changed
      if (newUserId !== this.currentUserId) {
        logger.info(
          `[AuthState] User changed: ${this.currentUserId?.slice(0, 8) ?? 'null'} -> ${newUserId?.slice(0, 8) ?? 'null'} (${event})`
        );
        this.currentUserId = newUserId;
        this.notifyListeners();
      }
    });
  }

  /**
   * Wait for initial auth state to be determined.
   * Call this before accessing userId if you need guaranteed initialization.
   */
  async waitForInit(): Promise<void> {
    if (this.initialized) return;
    await this.initPromise;
  }

  /**
   * Get current userId synchronously.
   * May return null if auth state hasn't been determined yet.
   */
  getUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * Get current userId, waiting for initialization if needed.
   * Use this in async contexts where you need a guaranteed value.
   */
  async getUserIdAsync(): Promise<string | null> {
    await this.waitForInit();
    return this.currentUserId;
  }

  /**
   * Subscribe to auth state changes.
   * Returns an unsubscribe function.
   */
  subscribe(listener: AuthStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentUserId);
      } catch (error) {
        logger.error('[AuthState] Listener error', { error });
      }
    });
  }
}

// Singleton instance - initialized when module is imported
export const authStateManager = new AuthStateManager();
