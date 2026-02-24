import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Dimensions,
  Linking,
  Modal,
  FlatList,
  ViewToken,
  Animated,
  PixelRatio,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { captureRef } from 'react-native-view-shot';
import RNShare, { Social } from 'react-native-share';
import { colors, fonts, fontSize, spacing, shadows } from '@/constants/theme';
import { getCompletedWorkoutCount } from '@/services/api/workouts';
import { useNavigationLock } from '@/hooks/useNavigationLock';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 24;
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN * 2;
const CARD_HEIGHT = CARD_WIDTH / 1.3;

type CardBackground = 'default' | 'dark' | 'purple' | 'white' | 'transparent';

const THEME_KEYS: CardBackground[] = ['default', 'dark', 'purple', 'white', 'transparent'];

const COMPLIMENTS = [
  'Great Work!',
  'Well Done!',
  'Good Job!',
  'Amazing!',
  'Crushed It!',
  'Keep Going!',
  'You Did It!',
  'Incredible!',
  'Way To Go!',
  'So Proud!',
  'Strong Work!',
  'Nailed It!',
  'Power Move!',
  'On Fire!',
  'Beast Mode!',
];

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return i18n.t('saveWorkout.hourMinutes', { hours, minutes });
  }
  return `${minutes}min`;
}

const CARD_THEMES: Record<
  CardBackground,
  { bg: string; text: string; sub: string; brand: string }
> = {
  default: {
    bg: '#F5F4FA',
    text: colors.text,
    sub: colors.textSecondary,
    brand: colors.textTertiary,
  },
  dark: {
    bg: '#1A1A1A',
    text: '#FFFFFF',
    sub: 'rgba(255,255,255,0.6)',
    brand: 'rgba(255,255,255,0.35)',
  },
  purple: {
    bg: '#947AFF',
    text: '#FFFFFF',
    sub: 'rgba(255,255,255,0.7)',
    brand: 'rgba(255,255,255,0.4)',
  },
  white: {
    bg: '#FFFFFF',
    text: colors.text,
    sub: colors.textSecondary,
    brand: colors.textTertiary,
  },
  transparent: {
    bg: 'transparent',
    text: '#1A1A1A',
    sub: '#666666',
    brand: '#999999',
  },
};

const THEME_LABELS: Record<CardBackground, string> = {
  default: 'Default',
  dark: 'Dark',
  purple: 'Purple',
  white: 'White',
  transparent: 'None',
};

const THEME_LABEL_COLORS: Record<CardBackground, string> = {
  default: colors.text,
  dark: '#FFFFFF',
  purple: '#FFFFFF',
  white: colors.text,
  transparent: colors.text,
};

const CARD_INDICES = [0, 1, 2, 3];

// Font families per card: title font, value font, label font, brand font
const CARD_FONTS: { title: string; value: string; label: string; brand: string }[] = [
  { title: fonts.bold, value: fonts.bold, label: fonts.medium, brand: fonts.semiBold },
  {
    title: 'CormorantGaramond-Bold',
    value: 'CormorantGaramond-Bold',
    label: 'CormorantGaramond-Medium',
    brand: 'CormorantGaramond-SemiBold',
  },
  { title: 'Lora-Bold', value: 'Lora-Bold', label: 'Lora-Medium', brand: 'Lora-SemiBold' },
  {
    title: 'GochiHand-Regular',
    value: 'GochiHand-Regular',
    label: 'GochiHand-Regular',
    brand: 'GochiHand-Regular',
  },
];

function AnimatedDot({ isActive }: { isActive: boolean }) {
  const widthAnim = useRef(new Animated.Value(isActive ? 24 : 8)).current;
  const opacityAnim = useRef(new Animated.Value(isActive ? 1 : 0.4)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(widthAnim, {
        toValue: isActive ? 24 : 8,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: isActive ? 1 : 0.4,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isActive, widthAnim, opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: widthAnim,
          backgroundColor: isActive ? colors.primary : colors.border,
          opacity: opacityAnim,
        },
      ]}
    />
  );
}

export default function WorkoutCompleteScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const { isNavigating, withLock } = useNavigationLock();

  const workoutTitle = (params.workoutTitle as string) || 'Workout';
  const durationSeconds = parseInt(params.durationSeconds as string, 10) || 0;
  const totalVolume = (params.totalVolume as string) || '0';
  const volumeUnit = (params.volumeUnit as string) || 'kg';
  const exerciseCount = (params.exerciseCount as string) || '0';
  const totalSets = (params.totalSets as string) || '0';
  const userId = params.userId as string;

  const completionDate = useMemo(() => {
    const now = new Date();
    const month = now.toLocaleDateString('en-US', { month: 'short' });
    const day = now.getDate();
    const time = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${month} ${day} at ${time}`;
  }, []);

  const [workoutNumber, setWorkoutNumber] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState<CardBackground>('default');
  const [showBgPicker, setShowBgPicker] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const cardRefs = useRef<(View | null)[]>([]);
  const activeIndexRef = useRef(0);
  activeIndexRef.current = activeIndex;

  const shareText = `Just finished my workout - ${workoutTitle}! ${formatDuration(durationSeconds)} | ${Number(totalVolume).toLocaleString()} ${volumeUnit} @align_tracker`;

  const compliment = useMemo(() => COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)], []);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (userId) {
      getCompletedWorkoutCount(userId).then((count) => {
        if (count > 0) setWorkoutNumber(count);
      });
    }
  }, []);

  // Stable viewability config for FlatList
  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig: { viewAreaCoveragePercentThreshold: 50 },
      onViewableItemsChanged: ({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0 && viewableItems[0].index != null) {
          setActiveIndex(viewableItems[0].index);
        }
      },
    },
  ]);

  // Capture the currently visible card as an image
  const captureCard = async (
    resultType: 'base64' | 'tmpfile' = 'base64'
  ): Promise<string | null> => {
    const ref = cardRefs.current[activeIndexRef.current];
    if (!ref) return null;
    try {
      // Target 3x resolution for crisp sharing on all devices
      const scale = PixelRatio.get();
      const targetScale = Math.max(scale, 3);
      return await captureRef(ref, {
        format: 'png',
        quality: 1,
        result: resultType,
        width: Math.round((CARD_WIDTH * targetScale) / scale),
        height: Math.round((CARD_HEIGHT * targetScale) / scale),
      });
    } catch (e) {
      console.warn('[WorkoutComplete] Card capture failed:', e);
      return null;
    }
  };

  const shareToInstagramStories = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const base64 = await captureCard('base64');
    if (!base64) return;

    const imageData = `data:image/png;base64,${base64}`;

    try {
      if (selectedTheme === 'transparent') {
        // Send as sticker so user can overlay on their own photo
        await RNShare.shareSingle({
          social: Social.InstagramStories,
          appId: 'com.aligntracker.app',
          stickerImage: imageData,
          backgroundTopColor: '#000000',
          backgroundBottomColor: '#000000',
        });
      } else {
        await RNShare.shareSingle({
          social: Social.InstagramStories,
          appId: 'com.aligntracker.app',
          backgroundImage: imageData,
        });
      }
    } catch {
      // Instagram not installed or share cancelled
    }
  }, [selectedTheme]);

  const shareToX = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const uri = await captureCard('tmpfile');
    if (!uri) return;

    try {
      await RNShare.shareSingle({
        social: Social.Twitter,
        url: `file://${uri}`,
        type: 'image/png',
      });
    } catch {
      // X not installed or share cancelled
    }
  }, []);

  const shareGeneral = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const uri = await captureCard('tmpfile');
    if (!uri) return;

    try {
      await RNShare.open({ url: `file://${uri}`, type: 'image/png' });
    } catch {
      // Share cancelled
    }
  }, []);

  const handleDone = () => {
    withLock(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      router.dismissAll();
      router.replace('/(tabs)');
    });
  };

  const renderDefaultCard = (
    theme: (typeof CARD_THEMES)[CardBackground],
    cardFont: (typeof CARD_FONTS)[0],
    textShadow: object
  ) => (
    <>
      <Text
        style={[styles.cardTitle, { color: theme.text, fontFamily: cardFont.title }, textShadow]}
      >
        {workoutTitle}
      </Text>

      <View style={styles.statsGrid}>
        <View style={styles.statCell}>
          <Text
            style={[
              styles.statValue,
              { color: theme.text, fontFamily: cardFont.value },
              textShadow,
            ]}
          >
            {formatDuration(durationSeconds)}
          </Text>
          <Text
            style={[styles.statLabel, { color: theme.sub, fontFamily: cardFont.label }, textShadow]}
          >
            {t('workoutComplete.duration')}
          </Text>
        </View>
        <View style={styles.statCell}>
          <Text
            style={[
              styles.statValue,
              { color: theme.text, fontFamily: cardFont.value },
              textShadow,
            ]}
          >
            {Number(totalVolume).toLocaleString()} {volumeUnit}
          </Text>
          <Text
            style={[styles.statLabel, { color: theme.sub, fontFamily: cardFont.label }, textShadow]}
          >
            {t('workoutComplete.volume')}
          </Text>
        </View>
        <View style={styles.statCell}>
          <Text
            style={[
              styles.statValue,
              { color: theme.text, fontFamily: cardFont.value },
              textShadow,
            ]}
          >
            {exerciseCount}
          </Text>
          <Text
            style={[styles.statLabel, { color: theme.sub, fontFamily: cardFont.label }, textShadow]}
          >
            {parseInt(exerciseCount, 10) === 1 ? 'Exercise' : t('workoutComplete.exercises')}
          </Text>
        </View>
        <View style={styles.statCell}>
          <Text
            style={[
              styles.statValue,
              { color: theme.text, fontFamily: cardFont.value },
              textShadow,
            ]}
          >
            {totalSets}
          </Text>
          <Text
            style={[styles.statLabel, { color: theme.sub, fontFamily: cardFont.label }, textShadow]}
          >
            {t('workoutComplete.sets')}
          </Text>
        </View>
      </View>
      {/* Spacer to maintain space-between layout */}
      <View />
    </>
  );

  const renderCormorantCard = (theme: (typeof CARD_THEMES)[CardBackground], textShadow: object) => {
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const durationText = hours > 0 ? `${hours}h ${minutes} mins` : `${minutes} mins`;

    return (
      <View style={styles.cormorantContent}>
        <Text style={[styles.cormorantDate, { color: theme.text }, textShadow]}>
          {completionDate}
        </Text>
        <Text style={[styles.cormorantTitle, { color: theme.text }, textShadow]}>
          {workoutTitle}
        </Text>
        <View style={styles.cormorantStatsRow}>
          <View style={styles.cormorantStatCol}>
            <Text style={[styles.cormorantStatLabel, { color: theme.text }, textShadow]}>Time</Text>
            <Text style={[styles.cormorantStatValue, { color: theme.text }, textShadow]}>
              {durationText}
            </Text>
          </View>
          <View style={styles.cormorantStatCol}>
            <Text style={[styles.cormorantStatLabel, { color: theme.text }, textShadow]}>
              Volume
            </Text>
            <Text style={[styles.cormorantStatValue, { color: theme.text }, textShadow]}>
              {Number(totalVolume).toLocaleString()} {volumeUnit}
            </Text>
          </View>
          <View style={styles.cormorantStatCol}>
            <Text style={[styles.cormorantStatLabel, { color: theme.text }, textShadow]}>Sets</Text>
            <Text style={[styles.cormorantStatValue, { color: theme.text }, textShadow]}>
              {totalSets} {parseInt(totalSets, 10) === 1 ? 'set' : 'sets'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderLoraCard = (theme: (typeof CARD_THEMES)[CardBackground], textShadow: object) => {
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const durationText = hours > 0 ? `${hours}h ${minutes} mins` : `${minutes} mins`;

    return (
      <View style={styles.loraContent}>
        <View style={styles.loraStatBlock}>
          <Text style={[styles.loraLabel, { color: theme.text }, textShadow]}>Date</Text>
          <Text style={[styles.loraValue, { color: theme.text }, textShadow]}>
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
        </View>
        <View style={styles.loraStatBlock}>
          <Text style={[styles.loraLabel, { color: theme.text }, textShadow]}>Time</Text>
          <Text style={[styles.loraValue, { color: theme.text }, textShadow]}>{durationText}</Text>
        </View>
        <View style={styles.loraStatBlock}>
          <Text style={[styles.loraLabel, { color: theme.text }, textShadow]}>Volume</Text>
          <Text style={[styles.loraValue, { color: theme.text }, textShadow]}>
            {Number(totalVolume).toLocaleString()} {volumeUnit}
          </Text>
        </View>
      </View>
    );
  };

  const renderCaveatCard = (theme: (typeof CARD_THEMES)[CardBackground], textShadow: object) => {
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const durationText = hours > 0 ? `${hours}h ${minutes} mins` : `${minutes} mins`;

    return (
      <View style={styles.caveatLayout}>
        <View style={styles.caveatRow}>
          <View style={styles.caveatCell}>
            <Text style={[styles.caveatLabel, { color: theme.sub }, textShadow]} numberOfLines={1}>
              Time
            </Text>
            <Text
              style={[styles.caveatValue, { color: theme.text }, textShadow]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {durationText}
            </Text>
          </View>
          <View style={styles.caveatCell}>
            <Text style={[styles.caveatLabel, { color: theme.sub }, textShadow]} numberOfLines={1}>
              Volume
            </Text>
            <Text
              style={[styles.caveatValue, { color: theme.text }, textShadow]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {Number(totalVolume).toLocaleString()} {volumeUnit}
            </Text>
          </View>
        </View>
        <View style={styles.caveatRow}>
          <View style={styles.caveatCell}>
            <Text style={[styles.caveatLabel, { color: theme.sub }, textShadow]} numberOfLines={1}>
              Exercises
            </Text>
            <Text
              style={[styles.caveatValue, { color: theme.text }, textShadow]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {exerciseCount}
            </Text>
          </View>
          <View style={styles.caveatCell}>
            <Text style={[styles.caveatLabel, { color: theme.sub }, textShadow]} numberOfLines={1}>
              Sets
            </Text>
            <Text
              style={[styles.caveatValue, { color: theme.text }, textShadow]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {totalSets}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCard = useCallback(
    ({ item, index }: { item: number; index: number }) => {
      const theme = CARD_THEMES[selectedTheme];
      const cardFont = CARD_FONTS[index];
      const isCentered = index !== 0;
      const isTransparent = selectedTheme === 'transparent';

      const textShadow = isTransparent
        ? {
            textShadowColor: 'rgba(0,0,0,0.3)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 3,
          }
        : {};

      const renderContent = () => {
        if (index === 1) return renderCormorantCard(theme, textShadow);
        if (index === 2) return renderLoraCard(theme, textShadow);
        if (index === 3) return renderCaveatCard(theme, textShadow);
        return renderDefaultCard(theme, cardFont, textShadow);
      };

      return (
        <View style={styles.cardPage}>
          <View
            style={[styles.shareCardShadow, isTransparent && { shadowOpacity: 0, elevation: 0 }]}
          >
            <View
              ref={(ref) => {
                cardRefs.current[index] = ref;
              }}
              collapsable={false}
              style={[
                styles.shareCardInner,
                { backgroundColor: theme.bg },
                isCentered && styles.shareCardCentered,
              ]}
            >
              {renderContent()}
              <Text style={[styles.brandText, { color: theme.brand }, textShadow]}>
                @align.tracker
              </Text>
            </View>
          </View>
        </View>
      );
    },
    [
      workoutTitle,
      durationSeconds,
      totalVolume,
      volumeUnit,
      exerciseCount,
      totalSets,
      selectedTheme,
      completionDate,
      t,
    ]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top content */}
      <View style={styles.topSection}>
        <Text style={styles.complimentTitle}>{compliment}</Text>
        {workoutNumber !== null && (
          <Text style={styles.subtitle}>
            This is your {getOrdinalSuffix(workoutNumber)} workout
          </Text>
        )}
      </View>

      {/* Card Carousel */}
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={CARD_INDICES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          renderItem={renderCard}
          keyExtractor={(item) => String(item)}
          viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          style={{ height: CARD_HEIGHT }}
        />

        {/* Pagination Dots */}
        <View style={styles.paginationContainer}>
          {CARD_INDICES.map((_, i) => (
            <AnimatedDot key={i} isActive={i === activeIndex} />
          ))}
        </View>
      </View>

      {/* Share CTA + Buttons */}
      <View style={styles.shareSection}>
        <Text style={styles.shareCta}>Share workout - Tag @align.tracker</Text>

        <View style={styles.shareRow}>
          <Pressable
            style={styles.shareButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowBgPicker(true);
            }}
          >
            <View style={styles.shareIconCircle}>
              <Ionicons name="color-palette-outline" size={24} color={colors.text} />
            </View>
            <Text style={styles.shareLabel}>Background</Text>
          </Pressable>

          <Pressable style={styles.shareButton} onPress={shareToInstagramStories}>
            <Image source={require('../assets/Insta_Icon.png')} style={styles.shareIconImage} />
            <Text style={styles.shareLabel}>Stories</Text>
          </Pressable>

          <Pressable style={styles.shareButton} onPress={shareGeneral}>
            <View style={styles.shareIconCircle}>
              <Ionicons name="share-outline" size={24} color={colors.text} />
            </View>
            <Text style={styles.shareLabel}>Share</Text>
          </Pressable>

          <Pressable style={styles.shareButton} onPress={shareToX}>
            <Image source={require('../assets/X_Icon.png')} style={styles.shareIconImage} />
            <Text style={styles.shareLabel}>X</Text>
          </Pressable>
        </View>
      </View>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Done Button */}
      <View style={styles.bottomSection}>
        <Pressable style={styles.doneButton} onPress={handleDone} disabled={isNavigating}>
          <Text style={styles.doneButtonText}>{t('workoutComplete.done')}</Text>
        </Pressable>
      </View>

      {/* Background Picker Modal */}
      <Modal
        visible={showBgPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBgPicker(false)}
      >
        <Pressable
          style={styles.bgPickerOverlay}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowBgPicker(false);
          }}
        >
          <Pressable style={styles.bgPickerSheet} onPress={() => {}}>
            <Text style={styles.bgPickerTitle}>Card Background</Text>

            <View style={styles.bgPickerOptions}>
              {THEME_KEYS.map((key) => (
                <Pressable
                  key={key}
                  style={styles.bgPickerOptionWrapper}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedTheme(key);
                    setShowBgPicker(false);
                  }}
                >
                  <View
                    style={[
                      styles.bgPickerOption,
                      key !== 'transparent' && { backgroundColor: CARD_THEMES[key].bg },
                      selectedTheme === key && styles.bgPickerOptionSelected,
                    ]}
                  >
                    {key === 'transparent' ? (
                      <View style={styles.checkerContainer}>
                        <View style={styles.checkerRow}>
                          <View style={[styles.checkerCell, { backgroundColor: '#E0E0E0' }]} />
                          <View style={[styles.checkerCell, { backgroundColor: '#FFFFFF' }]} />
                        </View>
                        <View style={styles.checkerRow}>
                          <View style={[styles.checkerCell, { backgroundColor: '#FFFFFF' }]} />
                          <View style={[styles.checkerCell, { backgroundColor: '#E0E0E0' }]} />
                        </View>
                      </View>
                    ) : (
                      <Text
                        style={[styles.bgPickerOptionLabel, { color: THEME_LABEL_COLORS[key] }]}
                      >
                        Aa
                      </Text>
                    )}
                  </View>
                  <Text style={styles.bgPickerLabelText}>{THEME_LABELS[key]}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  complimentTitle: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  carouselContainer: {
    marginBottom: spacing.md,
  },
  cardPage: {
    width: SCREEN_WIDTH,
    paddingHorizontal: CARD_MARGIN,
  },
  shareCardShadow: {
    width: CARD_WIDTH,
    aspectRatio: 1.3,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  shareCardInner: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    justifyContent: 'space-between',
  },
  shareCardCentered: {
    justifyContent: 'center',
  },

  // Card 2: Cormorant Garamond
  cormorantContent: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  cormorantDate: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    textAlign: 'center',
  },
  cormorantTitle: {
    fontFamily: 'CormorantGaramond-Bold',
    fontSize: 38,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  cormorantStatsRow: {
    flexDirection: 'row',
    width: '100%',
  },
  cormorantStatCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  cormorantStatLabel: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  cormorantStatValue: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Card 3: Lora
  loraContent: {
    alignItems: 'center',
    gap: spacing.md,
  },
  loraStatBlock: {
    alignItems: 'center',
    gap: 2,
  },
  loraLabel: {
    fontFamily: 'Lora-Regular',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loraValue: {
    fontFamily: 'Lora-Bold',
    fontSize: 28,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Card 5: Caveat (handwritten 2x2 grid)
  caveatLayout: {
    justifyContent: 'center',
    gap: spacing.xl,
  },
  caveatRow: {
    flexDirection: 'row',
  },
  caveatCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  caveatLabel: {
    fontFamily: 'GochiHand-Regular',
    fontSize: 18,
    lineHeight: 26,
    fontStyle: 'italic',
  },
  caveatValue: {
    fontFamily: 'GochiHand-Regular',
    fontSize: 28,
    lineHeight: 38,
  },

  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statCell: {
    width: '50%',
    paddingVertical: spacing.sm,
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xxl,
  },
  statLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  brandText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.md,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  shareSection: {
    alignItems: 'center',
  },
  shareCta: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  shareRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  shareButton: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  shareIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIconImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  shareLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  bottomSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  doneButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  doneButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.textInverse,
  },

  // Background picker modal
  bgPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  bgPickerSheet: {
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  bgPickerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  bgPickerOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  bgPickerOptionWrapper: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  bgPickerOption: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  bgPickerOptionSelected: {
    borderWidth: 3,
    borderColor: colors.primary,
    borderStyle: 'solid',
  },
  bgPickerOptionLabel: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
  },
  bgPickerLabelText: {
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  checkerContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 11,
    overflow: 'hidden',
  },
  checkerRow: {
    flex: 1,
    flexDirection: 'row',
  },
  checkerCell: {
    flex: 1,
  },
});
