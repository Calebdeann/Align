import React, { useEffect, useRef, useState } from 'react';
import { Stack, router, usePathname } from 'expo-router';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View, AppState, Platform, NativeModules } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '@/constants/theme';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { initializeStoreManager } from '@/lib/storeManager';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SuperwallProvider } from 'expo-superwall';
import { setupNotificationHandler, scheduleDailyReminder } from '@/services/notifications';
import { cleanupStaleLiveActivities } from '@/services/liveActivity';
import '@/i18n';
import { useLanguageSync } from '@/hooks/useLanguageSync';
import { useExerciseTranslations } from '@/hooks/useExerciseTranslations';

const { WorkoutWidgetBridge } = NativeModules;

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
    try {
      setupNotificationHandler();
    } catch (e) {
      // Notification handler setup is non-critical
    }

    async function prepare() {
      try {
        // Run independent init tasks in parallel for faster startup
        const [storeResult, localeResult] = await Promise.allSettled([
          Promise.resolve().then(() => initializeStoreManager()),
          Promise.resolve().then(() => initializeFromLocale()),
        ]);
        // Errors from store/locale init are non-blocking; app will still render

        // Clean up any orphaned Live Activity from a previous session
        cleanupStaleLiveActivities().catch(() => {});

        // Load fonts (must complete before render) - retry once on failure
        const fontAssets = {
          'Quicksand-Regular': require('../assets/fonts/Quicksand-Regular.ttf'),
          'Quicksand-Medium': require('../assets/fonts/Quicksand-Medium.ttf'),
          'Quicksand-SemiBold': require('../assets/fonts/Quicksand-SemiBold.ttf'),
          'Quicksand-Bold': require('../assets/fonts/Quicksand-Bold.ttf'),
          'BebasNeue-Regular': require('../assets/fonts/BebasNeue-Regular.ttf'),
          'InstrumentSerif-Regular': require('@expo-google-fonts/instrument-serif/400Regular/InstrumentSerif_400Regular.ttf'),
          'InstrumentSerif-Italic': require('@expo-google-fonts/instrument-serif/400Regular_Italic/InstrumentSerif_400Regular_Italic.ttf'),
          'Fraunces-Regular': require('@expo-google-fonts/fraunces/400Regular/Fraunces_400Regular.ttf'),
          'Fraunces-Italic': require('@expo-google-fonts/fraunces/400Regular_Italic/Fraunces_400Regular_Italic.ttf'),
          'Fraunces-SemiBold': require('@expo-google-fonts/fraunces/600SemiBold/Fraunces_600SemiBold.ttf'),
          'Fraunces-Bold': require('@expo-google-fonts/fraunces/700Bold/Fraunces_700Bold.ttf'),
        };
        try {
          await Font.loadAsync(fontAssets);
        } catch (fontError) {
          // Retry once on font loading failure
          await Font.loadAsync(fontAssets);
        }
      } catch (e) {
        // Font loading failed entirely, app will use system fonts as fallback
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, [initializeFromLocale]);

  // Track current path to avoid navigating to import-video if already there
  const pathname = usePathname();

  // Check for pending video import on cold start (fallback if Share Extension couldn't open the app)
  useEffect(() => {
    if (!appIsReady) return;
    const timeout = setTimeout(() => {
      if (!pathname?.includes('import-video')) {
        checkPendingVideoImport();
      }
    }, 1500);
    return () => clearTimeout(timeout);
  }, [appIsReady]);

  // Refresh profile when app returns to foreground + check for pending video import
  const appStateRef = useRef(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        await useUserProfileStore.getState().refreshProfile();
        const profile = useUserProfileStore.getState().profile;
        if (profile?.notifications_enabled && profile?.reminder_time) {
          scheduleDailyReminder(profile.reminder_time);
        }
        if (!pathname?.includes('import-video')) {
          checkPendingVideoImport();
        }
      }
      appStateRef.current = nextAppState;
    });
    return () => subscription.remove();
  }, [pathname]);

  // Check for pending video import written by Share Extension via App Groups
  async function checkPendingVideoImport() {
    if (Platform.OS !== 'ios' || !WorkoutWidgetBridge?.readPendingVideoImport) return;
    try {
      // Only allow import for signed-in users
      const profile = useUserProfileStore.getState().profile;
      if (!profile) return;

      const jsonString = await WorkoutWidgetBridge.readPendingVideoImport();
      if (jsonString) {
        const data = JSON.parse(jsonString);
        router.push({
          pathname: '/import-video',
          params: { videoUrl: data.url, platform: data.platform || 'tiktok' },
        });
      }
    } catch {
      // Silently fail - Share Extension may not be available
    }
  }

  // Show nothing while loading (splash is visible)
  if (!appIsReady) {
    return null;
  }

  const appContent = (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile" />
        <Stack.Screen
          name="active-workout"
          options={{
            animation: 'slide_from_bottom',
            animationDuration: 260,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen name="add-exercise" />
        <Stack.Screen name="save-workout" options={{ gestureEnabled: false }} />
        <Stack.Screen name="workout-complete" options={{ gestureEnabled: false }} />
        <Stack.Screen
          name="workout-photo"
          options={{
            headerShown: false,
            gestureEnabled: false,
            animation: 'slide_from_bottom',
            animationDuration: 260,
          }}
        />
        <Stack.Screen name="workout-photo-preview" options={{ headerShown: false }} />
        <Stack.Screen
          name="explore-templates"
          options={{ animation: 'slide_from_bottom', animationDuration: 260 }}
        />
        <Stack.Screen name="template-detail" />
        <Stack.Screen
          name="create-template"
          options={{
            animation: 'slide_from_bottom',
            animationDuration: 260,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen name="schedule-workout" />
        <Stack.Screen name="save-template" />
        <Stack.Screen name="workout-details" />
        <Stack.Screen
          name="import-video"
          options={{
            animation: 'slide_from_bottom',
            animationDuration: 260,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen name="exercise" />
        <Stack.Screen name="create-exercise" />
        <Stack.Screen name="workout-preview" />
        <Stack.Screen name="import-guide" />
        <Stack.Screen name="shortcut-guide" />
        <Stack.Screen name="settings" />
        <Stack.Screen
          name="start-workout-sheet"
          options={{
            animation: 'slide_from_bottom',
            animationDuration: 300,
            presentation: 'modal',
          }}
        />
      </Stack>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <SuperwallProvider apiKeys={{ ios: 'SUPERWALL_API_KEY_TODO' }}>
          {appContent}
        </SuperwallProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
