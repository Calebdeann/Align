import { useState } from 'react';
import { View, Text, Pressable, Image, ImageSourcePropType } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import QuestionLayout, { optionStyles } from '@/components/QuestionLayout';
import { useOnboardingStore } from '@/stores/onboardingStore';

type ObstacleId = 'consistency' | 'schedule' | 'energy' | 'hormonal' | 'life';

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
    id: 'schedule',
    label: 'Busy schedule',
    icon: require('../../assets/images/Onboarding Icons/3. Stopping you/bx_calendar.png'),
  },
  {
    id: 'energy',
    label: 'Low energy / motivation',
    icon: require('../../assets/images/Energy.png'),
  },
  {
    id: 'hormonal',
    label: 'Hormonal changes or period',
    icon: require('../../assets/images/Hormonal.png'),
  },
  {
    id: 'life',
    label: 'Life stuff (travel, stress)',
    icon: require('../../assets/images/LifeStuff.png'),
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
      router.push('/onboarding/energy-fluctuation');
    }, 300);
  };

  return (
    <QuestionLayout
      question="What usually throws off your training?"
      progress={48}
      onSkip={() => {
        skipField('mainObstacle');
        router.push('/onboarding/energy-fluctuation');
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
