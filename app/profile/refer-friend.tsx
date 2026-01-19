import { View, Text, StyleSheet, Pressable, Image, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useUserProfileStore } from '@/stores/userProfileStore';

const SAMPLE_AVATARS = [
  require('../../assets/images/Girl 1.png'),
  require('../../assets/images/Girl 1.png'),
  require('../../assets/images/Girl 1.png'),
  require('../../assets/images/Girl 1.png'),
  require('../../assets/images/Girl 1.png'),
  require('../../assets/images/Girl 1.png'),
  require('../../assets/images/Girl 1.png'),
];

// Generate a deterministic referral code from user ID (always same for same user)
function generateReferralCodeFromUserId(userId: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';

  // Use the user ID to seed the code generation
  // Take characters from different parts of the UUID to create variety
  const cleanId = userId.replace(/-/g, '').toUpperCase();

  for (let i = 0; i < 6; i++) {
    // Use different positions in the UUID for each character
    const charIndex = parseInt(cleanId.charAt(i * 4) || cleanId.charAt(i), 16) % chars.length;
    code += chars.charAt(charIndex);
  }

  return code;
}

export default function ReferFriendScreen() {
  const { userId } = useUserProfileStore();

  // Generate code deterministically from userId - always the same for same user
  const promoCode = userId ? generateReferralCodeFromUserId(userId) : null;

  const handleShare = async () => {
    if (!promoCode) return;

    try {
      await Share.share({
        message: `Join me on Align! Use my promo code ${promoCode} to get started. Download now!`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Referrals</Text>
        <View style={styles.backButton} />
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>Refer a Friend</Text>

        {/* Avatar Circle */}
        <View style={styles.avatarCircle}>
          {SAMPLE_AVATARS.map((avatar, index) => {
            const angle = (index * 360) / SAMPLE_AVATARS.length - 90;
            const radius = 70;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;

            return (
              <Image
                key={index}
                source={avatar}
                style={[
                  styles.circleAvatar,
                  {
                    transform: [{ translateX: x }, { translateY: y }],
                  },
                ]}
              />
            );
          })}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Logo</Text>
          </View>
        </View>

        <Text style={styles.heroSubtitle}>Empower your friends</Text>
        <Text style={styles.heroSubtitleSecondary}>& grow together</Text>
      </View>

      {/* Promo Code Section */}
      <View style={styles.promoSection}>
        <Text style={styles.promoLabel}>Your personal promo code</Text>
        <Text style={styles.promoCode}>{promoCode || '------'}</Text>
      </View>

      {/* Share Button */}
      <View style={styles.shareButtonContainer}>
        <Pressable
          style={[styles.shareButton, !promoCode && styles.shareButtonDisabled]}
          onPress={handleShare}
          disabled={!promoCode}
        >
          <Text style={styles.shareButtonText}>Share</Text>
        </Pressable>
      </View>

      {/* How to Earn Section */}
      <View style={styles.earnSection}>
        <View style={styles.earnHeader}>
          <Text style={styles.earnTitle}>How to earn</Text>
          <View style={styles.dollarBadge}>
            <Text style={styles.dollarText}>$</Text>
          </View>
        </View>

        <View style={styles.earnSteps}>
          <Text style={styles.earnStep}>1. Share your promo code to your friends</Text>
          <Text style={styles.earnStep}>2. Earn $5 per friend that signs up with your code</Text>
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
  heroSection: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  heroTitle: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  avatarCircle: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  circleAvatar: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.background,
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    color: colors.textInverse,
  },
  heroSubtitle: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  heroSubtitleSecondary: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  promoSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  promoLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  promoCode: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xl,
    color: colors.text,
    letterSpacing: 2,
  },
  shareButtonContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  shareButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 30,
    alignItems: 'center',
  },
  shareButtonDisabled: {
    backgroundColor: colors.border,
  },
  shareButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.textInverse,
  },
  earnSection: {
    paddingHorizontal: spacing.lg,
  },
  earnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  earnTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  dollarBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dollarText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xs,
    color: colors.textInverse,
  },
  earnSteps: {
    gap: spacing.xs,
  },
  earnStep: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
