import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useExerciseStore } from '@/stores/exerciseStore';
import { createCustomExercise, uploadCustomExerciseImage } from '@/services/api/customExercises';
import { SIMPLIFIED_MUSCLE_GROUPS } from '@/constants/muscleGroups';
import { FilterModal, MultiSelectFilterModal, FilterOption } from '@/components/FilterModal';

const MUSCLE_GROUP_ICONS: Record<string, any> = {
  back: require('../assets/Body Graph Icons/Back_BodyGraph.png'),
  biceps: require('../assets/Body Graph Icons/Biceps_BodyGraph.png'),
  calves: require('../assets/Body Graph Icons/Calves_BodyGraph.png'),
  chest: require('../assets/Body Graph Icons/Chest_BodyGraph.png'),
  core: require('../assets/Body Graph Icons/Core_BodyGraph.png'),
  glutes: require('../assets/Body Graph Icons/Glutes_BodyGraph.png'),
  legs: require('../assets/Body Graph Icons/Legs_BodyGraph.png'),
  other: require('../assets/Body Graph Icons/Other_BodyGraph.png'),
  shoulders: require('../assets/Body Graph Icons/Shoulders_BodyGraph.png'),
  triceps: require('../assets/Body Graph Icons/Triceps_BodyGraph.png'),
};

const EQUIPMENT_ICONS: Record<string, any> = {
  none: require('../assets/Equipment/None.png'),
  barbell: require('../assets/Equipment/Barbell.png'),
  dumbbell: require('../assets/Equipment/Dumbell.png'),
  kettlebell: require('../assets/Equipment/Kettlebell.png'),
  machine: require('../assets/Equipment/Machine.png'),
  'weighted plate': require('../assets/Equipment/Plate.png'),
  band: require('../assets/Equipment/ResistanceBand.png'),
  other: require('../assets/Body Graph Icons/Other_BodyGraph.png'),
};

const EQUIPMENT_ICON_SIZES: Record<string, number> = {
  none: 56,
  barbell: 52,
  dumbbell: 52,
  kettlebell: 52,
  machine: 52,
  'weighted plate': 52,
  band: 52,
  other: 52,
};

export default function CreateExerciseScreen() {
  const { t } = useTranslation();
  const { userId } = useUserProfileStore();
  const addCustomExercise = useExerciseStore((s) => s.addCustomExercise);

  // Form state
  const [name, setName] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [primaryMuscle, setPrimaryMuscle] = useState('');
  const [otherMuscles, setOtherMuscles] = useState<string[]>([]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modal state
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showPrimaryMuscleModal, setShowPrimaryMuscleModal] = useState(false);
  const [showOtherMusclesModal, setShowOtherMusclesModal] = useState(false);

  const canSave =
    name.trim().length > 0 && selectedEquipment.length > 0 && primaryMuscle.length > 0;

  // Equipment options (without "All")
  const EQUIPMENT_OPTIONS: FilterOption[] = useMemo(
    () => [
      { id: 'none', label: t('equipment.none') },
      { id: 'barbell', label: t('equipment.barbell') },
      { id: 'dumbbell', label: t('equipment.dumbbell') },
      { id: 'kettlebell', label: t('equipment.kettlebell') },
      { id: 'machine', label: t('equipment.machine') },
      { id: 'weighted plate', label: t('equipment.plate') },
      { id: 'band', label: t('equipment.resistanceBand') },
      { id: 'other', label: t('equipment.other') },
    ],
    [t]
  );

  // Muscle options (without "All")
  const MUSCLE_OPTIONS: FilterOption[] = useMemo(
    () => SIMPLIFIED_MUSCLE_GROUPS.map((g) => ({ id: g.id, label: t(g.i18nKey) })),
    [t]
  );

  // Other muscles options (exclude primary muscle)
  const otherMuscleOptions = useMemo(
    () => MUSCLE_OPTIONS.filter((o) => o.id !== primaryMuscle),
    [MUSCLE_OPTIONS, primaryMuscle]
  );

  // Display labels
  const equipmentLabel = EQUIPMENT_OPTIONS.find((o) => o.id === selectedEquipment)?.label || '';
  const primaryMuscleLabel = MUSCLE_OPTIONS.find((o) => o.id === primaryMuscle)?.label || '';
  const otherMusclesLabel =
    otherMuscles.length > 0
      ? otherMuscles
          .map((id) => MUSCLE_OPTIONS.find((o) => o.id === id)?.label)
          .filter(Boolean)
          .join(', ')
      : '';

  async function handleChooseFromLibrary() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Please allow photo library access in Settings.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.warn('CreateExercise: Error choosing from library:', error);
    }
  }

  async function handleTakePhoto() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Please allow camera access in Settings.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.warn('CreateExercise: Error taking photo:', error);
    }
  }

  function handleImagePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(t('createExercise.addAsset'), '', [
      { text: t('createExercise.chooseFromLibrary'), onPress: handleChooseFromLibrary },
      { text: t('createExercise.takePhoto'), onPress: handleTakePhoto },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  }

  async function handleSave() {
    if (!canSave || !userId) return;

    setIsSaving(true);

    try {
      // Upload image first if selected
      let imageUrl: string | null = null;
      if (imageUri) {
        imageUrl = await uploadCustomExerciseImage(userId, imageUri);
        if (!imageUrl) {
          Alert.alert(t('createExercise.note'), t('createExercise.imageUploadFailed'));
        }
      }

      const result = await createCustomExercise({
        userId,
        name: name.trim(),
        equipment: selectedEquipment,
        primaryMuscle,
        secondaryMuscles: otherMuscles,
        imageUrl,
      });

      if (result) {
        addCustomExercise(result);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      } else {
        Alert.alert(t('common.error'), t('createExercise.saveError'));
      }
    } catch (error) {
      console.warn('CreateExercise: Error saving:', error);
      Alert.alert(t('common.error'), t('createExercise.saveError'));
    }

    setIsSaving(false);
  }

  function handleToggleOtherMuscle(id: string) {
    setOtherMuscles((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('createExercise.title')}</Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            handleSave();
          }}
          style={styles.saveButton}
          disabled={!canSave || isSaving}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>
              {t('createExercise.save')}
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Image Section */}
        <View style={styles.imageSection}>
          <Pressable onPress={handleImagePress}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.imageCircle} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={36} color={colors.textSecondary} />
              </View>
            )}
          </Pressable>
          <Pressable onPress={handleImagePress}>
            <Text style={styles.addAssetText}>{t('createExercise.addAsset')}</Text>
          </Pressable>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Exercise Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{t('createExercise.exerciseName')}</Text>
            <View style={styles.fieldInputRow}>
              <TextInput
                style={styles.fieldInput}
                value={name}
                onChangeText={setName}
                placeholder={t('createExercise.exerciseNamePlaceholder')}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Equipment */}
          <Pressable
            style={styles.fieldContainer}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowEquipmentModal(true);
            }}
          >
            <Text style={styles.fieldLabel}>{t('createExercise.equipment')}</Text>
            <View style={styles.fieldSelectorRow}>
              <Text style={[styles.fieldValue, !equipmentLabel && styles.fieldPlaceholder]}>
                {equipmentLabel || t('createExercise.selectEquipment')}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
          </Pressable>

          {/* Primary Muscle Group */}
          <Pressable
            style={styles.fieldContainer}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowPrimaryMuscleModal(true);
            }}
          >
            <Text style={styles.fieldLabel}>{t('createExercise.primaryMuscle')}</Text>
            <View style={styles.fieldSelectorRow}>
              <Text style={[styles.fieldValue, !primaryMuscleLabel && styles.fieldPlaceholder]}>
                {primaryMuscleLabel || t('createExercise.selectMuscle')}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
          </Pressable>

          {/* Other Muscles (Optional) */}
          <Pressable
            style={styles.fieldContainer}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowOtherMusclesModal(true);
            }}
          >
            <Text style={styles.fieldLabel}>{t('createExercise.otherMuscles')}</Text>
            <View style={styles.fieldSelectorRow}>
              <Text
                style={[styles.fieldValue, !otherMusclesLabel && styles.fieldPlaceholder]}
                numberOfLines={1}
              >
                {otherMusclesLabel || t('createExercise.otherMusclesOptional')}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* Equipment Modal */}
      <FilterModal
        visible={showEquipmentModal}
        title={t('createExercise.selectEquipment')}
        options={EQUIPMENT_OPTIONS}
        selectedId={selectedEquipment}
        icons={EQUIPMENT_ICONS}
        iconSizes={EQUIPMENT_ICON_SIZES}
        onSelect={setSelectedEquipment}
        onClose={() => setShowEquipmentModal(false)}
      />

      {/* Primary Muscle Modal */}
      <FilterModal
        visible={showPrimaryMuscleModal}
        title={t('createExercise.selectMuscle')}
        options={MUSCLE_OPTIONS}
        selectedId={primaryMuscle}
        icons={MUSCLE_GROUP_ICONS}
        onSelect={(id) => {
          setPrimaryMuscle(id);
          // Remove from other muscles if it was selected there
          setOtherMuscles((prev) => prev.filter((m) => m !== id));
        }}
        onClose={() => setShowPrimaryMuscleModal(false)}
      />

      {/* Other Muscles Modal (Multi-select) */}
      <MultiSelectFilterModal
        visible={showOtherMusclesModal}
        title={t('createExercise.selectOtherMuscles')}
        options={otherMuscleOptions}
        selectedIds={otherMuscles}
        icons={MUSCLE_GROUP_ICONS}
        onToggle={handleToggleOtherMuscle}
        onDone={() => setShowOtherMusclesModal(false)}
        onClose={() => setShowOtherMusclesModal(false)}
        doneLabel={t('common.done')}
      />
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
  saveButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.primary,
  },
  saveTextDisabled: {
    color: colors.textSecondary,
  },
  scrollContent: {
    flex: 1,
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  imageCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.md,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0EEF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  addAssetText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  form: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  fieldContainer: {
    ...cardStyle,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  fieldLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  fieldInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldInput: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
    padding: 0,
  },
  fieldSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldValue: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  fieldPlaceholder: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },
});
