import { useState, useMemo } from 'react';
import { View, Text, Pressable, Image, ImageSourcePropType } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import QuestionLayout, { optionStyles } from '@/components/QuestionLayout';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useNavigationLock } from '@/hooks/useNavigationLock';

type ObstacleId = 'schedule' | 'knowledge' | 'motivation' | 'confidence';

interface ObstacleOption {
  id: ObstacleId;
  label: string;
  icon: ImageSourcePropType;
}

export default function ObstaclesScreen() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const { setAndSave, skipField } = useOnboardingStore();
  const { isNavigating, withLock } = useNavigationLock();

  const obstacleOptions: ObstacleOption[] = useMemo(
    () => [
      {
        id: 'schedule',
        label: t('onboarding.obstacles.schedule'),
        icon: require('../../assets/images/busy-schedule.png'),
      },
      {
        id: 'knowledge',
        label: t('onboarding.obstacles.knowledge'),
        icon: require('../../assets/images/idk.png'),
      },
      {
        id: 'motivation',
        label: t('onboarding.obstacles.motivation'),
        icon: require('../../assets/images/no-motivation.png'),
      },
      {
        id: 'confidence',
        label: t('onboarding.obstacles.confidence'),
        icon: require('../../assets/images/i-lack-confidence.png'),
      },
    ],
    [t]
  );

  const handleSelect = (id: string) => {
    withLock(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setSelected(id);
      setAndSave('mainObstacle', id);
      setTimeout(() => {
        router.push('/onboarding/obstacle-response');
      }, 300);
    });
  };

  return (
    <QuestionLayout
      navigationDisabled={isNavigating}
      question={t('onboarding.obstacles.question')}
      progress={48}
      onSkip={() => {
        skipField('mainObstacle');
        router.push('/onboarding/obstacle-response');
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
