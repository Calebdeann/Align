import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image, ImageSourcePropType } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import QuestionLayout, { optionStyles } from '@/components/QuestionLayout';
import { useOnboardingStore } from '@/stores/onboardingStore';

type AccomplishId = 'healthier' | 'energy' | 'motivated' | 'body';

interface AccomplishOption {
  id: AccomplishId;
  label: string;
  icon: ImageSourcePropType;
}

const accomplishOptions: AccomplishOption[] = [
  {
    id: 'healthier',
    label: 'Live healthier',
    icon: require('../../assets/images/Onboarding Icons/4. Accomplish/healthicons_health-outline-24px.png'),
  },
  {
    id: 'energy',
    label: 'Boost my energy and mood',
    icon: require('../../assets/images/Onboarding Icons/4. Accomplish/solar_sun-bold.png'),
  },
  {
    id: 'motivated',
    label: 'Stay motivated and consistent',
    icon: require('../../assets/images/Onboarding Icons/4. Accomplish/mdi_arm-flex.png'),
  },
  {
    id: 'body',
    label: 'Feel better about my body',
    icon: require('../../assets/images/Onboarding Icons/4. Accomplish/grommet-icons_yoga.png'),
  },
];

export default function AccomplishScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const { setAndSave, skipField, currentWeight, targetWeight } = useOnboardingStore();

  // Check if user is maintaining weight (not trying to gain or lose)
  const isMaintaining = Math.abs(targetWeight - currentWeight) < 0.5;

  const getNextScreen = () => {
    // Skip prediction screen if maintaining weight
    return isMaintaining ? '/onboarding/training-location' : '/onboarding/prediction';
  };

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelected(id);
    setAndSave('accomplish', id);
    setTimeout(() => {
      router.push(getNextScreen());
    }, 300);
  };

  return (
    <QuestionLayout
      question="What would you like to accomplish?"
      progress={52}
      onSkip={() => {
        skipField('accomplish');
        router.push(getNextScreen());
      }}
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
