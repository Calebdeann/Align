import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View, AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '@/constants/theme';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { initializeStoreManager } from '@/lib/storeManager';
// Note: Profile fetching is handled by storeManager on auth state change, not eagerly here
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { cleanupStaleLiveActivities } from '@/services/liveActivity';
import '@/i18n';
import { useLanguageSync } from '@/hooks/useLanguageSync';
import { useExerciseTranslations } from '@/hooks/useExerciseTranslations';

// Context to signal whether SuperwallProvider is active in the tree
// Tabs layout checks this before calling useSuperwall to avoid crashes
export const SuperwallReadyContext = React.createContext(false);

// Lazy import SuperwallProvider to prevent crash if native module isn't ready
let SuperwallProvider: React.ComponentType<any> | null = null;
try {
  SuperwallProvider = require('expo-superwall').SuperwallProvider;
} catch (e) {
  console.warn('[RootLayout] Failed to load SuperwallProvider:', e);
}

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore error on web/keyboard testing where native splash isn't available
});

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const initializeFromLocale = useUserPreferencesStore((state) => state.initializeFromLocale);
  useLanguageSync();
  useExerciseTranslations();

  useEffect(() => {
    async function prepare() {
      try {
        // Run independent init tasks in parallel for faster startup
        await Promise.allSettled([
          Promise.resolve().then(() => initializeStoreManager()),
          Promise.resolve().then(() => initializeFromLocale()),
          Promise.resolve().then(() => cleanupStaleLiveActivities()),
        ]);

        // Load fonts (must complete before render)
        await Font.loadAsync({
          'Quicksand-Regular': require('../assets/fonts/Quicksand-Regular.ttf'),
          'Quicksand-Medium': require('../assets/fonts/Quicksand-Medium.ttf'),
          'Quicksand-SemiBold': require('../assets/fonts/Quicksand-SemiBold.ttf'),
          'Quicksand-Bold': require('../assets/fonts/Quicksand-Bold.ttf'),
          'Canela-Medium': require('../assets/fonts/Canela-Medium-Trial.otf'),
        });
      } catch (e) {
        console.warn('[RootLayout] Font loading error:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, [initializeFromLocale]);

  // Refresh profile when app returns to foreground
  const appStateRef = useRef(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        useUserProfileStore.getState().refreshProfile();
      }
      appStateRef.current = nextAppState;
    });
    return () => subscription.remove();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync().catch(() => {
        // Ignore error on web/keyboard testing
      });
    }
  }, [appIsReady]);

  // Show nothing while loading (splash is visible)
  if (!appIsReady) {
    return null;
  }

  const appContent = (
    <View style={{ flex: 1, backgroundColor: colors.background }} onLayout={onLayoutRootView}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="active-workout" />
        <Stack.Screen name="add-exercise" />
        <Stack.Screen name="save-workout" />
        <Stack.Screen name="explore-templates" />
        <Stack.Screen name="template-detail" />
        <Stack.Screen name="create-template" />
        <Stack.Screen name="save-template" />
        <Stack.Screen name="workout-details" />
      </Stack>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        {SuperwallProvider ? (
          <ErrorBoundary fallback={appContent}>
            <SuperwallProvider apiKeys={{ ios: 'pk_vhA9Ry9TLgVUTyK_ugU0P' }}>
              <SuperwallReadyContext.Provider value={true}>
                {appContent}
              </SuperwallReadyContext.Provider>
            </SuperwallProvider>
          </ErrorBoundary>
        ) : (
          appContent
        )}
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
