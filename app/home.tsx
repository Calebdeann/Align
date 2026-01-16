import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/theme';

export default function HomeScreen() {
  useEffect(() => {
    // Redirect to tabs
    router.replace('/(tabs)');
  }, []);

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
