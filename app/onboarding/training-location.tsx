import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image, ImageSourcePropType } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import QuestionLayout, { optionStyles } from '@/components/QuestionLayout';
import { useOnboardingStore } from '@/stores/onboardingStore';

const locations: { id: string; label: string; icon: ImageSourcePropType }[] = [
  {
    id: 'commercial',
    label: 'Commercial Gym',
    icon: require('../../assets/images/Onboarding Icons/5. Where Train/fe_building.png'),
  },
  {
    id: 'small',
    label: 'Small Gym',
    icon: require('../../assets/images/Onboarding Icons/5. Where Train/icon-park-outline_building-four.png'),
  },
  {
    id: 'home',
    label: 'Home Gym',
    icon: require('../../assets/images/Onboarding Icons/5. Where Train/mdi_gym.png'),
  },
  {
    id: 'bodyweight',
    label: 'Body Weight',
    icon: require('../../assets/images/Onboarding Icons/5. Where Train/Vector.png'),
  },
];

export default function TrainingLocationScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const { setAndSave, skipField } = useOnboardingStore();

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelected(id);
    setAndSave('trainingLocation', id);
    setTimeout(() => {
      router.push('/onboarding/workout-frequency');
    }, 300);
  };

  return (
    <QuestionLayout
      question="Where do you train?"
      progress={60}
      onSkip={() => {
        skipField('trainingLocation');
        router.push('/onboarding/workout-frequency');
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
                <Image
                  source={location.icon}
                  style={{ width: 20, height: 20, tintColor: isSelected ? '#FFFFFF' : '#000000' }}
                  resizeMode="contain"
                />
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
