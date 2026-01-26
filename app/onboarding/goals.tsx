import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image, ImageSourcePropType } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import QuestionLayout, { optionStyles } from '@/components/QuestionLayout';
import { useOnboardingStore } from '@/stores/onboardingStore';

const goals: { id: string; label: string; icon: ImageSourcePropType }[] = [
  {
    id: 'lose',
    label: 'Lose Weight',
    icon: require('../../assets/images/Onboarding Icons/1. Main Goal/Vector.png'),
  },
  {
    id: 'tone',
    label: 'Tone & Shape',
    icon: require('../../assets/images/Onboarding Icons/1. Main Goal/Vector-1.png'),
  },
  {
    id: 'health',
    label: 'Improve Health',
    icon: require('../../assets/images/Onboarding Icons/1. Main Goal/Vector-2.png'),
  },
  {
    id: 'love',
    label: 'Find Self-Love',
    icon: require('../../assets/images/Onboarding Icons/1. Main Goal/Vector-3.png'),
  },
];

export default function GoalsScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const { setAndSave, skipField } = useOnboardingStore();

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelected(id);
    setAndSave('mainGoal', id);
    setTimeout(() => {
      router.push('/onboarding/other-goals');
    }, 300);
  };

  return (
    <QuestionLayout
      question="What is your main goal?"
      progress={8}
      onSkip={() => {
        skipField('mainGoal');
        router.push('/onboarding/other-goals');
      }}
    >
      <View style={optionStyles.optionsContainer}>
        {goals.map((goal) => {
          const isSelected = selected === goal.id;
          return (
            <Pressable
              key={goal.id}
              style={[optionStyles.optionCard, isSelected && optionStyles.optionCardSelected]}
              onPress={() => handleSelect(goal.id)}
            >
              <View style={optionStyles.optionIcon}>
                <Image
                  source={goal.icon}
                  style={{ width: 20, height: 20, tintColor: isSelected ? '#FFFFFF' : '#000000' }}
                  resizeMode="contain"
                />
              </View>
              <Text
                style={[optionStyles.optionText, isSelected && optionStyles.optionTextSelected]}
              >
                {goal.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </QuestionLayout>
  );
}
