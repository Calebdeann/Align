import { useState } from 'react';
import { View, Text, Pressable, Image, ImageSourcePropType } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import QuestionLayout, { optionStyles } from '@/components/QuestionLayout';
import { useOnboardingStore } from '@/stores/onboardingStore';

type FluctuationId = 'yes' | 'sometimes' | 'no';

interface FluctuationOption {
  id: FluctuationId;
  label: string;
  icon: ImageSourcePropType;
}

const fluctuationOptions: FluctuationOption[] = [
  { id: 'yes', label: 'Yes, noticeably', icon: require('../../assets/images/YesNoticeably.png') },
  { id: 'sometimes', label: 'Sometimes', icon: require('../../assets/images/Sometimes.png') },
  { id: 'no', label: 'Not really', icon: require('../../assets/images/NotReally.png') },
];

export default function EnergyFluctuationScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const { setAndSave, skipField } = useOnboardingStore();

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelected(id);
    setAndSave('energyFluctuation', id);
    setTimeout(() => {
      router.push('/onboarding/training-location');
    }, 300);
  };

  return (
    <QuestionLayout
      question="Does your energy for training tend to fluctuate throughout the month?"
      progress={50}
      onSkip={() => {
        skipField('energyFluctuation');
        router.push('/onboarding/training-location');
      }}
    >
      <View style={optionStyles.optionsContainer}>
        {fluctuationOptions.map((option) => {
          const isSelected = selected === option.id;
          return (
            <Pressable
              key={option.id}
              style={[optionStyles.optionCard, isSelected && optionStyles.optionCardSelected]}
              onPress={() => handleSelect(option.id)}
            >
              <View style={optionStyles.optionIcon}>
                <Image
                  source={option.icon}
                  style={{ width: 20, height: 20, tintColor: isSelected ? '#FFFFFF' : '#000000' }}
                  resizeMode="contain"
                />
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
