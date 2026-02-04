import { useState, useMemo } from 'react';
import { View, Text, Pressable, Image, ImageSourcePropType } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import QuestionLayout, { optionStyles } from '@/components/QuestionLayout';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useNavigationLock } from '@/hooks/useNavigationLock';

type FluctuationId = 'yes' | 'sometimes' | 'no';

interface FluctuationOption {
  id: FluctuationId;
  label: string;
  icon: ImageSourcePropType;
}

export default function EnergyFluctuationScreen() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const { setAndSave, skipField } = useOnboardingStore();
  const { isNavigating, withLock } = useNavigationLock();

  const fluctuationOptions: FluctuationOption[] = useMemo(
    () => [
      {
        id: 'yes',
        label: t('onboarding.energyFluctuation.yesNoticeably'),
        icon: require('../../assets/images/ThumbsUp.png'),
      },
      {
        id: 'sometimes',
        label: t('onboarding.energyFluctuation.sometimes'),
        icon: require('../../assets/images/Sometimes_icon.png'),
      },
      {
        id: 'no',
        label: t('onboarding.energyFluctuation.notReally'),
        icon: require('../../assets/images/ThumbsDown.png'),
      },
    ],
    [t]
  );

  const handleSelect = (id: string) => {
    withLock(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setSelected(id);
      setAndSave('energyFluctuation', id);
      setTimeout(() => {
        router.push('/onboarding/reminder');
      }, 300);
    });
  };

  return (
    <QuestionLayout
      navigationDisabled={isNavigating}
      question={t('onboarding.energyFluctuation.question')}
      progress={50}
      onSkip={() => {
        skipField('energyFluctuation');
        router.push('/onboarding/reminder');
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
