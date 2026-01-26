import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Hook to prevent duplicate navigation when users spam buttons.
 * Returns isNavigating state and a guard function to wrap navigation calls.
 */
export function useNavigationGuard() {
  const [isNavigating, setIsNavigating] = useState(false);

  // Reset navigation state when screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      setIsNavigating(false);
    }, [])
  );

  const navigate = useCallback(
    (navigationFn: () => void) => {
      if (isNavigating) return;
      setIsNavigating(true);
      navigationFn();
    },
    [isNavigating]
  );

  return { isNavigating, navigate };
}
