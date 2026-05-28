import { useState, type ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Alert,
  Linking,
  Image,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as StoreReview from 'expo-store-review';
import Constants from 'expo-constants';
import { fonts, spacing } from '@/constants/theme';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { supabase } from '@/services/supabase';
import { CircleBackButton } from '@/components';
import { deleteUserAccount } from '@/services/api/user';
import { clearUserDataFromStorage } from '@/lib/storeManager';

// ── Stroke icon helpers ──────────────────────────────────────────────────────

const S = {
  fill: 'none',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function PersonIcon({ color = '#000' }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx="12" cy="7" r="4" stroke={color} {...S} />
      <Path stroke={color} {...S} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    </Svg>
  );
}

function GlobeIcon({ color = '#000' }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="10" stroke={color} {...S} />
      <Path
        stroke={color}
        {...S}
        d="M2 12h20M12 2c-2.8 2.5-4 6-4 10s1.2 7.5 4 10M12 2c2.8 2.5 4 6 4 10s-1.2 7.5-4 10"
      />
    </Svg>
  );
}

function StarIcon({ color = '#000' }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        stroke={color}
        {...S}
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      />
    </Svg>
  );
}

function SlidersIcon({ color = '#000' }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        stroke={color}
        {...S}
        d="M4 21V14M4 10V3M12 21V13M12 9V3M20 21V17M20 13V3M1 14h6M9 9h6M17 17h6"
      />
    </Svg>
  );
}

function BellIcon({ color = '#000' }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        stroke={color}
        {...S}
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
      />
    </Svg>
  );
}

function InstagramIcon({ color = '#000' }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke={color} {...S} />
      <Circle cx="12" cy="12" r="4" stroke={color} {...S} />
      <Circle cx="17.5" cy="6.5" r="1" fill={color} />
    </Svg>
  );
}

function TikTokIcon({ color = '#000' }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      {/* Note-head circle */}
      <Circle cx="10" cy="16" r="4" stroke={color} {...S} />
      {/* Vertical stem */}
      <Path stroke={color} {...S} d="M14 16V4" />
      {/* Top hook */}
      <Path stroke={color} {...S} d="M14 4c2 0 5 1 6 4" />
    </Svg>
  );
}

function MailIcon({ color = '#000' }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        stroke={color}
        {...S}
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6"
      />
    </Svg>
  );
}

function DocumentIcon({ color = '#000' }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        stroke={color}
        {...S}
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8"
      />
    </Svg>
  );
}

function ShieldIcon({ color = '#000' }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path stroke={color} {...S} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Svg>
  );
}

function LogOutIcon({ color = '#000' }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        stroke={color}
        {...S}
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
      />
    </Svg>
  );
}

function TrashIcon({ color = '#000' }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        stroke={color}
        {...S}
        d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
      />
    </Svg>
  );
}

// ── Row & Section components ─────────────────────────────────────────────────

type RowProps = {
  icon: ReactNode;
  label: string;
  danger?: boolean;
  rightValue?: string;
  showToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
  isLast?: boolean;
};

function Row({
  icon,
  label,
  danger,
  rightValue,
  showToggle,
  toggleValue,
  onToggle,
  onPress,
  isLast,
}: RowProps) {
  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && !showToggle && styles.rowPressed]}
        onPress={
          showToggle
            ? undefined
            : () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                onPress?.();
              }
        }
      >
        <View style={styles.rowIconWrap}>{icon}</View>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
        {rightValue !== undefined && <Text style={styles.rowValue}>{rightValue}</Text>}
        {showToggle ? (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            ios_backgroundColor="#E5E5EA"
            style={styles.toggle}
          />
        ) : (
          <Text style={[styles.chevron, danger && styles.chevronDanger]}>›</Text>
        )}
      </Pressable>
      {!isLast && <View style={styles.divider} />}
    </>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.card}>
        <View style={styles.cardInner}>{children}</View>
      </View>
    </>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

const DANGER_COLOR = '#FB5057';

export default function SettingsScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const bruceHeight = Math.round(screenWidth / (1926 / 708));
  const [notificationsOn, setNotificationsOn] = useState(true);

  const profile = useUserProfileStore((state) => state.profile);
  const clearProfile = useUserProfileStore((state) => state.clearProfile);

  function haptic() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }

  function openNameEdit() {
    haptic();
    router.push('/profile/edit-name');
  }

  async function handleRateUs() {
    haptic();
    const available = await StoreReview.isAvailableAsync();
    if (available) {
      StoreReview.requestReview();
    } else {
      Linking.openURL('https://apps.apple.com/app/id0000000000');
    }
  }

  async function handleLogOut() {
    haptic();
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/');
        },
      },
    ]);
  }

  function handleDeleteAccount() {
    haptic();
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const userId = profile?.id;
            const deleted = await deleteUserAccount();
            if (!deleted) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
              return;
            }
            try {
              if (userId) await clearUserDataFromStorage(userId);
              clearProfile();
              await supabase.auth.signOut();
            } catch {
              // Local cleanup failed — still navigate away since DB record is gone
            }
            router.replace('/');
          },
        },
      ]
    );
  }

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <CircleBackButton />
        <Text style={styles.title}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
      >
        <Section label="Account">
          <Row
            icon={<PersonIcon />}
            label="Your name"
            rightValue={profile?.name ?? ''}
            onPress={openNameEdit}
          />
          <Row
            icon={<GlobeIcon />}
            label="Language"
            onPress={() => {
              haptic();
              router.push('/profile/select-language');
            }}
          />
          <Row icon={<StarIcon />} label="Rate us" onPress={handleRateUs} isLast />
        </Section>

        <Section label="Preferences">
          <Row
            icon={<SlidersIcon />}
            label="Units"
            onPress={() => {
              haptic();
              router.push('/profile/select-units');
            }}
          />
          <Row
            icon={<BellIcon />}
            label="Notifications"
            showToggle
            toggleValue={notificationsOn}
            onToggle={(v) => {
              haptic();
              setNotificationsOn(v);
            }}
            isLast
          />
        </Section>

        <Section label="Follow Us">
          <Row
            icon={<InstagramIcon />}
            label="Instagram"
            onPress={() => {
              haptic();
              Linking.openURL('https://www.instagram.com/itgirll.app/?hl=en');
            }}
          />
          <Row
            icon={<TikTokIcon />}
            label="TikTok"
            onPress={() => {
              haptic();
              Linking.openURL('https://www.tiktok.com/@snatched.tracker');
            }}
            isLast
          />
        </Section>

        <Section label="Support">
          <Row
            icon={<MailIcon />}
            label="Help & Support"
            onPress={() => {
              haptic();
              Linking.openURL('https://itgirlsupport.carrd.co/');
            }}
          />
          <Row
            icon={<DocumentIcon />}
            label="Terms & Conditions"
            onPress={() => {
              haptic();
              Linking.openURL('https://itgirltermsandconditions.carrd.co/');
            }}
          />
          <Row
            icon={<ShieldIcon />}
            label="Privacy Policy"
            onPress={() => {
              haptic();
              Linking.openURL('https://itgirlprivacypolicy.carrd.co/');
            }}
            isLast
          />
        </Section>

        <Section label="Actions">
          <Row
            icon={<LogOutIcon color={DANGER_COLOR} />}
            label="Log Out"
            danger
            onPress={handleLogOut}
          />
          <Row
            icon={<TrashIcon color={DANGER_COLOR} />}
            label="Delete Account"
            danger
            onPress={handleDeleteAccount}
            isLast
          />
        </Section>

        <View style={styles.footer}>
          <Text style={styles.version}>v{version}</Text>
        </View>

        <Image
          source={require('../assets/images/BrucePic.png')}
          style={[styles.bruce, { width: screenWidth, height: bruceHeight }]}
          resizeMode="contain"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  title: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 20,
    color: '#000000',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  headerSpacer: {
    width: 46,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  sectionLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: '#666666',
    letterSpacing: -0.3,
    marginHorizontal: spacing.lg,
    marginTop: 24,
    marginBottom: 8,
  },
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 5,
  },
  cardInner: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  rowPressed: {
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  rowIconWrap: {
    width: 24,
    height: 24,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: '#000000',
    letterSpacing: -0.3,
  },
  rowLabelDanger: {
    color: DANGER_COLOR,
  },
  rowValue: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: 'rgba(0,0,0,0.4)',
    letterSpacing: -0.3,
    marginRight: 4,
  },
  chevron: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: 'rgba(0,0,0,0.25)',
    lineHeight: 22,
  },
  chevronDanger: {
    color: 'rgba(251,80,87,0.4)',
  },
  toggle: {},
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(217,217,217,0.8)',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 32,
  },
  bruce: {
    marginTop: 16,
  },
  version: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: 'rgba(102,102,102,0.5)',
    letterSpacing: -0.2,
  },
});
