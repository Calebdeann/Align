import { useState } from 'react';
import { View, Text, Pressable, Image, ImageSourcePropType } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import QuestionLayout, { optionStyles } from '@/components/QuestionLayout';
import { useOnboardingStore } from '@/stores/onboardingStore';

type ObstacleId = 'consistency' | 'support' | 'schedule' | 'inspiration';

interface ObstacleOption {
  id: ObstacleId;
  label: string;
  icon: ImageSourcePropType;
}

const obstacleOptions: ObstacleOption[] = [
  {
    id: 'consistency',
    label: 'Lack of consistency',
    icon: require('../../assets/images/Onboarding Icons/3. Stopping you/solar_chart-2-bold.png'),
  },
  {
    id: 'support',
    label: 'Limited support',
    icon: require('../../assets/images/Onboarding Icons/3. Stopping you/material-symbols_handshake.png'),
  },
  {
    id: 'schedule',
    label: 'Busy schedule',
    icon: require('../../assets/images/Onboarding Icons/3. Stopping you/bx_calendar.png'),
  },
  {
    id: 'inspiration',
    label: 'Lack of workout inspiration',
    icon: require('../../assets/images/Onboarding Icons/3. Stopping you/mdi_fire.png'),
  },
];

export default function ObstaclesScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const { setAndSave, skipField } = useOnboardingStore();

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelected(id);
    setAndSave('mainObstacle', id);
    setTimeout(() => {
      router.push('/onboarding/accomplish');
    }, 300);
  };

  return (
    <QuestionLayout
      question="What's stopping you from reaching your goals?"
      progress={48}
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
                <Image
                  source={option.icon}
                  style={{ width: 20, height: 20, tintColor: isSelected ? '#FFFFFF' : '#000000' }}
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
