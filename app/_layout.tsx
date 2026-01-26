import React, { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '@/constants/theme';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { initializeStoreManager } from '@/lib/storeManager';

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
  const fetchProfile = useUserProfileStore((state) => state.fetchProfile);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize store manager to handle auth state changes
        // This enables per-user data isolation in Zustand stores
        initializeStoreManager();

        // Initialize unit preferences based on device locale
        initializeFromLocale();

        // Pre-fetch user profile so it's ready when navigating to Profile tab
        fetchProfile();

        // Load fonts using Font.loadAsync instead of useFonts hook
        await Font.loadAsync({
          'Quicksand-Regular': require('../assets/fonts/Quicksand-Regular.ttf'),
          'Quicksand-Medium': require('../assets/fonts/Quicksand-Medium.ttf'),
          'Quicksand-SemiBold': require('../assets/fonts/Quicksand-SemiBold.ttf'),
          'Quicksand-Bold': require('../assets/fonts/Quicksand-Bold.ttf'),
          'Canela-Medium': require('../assets/fonts/Canela-Medium-Trial.otf'),
        });
      } catch (e) {
        console.warn('Font loading error:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, [initializeFromLocale, fetchProfile]);

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
      {SuperwallProvider ? (
        <SuperwallProvider apiKeys={{ ios: 'pk_vhA9Ry9TLgVUTyK_ugU0P' }}>
          {appContent}
        </SuperwallProvider>
      ) : (
        appContent
      )}
    </GestureHandlerRootView>
  );
}
