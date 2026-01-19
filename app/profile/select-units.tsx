import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';
import { useUserProfileStore } from '@/stores/userProfileStore';
import {
  useUserPreferencesStore,
  WeightUnit,
  DistanceUnit,
  MeasurementUnit,
} from '@/stores/userPreferencesStore';

interface ToggleButtonGroupProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}

function ToggleButtonGroup({ label, options, selected, onSelect }: ToggleButtonGroupProps) {
  return (
    <View style={styles.toggleSection}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={styles.toggleContainer}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            style={[styles.toggleButton, selected === option.value && styles.toggleButtonActive]}
            onPress={() => onSelect(option.value)}
          >
            <Text
              style={[
                styles.toggleButtonText,
                selected === option.value && styles.toggleButtonTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function SelectUnitsScreen() {
  // Use profile store for userId and persisting to DB
  const { userId, updateProfile } = useUserProfileStore();

  // Use preferences store for local state (faster UI updates)
  const {
    weightUnit,
    distanceUnit,
    measurementUnit,
    setWeightUnit: setStoreWeightUnit,
    setDistanceUnit: setStoreDistanceUnit,
    setMeasurementUnit: setStoreMeasurementUnit,
  } = useUserPreferencesStore();

  async function handleWeightChange(value: string) {
    const unit = value as WeightUnit;
    // Update local preferences store (instant UI update)
    setStoreWeightUnit(unit);
    // Persist to database
    if (userId) {
      await updateProfile({ weight_unit: unit });
    }
  }

  async function handleDistanceChange(value: string) {
    const unit = value as DistanceUnit;
    // Update local preferences store (instant UI update)
    setStoreDistanceUnit(unit);
    // Persist to database
    if (userId) {
      await updateProfile({ distance_unit: unit });
    }
  }

  async function handleMeasurementChange(value: string) {
    const unit = value as MeasurementUnit;
    // Update local preferences store (instant UI update)
    setStoreMeasurementUnit(unit);
    // Persist to database
    if (userId) {
      await updateProfile({ measurement_unit: unit });
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Select Units</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        <ToggleButtonGroup
          label="Weight"
          options={[
            { value: 'kg', label: 'kg' },
            { value: 'lbs', label: 'lbs' },
          ]}
          selected={weightUnit}
          onSelect={handleWeightChange}
        />

        <ToggleButtonGroup
          label="Distance"
          options={[
            { value: 'kilometers', label: 'kilometers' },
            { value: 'miles', label: 'miles' },
          ]}
          selected={distanceUnit}
          onSelect={handleDistanceChange}
        />

        <ToggleButtonGroup
          label="Body Measurements"
          options={[
            { value: 'cm', label: 'cm' },
            { value: 'in', label: 'in' },
          ]}
          selected={measurementUnit}
          onSelect={handleMeasurementChange}
        />
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  toggleSection: {
    marginBottom: spacing.lg,
  },
  toggleLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  toggleContainer: {
    flexDirection: 'row',
    ...cardStyle,
    padding: 4,
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleButtonText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  toggleButtonTextActive: {
    color: colors.textInverse,
  },
});
