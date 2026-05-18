import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import * as StoreReview from 'expo-store-review';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { fonts, spacing } from '@/constants/theme';
import { LIQUID_TAB_BAR_HEIGHT } from '@/components/ui/LiquidGlassTabBar';
import { supabase } from '@/services/supabase';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useWorkoutStore, type CachedCompletedWorkout } from '@/stores/workoutStore';
import { uploadAvatar } from '@/services/api/user';
import {
  TRAIT_CATEGORIES,
  TRAITS_BOX_H,
  TRAITS_PILL_H,
  type PlacedTrait,
} from '@/constants/traits';

function groupByWeek(workouts: CachedCompletedWorkout[]) {
  const getMondayKey = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
  };
  const map = new Map<string, CachedCompletedWorkout[]>();
  for (const w of workouts) {
    const key = getMondayKey(new Date(w.completedAt));
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(w);
  }
  const sorted = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  return sorted
    .map(([key, items], idx) => ({
      weekKey: key,
      label: `Week ${idx + 1}`,
      workouts: items.sort(
        (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      ),
    }))
    .reverse();
}

const PLAN_PROFILE_IMAGES: Record<string, ReturnType<typeof require>> = {
  'summer-body': require('../../assets/Profile Assets/Plan Profile Images/ProfilePlan_Summer.png'),
  'pilates-princess': require('../../assets/Profile Assets/Plan Profile Images/ProfilePlan_Pilates.png'),
  hourglass: require('../../assets/Profile Assets/Plan Profile Images/ProfilePlan_Hourglass.png'),
  booty: require('../../assets/Profile Assets/Plan Profile Images/ProfilePlan_Booty.png'),
  'it-girl': require('../../assets/Profile Assets/Plan Profile Images/ProfilePlan_itgirl.png'),
  'glow-up': require('../../assets/Profile Assets/Plan Profile Images/ProfilePlan_glow.png'),
  'muscle-mommy': require('../../assets/Profile Assets/Plan Profile Images/ProfilePlan_muscle.png'),
  home: require('../../assets/Profile Assets/Plan Profile Images/ProfilePlan_Home.png'),
};

function CircleIconButton({ onPress, children }: { onPress: () => void; children: ReactNode }) {
  return (
    <Pressable onPress={onPress} style={styles.circleButton} hitSlop={8}>
      {children}
    </Pressable>
  );
}

function GearIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        fill="#000000"
        d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
      />
    </Svg>
  );
}

function EditIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        stroke="#888888"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke="#888888"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const traitsContainerWidth = width - 32; // matches paddingHorizontal: 16 each side
  const [activeTab, setActiveTab] = useState<'profile' | 'recovery'>('profile');
  const [bioModalVisible, setBioModalVisible] = useState(false);
  const [bioText, setBioText] = useState('');
  const [displayBio, setDisplayBio] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const profile = useUserProfileStore((state) => state.profile);
  const fetchProfile = useUserProfileStore((state) => state.fetchProfile);
  const updateProfile = useUserProfileStore((state) => state.updateProfile);
  const cachedCompletedWorkouts = useWorkoutStore((s) => s.cachedCompletedWorkouts);
  const weekGroups = useMemo(() => groupByWeek(cachedCompletedWorkouts), [cachedCompletedWorkouts]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    setDisplayBio(profile?.bio ?? '');
  }, [profile?.bio]);

  function handleSettings() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/settings');
  }

  async function handlePickAvatar() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission needed', 'Allow photo library access to set a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const userId = profile?.id;
    if (!userId) return;
    setUploadingAvatar(true);
    const url = await uploadAvatar(userId, result.assets[0].uri);
    if (url) {
      await updateProfile({ avatar_url: url });
    }
    setUploadingAvatar(false);
  }

  function handleBio() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBioText(profile?.bio ?? '');
    setBioModalVisible(true);
  }

  async function handleSaveBio() {
    const trimmed = bioText.trim();
    setDisplayBio(trimmed);
    setBioModalVisible(false);
    await updateProfile({ bio: trimmed });
  }

  function handleTraits() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/profile/traits');
  }

  const savedTraits = (profile?.traits ?? []) as PlacedTrait[];
  const hasSavedTraits = savedTraits.length > 0;

  const handleAppleSignIn = async () => {
    try {
      setIsAppleLoading(true);
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
      if (!credential.identityToken) {
        Alert.alert('Sign In Failed', 'No identity token from Apple.');
        return;
      }
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: rawNonce,
      });
      if (error) throw error;
      if (!data.user) {
        Alert.alert('Sign In Failed', 'Something went wrong.');
        return;
      }
      router.replace('/(tabs)');
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('Sign In Failed', error?.message || 'Apple sign-in failed.');
    } finally {
      setIsAppleLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      const redirectTo = 'itgirl://auth/callback';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data.url) {
        Alert.alert('Sign In Failed', 'Could not start Google sign-in.');
        return;
      }
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success') {
        if (result.type !== 'dismiss' && result.type !== 'cancel') {
          Alert.alert('Sign In Failed', 'Google sign-in was interrupted.');
        }
        return;
      }
      if (!result.url) {
        Alert.alert('Sign In Failed', 'No response from Google.');
        return;
      }
      const url = new URL(result.url);
      const params = new URLSearchParams(url.hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (!accessToken) {
        const errorDesc =
          params.get('error_description') || url.searchParams.get('error_description');
        Alert.alert('Sign In Failed', errorDesc || 'Google sign-in failed.');
        return;
      }
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });
      if (sessionError) throw sessionError;
      if (!sessionData.user) {
        Alert.alert('Sign In Failed', 'Something went wrong.');
        return;
      }
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Sign In Failed', 'Google sign-in failed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  async function handleReview() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const isAvailable = await StoreReview.isAvailableAsync();
    if (isAvailable) {
      StoreReview.requestReview();
    } else {
      Linking.openURL('https://apps.apple.com/app/id0000000000');
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Settings gear */}
      <View style={[styles.gearButtonContainer, { top: insets.top + 4 }]}>
        <CircleIconButton onPress={handleSettings}>
          <GearIcon />
        </CircleIconButton>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <Pressable style={styles.avatarContainer} onPress={handlePickAvatar}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} contentFit="cover" />
          ) : (
            <Image
              source={require('../../assets/Profile Assets/no-pfp.png')}
              style={[styles.avatar, uploadingAvatar && styles.avatarLoading]}
              contentFit="cover"
            />
          )}
        </Pressable>

        {/* Name */}
        <Text style={styles.name}>{profile?.name ?? 'Your Name'}</Text>

        {/* Bio */}
        <Pressable style={styles.bioRow} onPress={handleBio}>
          <Text style={[styles.bioText, displayBio && styles.bioTextFilled]}>
            {displayBio || 'Add a bio'}
          </Text>
          <View style={styles.bioIconGap}>
            <EditIcon />
          </View>
        </Pressable>

        {/* Scattered traits pills */}
        <Pressable style={styles.traitsContainer} onPress={handleTraits}>
          {hasSavedTraits ? (
            savedTraits.map((trait) => {
              const cat = TRAIT_CATEGORIES.find((c) => c.id === trait.categoryId);
              return (
                <View
                  key={trait.categoryId}
                  style={[
                    styles.savedTraitPill,
                    {
                      backgroundColor: cat?.color ?? '#f0f0f0',
                      left: trait.x * traitsContainerWidth,
                      top: trait.y * TRAITS_BOX_H,
                      transform: [{ rotate: `${trait.rotation}rad` }, { scale: trait.scale ?? 1 }],
                    },
                  ]}
                >
                  <Text style={styles.savedTraitText}>{trait.tag}</Text>
                </View>
              );
            })
          ) : (
            <>
              <View
                style={[
                  styles.traitPill,
                  styles.traitPillRound,
                  { top: 16, left: 35, width: 88, transform: [{ rotate: '4deg' }] },
                ]}
              >
                <Text style={styles.traitLabel}>Add traits</Text>
              </View>
              <View
                style={[
                  styles.traitPill,
                  styles.traitPillRound,
                  { top: 50, left: 82, width: 88, transform: [{ rotate: '-3deg' }] },
                ]}
              >
                <Text style={styles.traitLabel}>Add traits</Text>
              </View>
              <View
                style={[
                  styles.traitPill,
                  styles.traitPillRound,
                  { top: 4, left: 148, width: 88, transform: [{ rotate: '4deg' }] },
                ]}
              >
                <Text style={styles.traitLabel}>Add traits</Text>
              </View>
              <View
                style={[
                  styles.traitPill,
                  styles.traitPillRound,
                  { top: 48, left: 190, width: 88, transform: [{ rotate: '3deg' }] },
                ]}
              >
                <Text style={styles.traitLabel}>Add traits</Text>
              </View>
              <View
                style={[
                  styles.traitPill,
                  styles.traitPillRound,
                  { top: 10, left: 246, width: 88, transform: [{ rotate: '-6deg' }] },
                ]}
              >
                <Text style={styles.traitLabel}>Add traits</Text>
              </View>
            </>
          )}
        </Pressable>

        {/* Sub-tab bar */}
        <View style={styles.tabBar}>
          <Pressable
            style={styles.tab}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setActiveTab('profile');
            }}
          >
            <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>
              Profile
            </Text>
            {activeTab === 'profile' && <View style={styles.tabUnderline} />}
          </Pressable>
          <Pressable
            style={styles.tab}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setActiveTab('recovery');
            }}
          >
            <Text style={[styles.tabLabel, activeTab === 'recovery' && styles.tabLabelActive]}>
              Recovery
            </Text>
            {activeTab === 'recovery' && <View style={styles.tabUnderline} />}
          </Pressable>
        </View>

        {/* Tab content */}
        {activeTab === 'profile' ? (
          <Pressable
            style={styles.planCardShadow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/profile/change-plan');
            }}
          >
            <Image
              source={
                PLAN_PROFILE_IMAGES[profile?.plan_id ?? 'summer-body'] ??
                PLAN_PROFILE_IMAGES['summer-body']
              }
              style={styles.planImage}
              contentFit="cover"
            />
          </Pressable>
        ) : (
          <View style={styles.recoveryPlaceholder}>
            <Text style={styles.recoveryText}>Recovery coming soon</Text>
          </View>
        )}

        {/* Workout history by week */}
        {weekGroups.map((group) => (
          <View key={group.weekKey} style={styles.weekSection}>
            <Text style={styles.weekLabel}>{group.label}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.weekRow}
              style={styles.weekScroll}
            >
              {group.workouts.map((workout, i) => {
                const rotation = ['-0.5deg', '1deg', '-1deg'][i % 3];
                return (
                  <Pressable
                    key={workout.id}
                    style={[styles.photoCardShadow, { transform: [{ rotate: rotation }] }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/workout-detail?id=${workout.id}`);
                    }}
                  >
                    <View style={styles.photoCardInner}>
                      {workout.imageUri ? (
                        <Image
                          source={{ uri: workout.imageUri }}
                          style={styles.photoCardImage}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={styles.photoCardPlaceholder}>
                          <Text style={styles.photoCardName} numberOfLines={3}>
                            {workout.name ?? 'Workout'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ))}

        {/* Help Us Grow */}
        <Pressable style={styles.reviewShadow} onPress={handleReview}>
          <View style={styles.reviewInner}>
            <Image
              source={require('../../assets/Profile Assets/help-us-grow.png')}
              style={styles.reviewImage}
              contentFit="cover"
            />
          </View>
        </Pressable>

        {__DEV__ && (
          <View style={styles.devAuthSection}>
            <Text style={styles.devLabel}>DEV: Switch Account</Text>
            <Pressable
              style={[styles.devAuthBtn, styles.devAppleBtn]}
              onPress={handleAppleSignIn}
              disabled={isAppleLoading || isGoogleLoading}
            >
              {isAppleLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.devBtnRow}>
                  <Ionicons name="logo-apple" size={18} color="#fff" />
                  <Text style={styles.devAppleText}>Sign in with Apple</Text>
                </View>
              )}
            </Pressable>
            <Pressable
              style={[styles.devAuthBtn, styles.devGoogleBtn]}
              onPress={handleGoogleSignIn}
              disabled={isAppleLoading || isGoogleLoading}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.devGoogleText}>Sign in with Google</Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Bio edit modal */}
      <Modal
        visible={bioModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBioModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setBioModalVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalKAV}
          pointerEvents="box-none"
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Your Bio</Text>
            <TextInput
              style={styles.modalInput}
              value={bioText}
              onChangeText={setBioText}
              placeholder="Write something about yourself..."
              placeholderTextColor="#BBBBBB"
              multiline
              maxLength={150}
              autoFocus
            />
            <Text style={styles.modalCount}>{bioText.length}/150</Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setBioModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSave} onPress={handleSaveBio}>
                <Text style={styles.modalSaveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  circleButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 10,
  },
  gearButtonContainer: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: LIQUID_TAB_BAR_HEIGHT + 24,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: -17,
  },
  avatar: {
    width: 166,
    height: 166,
    borderRadius: 83,
    overflow: 'hidden',
  },
  avatarLoading: {
    opacity: 0.5,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: '#000000',
    textAlign: 'center',
    marginTop: -26,
    letterSpacing: -0.4,
  },
  bioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    gap: 5,
  },
  bioText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: '#888888',
    letterSpacing: -0.2,
  },
  bioTextFilled: {
    color: '#444444',
  },
  bioIconGap: {
    marginTop: 1,
  },
  traitsContainer: {
    height: TRAITS_BOX_H,
    marginTop: 10,
    position: 'relative',
  },
  savedTraitPill: {
    position: 'absolute',
    height: TRAITS_PILL_H,
    borderRadius: TRAITS_PILL_H / 2,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedTraitText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#000000',
    letterSpacing: -0.3,
  },
  traitPill: {
    position: 'absolute',
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F3F3F3',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#DDDDDD',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  traitPillRound: {
    borderRadius: 22,
  },
  traitLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: '#BDBDBD',
    letterSpacing: -0.2,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginTop: 6,
  },
  tab: {
    alignItems: 'center',
    paddingBottom: 4,
  },
  tabLabel: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: 'rgba(0,0,0,0.2)',
    letterSpacing: -0.3,
  },
  tabLabelActive: {
    color: '#000000',
  },
  tabUnderline: {
    marginTop: 4,
    height: 3,
    width: '100%',
    backgroundColor: '#000000',
    borderRadius: 100,
  },
  planCardShadow: {
    marginTop: 8,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 6,
  },
  planImage: {
    width: '100%',
    aspectRatio: 1836 / 769,
    borderRadius: 20,
    overflow: 'hidden',
  },
  recoveryPlaceholder: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recoveryText: {
    fontFamily: fonts.instrumentSerifItalic,
    fontSize: 30,
    color: '#999999',
  },
  reviewShadow: {
    marginTop: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 6,
  },
  reviewInner: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  reviewImage: {
    width: '100%',
    aspectRatio: 3.2,
  },
  // Workout history
  weekSection: {
    marginTop: 20,
  },
  weekLabel: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: '#000000',
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  weekScroll: {
    marginHorizontal: -16,
  },
  weekRow: {
    paddingHorizontal: 16,
    gap: 12,
    paddingVertical: 8,
  },
  photoCardShadow: {
    width: 140,
    height: 168,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 6,
  },
  photoCardInner: {
    width: 140,
    height: 168,
    borderRadius: 20,
    overflow: 'hidden',
  },
  photoCardImage: {
    width: 140,
    height: 168,
  },
  photoCardPlaceholder: {
    width: 140,
    height: 168,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  photoCardName: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  // Dev auth
  devAuthSection: {
    marginTop: 28,
    gap: 10,
  },
  devLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: 'rgba(0,0,0,0.3)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  devAuthBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devAppleBtn: {
    backgroundColor: '#000',
  },
  devBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  devAppleText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: '#fff',
  },
  devGoogleBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  devGoogleText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: '#000',
  },
  // Bio modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalKAV: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#000000',
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  modalInput: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 12,
    padding: 14,
    minHeight: 90,
    textAlignVertical: 'top',
    letterSpacing: -0.2,
  },
  modalCount: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#BBBBBB',
    textAlign: 'right',
    marginTop: 6,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 500,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: '#888888',
  },
  modalSave: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 500,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  modalSaveText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
