import { useState, useMemo } from 'react';
import { View, Text, Pressable, Image, ImageSourcePropType } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import QuestionLayout, { optionStyles } from '@/components/QuestionLayout';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useNavigationLock } from '@/hooks/useNavigationLock';

type SituationId = 'none' | 'injury' | 'pregnant' | 'postpartum' | 'menopause';

interface SituationOption {
  id: SituationId;
  label: string;
  icon: ImageSourcePropType;
}

export default function HealthSituationsScreen() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const { setAndSave, skipField } = useOnboardingStore();
  const { isNavigating, withLock } = useNavigationLock();

  const situationOptions: SituationOption[] = useMemo(
    () => [
      {
        id: 'none',
        label: t('onboarding.healthSituations.none'),
        icon: require('../../assets/images/No_icon.png'),
      },
      {
        id: 'injury',
        label: t('onboarding.healthSituations.injury'),
        icon: require('../../assets/images/FeelBetter_icon.png'),
      },
      {
        id: 'pregnant',
        label: t('onboarding.healthSituations.pregnant'),
        icon: require('../../assets/images/Pregnant_icon.png'),
      },
      {
        id: 'postpartum',
        label: t('onboarding.healthSituations.postpartum'),
        icon: require('../../assets/images/Energy_icon.png'),
      },
      {
        id: 'menopause',
        label: t('onboarding.healthSituations.menopause'),
        icon: require('../../assets/images/Menopause_icon.png'),
      },
    ],
    [t]
  );

  const handleSelect = (id: string) => {
    withLock(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setSelected(id);
      setAndSave('healthSituation', id);
      setTimeout(() => {
        router.push('/onboarding/energy-fluctuation');
      }, 300);
    });
  };

  return (
    <QuestionLayout
      navigationDisabled={isNavigating}
      question={t('onboarding.healthSituations.question')}
      progress={46}
      onSkip={() => {
        skipField('healthSituation');
        router.push('/onboarding/energy-fluctuation');
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
