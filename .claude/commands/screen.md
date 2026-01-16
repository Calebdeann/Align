# /screen - Create a new app screen

Create a new screen in the Expo Router app/ directory.

## Instructions

1. Ask for the screen name if not provided
2. Ask which route group it belongs to:
   - (auth) - authentication screens
   - (onboarding) - onboarding flow
   - (tabs) - main app tabs
   - (modals) - modal screens
3. Create the screen file with proper layout

## Template

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fonts } from '@/constants/theme';

export default function ${name}Screen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>${name}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.text,
  },
});
```

## Naming Convention

- File: lowercase with dashes (e.g., workout-detail.tsx)
- Component: PascalCase (e.g., WorkoutDetailScreen)
