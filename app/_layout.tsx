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
          'Canela-Medium': require('../assets/fonts/Canela-Medium-Trial.otf'),
          'CormorantGaramond-Regular': require('@expo-google-fonts/cormorant-garamond/400Regular/CormorantGaramond_400Regular.ttf'),
          'CormorantGaramond-Medium': require('@expo-google-fonts/cormorant-garamond/500Medium/CormorantGaramond_500Medium.ttf'),
          'CormorantGaramond-SemiBold': require('@expo-google-fonts/cormorant-garamond/600SemiBold/CormorantGaramond_600SemiBold.ttf'),
          'CormorantGaramond-Bold': require('@expo-google-fonts/cormorant-garamond/700Bold/CormorantGaramond_700Bold.ttf'),
          'Lora-Regular': require('@expo-google-fonts/lora/400Regular/Lora_400Regular.ttf'),
          'Lora-Medium': require('@expo-google-fonts/lora/500Medium/Lora_500Medium.ttf'),
          'Lora-SemiBold': require('@expo-google-fonts/lora/600SemiBold/Lora_600SemiBold.ttf'),
          'Lora-Bold': require('@expo-google-fonts/lora/700Bold/Lora_700Bold.ttf'),
          'Caveat-Regular': require('@expo-google-fonts/caveat/400Regular/Caveat_400Regular.ttf'),
          'Caveat-Medium': require('@expo-google-fonts/caveat/500Medium/Caveat_500Medium.ttf'),
          'Caveat-SemiBold': require('@expo-google-fonts/caveat/600SemiBold/Caveat_600SemiBold.ttf'),
          'Caveat-Bold': require('@expo-google-fonts/caveat/700Bold/Caveat_700Bold.ttf'),
          'GochiHand-Regular': require('@expo-google-fonts/gochi-hand/400Regular/GochiHand_400Regular.ttf'),
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
        <Stack.Screen name="onboarding" />
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
        <Stack.Screen name="import-guide" />
        <Stack.Screen name="shortcut-guide" />
      </Stack>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <SuperwallProvider apiKeys={{ ios: 'pk_vhA9Ry9TLgVUTyK_ugU0P' }}>
          {appContent}
        </SuperwallProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
