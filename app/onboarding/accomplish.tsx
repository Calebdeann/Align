import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import QuestionLayout, { optionStyles } from '@/components/QuestionLayout';

type AccomplishId = 'healthier' | 'energy' | 'motivated' | 'body';

interface AccomplishOption {
  id: AccomplishId;
  label: string;
  icon: string;
}

const accomplishOptions: AccomplishOption[] = [
  { id: 'healthier', label: 'Live healthier', icon: '🥗' },
  { id: 'energy', label: 'Boost my energy and mood', icon: '⚡' },
  { id: 'motivated', label: 'Stay motivated and consistent', icon: '🎯' },
  { id: 'body', label: 'Feel better about my body', icon: '💪' },
];

export default function AccomplishScreen() {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelected(id);
    setTimeout(() => {
      router.push('/onboarding/prediction');
    }, 300);
  };

  return (
    <QuestionLayout
      question="What would you like to accomplish?"
      progress={94}
      onSkip={() => router.push('/onboarding/prediction')}
    >
      <View style={optionStyles.optionsContainer}>
        {accomplishOptions.map((option) => {
          const isSelected = selected === option.id;
          return (
            <Pressable
              key={option.id}
              style={[optionStyles.optionCard, isSelected && optionStyles.optionCardSelected]}
              onPress={() => handleSelect(option.id)}
            >
              <View style={optionStyles.optionIcon}>
                <Text style={{ fontSize: 20, opacity: isSelected ? 1 : 0.8 }}>{option.icon}</Text>
              </View>
              <Text
                style={[optionStyles.optionText, isSelected && optionStyles.optionTextSelected]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </QuestionLayout>
  );
}
