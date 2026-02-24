import { useState, useEffect, useRef } from 'react';
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
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';
import { useUserProfileStore, getHighResAvatarUrl } from '@/stores/userProfileStore';
import { uploadAvatar } from '@/services/api/user';

export default function EditProfileScreen() {
  const { profile, userId, updateProfile, checkNameAvailable } = useUserProfileStore();

  // Initialize state from cached profile
  const [name, setName] = useState(profile?.name || '');
  const [weight, setWeight] = useState(profile?.weight?.toString() || '');
  const [height, setHeight] = useState(profile?.height?.toString() || '');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [isEditingHeight, setIsEditingHeight] = useState(false);
  const nameInputRef = useRef<TextInput>(null);
  const weightInputRef = useRef<TextInput>(null);
  const heightInputRef = useRef<TextInput>(null);

  const weightUnit = profile?.weight_unit || 'lbs';
  const heightUnit = profile?.measurement_unit || 'in';

  // Sync state when profile loads/changes (but only if user hasn't made changes)
  useEffect(() => {
    if (profile && !hasChanges) {
      setName(profile.name || '');
      setWeight(profile.weight?.toString() || '');
      setHeight(profile.height?.toString() || '');
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

      const updates: Record<string, unknown> = { name: trimmedName };
      const parsedWeight = parseFloat(weight);
      if (!isNaN(parsedWeight) && parsedWeight > 0) {
        updates.weight = parsedWeight;
      }
      const parsedHeight = parseFloat(height);
      if (!isNaN(parsedHeight) && parsedHeight > 0) {
        updates.height = parsedHeight;
      }
      const success = await updateProfile(updates);

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

  async function handlePickedImage(uri: string) {
    if (!userId) return;
    setIsUploadingPhoto(true);
    try {
      const publicUrl = await uploadAvatar(userId, uri);
      if (publicUrl) {
        await updateProfile({ avatar_url: publicUrl });
      } else {
        Alert.alert('Upload Failed', 'Could not upload photo. Please try again.');
      }
    } catch (error) {
      console.warn('Error uploading avatar:', error);
      Alert.alert('Upload Failed', 'Could not upload photo. Please try again.');
    }
    setIsUploadingPhoto(false);
  }

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
        handlePickedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.warn('EditProfile: Error choosing from library:', error);
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
        handlePickedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.warn('EditProfile: Error taking photo:', error);
    }
  }

  function handleChangePhoto() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Profile Photo', '', [
      { text: 'Choose from Library', onPress: handleChooseFromLibrary },
      { text: 'Take Photo', onPress: handleTakePhoto },
      { text: 'Cancel', style: 'cancel' },
    ]);
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
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            handleSave();
          }}
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
        <View>
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
          {isUploadingPhoto && (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator size="small" color="#FFFFFF" />
            </View>
          )}
        </View>
        <Pressable onPress={handleChangePhoto} disabled={isUploadingPhoto}>
          <Text style={styles.addPhotoText}>
            {isUploadingPhoto
              ? 'Uploading...'
              : profile?.avatar_url
                ? 'Change Profile Photo'
                : 'Add Profile Photo'}
          </Text>
        </Pressable>
      </View>

      {/* Form Fields */}
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Name</Text>
          <View style={styles.inputRow}>
            <TextInput
              ref={nameInputRef}
              style={styles.input}
              value={name}
              onChangeText={handleNameChange}
              placeholder="Name"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
              editable={isEditingName}
              pointerEvents={isEditingName ? 'auto' : 'none'}
              onBlur={() => setIsEditingName(false)}
            />
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsEditingName(true);
                setTimeout(() => nameInputRef.current?.focus(), 100);
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
          {nameError && <Text style={styles.errorText}>{nameError}</Text>}
        </View>

        {/* Weight */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Weight ({weightUnit})</Text>
          <View style={styles.inputRow}>
            <TextInput
              ref={weightInputRef}
              style={styles.input}
              value={weight}
              onChangeText={(v) => {
                setWeight(v);
                setHasChanges(true);
              }}
              placeholder="Weight"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              editable={isEditingWeight}
              pointerEvents={isEditingWeight ? 'auto' : 'none'}
              onBlur={() => setIsEditingWeight(false)}
            />
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsEditingWeight(true);
                setTimeout(() => weightInputRef.current?.focus(), 100);
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Height */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Height ({heightUnit})</Text>
          <View style={styles.inputRow}>
            <TextInput
              ref={heightInputRef}
              style={styles.input}
              value={height}
              onChangeText={(v) => {
                setHeight(v);
                setHasChanges(true);
              }}
              placeholder="Height"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              editable={isEditingHeight}
              pointerEvents={isEditingHeight ? 'auto' : 'none'}
              onBlur={() => setIsEditingHeight(false)}
            />
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsEditingHeight(true);
                setTimeout(() => heightInputRef.current?.focus(), 100);
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
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
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
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
