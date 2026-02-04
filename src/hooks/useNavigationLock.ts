import { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Prevents double-tap navigation by locking after the first tap.
 * Resets automatically when the screen regains focus (user navigated back).
 *
 * Usage:
 *   const { isNavigating, withLock } = useNavigationLock();
 *   withLock(() => router.push('/some-screen'));
 *   <Pressable disabled={isNavigating} ... />
 */
export function useNavigationLock() {
  const isNavigatingRef = useRef(false);
  const [isNavigating, setIsNavigating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      isNavigatingRef.current = false;
      setIsNavigating(false);
    }, [])
  );

  const withLock = useCallback((callback: () => void) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    setIsNavigating(true);
    callback();
  }, []);

  return { isNavigating, withLock };
}
