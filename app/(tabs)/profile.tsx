import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Switch,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';
import { signOut, deleteUserAccount } from '@/services/api/user';
import { useUserProfileStore, getHighResAvatarUrl } from '@/stores/userProfileStore';
import { supabase } from '@/services/supabase';

// Required for web browser auth to close properly
WebBrowser.maybeCompleteAuthSession();

// DEV ONLY flag - set to false for production
const __DEV_MODE__ = true;

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  showArrow?: boolean;
  rightElement?: React.ReactNode;
  showDivider?: boolean;
}

function MenuItem({
  icon,
  label,
  onPress,
  showArrow = true,
  rightElement,
  showDivider = true,
}: MenuItemProps) {
  return (
    <>
      <Pressable style={styles.menuItem} onPress={onPress}>
        <View style={styles.menuItemLeft}>
          {icon}
          <Text style={styles.menuItemLabel}>{label}</Text>
        </View>
        {rightElement ||
          (showArrow && <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />)}
      </Pressable>
      {showDivider && <View style={styles.divider} />}
    </>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function MenuCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.menuCard}>{children}</View>;
}

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

function ConfirmationModal({
  visible,
  title,
  message,
  confirmText = 'Delete',
  onCancel,
  onConfirm,
  isLoading = false,
}: ConfirmationModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.modalOverlay} onPress={onCancel}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <Pressable style={styles.modalCloseButton} onPress={onCancel}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </Pressable>

          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>

          <View style={styles.modalButtons}>
            <Pressable style={styles.modalCancelButton} onPress={onCancel} disabled={isLoading}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.modalConfirmButton, isLoading && styles.modalButtonDisabled]}
              onPress={onConfirm}
              disabled={isLoading}
            >
              <Text style={styles.modalConfirmText}>
                {isLoading ? 'Please wait...' : confirmText}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function ProfileScreen() {
  const { profile, userId, fetchProfile, updateProfile } = useUserProfileStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDevLoginLoading, setIsDevLoginLoading] = useState(false);

  // Set notifications state when profile loads
  useEffect(() => {
    if (profile) {
      setNotificationsEnabled(profile.notifications_enabled || false);
    }
  }, [profile]);

  // Fetch profile when screen comes into focus (uses cache if available)
  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  async function handleNotificationToggle(value: boolean) {
    setNotificationsEnabled(value);
    if (userId) {
      await updateProfile({ notifications_enabled: value });
    }
  }

  async function handleLogout() {
    setIsLoading(true);
    const success = await signOut();
    setIsLoading(false);
    setShowLogoutModal(false);

    if (success) {
      // Clear cached profile
      useUserProfileStore.getState().clearProfile();
      // Small delay to let modal close animation finish
      setTimeout(() => {
        router.replace('/');
      }, 100);
    } else {
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  }

  async function handleDeleteAccount() {
    if (!userId) {
      Alert.alert('Error', 'No user ID found. Please try again.');
      return;
    }

    setIsLoading(true);

    try {
      // Delete user profile from database
      const profileDeleted = await deleteUserAccount(userId);
      if (!profileDeleted) {
        setIsLoading(false);
        Alert.alert('Error', 'Failed to delete account. Please try again.');
        return;
      }

      // Sign out the user
      await signOut();
      // Clear cached profile
      useUserProfileStore.getState().clearProfile();

      setIsLoading(false);
      setShowDeleteModal(false);

      // Small delay to let modal close animation finish
      setTimeout(() => {
        router.replace('/');
      }, 100);
    } catch (error) {
      console.error('Delete account error:', error);
      setIsLoading(false);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  }

  // DEV ONLY: Quick Google login
  async function handleDevGoogleLogin() {
    try {
      setIsDevLoginLoading(true);

      const redirectTo = 'align://auth/callback';

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

        if (result.type === 'success' && result.url) {
          const url = new URL(result.url);
          const params = new URLSearchParams(url.hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });

            if (sessionError) throw sessionError;

            if (sessionData.user) {
              // Reload profile using the store
              fetchProfile();
              Alert.alert('Success', 'Logged in successfully!');
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Dev Google Sign-In error:', error);
      Alert.alert('Sign In Failed', 'Unable to sign in with Google. Please try again.');
    } finally {
      setIsDevLoginLoading(false);
    }
  }

  function getDisplayName(): string {
    return profile?.name || 'Your Name';
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.headerTitle}>Profile</Text>

        {/* Profile Card */}
        <Pressable style={styles.profileCard} onPress={() => router.push('/profile/edit-profile')}>
          {profile?.avatar_url ? (
            <Image
              source={{ uri: getHighResAvatarUrl(profile.avatar_url, 200) || profile.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={28} color={colors.textSecondary} />
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{getDisplayName()}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </Pressable>

        {/* Invite Friends */}
        <SectionHeader title="Invite Friends" />
        <MenuCard>
          <Pressable
            style={styles.referralCard}
            onPress={() => router.push('/profile/refer-friend')}
          >
            <Ionicons name="person-add-outline" size={24} color={colors.text} />
            <View style={styles.referralInfo}>
              <Text style={styles.referralTitle}>Refer a friend and earn $5</Text>
              <Text style={styles.referralSubtitle}>
                Earn $5 per friend that signs up with your promo code.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Pressable>
        </MenuCard>

        {/* Account */}
        <SectionHeader title="Account" />
        <MenuCard>
          <MenuItem
            icon={<Ionicons name="card-outline" size={20} color={colors.text} />}
            label="Personal Details"
            onPress={() => router.push('/profile/personal-details')}
          />
          <MenuItem
            icon={<Ionicons name="globe-outline" size={20} color={colors.text} />}
            label="Manage Subscription"
            onPress={() => {}}
          />
          <MenuItem
            icon={<Ionicons name="language-outline" size={20} color={colors.text} />}
            label="Language"
            onPress={() => router.push('/profile/select-language')}
          />
          <MenuItem
            icon={<Ionicons name="star-outline" size={20} color={colors.text} />}
            label="Rate Us"
            onPress={() => {}}
            showDivider={false}
          />
        </MenuCard>

        {/* Preferences */}
        <SectionHeader title="Preferences" />
        <MenuCard>
          <MenuItem
            icon={<Ionicons name="pencil-outline" size={20} color={colors.text} />}
            label="Units"
            onPress={() => router.push('/profile/select-units')}
          />
          <MenuItem
            icon={<Ionicons name="notifications-outline" size={20} color={colors.text} />}
            label="Notifications"
            onPress={() => handleNotificationToggle(!notificationsEnabled)}
            showArrow={false}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <MenuItem
            icon={<Ionicons name="heart-outline" size={20} color={colors.text} />}
            label="Apple Health"
            onPress={() => router.push('/profile/apple-health')}
            showDivider={false}
          />
        </MenuCard>

        {/* Support */}
        <SectionHeader title="Support" />
        <MenuCard>
          <MenuItem
            icon={<Ionicons name="paper-plane-outline" size={20} color={colors.text} />}
            label="Contact Us"
            onPress={() => {}}
          />
          <MenuItem
            icon={<Ionicons name="document-text-outline" size={20} color={colors.text} />}
            label="Terms & Conditions"
            onPress={() => {}}
          />
          <MenuItem
            icon={<Ionicons name="shield-checkmark-outline" size={20} color={colors.text} />}
            label="Privacy Policy"
            onPress={() => {}}
            showDivider={false}
          />
        </MenuCard>

        {/* Follow Us */}
        <SectionHeader title="Follow Us" />
        <MenuCard>
          <MenuItem
            icon={<Ionicons name="logo-instagram" size={20} color={colors.text} />}
            label="Instagram"
            onPress={() => {}}
          />
          <MenuItem
            icon={<Ionicons name="logo-tiktok" size={20} color={colors.text} />}
            label="TikTok"
            onPress={() => {}}
          />
          <MenuItem
            icon={<Ionicons name="logo-twitter" size={20} color={colors.text} />}
            label="X"
            onPress={() => {}}
            showDivider={false}
          />
        </MenuCard>

        {/* Account Actions */}
        <SectionHeader title="Account Actions" />
        <MenuCard>
          <MenuItem
            icon={<Ionicons name="log-out-outline" size={20} color={colors.text} />}
            label="Log Out"
            onPress={() => setShowLogoutModal(true)}
          />
          <MenuItem
            icon={<Ionicons name="trash-outline" size={20} color={colors.text} />}
            label="Delete Account"
            onPress={() => setShowDeleteModal(true)}
            showDivider={false}
          />
        </MenuCard>

        {/* DEV ONLY: Quick Login */}
        {__DEV_MODE__ && !userId && (
          <>
            <SectionHeader title="Dev Only" />
            <Pressable
              style={styles.devLoginButton}
              onPress={handleDevGoogleLogin}
              disabled={isDevLoginLoading}
            >
              {isDevLoginLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#FFFFFF" />
                  <Text style={styles.devLoginText}>Quick Google Login</Text>
                </>
              )}
            </Pressable>
          </>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        visible={showLogoutModal}
        title="Log out?"
        message="Are you sure you want to log out?"
        confirmText="Log Out"
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        isLoading={isLoading}
      />

      {/* Delete Account Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteModal}
        title="Delete Account?"
        message="Are you sure you want to permanently delete your account? This action cannot be undone."
        confirmText="Delete"
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        isLoading={isLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    ...cardStyle,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0EEF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  profileName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  sectionHeader: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  menuCard: {
    ...cardStyle,
    marginHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: spacing.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuItemLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  referralCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  referralInfo: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  referralTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  referralSubtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 40,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(217, 217, 217, 0.25)',
    marginHorizontal: spacing.sm,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 320,
  },
  modalCloseButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    padding: spacing.xs,
  },
  modalTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  modalMessage: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: '#FF4444',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: '#FFFFFF',
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  // DEV ONLY styles
  devLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#4285F4',
    marginHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: 12,
  },
  devLoginText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: '#FFFFFF',
  },
});
