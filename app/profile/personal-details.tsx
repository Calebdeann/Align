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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';
import { useUserProfileStore, UserProfile } from '@/stores/userProfileStore';
import { filterNumericInput } from '@/utils/units';

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
  const { t } = useTranslation();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editField, setEditField] = useState<'weight' | 'height' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  function openEditModal(field: 'weight' | 'height') {
    setEditField(field);
    if (field === 'weight') {
      setEditValue(profile?.weight?.toString() || '');
    } else if (field === 'height') {
      setEditValue(profile?.height?.toString() || '');
    }
    setShowEditModal(true);
  }

  async function handleEditSave() {
    if (!userId || !editField || isSaving) return;

    let updates: Partial<UserProfile> = {};

    if (editField === 'weight') {
      const weightNum = parseFloat(editValue);
      if (isNaN(weightNum)) {
        Alert.alert(i18n.t('errors.invalidInput'), i18n.t('errors.pleaseEnterValidNumber'));
        return;
      }
      updates.weight = weightNum;
    } else if (editField === 'height') {
      const heightNum = parseFloat(editValue);
      if (isNaN(heightNum)) {
        Alert.alert(i18n.t('errors.invalidInput'), i18n.t('errors.pleaseEnterValidNumber'));
        return;
      }
      updates.height = heightNum;
    }

    setIsSaving(true);
    try {
      const success = await updateProfile(updates);
      setIsSaving(false);
      if (success) {
        setShowEditModal(false);
      } else {
        Alert.alert(i18n.t('common.error'), i18n.t('errors.failedToSave'));
      }
    } catch (error) {
      setIsSaving(false);
      Alert.alert(i18n.t('common.error'), i18n.t('errors.failedToSave'));
    }
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

  function getEditLabel(): string {
    switch (editField) {
      case 'weight':
        return t('profile.currentWeight');
      case 'height':
        return t('profile.height');
      default:
        return '';
    }
  }

  function getEditPlaceholder(): string {
    switch (editField) {
      case 'weight':
        return t('profile.enterWeight');
      case 'height':
        return t('profile.enterHeight');
      default:
        return '';
    }
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
        <Text style={styles.headerTitle}>{t('profile.personalDetails')}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Details Card */}
        <View style={styles.detailsCard}>
          <DetailRow
            label={t('profile.currentWeight')}
            value={formatWeight(profile?.weight)}
            onEdit={() => openEditModal('weight')}
          />
          <DetailRow
            label={t('profile.height')}
            value={formatHeight(profile?.height)}
            onEdit={() => openEditModal('height')}
            showDivider={false}
          />
        </View>
      </ScrollView>

      {/* Edit Field Modal */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowEditModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{getEditLabel()}</Text>
            <TextInput
              style={styles.editInput}
              value={editValue}
              onChangeText={(value) => setEditValue(filterNumericInput(value))}
              placeholder={getEditPlaceholder()}
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalButtonCancel} onPress={() => setShowEditModal(false)}>
                <Text style={styles.modalButtonCancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButtonSave, isSaving && { opacity: 0.7 }]}
                disabled={isSaving}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  handleEditSave();
                }}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.textInverse} />
                ) : (
                  <Text style={styles.modalButtonSaveText}>{t('common.save')}</Text>
                )}
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
