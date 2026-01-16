# Code Snippets

Quick patterns to copy/paste.

---

## Screen Layout Pattern

```typescript
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/constants/theme';

export default function ScreenName() {
  return (
    <SafeAreaView style={styles.container}>
      {/* content */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
});
```

---

## Zustand Store Pattern

```typescript
import { create } from 'zustand';

interface StoreState {
  // Define your state
  value: string;
  // Define your actions
  setValue: (value: string) => void;
}

export const useStore = create<StoreState>((set) => ({
  value: '',
  setValue: (value) => set({ value }),
}));
```

---

## Supabase Query Pattern

```typescript
import { supabase } from '@/services/supabase';

const fetchData = async () => {
  const { data, error } = await supabase.from('table_name').select('*').eq('column', value);

  if (error) throw error;
  return data;
};
```

---

## Component with Props Pattern

```typescript
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@/constants/theme';

interface Props {
  title: string;
  style?: ViewStyle;
}

export function ComponentName({ title, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  title: {
    color: colors.text,
  },
});
```

---

## Button Component Pattern

```typescript
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '@/constants/theme';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ title, onPress, variant = 'primary' }: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, variant === 'secondary' && styles.secondary]}
      onPress={onPress}
    >
      <Text style={[styles.text, variant === 'secondary' && styles.secondaryText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  text: {
    color: '#FFFFFF',
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
  secondaryText: {
    color: colors.primary,
  },
});
```

---

## useEffect with Cleanup

```typescript
import { useEffect } from 'react';

useEffect(() => {
  // Setup code
  const subscription = someService.subscribe();

  // Cleanup function
  return () => {
    subscription.unsubscribe();
  };
}, [dependencies]);
```

---

## Async Function in Component

```typescript
import { useState, useEffect } from 'react';

const [loading, setLoading] = useState(true);
const [data, setData] = useState(null);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await someAsyncFunction();
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);
```
