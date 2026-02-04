import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import * as StoreReview from 'expo-store-review';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import { signOut, deleteUserAccount } from '@/services/api/user';
import { useUserProfileStore, getHighResAvatarUrl } from '@/stores/userProfileStore';
import { supabase } from '@/services/supabase';
import { clearUserDataFromStorage } from '@/lib/storeManager';

// Required for web browser auth to close properly
WebBrowser.maybeCompleteAuthSession();

// DEV ONLY flag - automatically false in production builds
const __DEV_MODE__ = __DEV__;

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
      <Pressable
        style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
      >
        <View style={styles.menuItemLeft}>
          {icon}
          <Text style={styles.menuItemLabel} numberOfLines={1}>
            {label}
          </Text>
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
      <Pressable
        style={styles.modalOverlay}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onCancel();
        }}
      >
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <Pressable
            style={styles.modalCloseButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onCancel();
            }}
          >
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </Pressable>

          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>

          <View style={styles.modalButtons}>
            <Pressable
              style={styles.modalCancelButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onCancel();
              }}
              disabled={isLoading}
            >
              <Text style={styles.modalCancelText}>{i18n.t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              style={[styles.modalConfirmButton, isLoading && styles.modalButtonDisabled]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                onConfirm();
              }}
              disabled={isLoading}
            >
              <Text style={styles.modalConfirmText}>
                {isLoading ? i18n.t('common.pleaseWait') : confirmText}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { profile, userId, fetchProfile, updateProfile } = useUserProfileStore();
  const { isNavigating, withLock } = useNavigationLock();
  const navigation = useNavigation();
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotificationsEnabled(value);
    if (userId) {
      await updateProfile({ notifications_enabled: value });
    }
  }

  function navigateToLanding() {
    // Reset root Stack to the landing screen ('index' = app/index.tsx)
    // Using CommonActions.reset avoids path ambiguity between app/index.tsx and app/(tabs)/index.tsx
    const rootNav = navigation.getParent();
    if (rootNav) {
      rootNav.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'index' }] }));
    } else {
      router.replace('/');
    }
  }

  async function handleLogout() {
    setIsLoading(true);
    const success = await signOut();
    setIsLoading(false);
    setShowLogoutModal(false);

    if (success) {
      useUserProfileStore.getState().clearProfile();
      setTimeout(() => navigateToLanding(), 300);
    } else {
      Alert.alert(i18n.t('common.error'), i18n.t('errors.somethingWentWrongTryAgain'));
    }
  }

  async function handleDeleteAccount() {
    if (!userId) {
      Alert.alert(i18n.t('common.error'), i18n.t('errors.somethingWentWrongTryAgain'));
      return;
    }

    setIsLoading(true);

    try {
      // Clear local storage first (needs userId for key names)
      await clearUserDataFromStorage(userId);

      // Delete account via RPC (deletes auth user + all DB data)
      const deleted = await deleteUserAccount();
      if (!deleted) {
        setIsLoading(false);
        Alert.alert(i18n.t('common.error'), i18n.t('errors.somethingWentWrongTryAgain'));
        return;
      }

      // Sign out locally to clear session
      await signOut();
      useUserProfileStore.getState().clearProfile();

      setIsLoading(false);
      setShowDeleteModal(false);

      setTimeout(() => navigateToLanding(), 300);
    } catch (error) {
      console.error('Delete account error:', error);
      setIsLoading(false);
      Alert.alert(i18n.t('common.error'), i18n.t('errors.unexpectedError'));
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
              Alert.alert('Success', 'Logged in successfully!'); // DEV only - no translation needed
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Dev Google Sign-In error:', error);
      Alert.alert(i18n.t('auth.signInFailed'), i18n.t('auth.googleSignInError'));
    } finally {
      setIsDevLoginLoading(false);
    }
  }

  function getDisplayName(): string {
    return profile?.name || t('profile.yourName');
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>

        {/* Profile Card */}
        <Pressable
          style={styles.profileCard}
          onPress={() => {
            withLock(() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/profile/edit-profile');
            });
          }}
        >
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

        {/* Account */}
        <SectionHeader title={t('profile.account')} />
        <MenuCard>
          <MenuItem
            icon={<Ionicons name="card-outline" size={20} color={colors.text} />}
            label={t('profile.personalDetails')}
            onPress={() =>
              withLock(() => {
                router.push('/profile/personal-details');
              })
            }
          />
          <MenuItem
            icon={<Ionicons name="language-outline" size={20} color={colors.text} />}
            label={t('profile.language')}
            onPress={() =>
              withLock(() => {
                router.push('/profile/select-language');
              })
            }
          />
          <MenuItem
            icon={<Ionicons name="star-outline" size={20} color={colors.text} />}
            label={t('profile.rateUs')}
            onPress={async () => {
              if (__DEV__) {
                Alert.alert(i18n.t('profile.devMode'), i18n.t('profile.devModeMessage'));
                return;
              }
              const available = await StoreReview.isAvailableAsync();
              if (available) {
                await StoreReview.requestReview();
              } else {
                Alert.alert(i18n.t('profile.comingSoon'), i18n.t('profile.comingSoonMessage'));
              }
            }}
            showDivider={false}
          />
        </MenuCard>

        {/* Preferences */}
        <SectionHeader title={t('profile.preferences')} />
        <MenuCard>
          <MenuItem
            icon={<Ionicons name="scale-outline" size={20} color={colors.text} />}
            label={t('profile.units')}
            onPress={() =>
              withLock(() => {
                router.push('/profile/select-units');
              })
            }
          />
          <MenuItem
            icon={<Ionicons name="notifications-outline" size={20} color={colors.text} />}
            label={t('profile.notifications')}
            onPress={() => handleNotificationToggle(!notificationsEnabled)}
            showArrow={false}
            showDivider={false}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.background}
              />
            }
          />
        </MenuCard>

        {/* Support */}
        <SectionHeader title={t('profile.support')} />
        <MenuCard>
          <MenuItem
            icon={<Ionicons name="paper-plane-outline" size={20} color={colors.text} />}
            label={t('profile.contactUs')}
            onPress={() => Linking.openURL('mailto:aligntracker@gmail.com')}
          />
          <MenuItem
            icon={<Ionicons name="document-text-outline" size={20} color={colors.text} />}
            label={t('profile.termsAndConditions')}
            onPress={() => WebBrowser.openBrowserAsync('https://aligntermsandconditions.carrd.co/')}
          />
          <MenuItem
            icon={<Ionicons name="shield-checkmark-outline" size={20} color={colors.text} />}
            label={t('profile.privacyPolicy')}
            onPress={() => WebBrowser.openBrowserAsync('https://alignprivacypolicy.carrd.co/')}
            showDivider={false}
          />
        </MenuCard>

        {/* Follow Us */}
        <SectionHeader title={t('profile.followUs')} />
        <MenuCard>
          <MenuItem
            icon={<Ionicons name="logo-instagram" size={20} color={colors.text} />}
            label={t('profile.instagram')}
            onPress={() => Linking.openURL('https://www.instagram.com/align.tracker/')}
          />
          <MenuItem
            icon={<Ionicons name="logo-tiktok" size={20} color={colors.text} />}
            label={t('profile.tiktok')}
            onPress={() => Linking.openURL('https://www.tiktok.com/@align.tracker')}
            showDivider={false}
          />
        </MenuCard>

        {/* Account Actions */}
        <SectionHeader title={t('profile.accountActions')} />
        <MenuCard>
          <MenuItem
            icon={<Ionicons name="log-out-outline" size={20} color={colors.text} />}
            label={t('profile.logOut')}
            onPress={() => setShowLogoutModal(true)}
          />
          <MenuItem
            icon={<Ionicons name="trash-outline" size={20} color={colors.text} />}
            label={t('profile.deleteAccount')}
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
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color={colors.textInverse} />
                  <Text style={styles.devLoginText}>{t('profile.quickGoogleLogin')}</Text>
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
        title={t('profile.logOutConfirm')}
        message={t('profile.logOutMessage')}
        confirmText={t('profile.logOut')}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        isLoading={isLoading}
      />

      {/* Delete Account Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteModal}
        title={t('profile.deleteConfirm')}
        message={t('profile.deleteMessage')}
        confirmText={t('common.delete')}
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
    flex: 1,
  },
  menuItemLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
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
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.textInverse,
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
    color: colors.textInverse,
  },
});
