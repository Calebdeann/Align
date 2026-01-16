import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize, spacing, cardStyle } from '@/constants/theme';

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

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.headerTitle}>Profile</Text>

        {/* Profile Card */}
        <Pressable style={styles.profileCard} onPress={() => {}}>
          <Image source={require('../../assets/images/Girl 1.png')} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Cass Killeen</Text>
            <Text style={styles.profileUsername}>@Cassie921</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </Pressable>

        {/* Invite Friends */}
        <SectionHeader title="Invite Friends" />
        <MenuCard>
          <Pressable style={styles.referralCard} onPress={() => {}}>
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
            onPress={() => {}}
          />
          <MenuItem
            icon={<Ionicons name="globe-outline" size={20} color={colors.text} />}
            label="Manage Subscription"
            onPress={() => {}}
          />
          <MenuItem
            icon={<Ionicons name="language-outline" size={20} color={colors.text} />}
            label="Language"
            onPress={() => {}}
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
            onPress={() => {}}
          />
          <MenuItem
            icon={<Ionicons name="notifications-outline" size={20} color={colors.text} />}
            label="Notifications"
            onPress={() => setNotificationsEnabled(!notificationsEnabled)}
            showArrow={false}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <MenuItem
            icon={<Ionicons name="heart-outline" size={20} color={colors.text} />}
            label="Apple Health"
            onPress={() => {}}
            showDivider={false}
          />
        </MenuCard>

        {/* Support */}
        <SectionHeader title="Preferences" />
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
            onPress={() => {}}
          />
          <MenuItem
            icon={<Ionicons name="trash-outline" size={20} color={colors.text} />}
            label="Delete Account"
            onPress={() => {}}
            showDivider={false}
          />
        </MenuCard>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  profileName: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  profileUsername: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
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
});
