import { useState, useMemo } from 'react';
import { View, Text, Pressable, Image, ImageSourcePropType } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import QuestionLayout, { optionStyles } from '@/components/QuestionLayout';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useNavigationLock } from '@/hooks/useNavigationLock';

export default function GoalsScreen() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const { setAndSave, skipField } = useOnboardingStore();
  const { isNavigating, withLock } = useNavigationLock();

  const goals: { id: string; label: string; icon: ImageSourcePropType; iconSize?: number }[] =
    useMemo(
      () => [
        {
          id: 'body_composition',
          label: t('onboarding.goals.bodyComposition'),
          icon: require('../../assets/images/scales.png'),
          iconSize: 21,
        },
        {
          id: 'health',
          label: t('onboarding.goals.health'),
          icon: require('../../assets/images/Onboarding Icons/1. Main Goal/Vector-3.png'),
        },
        {
          id: 'consistency',
          label: t('onboarding.goals.consistency'),
          icon: require('../../assets/images/Onboarding Icons/5. Where Train/mdi_gym.png'),
        },
        {
          id: 'love',
          label: t('onboarding.goals.love'),
          icon: require('../../assets/images/Onboarding Icons/1. Main Goal/Vector-2.png'),
        },
      ],
      [t]
    );

  const handleSelect = (id: string) => {
    withLock(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setSelected(id);
      setAndSave('mainGoal', id);
      const nextRoute =
        id === 'body_composition' ? '/onboarding/body-change' : '/onboarding/other-goals';
      setTimeout(() => {
        router.push(nextRoute);
      }, 300);
    });
  };

  return (
    <QuestionLayout
      navigationDisabled={isNavigating}
      question={t('onboarding.goals.question')}
      progress={10}
      onSkip={() => {
        skipField('mainGoal');
        router.push('/onboarding/potential');
      }}
    >
      <View style={optionStyles.optionsContainer}>
        {goals.map((goal) => {
          const isSelected = selected === goal.id;
          return (
            <Pressable
              key={goal.id}
              style={[optionStyles.optionCard, isSelected && optionStyles.optionCardSelected]}
              onPress={() => handleSelect(goal.id)}
            >
              <View style={optionStyles.optionIcon}>
                <Image
                  source={goal.icon}
                  style={{
                    width: goal.iconSize || 20,
                    height: goal.iconSize || 20,
                    tintColor: isSelected ? '#FFFFFF' : '#000000',
                  }}
                  resizeMode="contain"
                />
              </View>
              <Text
                style={[optionStyles.optionText, isSelected && optionStyles.optionTextSelected]}
              >
                {goal.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </QuestionLayout>
  );
}
