import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import QuestionLayout, { optionStyles } from '@/components/QuestionLayout';
import { colors, radius } from '@/constants/theme';

const otherGoals = [
  { id: 'confidence', label: 'Gain confidence', icon: '✨' },
  { id: 'strength', label: 'Build strength', icon: '💪' },
  { id: 'look', label: 'Look better', icon: '🪞' },
  { id: 'energy', label: 'Feel more energized', icon: '⚡' },
];

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View
      style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: checked ? '#FFFFFF' : '#E0E0E0',
        backgroundColor: checked ? '#FFFFFF' : 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {checked && (
        <View
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: colors.primary,
          }}
        />
      )}
    </View>
  );
}

export default function OtherGoalsScreen() {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  return (
    <QuestionLayout
      question="Are there any other goals you want to achieve?"
      progress={30}
      showContinue
      onContinue={() => router.push('/onboarding/potential')}
      onSkip={() => router.push('/onboarding/potential')}
    >
      <View style={optionStyles.optionsContainer}>
        {otherGoals.map((goal) => {
          const isSelected = selected.includes(goal.id);
          return (
            <Pressable
              key={goal.id}
              style={[optionStyles.optionCard, isSelected && optionStyles.optionCardSelected]}
              onPress={() => toggleSelect(goal.id)}
            >
              <View style={optionStyles.optionIcon}>
                <Text style={{ fontSize: 20, opacity: isSelected ? 1 : 0.8 }}>{goal.icon}</Text>
              </View>
              <Text
                style={[optionStyles.optionText, isSelected && optionStyles.optionTextSelected]}
              >
                {goal.label}
              </Text>
              <Checkbox checked={isSelected} />
            </Pressable>
          );
        })}
      </View>
    </QuestionLayout>
  );
}
