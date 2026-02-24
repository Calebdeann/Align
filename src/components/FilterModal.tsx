import { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function CloseIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={colors.text}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={colors.primary}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface FilterOption {
  id: string;
  label: string;
}

// Single-select filter modal
interface FilterModalProps {
  visible: boolean;
  title: string;
  options: FilterOption[];
  selectedId: string;
  icons?: Record<string, any>;
  iconSizes?: Record<string, number>;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function FilterModal({
  visible,
  title,
  options,
  selectedId,
  icons,
  iconSizes,
  onSelect,
  onClose,
}: FilterModalProps) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable
        style={styles.modalOverlay}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onClose();
        }}
      >
        <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onClose();
                }}
              >
                <CloseIcon />
              </Pressable>
              <Text style={styles.modalTitle}>{title}</Text>
              <View style={styles.modalCloseButton} />
            </View>

            <ScrollView style={styles.filterOptionsScroll} showsVerticalScrollIndicator={true}>
              {options.map((option) => (
                <Pressable
                  key={option.id}
                  style={styles.filterOptionItem}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onSelect(option.id);
                    onClose();
                  }}
                >
                  <View style={styles.filterOptionLeft}>
                    <View style={styles.filterOptionCircle}>
                      {icons?.[option.id] && (
                        <Image
                          source={icons[option.id]}
                          style={[
                            styles.filterOptionIcon,
                            iconSizes?.[option.id] && {
                              width: iconSizes[option.id],
                              height: iconSizes[option.id],
                            },
                          ]}
                          contentFit="contain"
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedId === option.id && styles.filterOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </View>
                  {selectedId === option.id && <CheckIcon />}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// Multi-select filter modal (for "Other Muscles")
interface MultiSelectFilterModalProps {
  visible: boolean;
  title: string;
  options: FilterOption[];
  selectedIds: string[];
  icons?: Record<string, any>;
  iconSizes?: Record<string, number>;
  onToggle: (id: string) => void;
  onDone: () => void;
  onClose: () => void;
  doneLabel?: string;
}

export function MultiSelectFilterModal({
  visible,
  title,
  options,
  selectedIds,
  icons,
  iconSizes,
  onToggle,
  onDone,
  onClose,
  doneLabel = 'Done',
}: MultiSelectFilterModalProps) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable
        style={styles.modalOverlay}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onClose();
        }}
      >
        <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onClose();
                }}
              >
                <CloseIcon />
              </Pressable>
              <Text style={styles.modalTitle}>{title}</Text>
              <View style={styles.modalCloseButton} />
            </View>

            <ScrollView style={styles.filterOptionsScroll} showsVerticalScrollIndicator={true}>
              {options.map((option) => {
                const isSelected = selectedIds.includes(option.id);
                return (
                  <Pressable
                    key={option.id}
                    style={styles.filterOptionItem}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onToggle(option.id);
                    }}
                  >
                    <View style={styles.filterOptionLeft}>
                      <View style={styles.filterOptionCircle}>
                        {icons?.[option.id] && (
                          <Image
                            source={icons[option.id]}
                            style={[
                              styles.filterOptionIcon,
                              iconSizes?.[option.id] && {
                                width: iconSizes[option.id],
                                height: iconSizes[option.id],
                              },
                            ]}
                            contentFit="contain"
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.filterOptionText,
                          isSelected && styles.filterOptionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </View>
                    {isSelected && <CheckIcon />}
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.doneButtonContainer}>
              <Pressable
                style={styles.doneButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onDone();
                }}
              >
                <Text style={styles.doneButtonText}>{doneLabel}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.95,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  filterOptionsScroll: {
    maxHeight: SCREEN_HEIGHT * 0.55,
  },
  filterOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
  },
  filterOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  filterOptionCircle: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  filterOptionIcon: {
    width: 49,
    height: 49,
  },
  filterOptionText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  filterOptionTextSelected: {
    color: colors.primary,
    fontFamily: fonts.semiBold,
  },
  doneButtonContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  doneButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.textInverse,
  },
});
