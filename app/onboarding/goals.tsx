import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import QuestionLayout, { optionStyles } from '@/components/QuestionLayout';
import { colors, fonts, fontSize, spacing, radius } from '@/constants/theme';

const goals = [
  { id: 'lose', label: 'Lose Weight', icon: '⚖️' },
  { id: 'tone', label: 'Tone & Shape', icon: '✨' },
  { id: 'health', label: 'Improve Health', icon: '❤️' },
  { id: 'love', label: 'Find Self-Love', icon: '🦋' },
];

export default function GoalsScreen() {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelected(id);
    setTimeout(() => {
      router.push('/onboarding/other-goals');
    }, 300);
  };

  return (
    <QuestionLayout
      question="What is your main goal?"
      progress={20}
      onSkip={() => router.push('/onboarding/other-goals')}
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
                <Text style={{ fontSize: 20, opacity: isSelected ? 1 : 0.8 }}>{goal.icon}</Text>
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
