import { useState, useMemo } from 'react';
import { View, Text, Pressable, Image, ImageSourcePropType } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import QuestionLayout, { optionStyles } from '@/components/QuestionLayout';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useNavigationLock } from '@/hooks/useNavigationLock';

export default function BodyChangeScreen() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const { setAndSave, skipField } = useOnboardingStore();
  const { isNavigating, withLock } = useNavigationLock();

  const bodyChangeOptions: { id: string; label: string; icon: ImageSourcePropType }[] = useMemo(
    () => [
      {
        id: 'lose_weight',
        label: t('onboarding.bodyChange.loseWeight'),
        icon: require('../../assets/images/LoseWeight.png'),
      },
      {
        id: 'tone_shape',
        label: t('onboarding.bodyChange.toneShape'),
        icon: require('../../assets/images/ToneShape.png'),
      },
      {
        id: 'gain_weight',
        label: t('onboarding.bodyChange.gainWeight'),
        icon: require('../../assets/images/GainWeight.png'),
      },
      {
        id: 'build_curves',
        label: t('onboarding.bodyChange.buildCurves'),
        icon: require('../../assets/images/BuildCurves.png'),
      },
    ],
    [t]
  );

  const handleSelect = (id: string) => {
    withLock(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setSelected(id);
      setAndSave('bodyChangeGoal', id);
      setTimeout(() => {
        router.push('/onboarding/potential');
      }, 300);
    });
  };

  return (
    <QuestionLayout
      navigationDisabled={isNavigating}
      question={t('onboarding.bodyChange.question')}
      progress={12}
      onSkip={() => {
        skipField('bodyChangeGoal');
        router.push('/onboarding/potential');
      }}
    >
      <View style={optionStyles.optionsContainer}>
        {bodyChangeOptions.map((option) => {
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
