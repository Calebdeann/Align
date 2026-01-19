import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';

type EquipmentItem = {
  id: string;
  label: string;
  selected: boolean;
};

type EquipmentSection = {
  title: string;
  items: EquipmentItem[];
};

const initialEquipment: EquipmentSection[] = [
  {
    title: 'Small Weights',
    items: [
      { id: 'dumbbell', label: 'Dumbbell', selected: true },
      { id: 'kettlebell', label: 'Kettlebell', selected: true },
    ],
  },
  {
    title: 'Bars & Plates',
    items: [
      { id: 'barbell', label: 'Barbell', selected: true },
      { id: 'plate', label: 'Plate', selected: true },
      { id: 'ez-bar', label: 'EZ Bar', selected: true },
    ],
  },
  {
    title: 'Machines',
    items: [
      { id: 'cable', label: 'Cable Machine', selected: true },
      { id: 'smith', label: 'Smith Machine', selected: true },
      { id: 'leg-press', label: 'Leg Press', selected: true },
    ],
  },
  {
    title: 'Cardio',
    items: [
      { id: 'treadmill', label: 'Treadmill', selected: true },
      { id: 'bike', label: 'Stationary Bike', selected: true },
      { id: 'elliptical', label: 'Elliptical', selected: true },
    ],
  },
];

export default function EquipmentScreen() {
  const [equipment, setEquipment] = useState(initialEquipment);

  const toggleItem = (sectionIndex: number, itemId: string) => {
    setEquipment((prev) =>
      prev.map((section, idx) =>
        idx === sectionIndex
          ? {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId ? { ...item, selected: !item.selected } : item
              ),
            }
          : section
      )
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <View style={[styles.progressBarFill, { width: '85%' }]} />
        </View>

        <Pressable
          onPress={() => {
            useOnboardingStore.getState().skipField('equipment');
            router.push('/onboarding/workout-frequency');
          }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Review your equipment</Text>
        <Text style={styles.subtitle}>
          We selected these based on where you train. You can edit this now or adjust later
        </Text>
      </View>

      {/* Scrollable Equipment List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {equipment.map((section, sectionIndex) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.equipmentRow}
                  onPress={() => toggleItem(sectionIndex, item.id)}
                >
                  <View style={styles.imagePlaceholder} />
                  <Text style={styles.equipmentLabel}>{item.label}</Text>
                  <View style={[styles.checkbox, item.selected && styles.checkboxSelected]}>
                    {item.selected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Continue button */}
      <View style={styles.bottomSection}>
        <Pressable
          style={styles.continueButton}
          onPress={() => {
            // Get all selected equipment IDs
            const selectedEquipment = equipment
              .flatMap((section) => section.items)
              .filter((item) => item.selected)
              .map((item) => item.id);
            useOnboardingStore.getState().setAndSave('equipment', selectedEquipment);
            router.push('/onboarding/workout-frequency');
          }}
        >
          <Text style={styles.continueText}>Continue</Text>
        </Pressable>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  backArrow: {
    fontSize: 24,
    color: colors.text,
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    position: 'relative',
  },
  progressBarBackground: {
    position: 'absolute',
    width: '100%',
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  progressBarFill: {
    position: 'absolute',
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  skipText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  titleContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  sectionContent: {
    backgroundColor: colors.primaryLight + '20',
  },
  equipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  imagePlaceholder: {
    width: 70,
    height: 70,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    marginRight: spacing.md,
  },
  equipmentLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 100,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  continueText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.lg,
    color: '#FFFFFF',
  },
});
