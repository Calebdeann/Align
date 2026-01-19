import { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const ages = Array.from({ length: 83 }, (_, i) => i + 13); // 13-95

export default function AgeScreen() {
  const flatListRef = useRef<FlatList>(null);
  const [selectedIndex, setSelectedIndex] = useState(ages.indexOf(18));

  useEffect(() => {
    // Scroll to age 18 on mount
    const initialIndex = ages.indexOf(18);
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: initialIndex,
        animated: false,
      });
    }, 100);
  }, []);

  const getItemLayout = (_: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  });

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.min(Math.max(index, 0), ages.length - 1);
    setSelectedIndex(clampedIndex);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: number; index: number }) => {
      const distance = Math.abs(index - selectedIndex);
      const isSelected = distance === 0;

      // Calculate opacity based on distance from center
      let opacity = 1;
      if (distance === 1) opacity = 0.5;
      else if (distance === 2) opacity = 0.25;
      else if (distance > 2) opacity = 0.1;

      return (
        <View style={styles.ageItem}>
          <Text
            style={[
              styles.ageText,
              {
                color: isSelected ? colors.primary : colors.textSecondary,
                opacity: isSelected ? 1 : opacity,
              },
            ]}
          >
            {item}
          </Text>
        </View>
      );
    },
    [selectedIndex]
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <View style={[styles.progressBarFill, { width: '60%' }]} />
        </View>

        <Pressable
          onPress={() => {
            useOnboardingStore.getState().skipField('age');
            router.push('/onboarding/height');
          }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>How old are you?</Text>
        <Text style={styles.subtitle}>This will be used to calibrate your custom plan.</Text>
      </View>

      {/* Age Picker */}
      <View style={styles.pickerWrapper}>
        <View style={styles.pickerContainer}>
          {/* Selection indicator pill */}
          <View style={styles.selectionIndicator} />

          <FlatList
            ref={flatListRef}
            data={ages}
            renderItem={renderItem}
            keyExtractor={(item) => item.toString()}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            getItemLayout={getItemLayout}
            onScroll={onScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingVertical: ITEM_HEIGHT * 2,
            }}
            initialScrollIndex={ages.indexOf(18)}
            onScrollToIndexFailed={() => {}}
            extraData={selectedIndex}
          />
        </View>
      </View>

      {/* Continue button */}
      <View style={styles.bottomSection}>
        <Pressable
          style={styles.continueButton}
          onPress={() => {
            useOnboardingStore.getState().setAndSave('age', ages[selectedIndex]);
            router.push('/onboarding/height');
          }}
        >
          <Text style={styles.continueText}>Continue</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  backArrow: {
    fontSize: 24,
    color: colors.text,
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    position: 'relative',
  },
  progressBarBackground: {
    position: 'absolute',
    width: '100%',
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  progressBarFill: {
    position: 'absolute',
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  skipText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  questionContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  questionText: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  pickerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    height: PICKER_HEIGHT,
    width: '80%',
    position: 'relative',
    overflow: 'hidden',
  },
  selectionIndicator: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: colors.primaryLight + '30',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.primary,
    zIndex: 1,
    pointerEvents: 'none',
  },
  ageItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ageText: {
    fontFamily: fonts.bold,
    fontSize: 36,
  },
  bottomSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  continueText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: '#FFFFFF',
  },
});
