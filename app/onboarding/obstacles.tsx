import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import QuestionLayout, { optionStyles } from '@/components/QuestionLayout';
import { useOnboardingStore } from '@/stores/onboardingStore';

type ObstacleId = 'consistency' | 'support' | 'schedule' | 'inspiration';

interface ObstacleOption {
  id: ObstacleId;
  label: string;
  icon: string;
}

const obstacleOptions: ObstacleOption[] = [
  { id: 'consistency', label: 'Lack of consistency', icon: '📉' },
  { id: 'support', label: 'Limited support', icon: '🤝' },
  { id: 'schedule', label: 'Busy schedule', icon: '📅' },
  { id: 'inspiration', label: 'Lack of workout inspiration', icon: '💡' },
];

export default function ObstaclesScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const { setAndSave, skipField } = useOnboardingStore();

  const handleSelect = (id: string) => {
    setSelected(id);
    setAndSave('mainObstacle', id);
    setTimeout(() => {
      router.push('/onboarding/accomplish');
    }, 300);
  };

  return (
    <QuestionLayout
      question="What's stopping you from reaching your goals?"
      progress={92}
      onSkip={() => {
        skipField('mainObstacle');
        router.push('/onboarding/accomplish');
      }}
    >
      <View style={optionStyles.optionsContainer}>
        {obstacleOptions.map((option) => {
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
