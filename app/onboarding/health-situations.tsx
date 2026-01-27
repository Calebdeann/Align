import { useState } from 'react';
import { View, Text, Pressable, Image, ImageSourcePropType } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import QuestionLayout, { optionStyles } from '@/components/QuestionLayout';
import { useOnboardingStore } from '@/stores/onboardingStore';

type SituationId = 'none' | 'injury' | 'pregnant' | 'postpartum' | 'menopause';

interface SituationOption {
  id: SituationId;
  label: string;
  icon: ImageSourcePropType;
}

const situationOptions: SituationOption[] = [
  { id: 'none', label: 'No', icon: require('../../assets/images/No.png') },
  { id: 'injury', label: 'Injury or recovery', icon: require('../../assets/images/Injury.png') },
  {
    id: 'pregnant',
    label: 'Pregnant or planning',
    icon: require('../../assets/images/Pregnant.png'),
  },
  {
    id: 'postpartum',
    label: 'Postpartum recovery',
    icon: require('../../assets/images/Postpartum.png'),
  },
  { id: 'menopause', label: 'Menopause', icon: require('../../assets/images/Menopause.png') },
];

export default function HealthSituationsScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const { setAndSave, skipField } = useOnboardingStore();

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelected(id);
    setAndSave('healthSituation', id);
    setTimeout(() => {
      router.push('/onboarding/obstacles');
    }, 300);
  };

  return (
    <QuestionLayout
      question="Are you in any of the following situations?"
      progress={46}
      onSkip={() => {
        skipField('healthSituation');
        router.push('/onboarding/obstacles');
      }}
    >
      <View style={optionStyles.optionsContainer}>
        {situationOptions.map((option) => {
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
