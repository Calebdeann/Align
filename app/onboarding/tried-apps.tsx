import { useState, useMemo } from 'react';
import { View, Text, Pressable, Image, ImageSourcePropType } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import QuestionLayout, { optionStyles } from '@/components/QuestionLayout';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useNavigationLock } from '@/hooks/useNavigationLock';

type TriedAppsId = 'yes' | 'no';

interface TriedAppsOption {
  id: TriedAppsId;
  label: string;
  icon: ImageSourcePropType;
}

export default function TriedAppsScreen() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const { setAndSave, skipField } = useOnboardingStore();
  const { isNavigating, withLock } = useNavigationLock();

  const triedAppsOptions: TriedAppsOption[] = useMemo(
    () => [
      {
        id: 'yes',
        label: t('onboarding.triedApps.yes'),
        icon: require('../../assets/images/ThumbsUp.png'),
      },
      {
        id: 'no',
        label: t('onboarding.triedApps.no'),
        icon: require('../../assets/images/ThumbsDown.png'),
      },
    ],
    [t]
  );

  const handleSelect = (id: string) => {
    withLock(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setSelected(id);
      setAndSave('triedOtherApps', id);
      setTimeout(() => {
        router.push('/onboarding/referral');
      }, 300);
    });
  };

  return (
    <QuestionLayout
      navigationDisabled={isNavigating}
      question={t('onboarding.triedApps.question')}
      progress={6}
      onSkip={() => {
        skipField('triedOtherApps');
        router.push('/onboarding/referral');
      }}
    >
      <View style={optionStyles.optionsContainer}>
        {triedAppsOptions.map((option) => {
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
