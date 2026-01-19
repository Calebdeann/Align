import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';
import { useUserProfileStore, UserProfile } from '@/stores/userProfileStore';
import { filterNumericInput } from '@/utils/units';

const GOALS = [
  'Lose Weight',
  'Build Muscle',
  'Get Stronger',
  'Improve Fitness',
  'Stay Active',
  'Tone Up',
];

interface DetailRowProps {
  label: string;
  value: string;
  onEdit: () => void;
  showDivider?: boolean;
}

function DetailRow({ label, value, onEdit, showDivider = true }: DetailRowProps) {
  return (
    <>
      <Pressable style={styles.detailRow} onPress={onEdit}>
        <Text style={styles.detailLabel}>{label}</Text>
        <View style={styles.detailRight}>
          <Text style={styles.detailValue}>{value || '-'}</Text>
          <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
        </View>
      </Pressable>
      {showDivider && <View style={styles.divider} />}
    </>
  );
}

export default function PersonalDetailsScreen() {
  const { profile, userId, updateProfile } = useUserProfileStore();

  // Modal states
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editField, setEditField] = useState<'weight' | 'height' | 'dob' | null>(null);
  const [editValue, setEditValue] = useState('');

  async function handleGoalChange(newGoal: string) {
    if (!userId) return;

    await updateProfile({ primary_goal: newGoal });
    setShowGoalModal(false);
  }

  function openEditModal(field: 'weight' | 'height' | 'dob') {
    setEditField(field);
    if (field === 'weight') {
      setEditValue(profile?.weight?.toString() || '');
    } else if (field === 'height') {
      setEditValue(profile?.height?.toString() || '');
    } else if (field === 'dob') {
      setEditValue(profile?.date_of_birth || '');
    }
    setShowEditModal(true);
  }

  async function handleEditSave() {
    if (!userId || !editField) return;

    let updates: Partial<UserProfile> = {};

    if (editField === 'weight') {
      const weightNum = parseFloat(editValue);
      if (isNaN(weightNum)) {
        Alert.alert('Invalid Input', 'Please enter a valid number');
        return;
      }
      updates.weight = weightNum;
    } else if (editField === 'height') {
      const heightNum = parseFloat(editValue);
      if (isNaN(heightNum)) {
        Alert.alert('Invalid Input', 'Please enter a valid number');
        return;
      }
      updates.height = heightNum;
    } else if (editField === 'dob') {
      updates.date_of_birth = editValue;
    }

    await updateProfile(updates);
    setShowEditModal(false);
  }

  function formatWeight(weight?: number): string {
    if (!weight) return '-';
    const unit = profile?.weight_unit || 'kg';
    return `${weight}${unit}`;
  }

  function formatHeight(height?: number): string {
    if (!height) return '-';
    const unit = profile?.measurement_unit || 'cm';
    return `${height} ${unit}`;
  }

  function formatDob(dob?: string): string {
    if (!dob) return '-';
    const date = new Date(dob);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function getEditLabel(): string {
    switch (editField) {
      case 'weight':
        return 'Current Weight';
      case 'height':
        return 'Height';
      case 'dob':
        return 'Date of Birth';
      default:
        return '';
    }
  }

  function getEditPlaceholder(): string {
    switch (editField) {
      case 'weight':
        return 'Enter weight (e.g., 64)';
      case 'height':
        return 'Enter height (e.g., 170)';
      case 'dob':
        return 'YYYY-MM-DD';
      default:
        return '';
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Personal Details</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Primary Goal Card */}
        <View style={styles.goalCard}>
          <View style={styles.goalLeft}>
            <Text style={styles.goalLabel}>Primary Goal</Text>
            <Text style={styles.goalValue}>{profile?.primary_goal || 'Not set'}</Text>
          </View>
          <Pressable style={styles.changeGoalButton} onPress={() => setShowGoalModal(true)}>
            <Text style={styles.changeGoalText}>Change Goal</Text>
          </Pressable>
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <DetailRow
            label="Current Weight"
            value={formatWeight(profile?.weight)}
            onEdit={() => openEditModal('weight')}
          />
          <DetailRow
            label="Height"
            value={formatHeight(profile?.height)}
            onEdit={() => openEditModal('height')}
          />
          <DetailRow
            label="Date of birth"
            value={formatDob(profile?.date_of_birth)}
            onEdit={() => openEditModal('dob')}
            showDivider={false}
          />
        </View>
      </ScrollView>

      {/* Goal Selection Modal */}
      <Modal visible={showGoalModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowGoalModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Your Goal</Text>
            {GOALS.map((goal) => (
              <Pressable
                key={goal}
                style={[
                  styles.goalOption,
                  profile?.primary_goal === goal && styles.goalOptionSelected,
                ]}
                onPress={() => handleGoalChange(goal)}
              >
                <Text
                  style={[
                    styles.goalOptionText,
                    profile?.primary_goal === goal && styles.goalOptionTextSelected,
                  ]}
                >
                  {goal}
                </Text>
                {profile?.primary_goal === goal && (
                  <Ionicons name="checkmark" size={20} color={colors.textInverse} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Edit Field Modal */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowEditModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{getEditLabel()}</Text>
            <TextInput
              style={styles.editInput}
              value={editValue}
              onChangeText={(value) => {
                // Only filter numeric for weight/height, not for date of birth
                if (editField === 'dob') {
                  setEditValue(value);
                } else {
                  setEditValue(filterNumericInput(value));
                }
              }}
              placeholder={getEditPlaceholder()}
              placeholderTextColor={colors.textSecondary}
              keyboardType={editField === 'dob' ? 'default' : 'numeric'}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalButtonCancel} onPress={() => setShowEditModal(false)}>
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalButtonSave} onPress={handleEditSave}>
                <Text style={styles.modalButtonSaveText}>Save</Text>
              </Pressable>
            </View>
          </View>
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
  },
  goalCard: {
    ...cardStyle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  goalLeft: {
    flex: 1,
  },
  goalLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  goalValue: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  changeGoalButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  changeGoalText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    color: colors.textInverse,
  },
  detailsCard: {
    ...cardStyle,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  detailLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  detailRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailValue: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(217, 217, 217, 0.25)',
    marginHorizontal: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    backgroundColor: colors.card,
  },
  goalOptionSelected: {
    backgroundColor: colors.primary,
  },
  goalOptionText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  goalOptionTextSelected: {
    color: colors.textInverse,
  },
  editInput: {
    ...cardStyle,
    padding: spacing.md,
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  modalButtonSave: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalButtonSaveText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.textInverse,
  },
});
