import { useState, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image, ImageSourcePropType } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import QuestionLayout, { optionStyles } from '@/components/QuestionLayout';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useNavigationLock } from '@/hooks/useNavigationLock';

export default function TrainingLocationScreen() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const { setAndSave, skipField } = useOnboardingStore();
  const { isNavigating, withLock } = useNavigationLock();

  const locations: { id: string; label: string; icon: ImageSourcePropType }[] = useMemo(
    () => [
      {
        id: 'commercial',
        label: t('onboarding.trainingLocation.commercialGym'),
        icon: require('../../assets/images/Onboarding Icons/5. Where Train/fe_building.png'),
      },
      {
        id: 'small',
        label: t('onboarding.trainingLocation.smallGym'),
        icon: require('../../assets/images/Onboarding Icons/5. Where Train/icon-park-outline_building-four.png'),
      },
      {
        id: 'home',
        label: t('onboarding.trainingLocation.homeGym'),
        icon: require('../../assets/images/Onboarding Icons/5. Where Train/mdi_gym.png'),
      },
      {
        id: 'bodyweight',
        label: t('onboarding.trainingLocation.bodyWeight'),
        icon: require('../../assets/images/Onboarding Icons/5. Where Train/Vector.png'),
      },
    ],
    [t]
  );

  const handleSelect = (id: string) => {
    withLock(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setSelected(id);
      setAndSave('trainingLocation', id);
      setTimeout(() => {
        router.push('/onboarding/workout-frequency');
      }, 300);
    });
  };

  return (
    <QuestionLayout
      navigationDisabled={isNavigating}
      question={t('onboarding.trainingLocation.question')}
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
