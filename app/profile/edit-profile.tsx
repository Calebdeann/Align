import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';
import { useUserProfileStore, getHighResAvatarUrl } from '@/stores/userProfileStore';

export default function EditProfileScreen() {
  const { profile, userId, updateProfile, checkNameAvailable } = useUserProfileStore();

  // Initialize state from cached profile
  const [name, setName] = useState(profile?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Sync state when profile loads/changes (but only if user hasn't made changes)
  useEffect(() => {
    if (profile && !hasChanges) {
      setName(profile.name || '');
    }
  }, [profile, hasChanges]);

  async function handleSave() {
    if (!userId) {
      Alert.alert('Error', 'User not found. Please try again.');
      return;
    }
    if (!hasChanges) {
      router.back();
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Please enter a name');
      return;
    }

    setIsSaving(true);
    setNameError(null);

    try {
      // Check if name is available
      const isAvailable = await checkNameAvailable(trimmedName);
      if (!isAvailable) {
        setIsSaving(false);
        setNameError('This name is already taken');
        return;
      }

      const success = await updateProfile({ name: trimmedName });

      setIsSaving(false);

      if (success) {
        router.back();
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      setIsSaving(false);
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  }

  function handleNameChange(value: string) {
    setName(value);
    setHasChanges(true);
    setNameError(null);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <Pressable
          onPress={handleSave}
          style={styles.saveButton}
          disabled={isSaving}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.saveText, !hasChanges && styles.saveTextDisabled]}>Save</Text>
          )}
        </Pressable>
      </View>

      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        {profile?.avatar_url ? (
          <Image
            source={{ uri: getHighResAvatarUrl(profile.avatar_url, 400) || profile.avatar_url }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={48} color={colors.textSecondary} />
          </View>
        )}
        <Pressable>
          <Text style={styles.addPhotoText}>
            {profile?.avatar_url ? 'Change Profile Photo' : 'Add Profile Photo'}
          </Text>
        </Pressable>
      </View>

      {/* Form Fields */}
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Name</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={handleNameChange}
              placeholder="Name"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
            />
            <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
          </View>
          {nameError && <Text style={styles.errorText}>{nameError}</Text>}
        </View>
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
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.md,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0EEF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  addPhotoText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  form: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  inputContainer: {
    ...cardStyle,
    padding: spacing.md,
  },
  inputLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
    padding: 0,
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
