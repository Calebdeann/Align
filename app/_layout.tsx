import { useEffect, useState, useCallback } from 'react';
import { Slot } from 'expo-router';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { colors } from '@/constants/theme';

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore error on web/keyboard testing where native splash isn't available
});

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} onLayout={onLayoutRootView}>
      <StatusBar style="dark" />
      <Slot />
    </View>
  );
}
