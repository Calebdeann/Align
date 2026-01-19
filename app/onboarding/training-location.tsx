import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import QuestionLayout, { optionStyles } from '@/components/QuestionLayout';
import { useOnboardingStore } from '@/stores/onboardingStore';

const locations = [
  { id: 'commercial', label: 'Commercial Gym', icon: '🏢' },
  { id: 'small', label: 'Small Gym', icon: '🏠' },
  { id: 'home', label: 'Home Gym', icon: '🏋️' },
  { id: 'bodyweight', label: 'Body Weight', icon: '🧘' },
];

export default function TrainingLocationScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const { setAndSave, skipField } = useOnboardingStore();

  const handleSelect = (id: string) => {
    setSelected(id);
    setAndSave('trainingLocation', id);
    setTimeout(() => {
      router.push('/onboarding/equipment');
    }, 300);
  };

  return (
    <QuestionLayout
      question="Where do you train?"
      progress={82}
      onSkip={() => {
        skipField('trainingLocation');
        router.push('/onboarding/equipment');
      }}
    >
      <View style={optionStyles.optionsContainer}>
        {locations.map((location) => {
          const isSelected = selected === location.id;
          return (
            <Pressable
              key={location.id}
              style={[optionStyles.optionCard, isSelected && optionStyles.optionCardSelected]}
              onPress={() => handleSelect(location.id)}
            >
              <View style={optionStyles.optionIcon}>
                <Text style={{ fontSize: 20, opacity: isSelected ? 1 : 0.8 }}>{location.icon}</Text>
              </View>
              <Text
                style={[optionStyles.optionText, isSelected && optionStyles.optionTextSelected]}
              >
                {location.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </QuestionLayout>
  );
}
