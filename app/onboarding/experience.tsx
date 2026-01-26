import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import QuestionLayout, { optionStyles } from '@/components/QuestionLayout';
import { useOnboardingStore } from '@/stores/onboardingStore';

const experienceLevels = [
  { id: 'never', label: "I've never worked out", bars: 1 },
  { id: 'beginner', label: 'Beginner - Tried it before', bars: 2 },
  { id: 'intermediate', label: 'Intermediate - Regular training', bars: 3 },
  { id: 'advanced', label: 'Advanced - Years of experience', bars: 4 },
];

function BarIcon({ filled, isSelected }: { filled: number; isSelected: boolean }) {
  const filledColor = isSelected ? '#FFFFFF' : '#000000';
  const emptyColor = isSelected ? 'rgba(255,255,255,0.4)' : '#E0E0E0';

  return (
    <View style={styles.barIcon}>
      {[1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={[
            styles.bar,
            { height: 5 + i * 3 },
            { backgroundColor: i <= filled ? filledColor : emptyColor },
          ]}
        />
      ))}
    </View>
  );
}

export default function ExperienceScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const { setAndSave, skipField } = useOnboardingStore();

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelected(id);
    setAndSave('experienceLevel', id);
    setTimeout(() => {
      router.push('/onboarding/goals');
    }, 300);
  };

  return (
    <QuestionLayout
      question="How experienced are you with working out?"
      progress={4}
      onSkip={() => {
        skipField('experienceLevel');
        router.push('/onboarding/goals');
      }}
    >
      <View style={optionStyles.optionsContainer}>
        {experienceLevels.map((level) => {
          const isSelected = selected === level.id;
          return (
            <Pressable
              key={level.id}
              style={[optionStyles.optionCard, isSelected && optionStyles.optionCardSelected]}
              onPress={() => handleSelect(level.id)}
            >
              <View style={optionStyles.optionIcon}>
                <BarIcon filled={level.bars} isSelected={isSelected} />
              </View>
              <Text
                style={[optionStyles.optionText, isSelected && optionStyles.optionTextSelected]}
              >
                {level.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </QuestionLayout>
  );
}

const styles = StyleSheet.create({
  barIcon: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    width: 20,
    height: 20,
  },
  bar: {
    width: 3,
    borderRadius: 1,
  },
});
